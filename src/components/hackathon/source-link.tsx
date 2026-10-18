import { ExternalLink, FileSpreadsheet } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { tracker } from '@/lib/hackathon-data'

export const SourceLink = ({ tab }: { tab: keyof typeof tracker.tabs }) => (
  <div className='bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2'>
    <div className='flex items-center gap-2 text-sm'>
      <FileSpreadsheet className='size-4' />
      <span>Live source: {tracker.title} / {tracker.tabs[tab]}</span>
      <Badge variant='outline' className='text-[10px]'>Google Sheets</Badge>
    </div>
    <Button variant='ghost' size='sm' className='h-7 gap-1.5 text-xs' render={<a href={tracker.url} target='_blank' rel='noreferrer' />}>
      Buka spreadsheet <ExternalLink className='size-3' />
    </Button>
  </div>
)
