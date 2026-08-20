import { NextResponse } from 'next/server'
import { signToken, verifyToken } from './auth'

export const PARTNER_COOKIE = 'taem_partner_token'

export type PartnerSession = {
  shopId: number
  phone: string
  shopName: string
}

export async function signPartnerToken(session: PartnerSession) {
  return signToken({
    typ: 'partner',
    shopId: session.shopId,
    phone: session.phone,
    shopName: session.shopName
  })
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null
}

export async function getPartnerSessionFromRequest(request: Request): Promise<PartnerSession | null> {
  const raw = readCookie(request.headers.get('cookie'), PARTNER_COOKIE)
  if (!raw) return null

  const payload = await verifyToken(decodeURIComponent(raw))
  if (!payload || payload.typ !== 'partner' || typeof payload.phone !== 'string') return null

  const shopId = Number(payload.shopId)
  if (!Number.isInteger(shopId) || shopId <= 0) return null

  const shopName = typeof payload.shopName === 'string' ? payload.shopName : 'Shop'
  return { shopId, phone: payload.phone, shopName }
}

export async function requirePartner(request: Request) {
  const session = await getPartnerSessionFromRequest(request)
  if (!session) {
    return { session: null as PartnerSession | null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, response: null }
}

export function partnerCookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production'
  }
}
