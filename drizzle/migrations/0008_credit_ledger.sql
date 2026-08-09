CREATE TABLE IF NOT EXISTS credit_ledgers (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_date TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledgers_customer_id ON credit_ledgers(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledgers_credit_date ON credit_ledgers(credit_date);

CREATE TABLE IF NOT EXISTS credit_payments (
  id SERIAL PRIMARY KEY,
  credit_id INTEGER NOT NULL REFERENCES credit_ledgers(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
