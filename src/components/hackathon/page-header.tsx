import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

export const PageHeader = ({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) => (
  <section className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
    <div className='space-y-1'>
      <p className='text-muted-foreground text-sm'>{eyebrow}</p>
      <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{title}</h1>
      <p className='text-muted-foreground max-w-2xl text-sm'>{description}</p>
    </div>
    {action ?? <Button variant='outline'>Refresh data</Button>}
  </section>
)
