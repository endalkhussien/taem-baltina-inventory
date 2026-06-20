const { Pool } = require('pg')

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL environment variable is required in production.')
    }

    return 'postgresql://postgres:postgres@localhost:5432/taem_baltina_dev'
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

async function reset() {
  if (process.env.CONFIRM_RESET !== 'yes') {
    console.error('This deletes all sales, production, purchases, expenses, cash counts, debts, and zeros all stock.')
    console.error('Run again with CONFIRM_RESET=yes')
    process.exit(1)
  }

  const pool = new Pool(createPgPoolOptions(resolveDatabaseUrl()))
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query('DELETE FROM liability_payments')
    await client.query('DELETE FROM liabilities')
    await client.query('DELETE FROM cash_entries')
    await client.query('DELETE FROM repayments')
    await client.query('DELETE FROM sales')
    await client.query('DELETE FROM production_batches')
    await client.query('DELETE FROM purchases')
    await client.query('DELETE FROM expenses')
    await client.query('UPDATE products SET stock_quantity = 0, updated_at = now()')
    await client.query('UPDATE ingredients SET quantity = 0, updated_at = now()')

    await client.query('COMMIT')
    console.log('Reset complete. All transactional amounts cleared and stock set to zero.')
    console.log('Products, recipes, raw materials, customers, and admin login were kept.')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

reset().catch((err) => {
  console.error(err)
  process.exit(1)
})
