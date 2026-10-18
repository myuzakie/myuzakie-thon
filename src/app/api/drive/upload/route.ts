import { NextResponse } from 'next/server'

import { getSessionFromRequest, sameOriginResponse, unauthorizedResponse } from '@/lib/auth'
import { appendAuditLog, attachDriveFileToSheet, GoogleWorkspaceError, uploadDriveFile } from '@/lib/google-workspace'

export const runtime = 'nodejs'
const maxUploadBytes = 100 * 1024 * 1024
const allowedExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'pdf', 'md', 'txt', 'json', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'])

const isAllowedFile = (file: File) => {
  const extension = file.name.toLowerCase().split('.').pop() ?? ''

  return file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf' || file.type === 'application/json' || file.type === 'application/zip' || file.type.startsWith('text/') || allowedExtensions.has(extension)
}

export async function POST(request: Request) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  const session = getSessionFromRequest(request)

  if (!session) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) return NextResponse.json({ error: 'file wajib diisi' }, { status: 400 })
    if (file.size > maxUploadBytes) return NextResponse.json({ error: 'file_too_large', message: 'Ukuran file maksimal 100 MB.' }, { status: 413 })
    if (!isAllowedFile(file)) return NextResponse.json({ error: 'file_type_not_allowed', message: 'Tipe file tidak didukung untuk evidence.' }, { status: 415 })

    const folderId = String(formData.get('folderId') || '') || undefined
    const sheet = String(formData.get('sheet') || '') as Parameters<typeof attachDriveFileToSheet>[0]['sheet']
    const rowId = String(formData.get('rowId') || '')
    const expectedVersion = String(formData.get('expectedVersion') || '') || undefined
    const fileName = file.name.replace(/[\\/\0]/g, '_').slice(0, 180) || 'evidence-upload'
    const uploaded = await uploadDriveFile({ fileName, mimeType: file.type || 'application/octet-stream', buffer: Buffer.from(await file.arrayBuffer()), folderId })

    let linkedRow = null

    if (sheet && rowId && uploaded.id) {
      linkedRow = await attachDriveFileToSheet({ sheet, rowId, fileId: uploaded.id, fileUrl: uploaded.webViewLink, expectedVersion, updatedBy: session.email, folderId })
      if (sheet !== 'audit') await appendAuditLog({ action: 'drive_upload', sheet, recordId: rowId, updatedBy: session.email, before: linkedRow.before, after: linkedRow.record })
    }

    return NextResponse.json({ source: 'google-drive', file: uploaded, linkedRow }, { status: 201 })
  } catch (error) {
    const status = error instanceof GoogleWorkspaceError ? error.status : 502
    const message = error instanceof Error ? error.message : 'Google Drive upload gagal.'
    const details = error instanceof GoogleWorkspaceError ? error.details : undefined

    return NextResponse.json({ error: status === 409 ? 'conflict' : 'google_drive_error', message, ...(details ? { details } : {}) }, { status })
  }
}
