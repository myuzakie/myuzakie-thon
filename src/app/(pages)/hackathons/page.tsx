import { Plus } from 'lucide-react'

import { LiveSheetTable } from '@/components/hackathon/live-sheet-table'
import { PageHeader } from '@/components/hackathon/page-header'
import { SourceLink } from '@/components/hackathon/source-link'
import { Button } from '@/components/ui/button'
import { events } from '@/lib/hackathon-data'

const HackathonsPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='Workspace / Events' title='Hackathons' description='Satu event workspace untuk deadline, eligibility, verification, project, dan evidence.' action={<Button className='gap-2'><Plus className='size-4' /> Tambah event</Button>} />
    <SourceLink tab='events' />
    <LiveSheetTable
      sheet='events'
      idKey='Event_ID'
      title='Event workspace'
      driveUploads
      filterKey='Verification_Status'
      columns={[
        { key: 'Event_ID', label: 'ID' },
        { key: 'Event_Name', label: 'Event' },
        { key: 'Deadline_WIB', label: 'Deadline' },
        { key: 'Focus', label: 'Focus' },
        { key: 'Eligibility_Status', label: 'Eligibility' },
        { key: 'Verification_Status', label: 'Verification' },
        { key: 'Drive_File_ID', label: 'Evidence', format: (_, row) => row.Drive_File_ID || row.Evidence_URL ? 'Linked' : 'Missing' }
      ]}
      fields={[
        { key: 'Event_Name', label: 'Event name' },
        { key: 'Organizer', label: 'Organizer' },
        { key: 'Deadline_WIB', label: 'Deadline WIB' },
        { key: 'Focus', label: 'Focus' },
        { key: 'Eligibility_Status', label: 'Eligibility status' },
        { key: 'Verification_Status', label: 'Verification status' },
        { key: 'Project_ID', label: 'Project ID' },
        { key: 'Official_URL', label: 'Official URL' },
        { key: 'Drive_Folder', label: 'Evidence folder' }
      ]}
      initialRows={events.map(event => ({ Event_ID: event.id, Event_Name: event.name, Deadline_WIB: event.deadline, Focus: event.focus, Verification_Status: event.verification, Drive_Folder: event.driveFolder }))}
    />
  </div>
)

export default HackathonsPage
