/**
 * Safe migration: creates partner shop tables if missing.
 * Run: npm run migrate:partners
 */
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const { requireDatabaseUrl } = require('./load-env')

function createPgPoolOptions(connectionString) {
  const requiresSsl = /sslmode=require|neon\.tech|supabase\.co/i.test(connectionString)

  return {
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  }
}

async function main() {
  const pool = new Pool(createPgPoolOptions(requireDatabaseUrl()))
  const client = await pool.connect()
  const sql = fs.readFileSync(path.join(__dirname, '..', 'drizzle/migrations/0013_partner_shops.sql'), 'utf8')

  try {
    console.log('Applying partner shop tables (safe CREATE IF NOT EXISTS)...')
    await client.query(sql)
    console.log('OK — partner shops, stock, buy orders, sales, and expenses are ready.')
  } catch (err) {
    console.error('Migration failed:', err.message || err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
