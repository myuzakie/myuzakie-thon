import { ExternalLink, FolderOpen } from 'lucide-react'

import { PageHeader } from '@/components/hackathon/page-header'
import { LiveSheetTable } from '@/components/hackathon/live-sheet-table'
import { SourceLink } from '@/components/hackathon/source-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { resources } from '@/lib/hackathon-data'

const ResourcesPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='Resources / UI' title='UI resources' description='Katalog referensi UI, UX, komponen, dan icon yang siap dipakai ulang di project.' />
    <SourceLink tab='resources' />
    <LiveSheetTable
      sheet='resources'
      idKey='Resource_ID'
      title='Live UI resource catalog'
      driveUploads
      filterKey='Review_Status'
      columns={[
        { key: 'Resource_ID', label: 'ID' },
        { key: 'Name', label: 'Name' },
        { key: 'Category', label: 'Category' },
        { key: 'Use_Case', label: 'Use case' },
        { key: 'Review_Status', label: 'Review' }
      ]}
      fields={[
        { key: 'Category', label: 'Category' },
        { key: 'Name', label: 'Name' },
        { key: 'URL', label: 'URL' },
        { key: 'Use_Case', label: 'Use case', multiline: true },
        { key: 'Review_Status', label: 'Review status' }
      ]}
      initialRows={resources.map(resource => ({ Resource_ID: resource.id, Category: resource.category, Name: resource.name, URL: resource.url, Use_Case: resource.useCase, Review_Status: resource.status }))}
    />
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>{resources.map(resource => <Card key={resource.id} className='shadow-none'><CardHeader><div className='flex items-center justify-between'><Badge variant='secondary'>{resource.category}</Badge><Button variant='ghost' size='icon' render={<a href={resource.url} target='_blank' rel='noreferrer' />} aria-label={`Buka ${resource.name}`}><ExternalLink className='size-4' /></Button></div><CardTitle className='text-base'>{resource.name}</CardTitle></CardHeader><CardContent><p className='text-muted-foreground text-sm'>{resource.useCase}</p><div className='mt-4 flex items-center justify-between border-t pt-3 text-xs'><span className='text-muted-foreground'>{resource.id}</span><span>{resource.status}</span></div></CardContent></Card>)}</div>
    <Card className='shadow-none'><CardContent className='flex items-center gap-3 p-5'><FolderOpen className='size-5' /><div><p className='font-medium'>Asset project tersimpan di Google Drive</p><p className='text-muted-foreground mt-1 text-sm'>Gunakan link folder pada tracker untuk menyimpan screenshot, video, dan referensi.</p></div></CardContent></Card>
  </div>
)

export default ResourcesPage
