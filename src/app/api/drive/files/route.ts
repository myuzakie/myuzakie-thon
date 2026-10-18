import { NextResponse } from 'next/server'

import { GoogleWorkspaceError, listDriveFiles } from '@/lib/google-workspace'

export async function GET(request: Request) {
  try {
    const folderId = new URL(request.url).searchParams.get('folderId') ?? undefined

    return NextResponse.json({ source: 'google-drive', files: await listDriveFiles(folderId) })
  } catch (error) {
    const status = error instanceof GoogleWorkspaceError ? error.status : 502
    const message = error instanceof Error ? error.message : 'Google Drive request gagal.'

    return NextResponse.json({ error: 'google_drive_error', message }, { status })
  }
}
