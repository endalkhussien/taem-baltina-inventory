import { pool } from './db'

/**
 * Idempotent CREATE IF NOT EXISTS for marketplace + credit tables.
 * Deployed Neon DBs often miss these after feature PRs if drizzle:push / migrate:*
 * was never re-run — which breaks both Reset All and public web orders.
 */
const MARKETPLACE_SQL = `
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
  stock_reserved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS market_orders_order_code_unique ON market_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_market_orders_order_code ON market_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_market_orders_status ON market_orders(status);
CREATE INDEX IF NOT EXISTS idx_market_orders_created_at ON market_orders(created_at);

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

CREATE INDEX IF NOT EXISTS idx_market_order_items_order_id ON market_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_market_order_items_product_id ON market_order_items(product_id);
`

const CREDIT_ITEMS_SQL = `
CREATE TABLE IF NOT EXISTS credit_ledger_items (
  id SERIAL PRIMARY KEY,
  credit_id INTEGER NOT NULL REFERENCES credit_ledgers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_kg NUMERIC(14,3) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_items_credit_id ON credit_ledger_items(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_items_product_id ON credit_ledger_items(product_id);
`

/** Deduplicate concurrent ensure calls without permanently caching success (tables can be recreated). */
let inFlight: Promise<void> | null = null

async function tableExists(name: string) {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [name]
  )
  return Boolean(result.rows[0]?.exists)
}

async function columnExists(table: string, column: string) {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    ) AS exists`,
    [table, column]
  )
  return Boolean(result.rows[0]?.exists)
}

async function runEnsure() {
  const hasOrders = await tableExists('market_orders')
  const hasItems = await tableExists('market_order_items')
  if (!hasOrders || !hasItems) {
    await pool.query(MARKETPLACE_SQL)
  }

  if ((await tableExists('market_orders')) && !(await columnExists('market_orders', 'stock_reserved'))) {
    await pool.query(
      'ALTER TABLE market_orders ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT FALSE'
    )
  }

  if ((await tableExists('credit_ledgers')) && !(await tableExists('credit_ledger_items'))) {
    await pool.query(CREDIT_ITEMS_SQL)
  }
}

/** Ensure marketplace order tables exist (safe to call on every request). */
export async function ensureMarketplaceSchema() {
  if (!inFlight) {
    inFlight = runEnsure().finally(() => {
      inFlight = null
    })
  }
  await inFlight
}
