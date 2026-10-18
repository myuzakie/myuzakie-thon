'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { CheckCircle2, CircleAlert, Clock3, GitBranch, Loader2, RefreshCw, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { project } from '@/lib/hackathon-data'

type Row = Record<string, string | number>

const isDone = (status: string) => /done|complete|completed|submitted|verified|closed/i.test(status)
const isBlocked = (status: string) => /blocked|at risk|overdue/i.test(status)

const parseDate = (value: string) => {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export const ProjectDeliveryOverview = ({ initialRows }: { initialRows: Row[] }) => {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [syncedAt, setSyncedAt] = useState('')

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sheets/tasks', { cache: 'no-store' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Task tracker tidak tersedia')
      setRows(body.rows ?? initialRows)
      setSyncedAt(body.syncedAt ?? new Date().toISOString())
    } catch (loadError) {
      setRows(initialRows)
      setError(loadError instanceof Error ? loadError.message : 'Snapshot lokal digunakan')
    } finally {
      setLoading(false)
    }
  }, [initialRows])

  // Refresh the overview independently from the table so its summary stays useful after external edits.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadRows() }, [loadRows])

  const summary = useMemo(() => {
    const now = new Date()
    const done = rows.filter(row => isDone(String(row.Status ?? ''))).length
    const blocked = rows.filter(row => isBlocked(String(row.Status ?? ''))).length

    const overdue = rows.filter(row => { const due = parseDate(String(row.Due_WIB ?? ''));

 return due && due < now && !isDone(String(row.Status ?? '')) }).length

    const inProgress = rows.filter(row => /progress|doing|active/i.test(String(row.Status ?? ''))).length

    return { total: rows.length, done, blocked, overdue, inProgress, progress: rows.length ? Math.round((done / rows.length) * 100) : 0 }
  }, [rows])

  return <Card className='shadow-none'><CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'><div><div className='flex flex-wrap items-center gap-2'><CardTitle>{project.name}</CardTitle><Badge variant='secondary'>Building</Badge></div><p className='text-muted-foreground mt-2 flex items-center gap-2 text-sm'><GitBranch className='size-4' />{project.branch}</p><div className='text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs'><a className='hover:text-foreground hover:underline' href={project.repository} target='_blank' rel='noreferrer'>Open repository</a>{syncedAt && <span>Task sync {new Date(syncedAt).toLocaleString('id-ID')}</span>}{error && <span className='text-destructive'>{error}</span>}</div></div><Button variant='outline' size='sm' className='gap-1.5' onClick={() => void loadRows()} disabled={loading}>{loading ? <Loader2 className='size-3.5 animate-spin' /> : <RefreshCw className='size-3.5' />} Refresh overview</Button></CardHeader><CardContent className='space-y-5'><div className='flex flex-wrap items-center justify-between gap-3 text-sm'><span>Delivery progress</span><span className='font-mono text-xs'>{summary.progress}% · {summary.done}/{summary.total || 0} done</span></div><Progress value={summary.progress} /><div className='grid gap-3 sm:grid-cols-4'><div className='bg-muted/50 rounded-md p-3'><CheckCircle2 className='size-4' /><p className='text-muted-foreground mt-2 text-xs'>Completed</p><p className='mt-1 text-lg font-semibold'>{summary.done}</p></div><div className='bg-muted/50 rounded-md p-3'><Clock3 className='size-4' /><p className='text-muted-foreground mt-2 text-xs'>In progress</p><p className='mt-1 text-lg font-semibold'>{summary.inProgress}</p></div><div className='bg-muted/50 rounded-md p-3'><TriangleAlert className='size-4' /><p className='text-muted-foreground mt-2 text-xs'>Blocked</p><p className='mt-1 text-lg font-semibold'>{summary.blocked}</p></div><div className='bg-muted/50 rounded-md p-3'><CircleAlert className='size-4' /><p className='text-muted-foreground mt-2 text-xs'>Overdue</p><p className='mt-1 text-lg font-semibold'>{summary.overdue}</p></div></div></CardContent></Card>
}
