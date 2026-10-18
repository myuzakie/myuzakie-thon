import { describe, expect, it } from 'vitest'

import { formatColumnValue } from '@/components/hackathon/live-sheet-table'

describe('live sheet column formatting', () => {
  it('uses serializable format descriptors for linked evidence status', () => {
    expect(formatColumnValue({ key: 'Drive_File_ID', label: 'Evidence', format: 'linked-status' }, { Drive_File_ID: 'file-1' })).toBe('Linked')
    expect(formatColumnValue({ key: 'Drive_File_ID', label: 'Evidence', format: 'linked-status' }, { Evidence_URL: 'https://drive.google.com/file/d/file-1' })).toBe('Linked')
    expect(formatColumnValue({ key: 'Drive_File_ID', label: 'Evidence', format: 'linked-status' }, {})).toBe('Missing')
  })

  it('renders ordinary values without a formatter function', () => {
    expect(formatColumnValue({ key: 'Event_ID', label: 'ID' }, { Event_ID: 'HACK-001' })).toBe('HACK-001')
    expect(formatColumnValue({ key: 'Event_ID', label: 'ID' }, {})).toBe('—')
  })
})
