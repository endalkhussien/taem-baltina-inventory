import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp
} from 'drizzle-orm/pg-core'

// Products (finished goods)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  selling_price: numeric('selling_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  alert_threshold: integer('alert_threshold').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
})

// Ingredients (raw materials)
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(),
  cost_per_unit: numeric('cost_per_unit', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  alert_threshold: numeric('alert_threshold', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
})

// Bill of Materials: relates products to ingredients and how much of an ingredient is used per unit of product
export const product_ingredients = pgTable('product_ingredients', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => products.id),
  ingredient_id: integer('ingredient_id').notNull().references(() => ingredients.id),
  quantity_per_unit: numeric('quantity_per_unit', { precision: 12, scale: 3, mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Ingredient purchases (for adding inventory cost)
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  ingredient_id: integer('ingredient_id').notNull().references(() => ingredients.id),
  quantity: numeric('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
  cost_total: numeric('cost_total', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  supplier: varchar('supplier', { length: 255 }),
  purchase_date: timestamp('purchase_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Sales (finished-goods sold to customers)
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  sale_code: varchar('sale_code', { length: 50 }).notNull(),
  product_id: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  total_amount: numeric('total_amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  amount_paid: numeric('amount_paid', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  payment_status: varchar('payment_status', { length: 20 }).notNull().default('Credit'),
  sale_date: timestamp('sale_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Repayments for credit sales
export const repayments = pgTable('repayments', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').notNull().references(() => sales.id),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  payment_date: timestamp('payment_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Expenses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  expense_date: timestamp('expense_date').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
})

// Indexes, constraints and triggers can be added in migrations where supported by drizzle-kit
