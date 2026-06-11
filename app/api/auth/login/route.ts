import { NextResponse } from 'next/server'
import { z } from 'zod'
import { signToken, COOKIE_NAME } from '../../../../lib/auth'

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) })

function getAdminCredentials() {
  const username = process.env.ADMIN_USER
  const password = process.env.ADMIN_PASS

  if (process.env.NODE_ENV === 'production' && (!username || !password)) {
    throw new Error('ADMIN_USER and ADMIN_PASS are required in production.')
  }

  return {
    username: username || 'admin',
    password: password || 'password'
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid username or password.' }, { status: 422 })

    const { username, password } = parsed.data
    const credentials = getAdminCredentials()

    if (username !== credentials.username || password !== credentials.password) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
    }

    const token = await signToken({ username })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production'
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Login failed.' }, { status: 500 })
  }
}
