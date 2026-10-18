'use client'

import { useRef, useState, type ChangeEvent } from 'react'

import { Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { SheetKey } from '@/lib/google-workspace'

export const DriveUpload = ({ sheet, rowId, folderUrl, folderId, expectedVersion, showLabel = false, onUploaded }: { sheet: SheetKey; rowId: string; folderUrl?: string; folderId?: string; expectedVersion?: string; showLabel?: boolean; onUploaded?: () => void }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    setUploading(true)
    setMessage('')
    const formData = new FormData()

    formData.set('file', file)
    formData.set('sheet', sheet)
    formData.set('rowId', rowId)
    if (expectedVersion) formData.set('expectedVersion', expectedVersion)

    if (folderId) formData.set('folderId', folderId)
    else if (folderUrl) {
      const match = folderUrl.match(/folders\/([^/?]+)/)

      if (match?.[1]) formData.set('folderId', match[1])
    }

    try {
      const response = await fetch('/api/drive/upload', { method: 'POST', body: formData })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Upload gagal')
      setMessage('Uploaded')
      onUploaded?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload gagal')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className='flex items-center gap-1'>
      <input ref={inputRef} type='file' className='hidden' onChange={handleChange} />
      <Button variant={showLabel ? 'outline' : 'ghost'} size={showLabel ? 'sm' : 'icon'} className={showLabel ? 'gap-1.5' : ''} onClick={() => inputRef.current?.click()} disabled={uploading} aria-label='Upload file ke Google Drive'>
        {uploading ? <Loader2 className='size-4 animate-spin' /> : <Upload className='size-4' />}
        {showLabel && 'Upload'}
      </Button>
      {message && <span className='text-muted-foreground max-w-24 truncate text-[10px]'>{message}</span>}
    </div>
  )
}
