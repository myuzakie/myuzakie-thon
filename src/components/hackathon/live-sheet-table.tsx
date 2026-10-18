'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowUpDown, CalendarRange, ChevronLeft, ChevronRight, Columns3, Eye, LayoutList, Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

import { DriveEvidence } from '@/components/hackathon/drive-evidence'
import { DriveUpload } from '@/components/hackathon/drive-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { SheetKey } from '@/lib/google-workspace'

type Row = Record<string, string | number>
type Field = { key: string; label: string; placeholder?: string; multiline?: boolean }
type Column = { key: string; label: string; format?: (value: string | number | undefined, row: Row) => string }
type ConflictState = { id: string; currentRecord: Row | null }

type ViewMode = 'table' | 'kanban' | 'timeline'

export const LiveSheetTable = ({ sheet, idKey, title, columns, fields, initialRows, driveUploads = false, filterKey, initialFilterValue = '', viewModes = false, autoSyncIntervalMs = 60000 }: { sheet: SheetKey; idKey: string; title: string; columns: Column[]; fields: Field[]; initialRows: Row[]; driveUploads?: boolean; filterKey?: string; initialFilterValue?: string; viewModes?: boolean; autoSyncIntervalMs?: number }) => {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [detail, setDetail] = useState<Row | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [filterValue, setFilterValue] = useState(initialFilterValue)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: idKey, direction: 'asc' })
  const [saving, setSaving] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const [conflict, setConflict] = useState<ConflictState | null>(null)
  const pageSize = 8

  const loadRows = useCallback(async () => {
    setLoading(true)
    setSyncError('')

    try {
      const response = await fetch(`/api/sheets/${sheet}`, { cache: 'no-store' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Google Sheets tidak tersedia')
      setRows(body.rows)
      setLastSyncedAt(body.syncedAt ?? new Date().toISOString())
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

  useEffect(() => {
    if (!autoSyncIntervalMs) return

    const interval = window.setInterval(() => { void loadRows() }, autoSyncIntervalMs)

    return () => window.clearInterval(interval)
  }, [autoSyncIntervalMs, loadRows])

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

  const save = async (force = false) => {
    setSaving(true)
    setSyncError('')

    try {
      const id = editing?.[idKey] ? String(editing[idKey]) : ''
      const record = editing ? { [idKey]: id, ...form } : form
      const response = await fetch(`/api/sheets/${sheet}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { id, expectedVersion: editing._version, force, changes: form } : { record }) })
      const body = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setConflict({ id, currentRecord: body.details?.currentRecord ?? null })
          setSyncError('Conflict terdeteksi: record berubah langsung di Google Sheets. Pilih data terbaru atau overwrite dengan perubahan Anda.')

          return
        }

        throw new Error(body.message ?? 'Perubahan gagal disimpan')
      }

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

    if (!id || !window.confirm(`Hapus ${id}? Record akan ditandai Deleted di Google Sheets.`)) return
    const response = await fetch(`/api/sheets/${sheet}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, expectedVersion: row._version }) })
    const body = await response.json()

    if (!response.ok) {
      setSyncError(response.status === 409 ? 'Conflict terdeteksi: record sudah berubah di Google Sheets. Refresh dilakukan sebelum mencoba lagi.' : body.message ?? 'Hapus gagal')
      if (response.status === 409) await loadRows()
    }
    else await loadRows()
  }

  const discardConflict = async () => {
    setConflict(null)
    setDialogOpen(false)
    await loadRows()
  }

  return (
    <Card className='shadow-none'>
      <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div><CardTitle>{title}</CardTitle><p className='text-muted-foreground mt-1 text-xs'>{syncError ? 'Snapshot lokal · konfigurasi Google belum aktif' : `Google Sheets live data${lastSyncedAt ? ` · sync ${new Date(lastSyncedAt).toLocaleString('id-ID')}` : ''}`}</p></div>
        <div className='flex flex-wrap items-center gap-2'>{viewModes && <div className='bg-muted flex rounded-md p-1'>{([['table', LayoutList, 'Table'], ['kanban', Columns3, 'Kanban'], ['timeline', CalendarRange, 'Timeline']] as const).map(([mode, Icon, label]) => <button key={mode} type='button' className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs transition-colors ${viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}><Icon className='size-3.5' />{label}</button>)}</div>}<Button variant='outline' size='sm' className='gap-1.5' onClick={() => void loadRows()} disabled={loading}>{loading ? <Loader2 className='size-3.5 animate-spin' /> : <RefreshCw className='size-3.5' />} Refresh</Button><Button size='sm' className='gap-1.5' onClick={openAdd}><Plus className='size-3.5' /> Add</Button></div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {syncError && <div className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs'>{syncError}</div>}
        <div className='flex flex-wrap gap-2'><div className='relative max-w-sm flex-1'><Search className='text-muted-foreground absolute top-2.5 left-2.5 size-4' /><Input value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder='Search records...' className='pl-8' /></div>{filterKey && filterOptions.length > 0 && <select aria-label={`Filter by ${filterKey}`} className='border-input bg-background h-9 rounded-md border px-3 text-sm' value={filterValue} onChange={event => { setFilterValue(event.target.value); setPage(1) }}><option value=''>All {filterKey.replaceAll('_', ' ')}</option>{filterOptions.map(option => <option key={option} value={option}>{option}</option>)}</select>}</div>
        {viewMode === 'table' && <div className='overflow-x-auto'><table className='w-full text-sm'><thead><tr className='border-b text-left'>{columns.map(column => <th key={column.key} className='text-muted-foreground px-3 py-2 font-medium'><button type='button' className='inline-flex items-center gap-1 hover:text-foreground' onClick={() => setSort(current => ({ key: column.key, direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc' }))}>{column.label}<ArrowUpDown className='size-3' /></button></th>)}<th className='px-3 py-2 text-right'>Actions</th></tr></thead><tbody>{visibleRows.map(row => <tr key={String(row[idKey] ?? row._rowNumber)} className='border-b last:border-0'><>{columns.map(column => <td key={column.key} className='max-w-72 px-3 py-3 align-top'><span className={column.key.toLowerCase().includes('id') ? 'font-mono text-xs' : ''}>{column.format ? column.format(row[column.key], row) : String(row[column.key] ?? '—')}</span></td>)}</><td className='px-3 py-3 align-top'><div className='flex justify-end gap-1'><Button variant='ghost' size='icon' onClick={() => setDetail(row)} aria-label='View row' title='View detail'><Eye className='size-4' /></Button><Button variant='ghost' size='icon' onClick={() => openEdit(row)} aria-label='Edit row' title='Edit'><Pencil className='size-4' /></Button>{driveUploads && <><DriveUpload sheet={sheet} rowId={String(row[idKey] ?? '')} folderUrl={String(row.Drive_Folder ?? '')} expectedVersion={String(row._version ?? '') || undefined} /><DriveEvidence sheet={sheet} rowId={String(row[idKey] ?? '')} folderUrl={String(row.Drive_Folder ?? '')} fileId={String(row.Drive_File_ID ?? '') || undefined} evidenceUrl={String(row.Evidence_URL ?? '') || undefined} rowVersion={String(row._version ?? '') || undefined} /></>}<Button variant='ghost' size='icon' onClick={() => void remove(row)} aria-label='Delete row' title='Delete'><Trash2 className='size-4' /></Button></div></td></tr>)}</tbody></table></div>}
        {viewMode === 'kanban' && <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>{['Backlog', 'In Progress', 'Blocked', 'Done'].map(status => { const statusRows = visibleRows.filter(row => String(row.Status ?? '') === status);

 return <section key={status} className='bg-muted/30 min-h-44 rounded-lg border p-3'><div className='mb-3 flex items-center justify-between'><p className='text-sm font-medium'>{status}</p><span className='text-muted-foreground text-xs'>{statusRows.length}</span></div><div className='space-y-2'>{statusRows.map(row => <button key={String(row[idKey] ?? row._rowNumber)} type='button' className='bg-background hover:border-foreground/30 w-full rounded-md border p-3 text-left transition-colors' onClick={() => setDetail(row)}><p className='line-clamp-2 text-sm font-medium'>{String(row.Task ?? row[idKey] ?? 'Untitled')}</p><p className='text-muted-foreground mt-2 font-mono text-[10px]'>{String(row[idKey] ?? '')} · {String(row.Due_WIB ?? 'No due date')}</p><div className='mt-2 flex flex-wrap gap-1'><span className='bg-muted rounded px-1.5 py-0.5 text-[10px]'>{String(row.Priority ?? '—')}</span><span className='bg-muted rounded px-1.5 py-0.5 text-[10px]'>{String(row.Workstream ?? '—')}</span></div></button>)}</div>{statusRows.length === 0 && <p className='text-muted-foreground py-6 text-center text-xs'>Tidak ada task.</p>}</section> })}</div>}
        {viewMode === 'timeline' && <div className='space-y-2'>{visibleRows.map(row => <button key={String(row[idKey] ?? row._rowNumber)} type='button' className='hover:bg-muted/40 flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors' onClick={() => setDetail(row)}><span className='bg-foreground mt-1.5 size-2 shrink-0 rounded-full' /><span className='min-w-0 flex-1'><span className='flex flex-wrap items-center justify-between gap-2'><span className='text-sm font-medium'>{String(row.Task ?? row[idKey] ?? 'Untitled')}</span><span className='text-muted-foreground font-mono text-[10px]'>{String(row.Due_WIB ?? 'No due date')}</span></span><span className='text-muted-foreground mt-1 block text-xs'>{String(row.Workstream ?? '—')} · {String(row.Priority ?? '—')} · {String(row.Status ?? '—')}</span></span></button>)}</div>}
        {visibleRows.length === 0 && <div className='text-muted-foreground py-8 text-center text-sm'>Tidak ada record.</div>}
        <div className='flex items-center justify-between gap-3 border-t pt-3'><span className='text-muted-foreground text-xs'>{filteredRows.length} records · page {safePage} / {pageCount}</span><div className='flex gap-1'><Button variant='outline' size='icon-sm' onClick={() => setPage(current => Math.max(1, current - 1))} disabled={safePage === 1}><ChevronLeft className='size-4' /></Button><Button variant='outline' size='icon-sm' onClick={() => setPage(current => Math.min(pageCount, current + 1))} disabled={safePage === pageCount}><ChevronRight className='size-4' /></Button></div></div>
      </CardContent>
      <Sheet open={detail !== null} onOpenChange={open => { if (!open) setDetail(null) }}><SheetContent side='right' className='w-full overflow-y-auto sm:max-w-xl'><SheetHeader className='border-b'><SheetTitle>{detail ? String(detail[idKey] ?? 'Record detail') : 'Record detail'}</SheetTitle><SheetDescription>Data item dari {title}. Field teknis dipisahkan dari informasi utama.</SheetDescription></SheetHeader><div className='space-y-6 px-4 pb-4'>{detail && <><section className='space-y-3'>{Object.entries(detail).filter(([key]) => !key.startsWith('_') && !['Created_At', 'Updated_At', 'Updated_By', 'Last_Synced_At'].includes(key)).map(([key, value]) => <div key={key} className='border-b pb-2'><p className='text-muted-foreground text-xs'>{key.replaceAll('_', ' ')}</p><p className='break-words text-sm'>{String(value || '—')}</p></div>)}</section><details className='rounded-md border p-3'><summary className='cursor-pointer text-sm font-medium'>System information</summary><div className='mt-3 space-y-2'>{Object.entries(detail).filter(([key]) => key.startsWith('_') || ['Created_At', 'Updated_At', 'Updated_By', 'Last_Synced_At'].includes(key)).map(([key, value]) => <div key={key}><p className='text-muted-foreground text-xs'>{key.replaceAll('_', ' ')}</p><p className='break-words font-mono text-[10px]'>{String(value || '—')}</p></div>)}</div></details></>}</div><SheetFooter><Button variant='outline' onClick={() => setDetail(null)}>Close</Button></SheetFooter></SheetContent></Sheet>
      <Dialog open={conflict !== null} onOpenChange={open => { if (!open) void discardConflict() }}><DialogContent><DialogHeader><DialogTitle>Conflict detected</DialogTitle><DialogDescription>Google Sheets berubah setelah data ini dibuka. Pilih apakah akan menggunakan data terbaru atau menimpa dengan perubahan dari web.</DialogDescription></DialogHeader><div className='max-h-64 space-y-3 overflow-y-auto rounded-md border p-3'>{conflict?.currentRecord && Object.keys(form).map(key => <div key={key} className='grid gap-1 text-sm sm:grid-cols-2'><div><p className='text-muted-foreground text-xs'>Perubahan web · {key}</p><p className='break-words'>{form[key] || '—'}</p></div><div><p className='text-muted-foreground text-xs'>Versi Sheets</p><p className='break-words'>{String(conflict.currentRecord?.[key] ?? '—')}</p></div></div>)}</div><DialogFooter><Button variant='outline' onClick={() => void discardConflict()}>Use latest Sheets data</Button><Button onClick={() => { setConflict(null); void save(true) }} disabled={saving}>{saving && <Loader2 className='size-4 animate-spin' />}Overwrite Sheets</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit record' : 'Tambah record'}</DialogTitle><DialogDescription>Perubahan akan ditulis ke Google Sheets saat integration server aktif.</DialogDescription></DialogHeader><div className='max-h-[60vh] space-y-4 overflow-y-auto'>{fields.map(field => <div key={field.key} className='space-y-2'><Label htmlFor={`field-${field.key}`}>{field.label}</Label>{field.multiline ? <Textarea id={`field-${field.key}`} value={form[field.key] ?? ''} placeholder={field.placeholder} onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))} /> : <Input id={`field-${field.key}`} value={form[field.key] ?? ''} placeholder={field.placeholder} onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))} />}</div>)}</div><DialogFooter><DialogClose render={<Button variant='outline' />}>Cancel</DialogClose><Button onClick={() => void save()} disabled={saving}>{saving && <Loader2 className='size-4 animate-spin' />}Save changes</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  )
}
