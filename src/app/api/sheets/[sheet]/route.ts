import { NextResponse } from 'next/server'

import { clearSheetRecord, GoogleWorkspaceError, appendSheetRecord, listSheetRecords, sheetConfig, updateSheetRecord } from '@/lib/google-workspace'

const getSheetKey = async (params: Promise<{ sheet: string }>) => {
  const { sheet } = await params

  if (!(sheet in sheetConfig)) throw new GoogleWorkspaceError(`Sheet ${sheet} tidak diizinkan.`, 400)

  return sheet as keyof typeof sheetConfig
}

const handleError = (error: unknown) => {
  const status = error instanceof GoogleWorkspaceError ? error.status : 502
  const message = error instanceof Error ? error.message : 'Google Sheets request gagal.'

  return NextResponse.json({ error: 'google_sheets_error', message }, { status })
}

export async function GET(_request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const sheet = await getSheetKey(params)

    return NextResponse.json({ source: 'google-sheets', sheet, ...(await listSheetRecords(sheet)) })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const sheet = await getSheetKey(params)
    const body = (await request.json()) as { record?: Record<string, unknown> }

    if (!body.record || typeof body.record !== 'object') return NextResponse.json({ error: 'record wajib diisi' }, { status: 400 })

    return NextResponse.json({ source: 'google-sheets', ...(await appendSheetRecord(sheet, body.record)) }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const sheet = await getSheetKey(params)
    const body = (await request.json()) as { id?: string; changes?: Record<string, unknown> }

    if (!body.id || !body.changes) return NextResponse.json({ error: 'id dan changes wajib diisi' }, { status: 400 })

    return NextResponse.json({ source: 'google-sheets', ...(await updateSheetRecord(sheet, body.id, body.changes)) })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const sheet = await getSheetKey(params)
    const body = (await request.json()) as { id?: string }

    if (!body.id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

    return NextResponse.json({ source: 'google-sheets', ...(await clearSheetRecord(sheet, body.id)) })
  } catch (error) {
    return handleError(error)
  }
}
