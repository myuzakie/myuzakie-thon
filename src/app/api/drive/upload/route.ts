import { NextResponse } from 'next/server'

import { getSessionFromRequest, sameOriginResponse, unauthorizedResponse } from '@/lib/auth'
import { appendAuditLog, attachDriveFileToSheet, GoogleWorkspaceError, uploadDriveFile } from '@/lib/google-workspace'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  const session = getSessionFromRequest(request)

  if (!session) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) return NextResponse.json({ error: 'file wajib diisi' }, { status: 400 })

    const folderId = String(formData.get('folderId') || '') || undefined
    const sheet = String(formData.get('sheet') || '') as Parameters<typeof attachDriveFileToSheet>[0]['sheet']
    const rowId = String(formData.get('rowId') || '')
    const expectedVersion = String(formData.get('expectedVersion') || '') || undefined
    const uploaded = await uploadDriveFile({ fileName: file.name, mimeType: file.type || 'application/octet-stream', buffer: Buffer.from(await file.arrayBuffer()), folderId })

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
