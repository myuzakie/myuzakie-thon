import { NextResponse } from 'next/server'

import { attachDriveFileToSheet, GoogleWorkspaceError, uploadDriveFile } from '@/lib/google-workspace'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) return NextResponse.json({ error: 'file wajib diisi' }, { status: 400 })

    const folderId = String(formData.get('folderId') || '') || undefined
    const sheet = String(formData.get('sheet') || '') as Parameters<typeof attachDriveFileToSheet>[0]['sheet']
    const rowId = String(formData.get('rowId') || '')
    const uploaded = await uploadDriveFile({ fileName: file.name, mimeType: file.type || 'application/octet-stream', buffer: Buffer.from(await file.arrayBuffer()), folderId })

    let linkedRow = null

    if (sheet && rowId && uploaded.id) {
      linkedRow = await attachDriveFileToSheet({ sheet, rowId, fileId: uploaded.id, fileUrl: uploaded.webViewLink })
    }

    return NextResponse.json({ source: 'google-drive', file: uploaded, linkedRow }, { status: 201 })
  } catch (error) {
    const status = error instanceof GoogleWorkspaceError ? error.status : 502
    const message = error instanceof Error ? error.message : 'Google Drive upload gagal.'

    return NextResponse.json({ error: 'google_drive_error', message }, { status })
  }
}
