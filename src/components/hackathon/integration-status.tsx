'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'

type Status = { configured: boolean; driveFolderConfigured: boolean }

export const IntegrationStatus = () => {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    fetch('/api/integrations/status', { cache: 'no-store' }).then(response => response.json()).then(setStatus).catch(() => setStatus({ configured: false, driveFolderConfigured: false }))
  }, [])

  if (!status) return <Badge variant='outline'>Checking…</Badge>

  return <Badge variant={status.configured ? 'default' : 'outline'} className='gap-1.5'><span className='size-1.5 rounded-full bg-current' />{status.configured ? 'Connected' : 'Needs setup'}</Badge>
}

export const DriveStatus = () => {
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/integrations/status', { cache: 'no-store' }).then(response => response.json()).then(body => setConfigured(Boolean(body.driveFolderConfigured))).catch(() => setConfigured(false))
  }, [])

  if (configured === null) return <Badge variant='outline'>Checking…</Badge>

  return <Badge variant='outline'>{configured ? 'Root folder ready' : 'Folder optional'}</Badge>
}
