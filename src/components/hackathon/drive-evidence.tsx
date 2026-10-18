'use client'

import { useMemo, useState, type ReactNode } from 'react'

import { ArrowLeft, CheckCircle2, ExternalLink, File, FileImage, FileText, FileUp, FileVideo, FolderOpen, Grid2X2, List, Loader2, RefreshCw, Search, XCircle } from 'lucide-react'

import { DriveUpload } from '@/components/hackathon/drive-upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

type Breadcrumb = { id: string; name: string }
type FileKind = 'image' | 'video' | 'pdf' | 'document' | 'other'

const folderMimeType = 'application/vnd.google-apps.folder'
const extractFolderId = (value?: string) => value?.match(/folders\/([^/?]+)/)?.[1] ?? value ?? ''

const formatSize = (size?: string) => {
  const bytes = Number(size)

  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const formatDate = (value?: string) => value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const getFileKind = (file?: DriveFile): FileKind => {
  const mimeType = file?.mimeType ?? ''

  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType.includes('spreadsheet') || mimeType.includes('presentation')) return 'document'

  return 'other'
}

const fileKindLabel: Record<FileKind, string> = { image: 'Image', video: 'Video', pdf: 'PDF', document: 'Document', other: 'File' }

const FileKindIcon = ({ kind, className = 'size-4' }: { kind: FileKind; className?: string }) => {
  if (kind === 'image') return <FileImage className={className} />
  if (kind === 'video') return <FileVideo className={className} />
  if (kind === 'document' || kind === 'pdf') return <FileText className={className} />

  return <File className={className} />
}

