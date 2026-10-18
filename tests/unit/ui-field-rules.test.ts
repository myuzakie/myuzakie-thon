import { describe, expect, it } from 'vitest'

import { getCurrencyPrefix, getFieldOptions, inferFieldType, isExternalUrl } from '@/lib/ui-field-rules'

describe('system UX field rules', () => {
  it('infers semantic editor controls from field names', () => {
    expect(inferFieldType({ key: 'Cash_Awards_USD', label: 'Cash award' })).toBe('currency')
    expect(inferFieldType({ key: 'Verification_Status', label: 'Verification' })).toBe('select')
    expect(inferFieldType({ key: 'Official_URL', label: 'Official URL' })).toBe('url')
    expect(inferFieldType({ key: 'Notes', label: 'Notes', multiline: true })).toBe('textarea')
    expect(inferFieldType({ key: 'Drive_Folder', label: 'Evidence folder' })).toBe('url')
  })

  it('returns stable select options and preserves an external current value', () => {
    expect(getFieldOptions({ key: 'Status', label: 'Status' }, 'Custom status')).toContain('Custom status')
    expect(getFieldOptions({ key: 'Priority', label: 'Priority', options: ['P0', 'P1'] }, 'P2')).toEqual(['P0', 'P1', 'P2'])
  })

  it('detects links and currency prefixes without exposing raw values', () => {
    expect(isExternalUrl('https://example.com')).toBe(true)
    expect(isExternalUrl('HACK-001')).toBe(false)
    expect(getCurrencyPrefix('$50,000')).toBe('$')
    expect(getCurrencyPrefix('Rp 100.000')).toBe('Rp')
    expect(getCurrencyPrefix('50000')).toBe('')
  })
})
