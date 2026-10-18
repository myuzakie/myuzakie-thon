import { Plus } from 'lucide-react'

import { LiveSheetTable } from '@/components/hackathon/live-sheet-table'
import { PageHeader } from '@/components/hackathon/page-header'
import { ProjectDeliveryOverview } from '@/components/hackathon/project-delivery-overview'
import { SourceLink } from '@/components/hackathon/source-link'
import { Button } from '@/components/ui/button'
import { project, tasks } from '@/lib/hackathon-data'

const ProjectsPage = async ({ searchParams }: { searchParams: Promise<{ status?: string }> }) => {
  const params = await searchParams
  const initialFilterValue = params.status === 'blocked' ? 'Blocked' : params.status === 'overdue' ? 'Overdue' : ''

  return <div className='space-y-6'>
    <PageHeader eyebrow='Workspace / Delivery' title='Projects' description='Satu delivery workspace untuk progress, task, risiko, dan evidence project aktif.' action={<Button className='gap-2'><Plus className='size-4' /> Tambah task</Button>} />
    <SourceLink tab='tasks' />
    <ProjectDeliveryOverview initialRows={tasks.map(task => ({ Task_ID: task.id, Event_ID: task.eventId, Task: task.task, Workstream: task.workstream, Priority: task.priority, Due_WIB: task.due, Status: task.status }))} />
    <LiveSheetTable
      sheet='tasks'
      idKey='Task_ID'
      title='Delivery task workspace'
      driveUploads
      filterKey='Status'
      initialFilterValue={initialFilterValue}
      viewModes
      columns={[
        { key: 'Task_ID', label: 'ID' },
        { key: 'Task', label: 'Task' },
        { key: 'Event_ID', label: 'Event' },
        { key: 'Workstream', label: 'Workstream' },
        { key: 'Priority', label: 'Priority' },
        { key: 'Due_WIB', label: 'Due' },
        { key: 'Status', label: 'Status' }
      ]}
      fields={[
        { key: 'Task', label: 'Task', multiline: true },
        { key: 'Event_ID', label: 'Event ID' },
        { key: 'Workstream', label: 'Workstream' },
        { key: 'Priority', label: 'Priority' },
        { key: 'Due_WIB', label: 'Due WIB' },
        { key: 'Status', label: 'Status' },
        { key: 'Notes', label: 'Notes', multiline: true }
      ]}
      initialRows={tasks.map(task => ({ Task_ID: task.id, Event_ID: task.eventId, Task: task.task, Workstream: task.workstream, Priority: task.priority, Due_WIB: task.due, Status: task.status }))}
    />
    <p className='text-muted-foreground text-center text-xs'>Project source: {project.name}. Progress dan status dihitung dari Task_Tracker.</p>
  </div>
}

export default ProjectsPage