export const DriveEvidence = ({ sheet, rowId, folderUrl, fileId, evidenceUrl, rowVersion, trigger }: { sheet: SheetKey; rowId: string; folderUrl?: string; fileId?: string; evidenceUrl?: string; rowVersion?: string; trigger?: ReactNode }) => {
  const rootFolderId = extractFolderId(folderUrl)
  const [open, setOpen] = useState(false)
  const [folderId, setFolderId] = useState(rootFolderId)
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: rootFolderId, name: 'Evidence' }])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(fileId ? { id: fileId, webViewLink: evidenceUrl } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const loadFiles = async (nextFolderId = folderId, nextBreadcrumbs = breadcrumbs) => {
    setLoading(true)
    setError('')

    try {
      const queryString = nextFolderId ? `?folderId=${encodeURIComponent(nextFolderId)}` : ''
      const response = await fetch(`/api/drive/files${queryString}`, { cache: 'no-store' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.message ?? 'Google Drive tidak tersedia')

      const nextFiles = body.files ?? []

      setFiles(nextFiles)
      setFolderId(nextFolderId)
      setBreadcrumbs(nextBreadcrumbs)
      if (selectedFile?.id) setSelectedFile(nextFiles.find((file: DriveFile) => file.id === selectedFile.id) ?? selectedFile)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Google Drive tidak tersedia')
    } finally {
      setLoading(false)
    }
  }

  const openPanel = () => {
    setOpen(true)
    void loadFiles(rootFolderId, [{ id: rootFolderId, name: 'Evidence' }])
  }

  const folders = files.filter(file => file.mimeType === folderMimeType)
  const evidenceFiles = files.filter(file => file.mimeType !== folderMimeType)

  const filteredFiles = useMemo(() => evidenceFiles.filter(file => {
    const matchesQuery = !query || String(file.name ?? '').toLowerCase().includes(query.toLowerCase())
    const matchesType = typeFilter === 'all' || getFileKind(file) === typeFilter

    return matchesQuery && matchesType
  }), [evidenceFiles, query, typeFilter])

  const previewId = selectedFile?.id
  const previewUrl = previewId ? `https://drive.google.com/file/d/${previewId}/preview` : ''
  const selectedKind = getFileKind(selectedFile ?? undefined)
  const selectedIsImage = selectedKind === 'image' && Boolean(previewId)
  const thumbnailUrl = (file: DriveFile) => file.id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w600` : ''
  const openDriveUrl = selectedFile?.webViewLink ?? evidenceUrl ?? (previewId ? `https://drive.google.com/open?id=${previewId}` : '')

  return (
    <>
      {trigger ? <span className='inline-flex' onClick={openPanel}>{trigger}</span> : <Button variant='ghost' size='icon' onClick={openPanel} aria-label='Buka evidence Google Drive' title='Evidence Google Drive'><FolderOpen className='size-4' /></Button>}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side='right' className='w-full overflow-y-auto sm:!max-w-[min(80vw,1100px)]'>
          <SheetHeader className='sticky top-0 z-10 border-b bg-background/95 pr-12 backdrop-blur'>
            <SheetTitle>Evidence workspace</SheetTitle>
            <SheetDescription>Kelola evidence untuk {rowId}. File yang di-upload akan ditautkan ke record dan Google Drive.</SheetDescription>
            <nav aria-label='Evidence breadcrumb' className='flex flex-wrap items-center gap-1 pt-2 text-xs'>
              {breadcrumbs.map((crumb, index) => <span key={`${crumb.id}-${index}`} className='inline-flex items-center gap-1'>{index > 0 && <span className='text-muted-foreground'>/</span>}<button type='button' className={index === breadcrumbs.length - 1 ? 'font-medium' : 'text-muted-foreground hover:text-foreground'} onClick={() => void loadFiles(crumb.id, breadcrumbs.slice(0, index + 1))}>{crumb.name}</button></span>)}
            </nav>
          </SheetHeader>

          <div className='space-y-4 p-4'>
            <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'>
              <div className='flex items-center gap-2'>
                {breadcrumbs.length > 1 && <Button variant='outline' size='icon-sm' onClick={() => void loadFiles(breadcrumbs.at(-2)?.id ?? rootFolderId, breadcrumbs.slice(0, -1))} aria-label='Kembali ke folder sebelumnya' title='Back'><ArrowLeft className='size-4' /></Button>}
                <div><p className='text-sm font-medium'>{breadcrumbs.at(-1)?.name ?? 'Evidence'}</p><p className='text-muted-foreground text-xs'>{evidenceFiles.length} file · {folders.length} folder</p></div>
              </div>
              <Button variant='outline' size='sm' className='gap-1.5' onClick={() => void loadFiles()} disabled={loading}>{loading ? <Loader2 className='size-3.5 animate-spin' /> : <RefreshCw className='size-3.5' />} Refresh</Button>
            </div>

            <DriveUpload sheet={sheet} rowId={rowId} folderId={folderId || undefined} expectedVersion={rowVersion} dropzone onUploaded={() => void loadFiles()} />
            {error && <div role='alert' className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs'>{error}</div>}

            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative min-w-52 flex-1'><Search className='text-muted-foreground absolute top-2.5 left-2.5 size-4' /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder='Search files...' className='pl-8' aria-label='Search evidence files' /></div>
              <Select value={typeFilter} onValueChange={value => setTypeFilter(value ?? 'all')}><SelectTrigger className='w-36' aria-label='Filter file type'><SelectValue placeholder='All types' /></SelectTrigger><SelectContent><SelectItem value='all'>All types</SelectItem><SelectItem value='image'>Images</SelectItem><SelectItem value='video'>Videos</SelectItem><SelectItem value='pdf'>PDF</SelectItem><SelectItem value='document'>Documents</SelectItem><SelectItem value='other'>Other</SelectItem></SelectContent></Select>
              <div className='bg-muted flex rounded-md p-1'><Button type='button' variant={viewMode === 'list' ? 'secondary' : 'ghost'} size='icon-sm' onClick={() => setViewMode('list')} aria-label='List view' title='List view'><List className='size-4' /></Button><Button type='button' variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size='icon-sm' onClick={() => setViewMode('grid')} aria-label='Grid view' title='Grid view'><Grid2X2 className='size-4' /></Button></div>
            </div>

            {folders.length > 0 && <section className='space-y-2'><p className='text-muted-foreground text-xs font-medium'>Folders</p><div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>{folders.map(folder => <button key={folder.id} type='button' className='hover:bg-muted/50 flex items-center gap-2 rounded-lg border p-3 text-left transition-colors' onClick={() => void loadFiles(folder.id ?? '', [...breadcrumbs, { id: folder.id ?? '', name: folder.name ?? 'Folder' }])}><FolderOpen className='size-4 shrink-0' /><span className='truncate text-sm'>{folder.name ?? 'Unnamed folder'}</span></button>)}</div></section>}

            <section className='space-y-2'>
              <div className='flex items-center justify-between'><p className='text-muted-foreground text-xs font-medium'>Files</p><span className='text-muted-foreground text-xs'>{filteredFiles.length} shown</span></div>
              {filteredFiles.length === 0 && !loading ? <div className='rounded-lg border border-dashed p-10 text-center'><FileUp className='text-muted-foreground mx-auto size-8' /><p className='mt-3 text-sm font-medium'>Upload evidence pertama</p><p className='text-muted-foreground mt-1 text-xs'>Screenshot, demo video, README, atau dokumen submission dapat disimpan di sini.</p></div> : viewMode === 'grid' ? <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>{filteredFiles.map(file => <button key={file.id} type='button' className={`group overflow-hidden rounded-lg border text-left transition-colors hover:border-foreground/40 ${selectedFile?.id === file.id ? 'border-foreground ring-1 ring-foreground' : ''}`} onClick={() => setSelectedFile(file)}><div className='bg-muted/30 flex h-32 items-center justify-center overflow-hidden'>{getFileKind(file) === 'image' && thumbnailUrl(file) ? <img src={thumbnailUrl(file)} alt='' className='size-full object-cover' /> : <FileKindIcon kind={getFileKind(file)} className='text-muted-foreground size-10' />}</div><div className='space-y-2 p-3'><p className='truncate text-sm font-medium'>{file.name ?? 'Unnamed file'}</p><div className='flex items-center justify-between gap-2'><Badge variant={file.id === fileId ? 'default' : 'outline'}>{file.id === fileId ? 'Linked' : 'Unlinked'}</Badge><span className='text-muted-foreground text-[10px]'>{formatSize(file.size)}</span></div></div></button>)}</div> : <div className='overflow-x-auto rounded-lg border'><table className='w-full text-sm'><thead><tr className='border-b text-left'><th className='px-3 py-2 font-medium'>File</th><th className='px-3 py-2 font-medium'>Type</th><th className='px-3 py-2 font-medium'>Size</th><th className='px-3 py-2 font-medium'>Modified</th><th className='px-3 py-2 font-medium'>Status</th></tr></thead><tbody>{filteredFiles.map(file => <tr key={file.id} className={`cursor-pointer border-b last:border-0 hover:bg-muted/40 ${selectedFile?.id === file.id ? 'bg-muted/50' : ''}`} onClick={() => setSelectedFile(file)}><td className='max-w-72 px-3 py-3'><div className='flex items-center gap-2'><FileKindIcon kind={getFileKind(file)} className='text-muted-foreground size-4 shrink-0' /><span className='truncate'>{file.name ?? 'Unnamed file'}</span></div></td><td className='text-muted-foreground px-3 py-3 text-xs'>{fileKindLabel[getFileKind(file)]}</td><td className='text-muted-foreground px-3 py-3 text-xs'>{formatSize(file.size)}</td><td className='text-muted-foreground px-3 py-3 text-xs'>{formatDate(file.modifiedTime)}</td><td className='px-3 py-3'><span className='inline-flex items-center gap-1 text-xs'>{file.id === fileId ? <CheckCircle2 className='size-3 text-emerald-500' /> : <XCircle className='text-muted-foreground size-3' />}{file.id === fileId ? 'Linked' : 'Unlinked'}</span></td></tr>)}</tbody></table></div>}
            </section>

            <section className='rounded-lg border'>
              <div className='border-b p-4'><p className='text-sm font-medium'>{selectedFile?.name ?? 'Preview'}</p>{selectedFile && <div className='text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs'><span>{fileKindLabel[selectedKind]}</span><span>{formatSize(selectedFile.size)}</span><span>{formatDate(selectedFile.modifiedTime)}</span></div>}</div>
              <div className='bg-muted/20 min-h-72 p-3'>{previewId ? selectedIsImage ? <img src={thumbnailUrl(selectedFile!)} alt={selectedFile?.name ?? 'Evidence preview'} className='mx-auto max-h-[32rem] rounded object-contain' /> : <iframe title={selectedFile?.name ?? 'Google Drive preview'} src={previewUrl} className='h-96 w-full rounded border bg-background' allow='autoplay' /> : <div className='text-muted-foreground flex min-h-72 items-center justify-center text-center text-sm'>Pilih file untuk melihat preview.</div>}</div>
              {selectedFile && <div className='flex flex-wrap items-center justify-between gap-2 border-t p-3'><span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>{selectedFile.id === fileId ? <><CheckCircle2 className='size-3 text-emerald-500' /> Linked to record</> : <><XCircle className='size-3' /> Unlinked file</>}</span>{openDriveUrl && <a className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs' href={openDriveUrl} target='_blank' rel='noreferrer'>Open in Google Drive <ExternalLink className='size-3' /></a>}</div>}
            </section>
          </div>
          <SheetFooter className='sticky bottom-0 border-t bg-background/95 backdrop-blur'><Button variant='outline' onClick={() => setOpen(false)}>Close</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
