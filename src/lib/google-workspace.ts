import { GoogleAuth } from 'google-auth-library'

import { tracker } from '@/lib/hackathon-data'

export type SheetKey = keyof typeof tracker.tabs

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
  dashboard: { title: tracker.tabs.dashboard, idHeader: 'Metric', defaultRange: 'A:H' }
}

export class GoogleWorkspaceError extends Error {
  status: number

  constructor(message: string, status = 503) {
    super(message)
    this.name = 'GoogleWorkspaceError'
    this.status = status
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

const getSheetValues = async (sheet: SheetKey) => {
  const config = sheetConfig[sheet]

  const response = await googleRequest<{ values?: string[][] }>({
    url: sheetsUrl(`/values/${encodeURIComponent(`${config.title}!${config.defaultRange}`)}`, { majorDimension: 'ROWS', valueRenderOption: 'FORMATTED_VALUE' }),
    method: 'GET'
  })

  const values = response.values ?? []
  const headers = (values[0] ?? []).map(String)

  return { config, headers, values: values.slice(1) }
}

const ensureHeaders = async (sheet: SheetKey, headers: string[], requiredHeaders: string[]) => {
  const missing = requiredHeaders.filter(header => !headers.includes(header))

  if (missing.length === 0) return headers

  const config = sheetConfig[sheet]
  const nextHeaders = [...headers, ...missing]
  const start = toColumnLabel(headers.length)
  const end = toColumnLabel(nextHeaders.length - 1)

  await googleRequest({
    url: sheetsUrl(`/values/${encodeURIComponent(`${config.title}!${start}1:${end}1`)}`, { valueInputOption: 'USER_ENTERED' }),
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: { values: [missing] }
  })

  return nextHeaders
}

const rowToRecord = (headers: string[], row: string[], rowNumber: number) => {
  const record: Record<string, string | number> = { _rowNumber: rowNumber }

  headers.forEach((header, index) => {
    record[header] = row[index] ?? ''
  })

  return record
}

export const listSheetRecords = async (sheet: SheetKey) => {
  const { headers, values } = await getSheetValues(sheet)

  return { headers, rows: values.map((row, index) => rowToRecord(headers, row, index + 2)) }
}

const findRecord = async (sheet: SheetKey, id: string) => {
  const { config, headers, values } = await getSheetValues(sheet)
  const idIndex = headers.indexOf(config.idHeader)

  if (idIndex === -1) throw new GoogleWorkspaceError(`${config.title} tidak memiliki kolom ${config.idHeader}.`, 500)

  const rowIndex = values.findIndex(row => String(row[idIndex] ?? '') === id)

  if (rowIndex === -1) throw new GoogleWorkspaceError(`${config.idHeader} ${id} tidak ditemukan.`, 404)

  return { config, headers, row: values[rowIndex] ?? [], rowNumber: rowIndex + 2 }
}

export const appendSheetRecord = async (sheet: SheetKey, record: Record<string, unknown>) => {
  const { config, headers } = await getSheetValues(sheet)
  const nextHeaders = await ensureHeaders(sheet, headers, Object.keys(record))
  const row = nextHeaders.map(header => String(record[header] ?? ''))

  const response = await googleRequest<{ updates?: { updatedRange?: string } }>({
    url: sheetsUrl(`/values/${encodeURIComponent(`${config.title}!A:${toColumnLabel(nextHeaders.length - 1)}`)}:append`, { valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { values: [row] }
  })

  return { updatedRange: response.updates?.updatedRange ?? null, record }
}

export const updateSheetRecord = async (sheet: SheetKey, id: string, changes: Record<string, unknown>) => {
  const found = await findRecord(sheet, id)
  const nextHeaders = await ensureHeaders(sheet, found.headers, Object.keys(changes))
  const nextRow = nextHeaders.map((header, index) => String(changes[header] ?? found.row[index] ?? ''))
  const endColumn = toColumnLabel(nextHeaders.length - 1)

  await googleRequest({
    url: sheetsUrl(`/values/${encodeURIComponent(`${found.config.title}!A${found.rowNumber}:${endColumn}${found.rowNumber}`)}`, { valueInputOption: 'USER_ENTERED' }),
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: { values: [nextRow] }
  })

  return { rowNumber: found.rowNumber, id, record: rowToRecord(nextHeaders, nextRow, found.rowNumber) }
}

export const clearSheetRecord = async (sheet: SheetKey, id: string) => {
  const found = await findRecord(sheet, id)
  const endColumn = toColumnLabel(found.headers.length - 1)

  await googleRequest({
    url: sheetsUrl(`/values/${encodeURIComponent(`${found.config.title}!A${found.rowNumber}:${endColumn}${found.rowNumber}`)}:clear`),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: {}
  })

  return { id, rowNumber: found.rowNumber }
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

export const attachDriveFileToSheet = async ({ sheet, rowId, fileId, fileUrl }: { sheet: SheetKey; rowId: string; fileId: string; fileUrl?: string | null }) => {
  const changes: Record<string, string> = { Drive_File_ID: fileId }

  if (fileUrl) changes.Evidence_URL = fileUrl

  return updateSheetRecord(sheet, rowId, changes)
}

export const googleSheetId = getSpreadsheetId
