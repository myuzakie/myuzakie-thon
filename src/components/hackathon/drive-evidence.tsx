'use client'

import { useState } from 'react'

import { ArrowLeft, ExternalLink, File, FolderOpen, Loader2, RefreshCw } from 'lucide-react'

import { DriveUpload } from '@/components/hackathon/drive-upload'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SheetKey } from '@/lib/google-workspace'

type DriveFile = {
  id?: string
  name?: string
  mimeType?: string
  size?: string
  webViewLink?: string
  webContentLink?: string
  modifiedTime?: string
}

const folderMimeType = 'application/vnd.google-apps.folder'

const extractFolderId = (value?: string) => value?.match(/folders\/([^/?]+)/)?.[1] ?? value ?? ''

const formatSize = (size?: string) => {
  const bytes = Number(size)

  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const DriveEvidence = ({ sheet, rowId, folderUrl, fileId, evidenceUrl, rowVersion }: { sheet: SheetKey; rowId: string; folderUrl?: string; fileId?: string; evidenceUrl?: string; rowVersion?: string }) => {
  const rootFolderId = extractFolderId(folderUrl)
  const [open, setOpen] = useState(false)
  const [folderId, setFolderId] = useState(rootFolderId)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(fileId ? { id: fileId, webViewLink: evidenceUrl } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadFiles = async (nextFolderId = folderId) => {
    setLoading(true)
    setError('')

    try {
      const query = nextFolderId ? `?folderId=${encodeURIComponent(nextFolderId)}` : ''
      const response = await fetch(`/api/drive/files${query}`, { cache: 'no-store' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Google Drive tidak tersedia')
      setFiles(body.files ?? [])
      setFolderId(nextFolderId)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Google Drive tidak tersedia')
    } finally {
      setLoading(false)
    }
  }

  const openPanel = () => {
    setOpen(true)
    void loadFiles(rootFolderId)
  }

  const folders = files.filter(file => file.mimeType === folderMimeType)
  const evidenceFiles = files.filter(file => file.mimeType !== folderMimeType)
  const previewId = selectedFile?.id
  const previewUrl = selectedFile?.webViewLink ?? (previewId ? `https://drive.google.com/file/d/${previewId}/preview` : '')

  return (
    <>
      <Button variant='ghost' size='icon' onClick={openPanel} aria-label='Buka evidence Google Drive' title='Evidence Google Drive'>
        <FolderOpen className='size-4' />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Evidence Google Drive</DialogTitle>
            <DialogDescription>Browse folder, upload evidence, dan preview file yang terhubung ke {rowId}.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'>
              <div className='flex items-center gap-2 text-xs'>
                {folderId && folderId !== rootFolderId && <Button variant='ghost' size='icon-sm' onClick={() => void loadFiles(rootFolderId)} aria-label='Kembali ke folder root'><ArrowLeft className='size-4' /></Button>}
                <span className='font-mono'>{folderId || 'Drive root'}</span>
              </div>
              <div className='flex items-center gap-2'>
                <DriveUpload sheet={sheet} rowId={rowId} folderId={folderId || undefined} expectedVersion={rowVersion} showLabel onUploaded={() => void loadFiles(folderId)} />
                <Button variant='outline' size='sm' className='gap-1.5' onClick={() => void loadFiles()} disabled={loading}>{loading ? <Loader2 className='size-3.5 animate-spin' /> : <RefreshCw className='size-3.5' />} Refresh</Button>
              </div>
            </div>
            {error && <div className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs'>{error}</div>}
            <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'>
              <div className='min-h-48 space-y-2 rounded-md border p-3'>
                <p className='text-muted-foreground text-xs font-medium'>Folders and files</p>
                {folders.map(folder => <button key={folder.id} type='button' className='hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm' onClick={() => folder.id && void loadFiles(folder.id)}><FolderOpen className='size-4' /><span className='truncate'>{folder.name ?? 'Unnamed folder'}</span></button>)}
                {evidenceFiles.map(file => <button key={file.id} type='button' className='hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm' onClick={() => setSelectedFile(file)}><File className='size-4 shrink-0' /><span className='min-w-0 flex-1 truncate'>{file.name ?? file.id}</span><span className='text-muted-foreground shrink-0 text-[10px]'>{formatSize(file.size)}</span></button>)}
                {!folders.length && !evidenceFiles.length && !loading && <p className='text-muted-foreground py-8 text-center text-xs'>Belum ada evidence di folder ini.</p>}
              </div>
              <div className='bg-muted/30 min-h-48 overflow-hidden rounded-md border p-3'>
                {previewUrl ? <div className='space-y-3'><iframe title={selectedFile?.name ?? 'Google Drive preview'} src={previewUrl.includes('/preview') ? previewUrl : `https://drive.google.com/file/d/${previewId}/preview`} className='h-72 w-full rounded border bg-background' allow='autoplay' /><a className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs' href={selectedFile?.webViewLink ?? evidenceUrl ?? `https://drive.google.com/open?id=${previewId}`} target='_blank' rel='noreferrer'>Open in Google Drive <ExternalLink className='size-3' /></a></div> : <p className='text-muted-foreground flex h-72 items-center justify-center text-center text-xs'>Pilih file untuk melihat preview.</p>}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant='outline' onClick={() => setOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
