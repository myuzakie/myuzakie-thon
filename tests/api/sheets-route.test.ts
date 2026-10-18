import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  getSessionFromRequest: vi.fn(),
  sameOriginResponse: vi.fn(() => null),
  unauthorizedResponse: vi.fn(() => new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }))
}))

const workspace = vi.hoisted(() => ({
  GoogleWorkspaceError: class GoogleWorkspaceError extends Error {
    status = 502
    details: unknown
  },
  appendAuditLog: vi.fn(),
  appendSheetRecord: vi.fn(),
  clearSheetRecord: vi.fn(),
  listSheetRecords: vi.fn(),
  sheetConfig: { events: { idHeader: 'Event_ID' } },
  updateSheetRecord: vi.fn()
}))

vi.mock('@/lib/auth', () => auth)
vi.mock('@/lib/google-workspace', () => workspace)

import { DELETE, GET, PATCH, POST } from '@/app/api/sheets/[sheet]/route'

describe('sheets API route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.getSessionFromRequest.mockReturnValue({ email: 'tester@example.com' })
  })

  it('rejects unauthenticated reads', async () => {
    auth.getSessionFromRequest.mockReturnValue(null)

    const response = await GET(new Request('http://localhost/api/sheets/events'), { params: Promise.resolve({ sheet: 'events' }) })

    expect(response.status).toBe(401)
    expect(workspace.listSheetRecords).not.toHaveBeenCalled()
  })

  it('returns live sheet records for an allowed sheet', async () => {
    workspace.listSheetRecords.mockResolvedValue({ rows: [{ Event_ID: 'HACK-001' }], syncedAt: '2026-10-18T00:00:00.000Z' })

    const response = await GET(new Request('http://localhost/api/sheets/events'), { params: Promise.resolve({ sheet: 'events' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.rows).toEqual([{ Event_ID: 'HACK-001' }])
    expect(workspace.listSheetRecords).toHaveBeenCalledWith('events')
  })

  it('validates create, update, and delete payloads before writing', async () => {
    const postResponse = await POST(new Request('http://localhost/api/sheets/events', { method: 'POST', body: JSON.stringify({}) }), { params: Promise.resolve({ sheet: 'events' }) })
    const patchResponse = await PATCH(new Request('http://localhost/api/sheets/events', { method: 'PATCH', body: JSON.stringify({ id: 'HACK-001' }) }), { params: Promise.resolve({ sheet: 'events' }) })
    const deleteResponse = await DELETE(new Request('http://localhost/api/sheets/events', { method: 'DELETE', body: JSON.stringify({}) }), { params: Promise.resolve({ sheet: 'events' }) })

    expect(postResponse.status).toBe(400)
    expect(patchResponse.status).toBe(400)
    expect(deleteResponse.status).toBe(400)
    expect(workspace.appendSheetRecord).not.toHaveBeenCalled()
    expect(workspace.updateSheetRecord).not.toHaveBeenCalled()
  })

  it('writes a record and appends an audit log', async () => {
    workspace.appendSheetRecord.mockResolvedValue({ record: { Event_ID: 'HACK-005' } })

    const response = await POST(new Request('http://localhost/api/sheets/events', { method: 'POST', body: JSON.stringify({ record: { Event_Name: 'Test event' } }) }), { params: Promise.resolve({ sheet: 'events' }) })

    expect(response.status).toBe(201)
    expect(workspace.appendSheetRecord).toHaveBeenCalledWith('events', { Event_Name: 'Test event' }, { updatedBy: 'tester@example.com' })
    expect(workspace.appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', sheet: 'events', recordId: 'HACK-005' }))
  })
})
