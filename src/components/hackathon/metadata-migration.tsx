'use client'

import { useState } from 'react'

import { Database, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const MetadataMigration = () => {
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  const runMigration = async () => {
    if (!window.confirm('Isi metadata kosong pada seluruh tab utama dengan timestamp dan status Active?')) return

    setRunning(true)
    setMessage('')

    try {
      const response = await fetch('/api/sheets/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Migration gagal')

      const migratedRows = body.results.reduce((total: number, result: { migratedRows?: number }) => total + (result.migratedRows ?? 0), 0)

      setMessage(`Migration selesai: ${migratedRows} row diperbarui.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Migration gagal')
    } finally {
      setRunning(false)
    }
  }

  return <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-4'><div><p className='font-medium'>Data model migration</p><p className='text-muted-foreground mt-1 text-sm'>Tambahkan metadata dan isi nilai kosong untuk record lama.</p>{message && <p className='text-muted-foreground mt-2 text-xs'>{message}</p>}</div><Button variant='outline' size='sm' className='gap-1.5' onClick={() => void runMigration()} disabled={running}>{running ? <Loader2 className='size-3.5 animate-spin' /> : <Database className='size-3.5' />} Run migration</Button></div>
}
