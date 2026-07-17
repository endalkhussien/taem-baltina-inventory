const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const { requireDatabaseUrl } = require('./load-env')

function createPgPoolOptions(connectionString) {
  const requiresSsl = /sslmode=require|neon\.tech|supabase\.co/i.test(connectionString)
  return {
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 3),
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  }
}

async function migrateDecimalSales() {
  const databaseUrl = requireDatabaseUrl()
  const pool = new Pool(createPgPoolOptions(databaseUrl))
  const client = await pool.connect()

  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'drizzle/migrations/0011_decimal_sales_stock.sql'), 'utf8')
    console.log('Applying decimal sales/stock migration (safe ALTER)...')
    await client.query(sql)
    console.log('Done. Sales quantity and product stock now support decimals (e.g. 2.5 kg).')
  } finally {
    client.release()
    await pool.end()
  }
}

migrateDecimalSales().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
