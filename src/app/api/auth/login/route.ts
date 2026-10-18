import { NextResponse } from 'next/server'

import { authenticateCredentials, isAuthConfigured, sameOriginResponse, setSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  if (!isAuthConfigured()) return NextResponse.json({ error: 'auth_not_configured', message: 'Authentication belum dikonfigurasi di server.' }, { status: 503 })

  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null

  if (!body?.email || !body.password || !authenticateCredentials(body.email.trim(), body.password)) {
    return NextResponse.json({ error: 'invalid_credentials', message: 'Email atau password salah.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })

  setSessionCookie(response, body.email.trim())

  return response
}
