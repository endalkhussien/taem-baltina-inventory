import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'taem_token'

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

export { COOKIE_NAME }
