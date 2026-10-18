'use client'

import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'

import { FileUp, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { SheetKey } from '@/lib/google-workspace'

type UploadedFile = Record<string, unknown>

type DriveUploadProps = {
  sheet: SheetKey
  rowId: string
  folderUrl?: string
  folderId?: string
  expectedVersion?: string
  showLabel?: boolean
  dropzone?: boolean
  trigger?: ReactNode
  onUploaded?: (file?: UploadedFile) => void
}

const folderIdFromUrl = (value?: string) => value?.match(/folders\/([^/?]+)/)?.[1] ?? value ?? ''

export const DriveUpload = ({ sheet, rowId, folderUrl, folderId, expectedVersion, showLabel = false, dropzone = false, trigger, onUploaded }: DriveUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)

  const uploadFile = (file: File) => {
    if (uploading) return

    setUploading(true)
    setProgress(0)
    setMessage('Uploading...')

    const formData = new FormData()

    formData.set('file', file)
    formData.set('sheet', sheet)
    formData.set('rowId', rowId)
    if (expectedVersion) formData.set('expectedVersion', expectedVersion)

    const targetFolderId = folderId || folderIdFromUrl(folderUrl)

    if (targetFolderId) formData.set('folderId', targetFolderId)

    const request = new XMLHttpRequest()

    request.open('POST', '/api/drive/upload')
    request.upload.addEventListener('progress', event => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      let body: { message?: string; file?: UploadedFile } = {}

      try {
        body = JSON.parse(request.responseText) as typeof body
      } catch {
        body = {}
      }

      if (request.status < 200 || request.status >= 300) {
        setMessage(body.message ?? 'Upload gagal')
      } else {
        setProgress(100)
        setMessage('Uploaded')
        onUploaded?.(body.file)
      }

      setUploading(false)
    })
    request.addEventListener('error', () => {
      setMessage('Upload gagal. Periksa koneksi dan akses Google Drive.')
      setUploading(false)
    })
    request.addEventListener('abort', () => {
      setMessage('Upload dibatalkan')
      setUploading(false)
    })
    request.send(formData)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''
    if (file) uploadFile(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]

    if (file) uploadFile(file)
  }

  const picker = trigger ?? (
    <Button type='button' variant={showLabel ? 'outline' : 'ghost'} size={showLabel ? 'sm' : 'icon'} className={showLabel ? 'gap-1.5' : ''} onClick={() => inputRef.current?.click()} disabled={uploading} aria-label='Upload file ke Google Drive' title='Upload evidence'>
      {uploading ? <Loader2 className='size-4 animate-spin' /> : <Upload className='size-4' />}
      {showLabel && 'Upload'}
    </Button>
  )

  return (
    <div className={dropzone ? 'space-y-3' : 'flex items-center gap-1'}>
      <input ref={inputRef} type='file' className='hidden' onChange={handleChange} />
      {dropzone ? (
        <div onDragEnter={() => setDragging(true)} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={`rounded-lg border border-dashed p-5 text-center transition-colors ${dragging ? 'border-foreground bg-muted/50' : 'border-border hover:border-foreground/40'}`}>
          <FileUp className='text-muted-foreground mx-auto mb-2 size-6' />
          <p className='text-sm font-medium'>Upload evidence</p>
          <p className='text-muted-foreground mt-1 text-xs'>Tarik file ke sini atau pilih dari perangkat. Maksimal 100 MB.</p>
          <div className='mt-3 flex justify-center'>{picker}</div>
        </div>
      ) : picker}
      {uploading && <div className='space-y-1'><Progress value={progress} aria-label={`Upload ${progress}%`} /><p className='text-muted-foreground text-[10px]'>{progress > 0 ? `${progress}% uploaded` : 'Menyiapkan upload...'}</p></div>}
      {!uploading && message && <span className='text-muted-foreground max-w-48 truncate text-[10px]'>{message}</span>}
    </div>
  )
}
