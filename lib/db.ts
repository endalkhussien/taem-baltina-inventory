import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema'
import { createPgPoolOptions, resolveDatabaseUrl } from './pgConnection'

const connectionString = resolveDatabaseUrl()

export const pool = new Pool(createPgPoolOptions(connectionString))
export const db = drizzle(pool, { schema })
export { schema }
