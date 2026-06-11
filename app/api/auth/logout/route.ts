import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '../../../../lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production'
  })
  return res
}
