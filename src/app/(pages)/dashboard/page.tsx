import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  ExternalLink,
  GitBranch,
  Lightbulb,
  Plus,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LiveOperationsDashboard } from '@/components/hackathon/live-operations-dashboard'
import { LiveSheetTable } from '@/components/hackathon/live-sheet-table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { dashboardMetrics } from '@/lib/hackathon-data'

const deadlines = [
  { title: 'CreateAThon — AI Agent Context', date: '31 Okt 2026', meta: 'Devpost · 14 hari lagi', status: 'On track' },
  { title: 'Demo end-to-end', date: '25 Okt 2026', meta: 'Milestone internal · 8 hari lagi', status: 'At risk' },
  { title: 'README & video demo', date: '28 Okt 2026', meta: 'Submission readiness · 11 hari lagi', status: 'Planned' }
]

const milestones = [
  { label: 'Setup & audit', date: '18–19 Okt', state: 'done' },
  { label: 'Selection & architecture', date: '20–21 Okt', state: 'done' },
  { label: 'Build & verify', date: '22–25 Okt', state: 'active' },
  { label: 'Submission readiness', date: '26–28 Okt', state: 'upcoming' },
  { label: 'Submit & review', date: '29–31 Okt', state: 'upcoming' }
]

const DashboardPage = () => {
  return (
    <div className='space-y-6'>
      <section className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-sm'>Sabtu, 18 Oktober 2026</p>
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Command center</h1>
          <p className='text-muted-foreground max-w-2xl text-sm'>Satu tempat untuk memilih hackathon, mengawal project, dan menyiapkan submission.</p>
        </div>
        <Button className='w-fit gap-2'><Plus className='size-4' /> Tambah hackathon</Button>
      </section>

      <LiveOperationsDashboard initialRows={dashboardMetrics} />
      <LiveSheetTable sheet='dashboard' idKey='Metric' title='Operations dashboard records' columns={[{ key: 'Metric', label: 'Metric' }, { key: 'Value', label: 'Value' }, { key: 'Description', label: 'Description' }]} fields={[{ key: 'Value', label: 'Value' }, { key: 'Description', label: 'Description', multiline: true }]} initialRows={dashboardMetrics} />

      <section className='grid gap-4 xl:grid-cols-[1.35fr_1fr]'>
        <Card className='shadow-none'>
          <CardHeader className='flex flex-row items-start justify-between gap-4'>
            <div><CardTitle>Project aktif</CardTitle><p className='text-muted-foreground mt-1 text-sm'>Hackathon Command Center</p></div>
            <Badge variant='secondary' className='gap-1.5'><CircleDot className='size-3 fill-current' /> Building</Badge>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2 text-sm'><GitBranch className='text-muted-foreground size-4' /><span className='font-mono text-xs'>feature/dashboard-shell</span></div>
              <a className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors' href='https://github.com/myuzakie/myuzakie-thon' target='_blank' rel='noreferrer'>Open repository <ExternalLink className='size-3' /></a>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'><span>Core flow progress</span><span className='font-mono text-xs'>62%</span></div>
              <Progress value={62} />
            </div>
            <Separator />
            <div className='grid gap-3 sm:grid-cols-3'>
              {[['Core dashboard', 'Done'], ['Mock data', 'In review'], ['GitHub sync', 'Planned']].map(([label, state]) => <div key={label} className='bg-muted/50 rounded-md p-3'><p className='text-muted-foreground text-xs'>{label}</p><p className='mt-1 text-sm font-medium'>{state}</p></div>)}
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-none'>
          <CardHeader className='flex flex-row items-center justify-between'><div><CardTitle>Upcoming deadlines</CardTitle><p className='text-muted-foreground mt-1 text-sm'>Yang perlu mendapat perhatian</p></div><Button variant='ghost' size='icon' aria-label='Lihat semua deadline'><ArrowUpRight className='size-4' /></Button></CardHeader>
          <CardContent className='space-y-1'>
            {deadlines.map((deadline, index) => <div key={deadline.title} className='flex gap-3 rounded-md p-3 transition-colors hover:bg-muted/50'><div className='flex flex-col items-center'><span className='bg-foreground mt-1 size-2 rounded-full' />{index < deadlines.length - 1 && <span className='bg-border mt-1 h-full w-px' />}</div><div className='min-w-0 flex-1 space-y-1'><div className='flex flex-wrap items-center justify-between gap-2'><p className='truncate text-sm font-medium'>{deadline.title}</p><Badge variant={deadline.status === 'At risk' ? 'destructive' : 'outline'} className='text-[10px]'>{deadline.status}</Badge></div><p className='font-mono text-xs'>{deadline.date}</p><p className='text-muted-foreground text-xs'>{deadline.meta}</p></div></div>)}
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-4 xl:grid-cols-[1.35fr_1fr]'>
        <Card className='shadow-none'><CardHeader><CardTitle>Execution timeline</CardTitle><p className='text-muted-foreground mt-1 text-sm'>Rencana kerja 18–31 Oktober</p></CardHeader><CardContent><div className='grid gap-3 md:grid-cols-5'>{milestones.map(milestone => <div key={milestone.label} className='space-y-3'><div className='flex items-center gap-2'><span className={`size-2.5 rounded-full ${milestone.state === 'done' ? 'bg-foreground' : milestone.state === 'active' ? 'bg-foreground ring-4 ring-muted' : 'border-muted-foreground/40 border-2'}`} /><span className='text-muted-foreground font-mono text-[10px]'>{milestone.date}</span></div><p className='text-sm font-medium'>{milestone.label}</p></div>)}</div></CardContent></Card>
        <Card className='shadow-none'><CardHeader><CardTitle>Focus berikutnya</CardTitle><p className='text-muted-foreground mt-1 text-sm'>Tiga item yang membuka progress</p></CardHeader><CardContent className='space-y-3'>{[{ icon: Lightbulb, label: 'Validasi ide utama', detail: 'Pilih satu problem untuk demo', urgent: false }, { icon: CircleAlert, label: 'Cek eligibility event', detail: 'Pastikan aturan kode lama', urgent: true }, { icon: CheckCircle2, label: 'Kunci scope MVP', detail: 'Freeze fitur sebelum 25 Okt', urgent: false }].map(item => { const Icon = item.icon;

 return <div key={item.label} className='flex items-start gap-3 rounded-md border p-3'><Icon className='mt-0.5 size-4 shrink-0' /><div className='min-w-0 flex-1'><p className='text-sm font-medium'>{item.label}</p><p className='text-muted-foreground mt-0.5 text-xs'>{item.detail}</p></div>{item.urgent && <Badge variant='outline' className='text-[10px]'>Review</Badge>}</div> })}</CardContent></Card>
      </section>
    </div>
  )
}

export default DashboardPage
