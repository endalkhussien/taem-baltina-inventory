-- Categorize raw materials for filtered stock views

ALTER TABLE ingredients
  ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Spices';

CREATE INDEX idx_ingredients_category ON ingredients (category);
