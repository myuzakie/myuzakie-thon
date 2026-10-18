import { ExternalLink, Settings2 } from 'lucide-react'

import { PageHeader } from '@/components/hackathon/page-header'
import { DriveStatus, IntegrationStatus } from '@/components/hackathon/integration-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SettingsPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='System' title='Settings' description='Konfigurasi sumber data dan workspace Hackathon OS.' />
    <Card className='shadow-none'><CardHeader><CardTitle className='flex items-center gap-2'><Settings2 className='size-4' /> Integrations</CardTitle></CardHeader><CardContent className='space-y-3'><div className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-4'><div><p className='font-medium'>Google Sheets — Hackathon Tracker 2026</p><p className='text-muted-foreground mt-1 text-sm'>Events, tasks, ideas, resources, dan submission checklist</p></div><IntegrationStatus /></div><div className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-4'><div><p className='font-medium'>Google Drive</p><p className='text-muted-foreground mt-1 text-sm'>Upload evidence, screenshot, video, README, dan dokumen submission</p></div><DriveStatus /></div><a className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs' href='https://docs.google.com/spreadsheets/d/1vjKrwmlUnaTpgtQl7hKddhAJhfMsV436xfklJ6_UxEw/edit' target='_blank' rel='noreferrer'>Open source spreadsheet <ExternalLink className='size-3' /></a></CardContent></Card>
  </div>
)

export default SettingsPage
