import { NextResponse } from 'next/server'

import { isAuthConfigured } from '@/lib/auth'
import { isGoogleWorkspaceConfigured } from '@/lib/google-workspace'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'hackathon-os',
    authConfigured: isAuthConfigured(),
    googleWorkspaceConfigured: isGoogleWorkspaceConfigured(),
    checkedAt: new Date().toISOString()
  })
}
