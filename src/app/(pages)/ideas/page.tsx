import { ExternalLink, Lightbulb, Plus } from 'lucide-react'

import { PageHeader } from '@/components/hackathon/page-header'
import { LiveSheetTable } from '@/components/hackathon/live-sheet-table'
import { SourceLink } from '@/components/hackathon/source-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ideas } from '@/lib/hackathon-data'

const IdeasPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='Workspace / Discovery' title='Idea management' description='Simpan, bandingkan, dan validasi ide berdasarkan problem, target user, event, dan effort.' action={<Button className='gap-2'><Plus className='size-4' /> Tambah ide</Button>} />
    <SourceLink tab='ideas' />
    <LiveSheetTable
      sheet='ideas'
      idKey='Idea_ID'
      title='Live idea vault'
      driveUploads
      filterKey='Validation_Status'
      columns={[
        { key: 'Idea_ID', label: 'ID' },
        { key: 'Idea', label: 'Idea' },
        { key: 'Problem', label: 'Problem' },
        { key: 'Target_User', label: 'Target user' },
        { key: 'Validation_Status', label: 'Validation' }
      ]}
      fields={[
        { key: 'Idea', label: 'Idea', multiline: true },
        { key: 'Problem', label: 'Problem', multiline: true },
        { key: 'Target_User', label: 'Target user' },
        { key: 'Differentiator', label: 'Differentiator', multiline: true },
        { key: 'Validation_Status', label: 'Validation status' },
        { key: 'Notes', label: 'Notes', multiline: true }
      ]}
      initialRows={ideas.map(idea => ({ Idea_ID: idea.id, Event_ID: idea.eventId, Idea: idea.title, Problem: idea.problem, Target_User: idea.target, Validation_Status: idea.status }))}
    />
    <div className='grid gap-4 md:grid-cols-2'>{ideas.map(idea => <Card key={idea.id} className='shadow-none'><CardHeader className='flex flex-row items-start justify-between gap-3'><div className='flex gap-3'><div className='bg-muted rounded-md p-2'><Lightbulb className='size-4' /></div><div><CardTitle className='text-base'>{idea.title}</CardTitle><p className='text-muted-foreground mt-1 font-mono text-xs'>{idea.id} · {idea.eventId}</p></div></div><Badge variant='outline'>{idea.status}</Badge></CardHeader><CardContent className='space-y-3'><div className='grid grid-cols-2 gap-3 text-sm'><div><p className='text-muted-foreground text-xs'>Problem</p><p className='mt-1'>{idea.problem}</p></div><div><p className='text-muted-foreground text-xs'>Target user</p><p className='mt-1'>{idea.target}</p></div></div><div className='flex items-center justify-between border-t pt-3 text-xs'><span className='text-muted-foreground'>Effort estimate</span><span className='font-medium'>{idea.effort}</span></div></CardContent></Card>)}</div>
    <Card className='shadow-none'><CardContent className='flex flex-wrap items-center justify-between gap-3 p-5'><div><p className='font-medium'>Research notes tersimpan di Drive</p><p className='text-muted-foreground mt-1 text-sm'>Tambahkan evidence URL dan hasil validasi ke tab Idea_Vault.</p></div><Button variant='outline' className='gap-2' render={<a href={trackerUrl()} target='_blank' rel='noreferrer' />}>Buka tracker <ExternalLink className='size-3.5' /></Button></CardContent></Card>
  </div>
)

const trackerUrl = () => 'https://docs.google.com/spreadsheets/d/1vjKrwmlUnaTpgtQl7hKddhAJhfMsV436xfklJ6_UxEw/edit'

export default IdeasPage
