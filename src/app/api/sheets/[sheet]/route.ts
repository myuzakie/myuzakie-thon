import { NextResponse } from 'next/server'

import { getSessionFromRequest, sameOriginResponse, unauthorizedResponse } from '@/lib/auth'
import { appendAuditLog, clearSheetRecord, GoogleWorkspaceError, appendSheetRecord, listSheetRecords, sheetConfig, updateSheetRecord } from '@/lib/google-workspace'

const getSheetKey = async (params: Promise<{ sheet: string }>) => {
  const { sheet } = await params

  if (!(sheet in sheetConfig)) throw new GoogleWorkspaceError(`Sheet ${sheet} tidak diizinkan.`, 400)

  return sheet as keyof typeof sheetConfig
}

const handleError = (error: unknown) => {
  const status = error instanceof GoogleWorkspaceError ? error.status : 502
  const message = error instanceof Error ? error.message : 'Google Sheets request gagal.'
  const details = error instanceof GoogleWorkspaceError ? error.details : undefined

  return NextResponse.json({ error: status === 409 ? 'conflict' : 'google_sheets_error', message, ...(details ? { details } : {}) }, { status })
}

export async function GET(request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  const session = getSessionFromRequest(request)

  if (!session) return unauthorizedResponse()

  try {
    const sheet = await getSheetKey(params)

    return NextResponse.json({ source: 'google-sheets', sheet, ...(await listSheetRecords(sheet)) })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  const session = getSessionFromRequest(request)

  if (!session) return unauthorizedResponse()

  try {
    const sheet = await getSheetKey(params)
    const body = (await request.json()) as { record?: Record<string, unknown> }

    if (!body.record || typeof body.record !== 'object') return NextResponse.json({ error: 'record wajib diisi' }, { status: 400 })

    const result = await appendSheetRecord(sheet, body.record, { updatedBy: session.email })

    if (sheet !== 'audit') await appendAuditLog({ action: 'create', sheet, recordId: String(result.record[sheetConfig[sheet].idHeader] ?? ''), updatedBy: session.email, after: result.record })

    return NextResponse.json({ source: 'google-sheets', ...result }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  const session = getSessionFromRequest(request)

  if (!session) return unauthorizedResponse()

  try {
    const sheet = await getSheetKey(params)
    const body = (await request.json()) as { id?: string; expectedVersion?: string; force?: boolean; changes?: Record<string, unknown> }

    if (!body.id || !body.changes) return NextResponse.json({ error: 'id dan changes wajib diisi' }, { status: 400 })

    const result = await updateSheetRecord(sheet, body.id, body.changes, { expectedVersion: body.expectedVersion, force: body.force, updatedBy: session.email })

    if (sheet !== 'audit') await appendAuditLog({ action: 'update', sheet, recordId: body.id, updatedBy: session.email, before: result.before, after: result.record })

    return NextResponse.json({ source: 'google-sheets', ...result })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  const session = getSessionFromRequest(request)

  if (!session) return unauthorizedResponse()

  try {
    const sheet = await getSheetKey(params)
    const body = (await request.json()) as { id?: string; expectedVersion?: string }

    if (!body.id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

    const result = await clearSheetRecord(sheet, body.id, { expectedVersion: body.expectedVersion, updatedBy: session.email })

    if (sheet !== 'audit') await appendAuditLog({ action: 'delete', sheet, recordId: body.id, updatedBy: session.email, before: result.before, after: result.record })

    return NextResponse.json({ source: 'google-sheets', ...result })
  } catch (error) {
    return handleError(error)
  }
}
