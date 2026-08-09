import { NextResponse } from 'next/server'
import { signToken, COOKIE_NAME } from '../../../../lib/auth'
import { authenticateAdmin, bootstrapAdminFromEnv, countAdminUsers, getAuthSetupHint } from '../../../../lib/adminUsers'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'
import { loginSchema } from '../../../../lib/validators/auth'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = loginSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid username or password.' }, { status: 422 })

    const { username, password } = parsed.data

    await bootstrapAdminFromEnv()

    const user = await authenticateAdmin(username, password)
    if (!user) {
      const total = await countAdminUsers()
      if (total === 0) {
        return NextResponse.json({ error: getAuthSetupHint() }, { status: 503 })
      }

      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, username: user.username })
    const res = NextResponse.json({ ok: true, username: user.username })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production'
    })
    return res
  } catch (err) {
    return databaseErrorResponse(err, 'Login failed')
  }
}
