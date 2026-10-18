export type FieldType = 'text' | 'textarea' | 'url' | 'date' | 'number' | 'currency' | 'select'

type FieldLike = { key: string; label?: string; multiline?: boolean; type?: FieldType; options?: string[] }

const selectKeyPattern = /(^|_)(status|priority|required|category|workstream|verification|eligibility|validation|review)(_|$)/i
const urlKeyPattern = /(url|uri|link|repository|website|source|folder(?!_id))/i
const currencyKeyPattern = /(prize|award|amount|budget|cost|price|revenue|usd|idr|currency)/i
const dateKeyPattern = /(date|deadline|due|at$)/i

export const inferFieldType = (field: FieldLike): FieldType => {
  if (field.type) return field.type
  if (field.multiline) return 'textarea'
  if (urlKeyPattern.test(field.key) || urlKeyPattern.test(field.label ?? '')) return 'url'
  if (currencyKeyPattern.test(field.key) || currencyKeyPattern.test(field.label ?? '')) return 'currency'
  if (selectKeyPattern.test(field.key)) return 'select'
  if (dateKeyPattern.test(field.key)) return 'date'

  return 'text'
}

export const getFieldOptions = (field: FieldLike, currentValue = '') => {
  if (field.options?.length) return Array.from(new Set([...field.options, currentValue].filter(Boolean)))

  if (/priority/i.test(field.key)) return ['P0', 'P1', 'P2', 'P3', currentValue].filter(Boolean)
  if (/required/i.test(field.key)) return ['Yes', 'No', currentValue].filter(Boolean)
  if (/verification|eligibility|validation|review/i.test(field.key)) return ['Not Started', 'Pending', 'In Review', 'Verified', 'Eligible', 'Ineligible', currentValue].filter(Boolean)
  if (/status/i.test(field.key)) return ['Backlog', 'Not Started', 'In Progress', 'Blocked', 'At Risk', 'Done', 'Completed', 'Submitted', 'Closed', currentValue].filter(Boolean)

  return currentValue ? [currentValue] : []
}

export const isExternalUrl = (value: string) => /^https?:\/\//i.test(value.trim())

export const getCurrencyPrefix = (value: string) => value.trim().startsWith('$') ? '$' : value.trim().startsWith('€') ? '€' : value.trim().startsWith('£') ? '£' : value.trim().startsWith('Rp') ? 'Rp' : ''
