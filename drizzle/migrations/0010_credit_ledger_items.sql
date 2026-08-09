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
