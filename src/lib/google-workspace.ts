import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'

import { tracker } from '@/lib/hackathon-data'

export type SheetKey = 'events' | 'tasks' | 'ideas' | 'resources' | 'submission' | 'dashboard' | 'audit'

type SheetConfig = {
  title: string
  idHeader: string
  defaultRange: string
}

type GoogleResponse<T> = { data: T }

type GoogleClient = {
  request<T>(options: { url: string; method?: string; headers?: Record<string, string>; data?: unknown }): Promise<GoogleResponse<T>>
}

export const sheetConfig: Record<SheetKey, SheetConfig> = {
  events: { title: tracker.tabs.events, idHeader: 'Event_ID', defaultRange: 'A:AC' },
  tasks: { title: tracker.tabs.tasks, idHeader: 'Task_ID', defaultRange: 'A:J' },
  ideas: { title: tracker.tabs.ideas, idHeader: 'Idea_ID', defaultRange: 'A:K' },
  resources: { title: tracker.tabs.resources, idHeader: 'Resource_ID', defaultRange: 'A:G' },
  submission: { title: tracker.tabs.submission, idHeader: 'Checklist_ID', defaultRange: 'A:I' },
  dashboard: { title: tracker.tabs.dashboard, idHeader: 'Metric', defaultRange: 'A:H' },
  audit: { title: 'Sources_Audit', idHeader: 'Audit_ID', defaultRange: 'A:K' }
}

const stableMetadataHeaders = ['Created_At', 'Updated_At', 'Updated_By', 'Record_Status', 'Drive_File_ID', 'Drive_Folder_ID', 'Last_Synced_At']
const auditHeaders = ['Audit_ID', 'Occurred_At', 'Action', 'Sheet', 'Record_ID', 'Updated_By', 'Before_JSON', 'After_JSON', 'Conflict_Status']
const stableIdPrefixes: Record<SheetKey, string> = { events: 'HACK', tasks: 'T', ideas: 'IDEA', resources: 'UI', submission: 'SC', dashboard: 'METRIC', audit: 'AUDIT' }

export class GoogleWorkspaceError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status = 503, details?: unknown) {
    super(message)
    this.name = 'GoogleWorkspaceError'
    this.status = status
    this.details = details
  }
}

export class GoogleWorkspaceConflictError extends GoogleWorkspaceError {
  constructor(message: string, currentRecord: Record<string, string | number>) {
    super(message, 409, { currentRecord })
    this.name = 'GoogleWorkspaceConflictError'
  }
}

const getSpreadsheetId = () => process.env.GOOGLE_SHEETS_ID ?? '1vjKrwmlUnaTpgtQl7hKddhAJhfMsV436xfklJ6_UxEw'

const getCredentials = () => {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!encoded && !raw) {
    throw new GoogleWorkspaceError('Google Workspace belum dikonfigurasi. Isi GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 di server.')
  }

  try {
    return JSON.parse(encoded ? Buffer.from(encoded, 'base64').toString('utf8') : raw!)
  } catch {
    throw new GoogleWorkspaceError('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 tidak valid.')
  }
}

const getClient = async (): Promise<GoogleClient> => {
  const auth = new GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
  })

  return (await auth.getClient()) as unknown as GoogleClient
}

const googleRequest = async <T>(options: Parameters<GoogleClient['request']>[0]) => {
  const client = await getClient()

  return (await client.request<T>(options)).data
}

export const isGoogleWorkspaceConfigured = () => Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_JSON)

const toColumnLabel = (index: number) => {
  let label = ''
  let current = index + 1

  while (current > 0) {
    const remainder = (current - 1) % 26

    label = String.fromCharCode(65 + remainder) + label
    current = Math.floor((current - 1) / 26)
  }

  return label
}

const sheetsUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${getSpreadsheetId()}${path}`)

  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value))

  return url.toString()
}

type SheetProperties = {
  sheetId?: number
  title?: string
  gridProperties?: { columnCount?: number }
}

const getSheetProperties = async (title: string) => {
  const response = await googleRequest<{ sheets?: Array<{ properties?: SheetProperties }> }>({
    url: sheetsUrl('', { fields: 'sheets(properties(sheetId,title,gridProperties(columnCount)))' }),
    method: 'GET'
  })

  const properties = response.sheets?.find(item => item.properties?.title === title)?.properties

  if (!properties || typeof properties.sheetId !== 'number') throw new GoogleWorkspaceError(`Tab ${title} tidak ditemukan di spreadsheet.`, 404)

  return properties
}

const columnLabelToIndex = (label: string) => {
  let index = 0

  for (const character of label) index = index * 26 + character.charCodeAt(0) - 64

  return index - 1
}

const getSheetValues = async (sheet: SheetKey) => {
  const config = sheetConfig[sheet]
  const properties = await getSheetProperties(config.title)
  const configuredEnd = config.defaultRange.split(':')[1] ?? 'A'
  const minimumColumnCount = columnLabelToIndex(configuredEnd) + 1
  const currentColumnCount = properties.gridProperties?.columnCount ?? minimumColumnCount
  const readEnd = toColumnLabel(Math.max(1, currentColumnCount) - 1)

  const response = await googleRequest<{ values?: string[][] }>({
    url: sheetsUrl(`/values/${encodeURIComponent(`${config.title}!A:${readEnd}`)}`, { majorDimension: 'ROWS', valueRenderOption: 'FORMATTED_VALUE' }),
    method: 'GET'
  })

  const values = response.values ?? []
  const headers = (values[0] ?? []).map(String)

  return { config, headers, values: values.slice(1) }
}

const ensureSheetGridColumns = async (title: string, requiredColumnCount: number) => {
  const properties = await getSheetProperties(title)

  const currentColumnCount = properties.gridProperties?.columnCount ?? 0

  if (currentColumnCount >= requiredColumnCount) return

  await googleRequest({
    url: sheetsUrl(':batchUpdate'),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: {
      requests: [
        {
          appendDimension: {
            sheetId: properties.sheetId,
            dimension: 'COLUMNS',
            length: requiredColumnCount - currentColumnCount
          }
        }
      ]
    }
  })
}

const ensureHeaders = async (sheet: SheetKey, headers: string[], requiredHeaders: string[]) => {
  const missing = requiredHeaders.filter(header => !headers.includes(header))

  if (missing.length === 0) return headers

  const config = sheetConfig[sheet]
  const nextHeaders = [...headers, ...missing]
  const start = toColumnLabel(headers.length)
  const end = toColumnLabel(nextHeaders.length - 1)

  await ensureSheetGridColumns(config.title, nextHeaders.length)

  await googleRequest({
    url: sheetsUrl(`/values/${encodeURIComponent(`${config.title}!${start}1:${end}1`)}`, { valueInputOption: 'USER_ENTERED' }),
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: { values: [missing] }
  })

  return nextHeaders
}

const rowToRecord = (headers: string[], row: string[], rowNumber: number) => {
  const record: Record<string, string | number> = { _rowNumber: rowNumber, _version: createHash('sha256').update(JSON.stringify(headers.map((header, index) => [header, row[index] ?? '']))).digest('hex') }

  headers.forEach((header, index) => {
    record[header] = row[index] ?? ''
  })

  return record
}

export const listSheetRecords = async (sheet: SheetKey) => {
  const { headers, values } = await getSheetValues(sheet)
  const requiredHeaders = sheet === 'audit' ? [...stableMetadataHeaders, ...auditHeaders] : stableMetadataHeaders
  const nextHeaders = await ensureHeaders(sheet, headers, requiredHeaders)
  const syncedAt = new Date().toISOString()
  const rows = values.map((row, index) => rowToRecord(nextHeaders, row, index + 2)).filter(row => String(row.Record_Status ?? '') !== 'Deleted')

  return { headers: nextHeaders, rows, syncedAt, last_synced_at: syncedAt }
}

const findRecord = async (sheet: SheetKey, id: string) => {
  const { config, headers, values } = await getSheetValues(sheet)
  const nextHeaders = await ensureHeaders(sheet, headers, stableMetadataHeaders)
  const idIndex = nextHeaders.indexOf(config.idHeader)

  if (idIndex === -1) throw new GoogleWorkspaceError(`${config.title} tidak memiliki kolom ${config.idHeader}.`, 500)

  const rowIndex = values.findIndex(row => String(row[idIndex] ?? '') === id)

  if (rowIndex === -1) throw new GoogleWorkspaceError(`${config.idHeader} ${id} tidak ditemukan.`, 404)

  const row = values[rowIndex] ?? []

  return { config, headers: nextHeaders, row, rowNumber: rowIndex + 2, version: rowToRecord(nextHeaders, row, rowIndex + 2)._version as string, record: rowToRecord(nextHeaders, row, rowIndex + 2) }
}

type MutationOptions = { updatedBy?: string; expectedVersion?: string; force?: boolean }

const now = () => new Date().toISOString()

const nextStableId = (sheet: SheetKey, idHeader: string, headers: string[], values: string[][]) => {
  const prefix = stableIdPrefixes[sheet]
  const idIndex = Math.max(0, headers.indexOf(idHeader))

  const nextNumber = values.reduce((highest, row) => {
    const match = String(row[idIndex] ?? '').match(new RegExp(`^${prefix}-(\\d+)$`))
    const number = match ? Number(match[1]) : 0

    return Math.max(highest, number)
  }, 0) + 1

  return { [idHeader]: `${prefix}-${String(nextNumber).padStart(3, '0')}` }
}

export const appendSheetRecord = async (sheet: SheetKey, record: Record<string, unknown>, options: MutationOptions = {}) => {
  const { config, headers, values } = await getSheetValues(sheet)
  const timestamp = now()

  const preparedRecord = {
    ...nextStableId(sheet, config.idHeader, headers, values),
    ...record,
    Created_At: record.Created_At ?? timestamp,
    Updated_At: timestamp,
    Updated_By: options.updatedBy ?? String(record.Updated_By ?? 'system'),
    Record_Status: record.Record_Status ?? 'Active',
    Drive_File_ID: record.Drive_File_ID ?? '',
    Drive_Folder_ID: record.Drive_Folder_ID ?? '',
    Last_Synced_At: timestamp,
    [config.idHeader]: nextStableId(sheet, config.idHeader, headers, values)[config.idHeader]
  }

  const requiredHeaders = sheet === 'audit' ? [...stableMetadataHeaders, ...auditHeaders] : stableMetadataHeaders
  const nextHeaders = await ensureHeaders(sheet, headers, [...requiredHeaders, ...Object.keys(preparedRecord)])
  const row = nextHeaders.map(header => String(preparedRecord[header] ?? ''))

  const response = await googleRequest<{ updates?: { updatedRange?: string } }>({
    url: sheetsUrl(`/values/${encodeURIComponent(`${config.title}!A:${toColumnLabel(nextHeaders.length - 1)}`)}:append`, { valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { values: [row] }
  })

  return { updatedRange: response.updates?.updatedRange ?? null, record: preparedRecord }
}

const assertCurrentVersion = (expectedVersion: string | undefined, found: Awaited<ReturnType<typeof findRecord>>) => {
  if (expectedVersion && expectedVersion !== found.version) throw new GoogleWorkspaceConflictError('Data berubah di Google Sheets sejak terakhir disinkronkan. Refresh sebelum menyimpan lagi.', found.record)
}

export const updateSheetRecord = async (sheet: SheetKey, id: string, changes: Record<string, unknown>, options: MutationOptions = {}) => {
  const found = await findRecord(sheet, id)

  if (!options.force) assertCurrentVersion(options.expectedVersion, found)
  if (Object.prototype.hasOwnProperty.call(changes, found.config.idHeader) && String(changes[found.config.idHeader]) !== id) throw new GoogleWorkspaceError(`${found.config.idHeader} adalah primary key dan tidak dapat diubah.`, 400)
  const timestamp = now()
  const nextHeaders = await ensureHeaders(sheet, found.headers, [...stableMetadataHeaders, ...Object.keys(changes)])

  const nextRow = nextHeaders.map((header, index) => {
    if (header === 'Created_At') return String(found.row[index] ?? timestamp)
    if (header === 'Updated_At' || header === 'Last_Synced_At') return timestamp
    if (header === 'Updated_By') return options.updatedBy ?? String(found.row[index] ?? 'system')
    if (header === 'Record_Status') return String(changes[header] ?? found.row[index] ?? 'Active')

    return String(changes[header] ?? found.row[index] ?? '')
  })

  const endColumn = toColumnLabel(nextHeaders.length - 1)

  await googleRequest({
    url: sheetsUrl(`/values/${encodeURIComponent(`${found.config.title}!A${found.rowNumber}:${endColumn}${found.rowNumber}`)}`, { valueInputOption: 'USER_ENTERED' }),
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: { values: [nextRow] }
  })

  return { rowNumber: found.rowNumber, id, before: found.record, record: rowToRecord(nextHeaders, nextRow, found.rowNumber) }
}

export const clearSheetRecord = async (sheet: SheetKey, id: string, options: MutationOptions = {}) => {
  const result = await updateSheetRecord(sheet, id, { Record_Status: 'Deleted' }, options)

  return { id, rowNumber: result.rowNumber, before: result.before, record: result.record }
}

const driveUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(`https://www.googleapis.com/drive/v3${path}`)

  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value))

  return url.toString()
}

