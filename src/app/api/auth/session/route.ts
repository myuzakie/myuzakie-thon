import { NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/lib/auth'

export function GET(request: Request) {
  const session = getSessionFromRequest(request)

  return NextResponse.json({ authenticated: Boolean(session), user: session ? { email: session.email } : null })
}
