-- Manual cash counts and liabilities (money you owe)

CREATE TABLE IF NOT EXISTS cash_entries (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(14,2) NOT NULL,
  notes TEXT,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS liabilities (
  id SERIAL PRIMARY KEY,
  creditor_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  title VARCHAR(255) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  liability_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liabilities_creditor ON liabilities (creditor_name);
CREATE INDEX IF NOT EXISTS idx_liabilities_category ON liabilities (category);

CREATE TABLE IF NOT EXISTS liability_payments (
  id SERIAL PRIMARY KEY,
  liability_id INTEGER NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
