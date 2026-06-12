import { eq, sql } from 'drizzle-orm'
import { db, schema } from './db'
import { hashPassword, verifyPassword } from './password'

export type AdminUser = {
  id: number
  username: string
}

function readBootstrapCredentials() {
  const username = process.env.ADMIN_USER?.trim()
  const password = process.env.ADMIN_PASS

  if (!username || !password) return null

  return { username, password }
}

function readRecoverySecret() {
  return process.env.PASSWORD_RESET_SECRET?.trim() || null
}

export async function countAdminUsers() {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.admin_users)

  return Number(result?.count ?? 0)
}

export async function bootstrapAdminFromEnv() {
  const credentials = readBootstrapCredentials()
  if (!credentials) return null

  const total = await countAdminUsers()
  if (total > 0) return null

  const passwordHash = await hashPassword(credentials.password)

  const [created] = await db
    .insert(schema.admin_users)
    .values({
      username: credentials.username,
      password_hash: passwordHash
    })
    .returning({ id: schema.admin_users.id, username: schema.admin_users.username })

  return created
}

export async function findAdminByUsername(username: string) {
  const [user] = await db
    .select({
      id: schema.admin_users.id,
      username: schema.admin_users.username,
      password_hash: schema.admin_users.password_hash
    })
    .from(schema.admin_users)
    .where(eq(schema.admin_users.username, username))
    .limit(1)

  return user ?? null
}

export async function authenticateAdmin(username: string, password: string) {
  const user = await findAdminByUsername(username.trim())
  if (!user) return null

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return null

  return { id: user.id, username: user.username }
}

export async function updateAdminPassword(userId: number, newPassword: string) {
  const passwordHash = await hashPassword(newPassword)

  const [updated] = await db
    .update(schema.admin_users)
    .set({ password_hash: passwordHash, updated_at: new Date() })
    .where(eq(schema.admin_users.id, userId))
    .returning({ id: schema.admin_users.id, username: schema.admin_users.username })

  return updated ?? null
}

export async function resetAdminPassword(username: string, recoverySecret: string, newPassword: string) {
  const expectedSecret = readRecoverySecret()

  if (!expectedSecret) {
    return {
      ok: false as const,
      status: 503,
      error: 'Password recovery is not configured. Set PASSWORD_RESET_SECRET in your deployment environment.'
    }
  }

  if (recoverySecret.trim() !== expectedSecret) {
    return { ok: false as const, status: 401, error: 'Invalid recovery secret.' }
  }

  const normalizedUsername = username.trim()
  if (!normalizedUsername) {
    return { ok: false as const, status: 422, error: 'Username is required.' }
  }

  const existing = await findAdminByUsername(normalizedUsername)
  const passwordHash = await hashPassword(newPassword)

  if (existing) {
    const updated = await updateAdminPassword(existing.id, newPassword)
    if (!updated) {
      return { ok: false as const, status: 500, error: 'Could not update password.' }
    }

    return { ok: true as const, user: updated, created: false }
  }

  const [created] = await db
    .insert(schema.admin_users)
    .values({
      username: normalizedUsername,
      password_hash: passwordHash
    })
    .returning({ id: schema.admin_users.id, username: schema.admin_users.username })

  return { ok: true as const, user: created, created: true }
}

export function getAuthSetupHint() {
  const hasBootstrap = Boolean(readBootstrapCredentials())
  const hasRecovery = Boolean(readRecoverySecret())

  if (hasBootstrap) {
    return 'No admin account exists yet. The first login will create one from ADMIN_USER and ADMIN_PASS.'
  }

  if (hasRecovery) {
    return 'No admin account exists yet. Use Forgot password to create your first account with your recovery secret.'
  }

  return 'No admin account exists yet. Set ADMIN_USER and ADMIN_PASS, or PASSWORD_RESET_SECRET, in your deployment environment and redeploy.'
}
