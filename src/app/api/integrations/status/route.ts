import { NextResponse } from 'next/server'

import { getSessionFromRequest, unauthorizedResponse } from '@/lib/auth'
import { tracker } from '@/lib/hackathon-data'
import { googleSheetId, isGoogleWorkspaceConfigured } from '@/lib/google-workspace'

export async function GET(request: Request) {
  if (!getSessionFromRequest(request)) return unauthorizedResponse()

  return NextResponse.json({
    configured: isGoogleWorkspaceConfigured(),
    provider: 'google-workspace',
    spreadsheetId: googleSheetId(),
    spreadsheetUrl: tracker.url,
    tabs: tracker.tabs,
    driveFolderConfigured: Boolean(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)
  })
}
