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
  attachDriveFileToSheet: vi.fn(),
  listDriveFiles: vi.fn(),
  uploadDriveFile: vi.fn()
}))

vi.mock('@/lib/auth', () => auth)
vi.mock('@/lib/google-workspace', () => workspace)

import { GET } from '@/app/api/drive/files/route'
import { POST } from '@/app/api/drive/upload/route'

describe('Drive API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.getSessionFromRequest.mockReturnValue({ email: 'tester@example.com' })
  })

  it('rejects unauthenticated file listing', async () => {
    auth.getSessionFromRequest.mockReturnValue(null)

    const response = await GET(new Request('http://localhost/api/drive/files'))

    expect(response.status).toBe(401)
  })

  it('lists files from the requested folder', async () => {
    workspace.listDriveFiles.mockResolvedValue([{ id: 'file-1', name: 'README.md' }])

    const response = await GET(new Request('http://localhost/api/drive/files?folderId=folder-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.files).toEqual([{ id: 'file-1', name: 'README.md' }])
    expect(workspace.listDriveFiles).toHaveBeenCalledWith('folder-1')
  })

  it('rejects unsupported uploads before touching Drive', async () => {
    const formData = new FormData()

    formData.set('file', new File(['binary'], 'evidence.exe', { type: 'application/octet-stream' }))
    formData.set('sheet', 'events')
    formData.set('rowId', 'HACK-001')

    const response = await POST(new Request('http://localhost/api/drive/upload', { method: 'POST', body: formData }))

    expect(response.status).toBe(415)
    expect(workspace.uploadDriveFile).not.toHaveBeenCalled()
  })

  it('uploads an allowed file and links it to the sheet row', async () => {
    workspace.uploadDriveFile.mockResolvedValue({ id: 'file-1', name: 'evidence.txt', webViewLink: 'https://drive.google.com/file/d/file-1/view' })
    workspace.attachDriveFileToSheet.mockResolvedValue({ before: {}, record: { Event_ID: 'HACK-001', Drive_File_ID: 'file-1' } })
    const formData = new FormData()

    formData.set('file', new File(['evidence'], 'evidence.txt', { type: 'text/plain' }))
    formData.set('sheet', 'events')
    formData.set('rowId', 'HACK-001')
    formData.set('folderId', 'folder-1')

    const response = await POST(new Request('http://localhost/api/drive/upload', { method: 'POST', body: formData }))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.file.id).toBe('file-1')
    expect(workspace.uploadDriveFile).toHaveBeenCalledWith(expect.objectContaining({ fileName: 'evidence.txt', folderId: 'folder-1' }))
    expect(workspace.attachDriveFileToSheet).toHaveBeenCalledWith(expect.objectContaining({ sheet: 'events', rowId: 'HACK-001', fileId: 'file-1', folderId: 'folder-1' }))
    expect(workspace.appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'drive_upload', recordId: 'HACK-001' }))
  })
})
