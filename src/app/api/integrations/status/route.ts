import { NextResponse } from 'next/server'

import { tracker } from '@/lib/hackathon-data'
import { googleSheetId, isGoogleWorkspaceConfigured } from '@/lib/google-workspace'

export async function GET() {
  return NextResponse.json({
    configured: isGoogleWorkspaceConfigured(),
    provider: 'google-workspace',
    spreadsheetId: googleSheetId(),
    spreadsheetUrl: tracker.url,
    tabs: tracker.tabs,
    driveFolderConfigured: Boolean(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)
  })
}
