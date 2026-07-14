ALTER TABLE credit_ledgers ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE credit_ledgers ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC(14,3);
CREATE INDEX IF NOT EXISTS idx_credit_ledgers_product_id ON credit_ledgers(product_id);
