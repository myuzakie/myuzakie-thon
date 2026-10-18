'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Cloud, CloudOff, FileCheck2, HardDrive, ListChecks, Loader2, Plus, RefreshCw, TriangleAlert, Upload } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { project, submissionItems, tasks as fallbackTasks, events as fallbackEvents } from '@/lib/hackathon-data'

type Row = Record<string, string | number>
type IntegrationState = { configured?: boolean; driveFolderConfigured?: boolean }

const text = (row: Row, key: string) => String(row[key] ?? '').trim()

const isDone = (value: string) => /done|complete|completed|submitted|verified|closed/i.test(value)
const isRisk = (value: string) => /blocked|overdue|at risk|risk|conflict|review/i.test(value)

const parseDate = (value: string) => {
  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const dayDifference = (date: Date, now: Date) => Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

const normalizeRows = (value: unknown, fallback: Row[] = []) => {
  const candidate = Array.isArray(value) ? value : fallback

  return candidate.filter(row => Boolean(row) && typeof row === 'object' && !Array.isArray(row)) as Row[]
}

const formatDate = (value: string) => {
  const date = parseDate(value)

  return date ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date) : value || 'Tanggal belum diisi'
}

const loadSheetRows = async (sheet: string, fallback: Row[]) => {
  const response = await fetch(`/api/sheets/${sheet}`, { cache: 'no-store' })
  const body = await response.json() as { rows?: unknown; syncedAt?: unknown; message?: string }

  if (!response.ok) throw new Error(body.message ?? `Sheet ${sheet} tidak tersedia`)

  return { rows: normalizeRows(body.rows, fallback), syncedAt: String(body.syncedAt ?? '') }
}

const fallbackEventRows: Row[] = fallbackEvents.map(event => ({ Event_ID: event.id, Event_Name: event.name, Deadline_WIB: event.deadline, Verification_Status: event.verification, Status: event.status, Drive_Folder: event.driveFolder }))
const fallbackTaskRows: Row[] = fallbackTasks.map(task => ({ Task_ID: task.id, Event_ID: task.eventId, Task: task.task, Workstream: task.workstream, Priority: task.priority, Due_WIB: task.due, Status: task.status }))
const fallbackSubmissionRows: Row[] = submissionItems.map(item => ({ Checklist_ID: item.id, Event_ID: item.eventId, Requirement: item.requirement, Category: item.category, Status: item.status }))

