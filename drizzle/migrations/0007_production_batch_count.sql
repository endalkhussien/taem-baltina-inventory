ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS batch_count INTEGER NOT NULL DEFAULT 1;

UPDATE production_batches
SET batch_count = 1
WHERE batch_count IS NULL OR batch_count < 1;
