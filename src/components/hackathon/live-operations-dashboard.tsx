'use client'

import { useCallback, useEffect, useState } from 'react'

import { Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type MetricRow = Record<string, string | number>

const labelForMetric = (metric: string) => metric.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase())

export const LiveOperationsDashboard = ({ initialRows }: { initialRows: MetricRow[] }) => {
  const [rows, setRows] = useState<MetricRow[]>(initialRows)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState('')

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sheets/dashboard', { cache: 'no-store' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Operations Dashboard tidak tersedia')
      setRows(body.rows?.length ? body.rows : initialRows)
      setLastSyncedAt(body.syncedAt ?? new Date().toISOString())
    } catch (loadError) {
      setRows(initialRows)
      setError(loadError instanceof Error ? loadError.message : 'Operations Dashboard tidak tersedia')
    } finally {
      setLoading(false)
    }
  }, [initialRows])

  // The dashboard performs a periodic read so external spreadsheet edits appear without a full page reload.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadRows() }, [loadRows])

  useEffect(() => {
    const interval = window.setInterval(() => { void loadRows() }, 60000)

    return () => window.clearInterval(interval)
  }, [loadRows])

  return (
    <section className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div><p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>Operations Dashboard</p><p className='text-muted-foreground mt-1 text-xs'>{error ? 'Snapshot lokal · sync belum tersedia' : `Live dari Operations_Dashboard${lastSyncedAt ? ` · sync ${new Date(lastSyncedAt).toLocaleString('id-ID')}` : ''}`}</p></div>
        <Button variant='outline' size='sm' className='gap-1.5' onClick={() => void loadRows()} disabled={loading}>{loading ? <Loader2 className='size-3.5 animate-spin' /> : <RefreshCw className='size-3.5' />} Refresh metrics</Button>
      </div>
      {error && <div className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs'>{error}</div>}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {rows.slice(0, 4).map(row => <Card key={String(row.Metric)} className='shadow-none'><CardContent className='space-y-2 p-5'><p className='text-muted-foreground text-sm'>{labelForMetric(String(row.Metric ?? 'Metric'))}</p><p className='text-3xl font-semibold tracking-tight'>{String(row.Value ?? '—')}</p><p className='text-muted-foreground text-xs'>{String(row.Description ?? '')}</p></CardContent></Card>)}
      </div>
    </section>
  )
}
