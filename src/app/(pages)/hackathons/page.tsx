import { ExternalLink, FolderOpen, Plus, ShieldAlert } from 'lucide-react'

import { PageHeader } from '@/components/hackathon/page-header'
import { LiveSheetTable } from '@/components/hackathon/live-sheet-table'
import { SourceLink } from '@/components/hackathon/source-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { events } from '@/lib/hackathon-data'

const HackathonsPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='Workspace / Events' title='Hackathons' description='Kelola shortlist kompetisi, deadline, eligibility, dan sumber riset dalam satu daftar.' action={<Button className='gap-2'><Plus className='size-4' /> Tambah event</Button>} />
    <SourceLink tab='events' />
    <LiveSheetTable
      sheet='events'
      idKey='Event_ID'
      title='Live event records'
      driveUploads
      filterKey='Verification_Status'
      columns={[
        { key: 'Event_ID', label: 'ID' },
        { key: 'Event_Name', label: 'Event' },
        { key: 'Deadline_WIB', label: 'Deadline' },
        { key: 'Focus', label: 'Focus' },
        { key: 'Verification_Status', label: 'Verification' }
      ]}
      fields={[
        { key: 'Event_Name', label: 'Event name' },
        { key: 'Organizer', label: 'Organizer' },
        { key: 'Deadline_WIB', label: 'Deadline WIB' },
        { key: 'Focus', label: 'Focus' },
        { key: 'Official_URL', label: 'Official URL' },
        { key: 'Verification_Status', label: 'Verification status' }
      ]}
      initialRows={events.map(event => ({ Event_ID: event.id, Event_Name: event.name, Deadline_WIB: event.deadline, Focus: event.focus, Verification_Status: event.verification, Drive_Folder: event.driveFolder }))}
    />
    <div className='grid gap-4 sm:grid-cols-3'>
      {[['4', 'Event dilacak'], ['0', 'Eligibility terkonfirmasi'], ['2', 'Konflik sumber']].map(([value, label]) => <Card key={label} className='shadow-none'><CardContent className='p-5'><p className='text-3xl font-semibold'>{value}</p><p className='text-muted-foreground mt-1 text-sm'>{label}</p></CardContent></Card>)}
    </div>
    <Card className='shadow-none'>
      <CardHeader><CardTitle>Event master</CardTitle></CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Deadline WIB</TableHead><TableHead>Focus</TableHead><TableHead>Verification</TableHead><TableHead className='text-right'>Links</TableHead></TableRow></TableHeader>
            <TableBody>{events.map(event => <TableRow key={event.id}><TableCell><div className='min-w-60'><p className='font-medium'>{event.name}</p><p className='text-muted-foreground font-mono text-xs'>{event.id} · {event.organizer}</p></div></TableCell><TableCell className='font-mono text-xs'>{event.deadline}</TableCell><TableCell><Badge variant='secondary'>{event.focus}</Badge></TableCell><TableCell><span className='inline-flex items-center gap-1.5 text-xs'><ShieldAlert className='size-3.5' />{event.verification}</span></TableCell><TableCell><div className='flex justify-end gap-1'><Button variant='ghost' size='icon' render={<a href={event.url} target='_blank' rel='noreferrer' />} aria-label={`Buka ${event.name}`}><ExternalLink className='size-4' /></Button><Button variant='ghost' size='icon' render={<a href={event.driveFolder} target='_blank' rel='noreferrer' />} aria-label={`Buka folder ${event.name}`}><FolderOpen className='size-4' /></Button></div></TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
)

export default HackathonsPage
