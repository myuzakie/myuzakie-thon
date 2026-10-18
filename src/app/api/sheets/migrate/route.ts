import { NextResponse } from 'next/server'

import { getSessionFromRequest, sameOriginResponse, unauthorizedResponse } from '@/lib/auth'
import { appendAuditLog, migrateSheetMetadata, sheetConfig, type SheetKey } from '@/lib/google-workspace'

const migratableSheets = Object.keys(sheetConfig).filter(sheet => sheet !== 'audit') as SheetKey[]

export async function POST(request: Request) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  const session = getSessionFromRequest(request)

  if (!session) return unauthorizedResponse()

  try {
    const body = await request.json().catch(() => ({})) as { sheets?: string[] }
    const requestedSheets = body.sheets?.length ? body.sheets : migratableSheets
    const invalidSheet = requestedSheets.find(sheet => !migratableSheets.includes(sheet as SheetKey))

    if (invalidSheet) return NextResponse.json({ error: 'invalid_sheet', message: `Sheet ${invalidSheet} tidak dapat dimigrasikan.` }, { status: 400 })

    const results = []

    for (const sheet of requestedSheets as SheetKey[]) {
      const result = await migrateSheetMetadata(sheet, session.email)

      results.push(result)
      await appendAuditLog({ action: 'metadata_migration', sheet, recordId: '*', updatedBy: session.email, after: result })
    }

    return NextResponse.json({ source: 'google-sheets', migratedAt: new Date().toISOString(), results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Metadata migration gagal.'

    return NextResponse.json({ error: 'migration_failed', message }, { status: 502 })
  }
}
