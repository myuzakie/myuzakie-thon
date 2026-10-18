'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

import { DriveEvidence } from '@/components/hackathon/drive-evidence'
import { DriveUpload } from '@/components/hackathon/drive-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SheetKey } from '@/lib/google-workspace'

type Row = Record<string, string | number>
type Field = { key: string; label: string; placeholder?: string; multiline?: boolean }

const prefixBySheet: Record<SheetKey, string> = {
  events: 'HACK',
  tasks: 'T',
  ideas: 'IDEA',
  resources: 'UI',
  submission: 'SC',
  dashboard: 'METRIC'
}

export const LiveSheetTable = ({ sheet, idKey, title, columns, fields, initialRows, driveUploads = false, filterKey }: { sheet: SheetKey; idKey: string; title: string; columns: Array<{ key: string; label: string }>; fields: Field[]; initialRows: Row[]; driveUploads?: boolean; filterKey?: string }) => {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [detail, setDetail] = useState<Row | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [filterValue, setFilterValue] = useState('')
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: idKey, direction: 'asc' })
  const [saving, setSaving] = useState(false)
  const pageSize = 8

  const loadRows = useCallback(async () => {
    setLoading(true)
    setSyncError('')

    try {
      const response = await fetch(`/api/sheets/${sheet}`, { cache: 'no-store' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Google Sheets tidak tersedia')
      setRows(body.rows)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Google Sheets tidak tersedia. Menampilkan snapshot lokal.')
      setRows(initialRows)
    } finally {
      setLoading(false)
    }
  }, [initialRows, sheet])

  // The first read is an external synchronization with Google Sheets.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadRows() }, [loadRows])

  const filterOptions = useMemo(() => filterKey ? Array.from(new Set(rows.map(row => String(row[filterKey] ?? '')).filter(Boolean))).sort((left, right) => left.localeCompare(right)) : [], [filterKey, rows])

  const filteredRows = useMemo(() => {
    const nextRows = rows.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(query.toLowerCase())))
      .filter(row => !filterKey || !filterValue || String(row[filterKey] ?? '') === filterValue)

    return [...nextRows].sort((left, right) => {
      const leftValue = String(left[sort.key] ?? '')
      const rightValue = String(right[sort.key] ?? '')
      const leftNumber = Number(leftValue)
      const rightNumber = Number(rightValue)
      const result = Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftValue !== '' && rightValue !== '' ? leftNumber - rightNumber : leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' })

      return sort.direction === 'asc' ? result : -result
    })
  }, [filterKey, filterValue, query, rows, sort])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize)

  const openAdd = () => {
    setEditing(null)
    setForm(Object.fromEntries(fields.map(field => [field.key, ''])))
    setDialogOpen(true)
  }

  const openEdit = (row: Row) => {
    setEditing(row)
    setForm(Object.fromEntries(fields.map(field => [field.key, String(row[field.key] ?? '')])))
    setDialogOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setSyncError('')

    try {
      const id = editing?.[idKey] ? String(editing[idKey]) : `${prefixBySheet[sheet]}-${Date.now().toString(36).toUpperCase()}`
      const record = { [idKey]: id, ...form }
      const response = await fetch(`/api/sheets/${sheet}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { id, changes: form } : { record }) })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Perubahan gagal disimpan')
      setDialogOpen(false)
      await loadRows()
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Perubahan gagal disimpan')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: Row) => {
    const id = String(row[idKey] ?? '')

    if (!id || !window.confirm(`Hapus ${id}? Baris akan dikosongkan di Google Sheets.`)) return
    const response = await fetch(`/api/sheets/${sheet}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const body = await response.json()

    if (!response.ok) setSyncError(body.message ?? 'Hapus gagal')
    else await loadRows()
  }

  return (
    <Card className='shadow-none'>
      <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div><CardTitle>{title}</CardTitle><p className='text-muted-foreground mt-1 text-xs'>{syncError ? 'Snapshot lokal · konfigurasi Google belum aktif' : 'Google Sheets live data'}</p></div>
        <div className='flex flex-wrap gap-2'><Button variant='outline' size='sm' className='gap-1.5' onClick={() => void loadRows()} disabled={loading}>{loading ? <Loader2 className='size-3.5 animate-spin' /> : <RefreshCw className='size-3.5' />} Refresh</Button><Button size='sm' className='gap-1.5' onClick={openAdd}><Plus className='size-3.5' /> Add</Button></div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {syncError && <div className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs'>{syncError}</div>}
        <div className='flex flex-wrap gap-2'><div className='relative max-w-sm flex-1'><Search className='text-muted-foreground absolute top-2.5 left-2.5 size-4' /><Input value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder='Search records...' className='pl-8' /></div>{filterKey && filterOptions.length > 0 && <select aria-label={`Filter by ${filterKey}`} className='border-input bg-background h-9 rounded-md border px-3 text-sm' value={filterValue} onChange={event => { setFilterValue(event.target.value); setPage(1) }}><option value=''>All {filterKey.replaceAll('_', ' ')}</option>{filterOptions.map(option => <option key={option} value={option}>{option}</option>)}</select>}</div>
        <div className='overflow-x-auto'><table className='w-full text-sm'><thead><tr className='border-b text-left'>{columns.map(column => <th key={column.key} className='text-muted-foreground px-3 py-2 font-medium'><button type='button' className='inline-flex items-center gap-1 hover:text-foreground' onClick={() => setSort(current => ({ key: column.key, direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc' }))}>{column.label}<ArrowUpDown className='size-3' /></button></th>)}<th className='px-3 py-2 text-right'>Actions</th></tr></thead><tbody>{visibleRows.map(row => <tr key={String(row[idKey] ?? row._rowNumber)} className='border-b last:border-0'><>{columns.map(column => <td key={column.key} className='max-w-72 px-3 py-3 align-top'><span className={column.key.toLowerCase().includes('id') ? 'font-mono text-xs' : ''}>{String(row[column.key] ?? '—')}</span></td>)}</><td className='px-3 py-3 align-top'><div className='flex justify-end gap-1'><Button variant='ghost' size='icon' onClick={() => setDetail(row)} aria-label='View row' title='View detail'><Eye className='size-4' /></Button><Button variant='ghost' size='icon' onClick={() => openEdit(row)} aria-label='Edit row' title='Edit'><Pencil className='size-4' /></Button>{driveUploads && <><DriveUpload sheet={sheet} rowId={String(row[idKey] ?? '')} folderUrl={String(row.Drive_Folder ?? '')} /><DriveEvidence sheet={sheet} rowId={String(row[idKey] ?? '')} folderUrl={String(row.Drive_Folder ?? '')} fileId={String(row.Drive_File_ID ?? '') || undefined} evidenceUrl={String(row.Evidence_URL ?? '') || undefined} /></>}<Button variant='ghost' size='icon' onClick={() => void remove(row)} aria-label='Delete row' title='Delete'><Trash2 className='size-4' /></Button></div></td></tr>)}</tbody></table></div>
        {visibleRows.length === 0 && <div className='text-muted-foreground py-8 text-center text-sm'>Tidak ada record.</div>}
        <div className='flex items-center justify-between gap-3 border-t pt-3'><span className='text-muted-foreground text-xs'>{filteredRows.length} records · page {safePage} / {pageCount}</span><div className='flex gap-1'><Button variant='outline' size='icon-sm' onClick={() => setPage(current => Math.max(1, current - 1))} disabled={safePage === 1}><ChevronLeft className='size-4' /></Button><Button variant='outline' size='icon-sm' onClick={() => setPage(current => Math.min(pageCount, current + 1))} disabled={safePage === pageCount}><ChevronRight className='size-4' /></Button></div></div>
      </CardContent>
      <Dialog open={detail !== null} onOpenChange={open => { if (!open) setDetail(null) }}><DialogContent><DialogHeader><DialogTitle>Record detail</DialogTitle><DialogDescription>Data item dari {title}.</DialogDescription></DialogHeader><div className='max-h-[60vh] space-y-3 overflow-y-auto'>{detail && Object.entries(detail).filter(([key]) => key !== '_rowNumber').map(([key, value]) => <div key={key} className='border-b pb-2'><p className='text-muted-foreground text-xs'>{key.replaceAll('_', ' ')}</p><p className='break-words text-sm'>{String(value || '—')}</p></div>)}</div><DialogFooter><Button variant='outline' onClick={() => setDetail(null)}>Close</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit record' : 'Tambah record'}</DialogTitle><DialogDescription>Perubahan akan ditulis ke Google Sheets saat integration server aktif.</DialogDescription></DialogHeader><div className='max-h-[60vh] space-y-4 overflow-y-auto'>{fields.map(field => <div key={field.key} className='space-y-2'><Label htmlFor={`field-${field.key}`}>{field.label}</Label>{field.multiline ? <Textarea id={`field-${field.key}`} value={form[field.key] ?? ''} placeholder={field.placeholder} onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))} /> : <Input id={`field-${field.key}`} value={form[field.key] ?? ''} placeholder={field.placeholder} onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))} />}</div>)}</div><DialogFooter><DialogClose render={<Button variant='outline' />}>Cancel</DialogClose><Button onClick={() => void save()} disabled={saving}>{saving && <Loader2 className='size-4 animate-spin' />}Save changes</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  )
}
