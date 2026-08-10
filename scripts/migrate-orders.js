/**
 * Safe migration: creates marketplace order tables if missing.
 * Run: node scripts/migrate-orders.js
 */
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
  try {
    await client.query('BEGIN')
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_orders (
        id SERIAL PRIMARY KEY,
        order_code VARCHAR(50) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255),
        delivery_address TEXT NOT NULL,
        city VARCHAR(120) NOT NULL DEFAULT 'Addis Ababa',
        notes TEXT,
        payment_method VARCHAR(30) NOT NULL DEFAULT 'cod',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_market_orders_order_code ON market_orders(order_code);`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_market_orders_status ON market_orders(status);`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_market_orders_created_at ON market_orders(created_at);`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS market_order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES market_orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name VARCHAR(255) NOT NULL,
        quantity_kg NUMERIC(14, 3) NOT NULL,
        unit_price NUMERIC(12, 2) NOT NULL,
        line_total NUMERIC(14, 2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_market_order_items_order_id ON market_order_items(order_id);`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_market_order_items_product_id ON market_order_items(product_id);`)
    await client.query('COMMIT')
    console.log('OK — market_orders and market_order_items are ready.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', err.message || err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
