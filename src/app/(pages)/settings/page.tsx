import { ExternalLink, Settings2 } from 'lucide-react'

import { PageHeader } from '@/components/hackathon/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SettingsPage = () => (
  <div className='space-y-6'>
    <PageHeader eyebrow='System' title='Settings' description='Konfigurasi sumber data dan workspace Hackathon OS.' />
    <Card className='shadow-none'><CardHeader><CardTitle className='flex items-center gap-2'><Settings2 className='size-4' /> Integrations</CardTitle></CardHeader><CardContent className='space-y-3'><div className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-4'><div><p className='font-medium'>Google Sheets — Hackathon Tracker 2026</p><p className='text-muted-foreground mt-1 text-sm'>Events, tasks, ideas, resources, dan submission checklist</p></div><Badge className='gap-1.5'><span className='size-1.5 rounded-full bg-current' /> Connected</Badge></div><div className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-4'><div><p className='font-medium'>Google Drive</p><p className='text-muted-foreground mt-1 text-sm'>Folder event dan evidence submission</p></div><Badge variant='outline'>Via tracker links</Badge></div><a className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs' href='https://docs.google.com/spreadsheets/d/1vjKrwmlUnaTpgtQl7hKddhAJhfMsV436xfklJ6_UxEw/edit' target='_blank' rel='noreferrer'>Open source spreadsheet <ExternalLink className='size-3' /></a></CardContent></Card>
  </div>
)

export default SettingsPage
