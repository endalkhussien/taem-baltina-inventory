-- Public marketplace orders (safe CREATE IF NOT EXISTS)
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
