import { describe, expect, it } from 'vitest'

import { driveUploadUrl } from '@/lib/google-workspace'

describe('Google Drive transport', () => {
  it('uses the multipart upload endpoint without duplicating /drive/v3', () => {
    const url = driveUploadUrl('/files', { uploadType: 'multipart' })

    expect(url).toBe('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart')
    expect(url).not.toContain('/drive/v3/upload/drive/v3')
  })
})
