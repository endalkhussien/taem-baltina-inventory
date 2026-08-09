import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'taem_token'

export type SessionPayload = {
  userId: number
  username: string
}

function getSecret() {
  const secret = process.env.JWT_SECRET

  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET is required in production.')
  }

  return new TextEncoder().encode(secret || 'change-me')
}

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export async function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1)

  if (!token) return null

  const payload = await verifyToken(decodeURIComponent(token))
  if (!payload || typeof payload.username !== 'string') return null

  const userId = Number(payload.userId)
  if (!Number.isInteger(userId)) return null

  return { userId, username: payload.username }
}

export { COOKIE_NAME }