export const uploadDriveFile = async ({ fileName, mimeType, buffer, folderId }: { fileName: string; mimeType: string; buffer: Buffer; folderId?: string }) => {
  const boundary = `hackathon-os-${Date.now().toString(36)}`
  const metadata = JSON.stringify({ name: fileName, ...(folderId ? { parents: [folderId] } : {}) })

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ])

  return googleRequest<{ id?: string; name?: string; mimeType?: string; size?: string; webViewLink?: string; webContentLink?: string; parents?: string[]; createdTime?: string }>({
    url: driveUrl('/upload/drive/v3/files', { uploadType: 'multipart', fields: 'id,name,mimeType,size,webViewLink,webContentLink,parents,createdTime' }),
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    data: body
  })
}

export const listDriveFiles = async (folderId?: string) => {
  const parent = folderId ?? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  const query = parent ? `'${parent}' in parents and trashed = false` : 'trashed = false'

  const response = await googleRequest<{ files?: Array<Record<string, unknown>> }>({
    url: driveUrl('/files', { q: query, pageSize: '100', orderBy: 'modifiedTime desc', fields: 'files(id,name,mimeType,size,webViewLink,webContentLink,parents,createdTime,modifiedTime)', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' }),
    method: 'GET'
  })

  return response.files ?? []
}

export const attachDriveFileToSheet = async ({ sheet, rowId, fileId, fileUrl, expectedVersion, updatedBy, folderId }: { sheet: SheetKey; rowId: string; fileId: string; fileUrl?: string | null; expectedVersion?: string; updatedBy?: string; folderId?: string }) => {
  const changes: Record<string, string> = { Drive_File_ID: fileId }

  if (fileUrl) changes.Evidence_URL = fileUrl
  if (folderId) changes.Drive_Folder_ID = folderId

  return updateSheetRecord(sheet, rowId, changes, { expectedVersion, updatedBy })
}

export const appendAuditLog = async ({ action, sheet, recordId, updatedBy, before, after, conflictStatus }: { action: string; sheet: SheetKey; recordId: string; updatedBy: string; before?: unknown; after?: unknown; conflictStatus?: string }) => {
  return appendSheetRecord('audit', {
    Occurred_At: now(),
    Action: action,
    Sheet: sheet,
    Record_ID: recordId,
    Updated_By: updatedBy,
    Before_JSON: before ? JSON.stringify(before) : '',
    After_JSON: after ? JSON.stringify(after) : '',
    Conflict_Status: conflictStatus ?? 'none'
  }, { updatedBy })
}

const migrationHeaders = ['Created_At', 'Updated_At', 'Updated_By', 'Record_Status', 'Last_Synced_At']

export const migrateSheetMetadata = async (sheet: SheetKey, updatedBy = 'migration') => {
  const { config, headers, values } = await getSheetValues(sheet)
  const requiredHeaders = sheet === 'audit' ? [...stableMetadataHeaders, ...auditHeaders] : stableMetadataHeaders
  const nextHeaders = await ensureHeaders(sheet, headers, requiredHeaders)
  const idIndex = nextHeaders.indexOf(config.idHeader)
  const timestamp = now()
  const updates: Array<{ range: string; values: string[][] }> = []
  let migratedRows = 0

  values.forEach((row, index) => {
    if (idIndex < 0 || !String(row[idIndex] ?? '').trim()) return

    const rowNumber = index + 2
    let changed = false

    migrationHeaders.forEach(header => {
      const columnIndex = nextHeaders.indexOf(header)

      if (columnIndex < 0 || String(row[columnIndex] ?? '').trim()) return

      const value = header === 'Updated_By' ? updatedBy : header === 'Record_Status' ? 'Active' : timestamp

      updates.push({ range: `${config.title}!${toColumnLabel(columnIndex)}${rowNumber}`, values: [[value]] })
      changed = true
    })

    if (changed) migratedRows += 1
  })

  if (updates.length > 0) {
    await googleRequest({
      url: sheetsUrl('/values:batchUpdate'),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { valueInputOption: 'USER_ENTERED', data: updates }
    })
  }

  return { sheet, addedHeaders: nextHeaders.filter(header => !headers.includes(header)), migratedRows, migratedAt: timestamp }
}

export const googleSheetId = getSpreadsheetId
