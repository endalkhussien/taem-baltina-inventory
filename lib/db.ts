import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/taem_baltina_dev'
const requiresSsl = /sslmode=require|neon\.tech|supabase\.co/i.test(connectionString)

export const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 3),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
})
export const db = drizzle(pool, { schema })
export { schema }
