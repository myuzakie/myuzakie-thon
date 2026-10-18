import { ExternalLink, GitBranch } from 'lucide-react'

import { PageHeader } from '@/components/hackathon/page-header'
import { SourceLink } from '@/components/hackathon/source-link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { project, tasks } from '@/lib/hackathon-data'

const ProjectsPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='Workspace / Delivery' title='Projects' description='Pantau project aktif, milestone, branch, dan task eksekusi tanpa kehilangan konteks event.' />
    <SourceLink tab='tasks' />
    <Card className='shadow-none'><CardHeader className='flex flex-row items-start justify-between gap-4'><div><CardTitle>{project.name}</CardTitle><p className='text-muted-foreground mt-1 flex items-center gap-2 text-sm'><GitBranch className='size-4' />{project.branch}</p></div><Badge>In progress</Badge></CardHeader><CardContent className='space-y-5'><div className='flex flex-wrap items-center justify-between gap-3 text-sm'><span>Delivery progress</span><span className='font-mono text-xs'>{project.progress}%</span></div><Progress value={project.progress} /><div className='flex flex-wrap gap-2'><a className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs' href={project.repository} target='_blank' rel='noreferrer'>Open GitHub repository <ExternalLink className='size-3' /></a></div><Separator /><div className='grid gap-3 sm:grid-cols-4'>{project.milestones.map(milestone => <div key={milestone.label} className='bg-muted/50 rounded-md p-3'><p className='text-muted-foreground text-xs'>{milestone.label}</p><p className='mt-1 text-sm font-medium'>{milestone.status}</p></div>)}</div></CardContent></Card>
    <Card className='shadow-none'><CardHeader><CardTitle>Execution tasks</CardTitle></CardHeader><CardContent><div className='space-y-2'>{tasks.map(task => <div key={task.id} className='flex flex-col justify-between gap-2 rounded-md border p-3 sm:flex-row sm:items-center'><div><p className='text-sm font-medium'>{task.task}</p><p className='text-muted-foreground mt-1 font-mono text-xs'>{task.id} · {task.eventId} · due {task.due}</p></div><div className='flex items-center gap-2'><Badge variant='outline'>{task.workstream}</Badge><Badge variant={task.priority === 'P0' ? 'destructive' : 'secondary'}>{task.priority}</Badge><Badge variant='outline'>{task.status}</Badge></div></div>)}</div></CardContent></Card>
  </div>
)

export default ProjectsPage
