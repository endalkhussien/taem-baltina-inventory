-- Independent reseller shops (buy prepared goods from HQ, own stock and finance)
CREATE TABLE IF NOT EXISTS partner_shops (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  password_hash TEXT NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT 'Addis Ababa',
  address TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_shops_phone_unique ON partner_shops(phone);
CREATE INDEX IF NOT EXISTS idx_partner_shops_phone ON partner_shops(phone);
CREATE INDEX IF NOT EXISTS idx_partner_shops_status ON partner_shops(status);

CREATE TABLE IF NOT EXISTS partner_stock (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES partner_shops(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_kg NUMERIC(14, 3) NOT NULL DEFAULT 0,
  avg_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_stock_shop_product_unique ON partner_stock(shop_id, product_id);
CREATE INDEX IF NOT EXISTS idx_partner_stock_shop_id ON partner_stock(shop_id);

CREATE TABLE IF NOT EXISTS partner_buy_orders (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES partner_shops(id) ON DELETE CASCADE,
  order_code VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_buy_orders_order_code_unique ON partner_buy_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_partner_buy_orders_shop_id ON partner_buy_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_partner_buy_orders_status ON partner_buy_orders(status);

CREATE TABLE IF NOT EXISTS partner_buy_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES partner_buy_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity_kg NUMERIC(14, 3) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_buy_order_items_order_id ON partner_buy_order_items(order_id);

CREATE TABLE IF NOT EXISTS partner_sales (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES partner_shops(id) ON DELETE CASCADE,
  sale_code VARCHAR(50) NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity_kg NUMERIC(14, 3) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  total_amount NUMERIC(14, 2) NOT NULL,
  amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  customer_name VARCHAR(255),
  sale_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sales_shop_id ON partner_sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_sale_date ON partner_sales(sale_date);

CREATE TABLE IF NOT EXISTS partner_expenses (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES partner_shops(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'other',
  amount NUMERIC(14, 2) NOT NULL,
  expense_date TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_expenses_shop_id ON partner_expenses(shop_id);
