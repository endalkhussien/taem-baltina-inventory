import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from './lib/auth'

function isPublicApi(pathname: string) {
  return pathname.startsWith('/api/public/')
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    if (pathname.startsWith('/api/auth') || isPublicApi(pathname)) {
      return NextResponse.next()
    }

    const tokenCookie = req.cookies.get(COOKIE_NAME)

    if (pathname === '/admin/login' || pathname === '/admin/forgot-password') {
      if (!tokenCookie) return NextResponse.next()

      const valid = await verifyToken(tokenCookie.value)
      if (!valid) return NextResponse.next()

      const url = req.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    if (!tokenCookie) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    const valid = await verifyToken(tokenCookie.value)
    if (!valid) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin', '/api/:path*']
}
