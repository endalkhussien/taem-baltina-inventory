import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/taem_baltina_dev'

export const pool = new Pool({ connectionString })
export const db = drizzle(pool, { schema })
export { schema }
