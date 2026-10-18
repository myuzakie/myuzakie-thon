import { NextResponse } from 'next/server'

import { authenticateCredentials, clearLoginFailures, getLoginIdentifier, getLoginRateLimit, isAuthConfigured, registerLoginFailure, sameOriginResponse, setSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  const originError = sameOriginResponse(request)

  if (originError) return originError

  if (!isAuthConfigured()) return NextResponse.json({ error: 'auth_not_configured', message: 'Authentication belum dikonfigurasi di server.' }, { status: 503 })

  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  const email = body?.email?.trim() ?? ''
  const identifier = getLoginIdentifier(request, email)
  const rateLimit = getLoginRateLimit(identifier)

  if (!rateLimit.allowed) return NextResponse.json({ error: 'too_many_attempts', message: 'Terlalu banyak percobaan login. Coba lagi nanti.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } })

  if (!email || !body?.password || !authenticateCredentials(email, body.password)) {
    registerLoginFailure(identifier)

    return NextResponse.json({ error: 'invalid_credentials', message: 'Email atau password salah.' }, { status: 401 })
  }

  clearLoginFailures(identifier)

  const response = NextResponse.json({ ok: true })

  setSessionCookie(response, email)

  return response
}
