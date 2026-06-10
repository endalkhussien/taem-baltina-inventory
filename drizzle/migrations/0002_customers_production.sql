-- Customers, credit sales linkage, and production batches

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sales
  ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

CREATE TABLE production_batches (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_produced INTEGER NOT NULL,
  produced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_name ON customers (name);
CREATE INDEX idx_sales_customer_id ON sales (customer_id);
CREATE INDEX idx_production_batches_product_id ON production_batches (product_id);
CREATE INDEX idx_production_batches_produced_at ON production_batches (produced_at);
