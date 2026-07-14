const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL is required. Example: $env:DATABASE_URL = "postgresql://..."')
  }

  return url
}

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

async function runSqlFile(client, relativePath) {
  const filePath = path.join(__dirname, '..', relativePath)
  const sql = fs.readFileSync(filePath, 'utf8')
  console.log(`Applying ${relativePath}...`)
  await client.query(sql)
}

async function migrateCredit() {
  const pool = new Pool(createPgPoolOptions(resolveDatabaseUrl()))
  const client = await pool.connect()

  try {
    console.log('Safe credit migration — only creates new tables/columns (IF NOT EXISTS).')
    console.log('Your sales, customers, products, and stock data are not modified.\n')

    await runSqlFile(client, 'drizzle/migrations/0008_credit_ledger.sql')
    await runSqlFile(client, 'drizzle/migrations/0009_credit_product.sql')

    console.log('\nDone. credit_ledgers and credit_payments are ready.')
    console.log('Refresh the Customers page and record credit again.')
  } finally {
    client.release()
    await pool.end()
  }
}

migrateCredit().catch((err) => {
  console.error(err)
  process.exit(1)
})
