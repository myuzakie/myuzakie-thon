import { createHmac, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const sessionCookieName = 'hackathon_session'
const sessionLifetimeSeconds = 60 * 60 * 12

type SessionPayload = {
  email: string
  iat: number
  exp: number
}

const getAuthSecret = () => process.env.HACKATHON_AUTH_SECRET ?? ''
const getAuthEmail = () => process.env.HACKATHON_AUTH_EMAIL ?? ''
const getAuthPassword = () => process.env.HACKATHON_AUTH_PASSWORD ?? ''

export const isAuthConfigured = () => Boolean(getAuthSecret() && getAuthEmail() && getAuthPassword())

const encode = (value: string) => Buffer.from(value).toString('base64url')
const decode = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

const sign = (value: string) => createHmac('sha256', getAuthSecret()).update(value).digest('base64url')

export const createSessionToken = (email: string) => {
  const now = Math.floor(Date.now() / 1000)
  const payload = encode(JSON.stringify({ email, iat: now, exp: now + sessionLifetimeSeconds } satisfies SessionPayload))
  const content = `${payload}.${sign(payload)}`

  return content
}

export const verifySessionToken = (token?: string | null) => {
  if (!token || !isAuthConfigured()) return null

  const [payload, signature] = token.split('.')

  if (!payload || !signature) return null

  const expected = sign(payload)
  const receivedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null

  try {
    const parsed = JSON.parse(decode(payload)) as SessionPayload

    if (!parsed.email || parsed.exp <= Math.floor(Date.now() / 1000)) return null

    return parsed
  } catch {
    return null
  }
}

export const authenticateCredentials = (email: string, password: string) => {
  if (!isAuthConfigured() || email !== getAuthEmail()) return false

  const expected = Buffer.from(getAuthPassword())
  const received = Buffer.from(password)

  return expected.length === received.length && timingSafeEqual(expected, received)
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: sessionLifetimeSeconds
}

export const getSessionFromRequest = (request: Request) => {
  const token = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)

  return verifySessionToken(token)
}

export const getSessionFromCookies = async () => verifySessionToken((await cookies()).get(sessionCookieName)?.value)

export const unauthorizedResponse = () => NextResponse.json({ error: 'unauthorized', message: 'Login diperlukan.' }, { status: 401 })

export const sameOriginResponse = (request: Request) => {
  const origin = request.headers.get('origin')

  if (!origin) return null

  try {
    const requestOrigin = new URL(origin)
    const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')

    if (requestHost && requestOrigin.host !== requestHost) return NextResponse.json({ error: 'forbidden', message: 'Origin request tidak valid.' }, { status: 403 })
  } catch {
    return NextResponse.json({ error: 'forbidden', message: 'Origin request tidak valid.' }, { status: 403 })
  }

  return null
}

export const setSessionCookie = (response: NextResponse, email: string) => {
  response.cookies.set(sessionCookieName, createSessionToken(email), sessionCookieOptions)
}

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(sessionCookieName, '', { ...sessionCookieOptions, maxAge: 0 })
}
