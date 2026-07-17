-- Allow decimal kg for sales and finished-goods stock (safe ALTER, preserves data)
ALTER TABLE sales ALTER COLUMN quantity TYPE NUMERIC(14,3) USING quantity::numeric;
ALTER TABLE products ALTER COLUMN stock_quantity TYPE NUMERIC(14,3) USING stock_quantity::numeric;
