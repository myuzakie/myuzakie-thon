import { NextResponse } from 'next/server'

import { clearSessionCookie, sameOriginResponse } from '@/lib/auth'

export async function POST(request: Request) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  const response = NextResponse.json({ ok: true })

  clearSessionCookie(response)

  return response
}