export const OperationsCommandCenter = ({ initialEvents, initialTasks, initialSubmission }: { initialEvents?: Row[]; initialTasks?: Row[]; initialSubmission?: Row[] }) => {
  const initialEventRows = useMemo(() => normalizeRows(initialEvents, fallbackEventRows), [initialEvents])
  const initialTaskRows = useMemo(() => normalizeRows(initialTasks, fallbackTaskRows), [initialTasks])
  const initialSubmissionRows = useMemo(() => normalizeRows(initialSubmission, fallbackSubmissionRows), [initialSubmission])
  const [events, setEvents] = useState<Row[]>(initialEventRows)
  const [tasks, setTasks] = useState<Row[]>(initialTaskRows)
  const [submission, setSubmission] = useState<Row[]>(initialSubmissionRows)
  const [integration, setIntegration] = useState<IntegrationState>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState('')

  const loadWorkspace = useCallback(async () => {
    setLoading(true)
    setError('')

    const [eventResult, taskResult, submissionResult, integrationResult] = await Promise.allSettled([
      loadSheetRows('events', initialEventRows),
      loadSheetRows('tasks', initialTaskRows),
      loadSheetRows('submission', initialSubmissionRows),
      fetch('/api/integrations/status', { cache: 'no-store' }).then(async response => {
        const body = await response.json()

        if (!response.ok) throw new Error(body.message ?? 'Status integration tidak tersedia')

        return body as IntegrationState
      })
    ])

    const errors: string[] = []

    if (eventResult.status === 'fulfilled') setEvents(eventResult.value.rows)
    else errors.push(eventResult.reason instanceof Error ? eventResult.reason.message : 'Events tidak tersedia')
    if (taskResult.status === 'fulfilled') setTasks(taskResult.value.rows)
    else errors.push(taskResult.reason instanceof Error ? taskResult.reason.message : 'Tasks tidak tersedia')
    if (submissionResult.status === 'fulfilled') setSubmission(submissionResult.value.rows)
    else errors.push(submissionResult.reason instanceof Error ? submissionResult.reason.message : 'Submission tidak tersedia')
    if (integrationResult.status === 'fulfilled') setIntegration(integrationResult.value)

    const syncTimes = [eventResult, taskResult, submissionResult].filter(result => result.status === 'fulfilled').map(result => result.value.syncedAt).filter(Boolean)

    if (syncTimes.length) setLastSyncedAt(syncTimes.sort().at(-1) ?? '')
    if (errors.length) setError('Sebagian data belum tersinkron. Snapshot lokal dipakai untuk bagian yang gagal.')
    setLoading(false)
  }, [initialEventRows, initialSubmissionRows, initialTaskRows])

  // Sync once on mount and keep the command center current while it is open.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadWorkspace() }, [loadWorkspace])

  useEffect(() => {
    const interval = window.setInterval(() => { void loadWorkspace() }, 60000)

    return () => window.clearInterval(interval)
  }, [loadWorkspace])

  const metrics = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const activeEvents = events.filter(row => !isDone(text(row, 'Status'))).length
    const openTasks = tasks.filter(row => !isDone(text(row, 'Status')))
    const completedTasks = tasks.filter(row => isDone(text(row, 'Status'))).length
    const blockedTasks = openTasks.filter(row => isRisk(text(row, 'Status'))).length

    const overdueTasks = openTasks.filter(row => { const date = parseDate(text(row, 'Due_WIB'));

 return date ? date < now : false }).length

    const dueSoonTasks = openTasks.filter(row => { const date = parseDate(text(row, 'Due_WIB'));

 return date ? date >= now && date <= nextWeek : false }).length

    const completedSubmission = submission.filter(row => isDone(text(row, 'Status'))).length
    const submissionReadiness = submission.length ? Math.round((completedSubmission / submission.length) * 100) : 0
    const missingEvidence = submission.filter(row => !text(row, 'Drive_File_ID') && !text(row, 'Evidence_URL')).length
    const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    const deadlineEvents = events.map(row => ({ row, date: parseDate(text(row, 'Deadline_WIB')) })).filter(item => item.date).sort((left, right) => left.date!.getTime() - right.date!.getTime())

    return { activeEvents, openTasks, completedTasks, blockedTasks, overdueTasks, dueSoonTasks, completedSubmission, submissionReadiness, missingEvidence, progress, deadlineEvents, totalTasks: tasks.length }
  }, [events, submission, tasks])

  const attentionItems = useMemo(() => {
    const items: Array<{ title: string; detail: string; href: string; severity: 'critical' | 'warning' | 'info' }> = []
    const now = new Date()

    tasks.forEach(row => {
      const due = parseDate(text(row, 'Due_WIB'))
      const status = text(row, 'Status')

      if (due && due < now && !isDone(status)) items.push({ title: text(row, 'Task') || text(row, 'Task_ID'), detail: `Overdue · ${text(row, 'Due_WIB')}`, href: '/projects?status=overdue', severity: 'critical' })
      else if (isRisk(status)) items.push({ title: text(row, 'Task') || text(row, 'Task_ID'), detail: `${status} · ${text(row, 'Priority') || 'Prioritas belum diisi'}`, href: '/projects?status=blocked', severity: 'warning' })
    })

    events.forEach(row => {
      const verification = text(row, 'Verification_Status')

      if (isRisk(verification)) items.push({ title: text(row, 'Event_Name') || text(row, 'Event_ID'), detail: verification, href: `/hackathons?event=${encodeURIComponent(text(row, 'Event_ID'))}`, severity: 'warning' })
    })

    if (metrics.missingEvidence > 0) items.push({ title: `${metrics.missingEvidence} evidence belum terhubung`, detail: 'Lengkapi evidence untuk submission', href: '/submission', severity: 'info' })

    return items.slice(0, 5)
  }, [events, metrics.missingEvidence, tasks])

  const kpis = [
    { label: 'Active hackathons', value: metrics.activeEvents, description: 'Event yang masih terbuka', href: '/hackathons', icon: CalendarClock },
    { label: 'Due 7 hari', value: metrics.dueSoonTasks, description: 'Task perlu dijadwalkan', href: '/projects?status=due-soon', icon: ListChecks },
    { label: 'Risk / blocked', value: metrics.blockedTasks + metrics.overdueTasks, description: 'Task butuh perhatian', href: '/projects?status=blocked', icon: TriangleAlert },
    { label: 'Submission readiness', value: `${metrics.submissionReadiness}%`, description: `${metrics.completedSubmission}/${submission.length || 0} checklist selesai`, href: '/submission', icon: FileCheck2 },
    { label: 'Evidence missing', value: metrics.missingEvidence, description: 'Item belum punya evidence', href: '/submission', icon: Upload }
  ]

  return (
    <div className='space-y-6'>
      <section className='flex flex-col justify-between gap-4 lg:flex-row lg:items-end'>
        <div className='space-y-2'>
          <p className='text-muted-foreground text-sm'>Workspace / Command center</p>
          <div className='flex flex-wrap items-center gap-2'><h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Hackathon Command Center</h1><Badge variant='secondary'>Building</Badge></div>
          <p className='text-muted-foreground max-w-2xl text-sm'>Prioritas harian, deadline, progress delivery, dan kesiapan submission dalam satu tampilan.</p>
          <div className='flex flex-wrap items-center gap-2 pt-1 text-xs'>
            <span className='text-muted-foreground inline-flex items-center gap-1.5'><Cloud className='size-3.5' />{integration.configured ? 'Sheets configured' : 'Sheets belum dikonfigurasi'}</span>
            <span className='text-border'>•</span>
            <span className='text-muted-foreground inline-flex items-center gap-1.5'>{integration.driveFolderConfigured ? <HardDrive className='size-3.5' /> : <CloudOff className='size-3.5' />}{integration.driveFolderConfigured ? 'Drive ready' : 'Drive folder belum siap'}</span>
            {lastSyncedAt && <><span className='text-border'>•</span><span className='text-muted-foreground'>Sync {new Date(lastSyncedAt).toLocaleString('id-ID')}</span></>}
          </div>
        </div>
        <div className='flex flex-wrap gap-2'><Button variant='outline' size='sm' className='gap-1.5' render={<Link href='/projects' />}><Plus className='size-3.5' /> Tambah task</Button><Button variant='outline' size='sm' className='gap-1.5' render={<Link href='/submission' />}><Upload className='size-3.5' /> Upload evidence</Button><Button size='sm' className='gap-1.5' onClick={() => void loadWorkspace()} disabled={loading}>{loading ? <Loader2 className='size-3.5 animate-spin' /> : <RefreshCw className='size-3.5' />} Refresh</Button></div>
      </section>

      {error && <div className='border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-xs'><CloudOff className='mt-0.5 size-4 shrink-0' />{error}</div>}

      <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
        {kpis.map(kpi => { const Icon = kpi.icon;

 return <Link key={kpi.label} href={kpi.href} className='group'><Card className='h-full shadow-none transition-colors group-hover:border-foreground/40'><CardContent className='flex items-start justify-between gap-3 p-4'><div><p className='text-muted-foreground text-xs'>{kpi.label}</p><p className='mt-2 text-2xl font-semibold tracking-tight'>{kpi.value}</p><p className='text-muted-foreground mt-1 text-[11px]'>{kpi.description}</p></div><Icon className='text-muted-foreground size-4' /></CardContent></Card></Link> })}
      </section>

      <section className='grid gap-4 xl:grid-cols-[1.15fr_1fr]'>
        <Card className='shadow-none'>
          <CardHeader className='flex flex-row items-start justify-between gap-4'><div><CardTitle>Needs attention</CardTitle><p className='text-muted-foreground mt-1 text-sm'>Item yang paling mungkin menghambat delivery.</p></div><AlertTriangle className='text-muted-foreground size-4' /></CardHeader>
          <CardContent className='space-y-2'>
            {attentionItems.map(item => <Link key={`${item.title}-${item.detail}`} href={item.href} className='hover:bg-muted/40 flex items-start gap-3 rounded-md border p-3 transition-colors'><span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.severity === 'critical' ? 'bg-destructive' : item.severity === 'warning' ? 'bg-amber-500' : 'bg-foreground'}`} /><span className='min-w-0 flex-1'><span className='block truncate text-sm font-medium'>{item.title}</span><span className='text-muted-foreground mt-1 block text-xs'>{item.detail}</span></span><ArrowRight className='text-muted-foreground mt-0.5 size-4 shrink-0' /></Link>)}
            {!attentionItems.length && <div className='text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'><CheckCircle2 className='mx-auto mb-2 size-5' />Tidak ada item kritis saat ini.</div>}
          </CardContent>
        </Card>

        <Card className='shadow-none'><CardHeader className='flex flex-row items-start justify-between gap-4'><div><CardTitle>Project progress</CardTitle><p className='text-muted-foreground mt-1 text-sm'>{project.name} · {project.branch}</p></div><Badge variant='outline'>{metrics.progress}% complete</Badge></CardHeader><CardContent className='space-y-4'><div className='flex items-center justify-between text-sm'><span>Task completion</span><span className='font-mono text-xs'>{metrics.completedTasks}/{metrics.totalTasks || 0}</span></div><Progress value={metrics.progress} /><div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>{[['Done', metrics.completedTasks], ['Open', metrics.openTasks.length], ['Blocked', metrics.blockedTasks], ['Overdue', metrics.overdueTasks]].map(([label, value]) => <div key={String(label)} className='bg-muted/50 rounded-md p-3'><p className='text-muted-foreground text-[11px]'>{label}</p><p className='mt-1 text-lg font-semibold'>{String(value)}</p></div>)}</div><Separator /><div className='flex flex-wrap items-center justify-between gap-2'><span className='text-muted-foreground text-xs'>Repository</span><a className='inline-flex items-center gap-1 text-xs hover:underline' href={project.repository} target='_blank' rel='noreferrer'>Open GitHub <ArrowRight className='size-3' /></a></div></CardContent></Card>
      </section>

      <section className='grid gap-4 xl:grid-cols-[1.15fr_1fr]'>
        <Card className='shadow-none'><CardHeader className='flex flex-row items-start justify-between gap-4'><div><CardTitle>Upcoming deadlines</CardTitle><p className='text-muted-foreground mt-1 text-sm'>Urut berdasarkan waktu dan risiko.</p></div><Link href='/hackathons' className='text-muted-foreground hover:text-foreground text-xs'>Lihat semua</Link></CardHeader><CardContent className='space-y-2'>{metrics.deadlineEvents.slice(0, 4).map(({ row, date }) => { const days = dayDifference(date!, new Date()); const verification = text(row, 'Verification_Status'); const overdue = days < 0; const atRisk = isRisk(verification); const status = overdue ? 'Overdue' : atRisk ? 'At risk' : 'On track';

 return <div key={text(row, 'Event_ID')} className='flex items-start gap-3 rounded-md border p-3'><CalendarClock className='text-muted-foreground mt-0.5 size-4 shrink-0' /><div className='min-w-0 flex-1'><div className='flex flex-wrap items-start justify-between gap-2'><p className='truncate text-sm font-medium'>{text(row, 'Event_Name') || text(row, 'Event_ID')}</p><Badge variant={status === 'Overdue' ? 'destructive' : status === 'At risk' ? 'outline' : 'secondary'} className='text-[10px]'>{status}</Badge></div><p className='text-muted-foreground mt-1 text-xs'>{formatDate(text(row, 'Deadline_WIB'))} · {overdue ? `${Math.abs(days)} hari terlambat` : `${days} hari lagi`}</p><p className='text-muted-foreground mt-1 truncate text-xs'>{verification || 'Verification belum diisi'}</p><div className='mt-2 flex flex-wrap gap-2'><Link href={`/hackathons?event=${encodeURIComponent(text(row, 'Event_ID'))}`} className='text-xs font-medium hover:underline'>Review event</Link><Link href='/submission' className='text-muted-foreground text-xs hover:underline'>Open checklist</Link></div></div></div> })}{!metrics.deadlineEvents.length && <p className='text-muted-foreground py-8 text-center text-sm'>Belum ada deadline event.</p>}</CardContent></Card>

        <Card className='shadow-none'><CardHeader className='flex flex-row items-start justify-between gap-4'><div><CardTitle>Submission readiness</CardTitle><p className='text-muted-foreground mt-1 text-sm'>Checklist yang menentukan kesiapan submit.</p></div><Link href='/submission' className='text-muted-foreground hover:text-foreground text-xs'>Open checklist</Link></CardHeader><CardContent className='space-y-4'><div className='flex items-end justify-between'><div><p className='text-3xl font-semibold'>{metrics.submissionReadiness}%</p><p className='text-muted-foreground text-xs'>{metrics.completedSubmission} dari {submission.length || 0} item selesai</p></div><FileCheck2 className='text-muted-foreground size-5' /></div><Progress value={metrics.submissionReadiness} />{submission.slice(0, 5).map(row => { const done = isDone(text(row, 'Status'));

 return <div key={text(row, 'Checklist_ID')} className='flex items-center gap-2 text-sm'><span className={`flex size-4 items-center justify-center rounded-full border ${done ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground/40'}`}>{done && <CheckCircle2 className='size-3' />}</span><span className={done ? 'text-muted-foreground line-through' : ''}>{text(row, 'Requirement') || text(row, 'Checklist_ID')}</span></div> })}</CardContent></Card>
      </section>
    </div>
  )
}

export const dashboardFallbackRows = {
  events: fallbackEventRows,
  tasks: fallbackTaskRows,
  submission: fallbackSubmissionRows
}
