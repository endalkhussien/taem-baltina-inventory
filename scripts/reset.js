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

async function tableExists(client, name) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [name]
  )
  return Boolean(result.rows[0]?.exists)
}

async function deleteIfExists(client, name) {
  if (await tableExists(client, name)) {
    await client.query(`DELETE FROM ${name}`)
  }
}

async function reset() {
  if (process.env.CONFIRM_RESET !== 'yes') {
    console.error('This deletes all sales, web orders, production, purchases, expenses, cash counts, debts, and zeros all stock.')
    console.error('Run again with CONFIRM_RESET=yes')
    process.exit(1)
  }

  const pool = new Pool(createPgPoolOptions(resolveDatabaseUrl()))
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await deleteIfExists(client, 'market_order_items')
    await deleteIfExists(client, 'market_orders')
    await deleteIfExists(client, 'partner_buy_order_items')
    await deleteIfExists(client, 'partner_buy_orders')
    await deleteIfExists(client, 'partner_sales')
    await deleteIfExists(client, 'partner_expenses')
    if (await tableExists(client, 'partner_stock')) {
      await client.query('UPDATE partner_stock SET quantity_kg = 0, updated_at = now()')
    }

    await deleteIfExists(client, 'credit_payments')
    await deleteIfExists(client, 'credit_ledger_items')
    await deleteIfExists(client, 'credit_ledgers')
    await deleteIfExists(client, 'liability_payments')
    await deleteIfExists(client, 'liabilities')
    await deleteIfExists(client, 'cash_entries')
    await deleteIfExists(client, 'repayments')
    await deleteIfExists(client, 'sales')
    await deleteIfExists(client, 'production_batches')
    await deleteIfExists(client, 'purchases')
    await deleteIfExists(client, 'expenses')
    await client.query('UPDATE products SET stock_quantity = 0, updated_at = now()')
    await client.query('UPDATE ingredients SET quantity = 0, updated_at = now()')

    await client.query('COMMIT')
    console.log('Reset complete. All transactional amounts cleared and stock set to zero.')
    console.log('Products, recipes, raw materials, customers, partner shops, and admin login were kept.')
    console.log('Produce finished goods again before the public shop can take new orders.')
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
