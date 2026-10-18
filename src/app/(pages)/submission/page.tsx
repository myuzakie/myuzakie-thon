import { CheckCircle2, ExternalLink } from 'lucide-react'

import { PageHeader } from '@/components/hackathon/page-header'
import { LiveSheetTable } from '@/components/hackathon/live-sheet-table'
import { SourceLink } from '@/components/hackathon/source-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { submissionItems } from '@/lib/hackathon-data'

const SubmissionPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='Delivery / Final review' title='Submission checklist' description='Pastikan requirement teknis, repository, demo, dan dokumentasi selesai sebelum submit.' action={<Button variant='outline' className='gap-2' render={<a href='https://docs.google.com/spreadsheets/d/1vjKrwmlUnaTpgtQl7hKddhAJhfMsV436xfklJ6_UxEw/edit' target='_blank' rel='noreferrer' />}>Open checklist <ExternalLink className='size-3.5' /></Button>} />
    <SourceLink tab='submission' />
    <LiveSheetTable
      sheet='submission'
      idKey='Checklist_ID'
      title='Live submission requirements'
      driveUploads
      filterKey='Status'
      columns={[
        { key: 'Checklist_ID', label: 'ID' },
        { key: 'Requirement', label: 'Requirement' },
        { key: 'Category', label: 'Category' },
        { key: 'Event_ID', label: 'Event' },
        { key: 'Status', label: 'Status' }
      ]}
      fields={[
        { key: 'Event_ID', label: 'Event ID' },
        { key: 'Requirement', label: 'Requirement', multiline: true },
        { key: 'Category', label: 'Category' },
        { key: 'Required', label: 'Required' },
        { key: 'Status', label: 'Status' },
        { key: 'Notes', label: 'Notes', multiline: true }
      ]}
      initialRows={submissionItems.map(item => ({ Checklist_ID: item.id, Event_ID: item.eventId, Requirement: item.requirement, Category: item.category, Status: item.status }))}
    />
    <Card className='shadow-none'><CardContent className='space-y-3 p-5'><div className='flex items-center justify-between'><div><p className='font-medium'>Nebius x NVIDIA Global AI Hackathon</p><p className='text-muted-foreground mt-1 text-sm'>0 van 8 requirement selesai</p></div><span className='font-mono text-sm'>0%</span></div><Progress value={0} /></CardContent></Card>
    <Card className='shadow-none'><CardHeader><CardTitle>Requirements</CardTitle></CardHeader><CardContent><div className='overflow-x-auto'><Table><TableHeader><TableRow><TableHead>Requirement</TableHead><TableHead>Category</TableHead><TableHead>Event</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{submissionItems.map(item => <TableRow key={item.id}><TableCell><div className='flex items-start gap-2'><CheckCircle2 className='text-muted-foreground mt-0.5 size-4' /><span>{item.requirement}</span></div></TableCell><TableCell><Badge variant='outline'>{item.category}</Badge></TableCell><TableCell className='font-mono text-xs'>{item.eventId}</TableCell><TableCell><Badge variant='secondary'>{item.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
  </div>
)

export default SubmissionPage
