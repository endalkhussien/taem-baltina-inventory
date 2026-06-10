import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'taem_token'

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'change-me')
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
