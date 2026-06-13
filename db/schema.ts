import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  unique,
  index
} from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  selling_price: numeric('selling_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  alert_threshold: integer('alert_threshold').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('idx_products_name').on(table.name)
}))

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull().default('Spices'),
  quantity: numeric('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(),
  cost_per_unit: numeric('cost_per_unit', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  alert_threshold: numeric('alert_threshold', { precision: 12, scale: 3, mode: 'number' }).notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('idx_ingredients_name').on(table.name),
  categoryIdx: index('idx_ingredients_category').on(table.category)
}))

export const product_ingredients = pgTable('product_ingredients', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  ingredient_id: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantity_per_unit: numeric('quantity_per_unit', { precision: 12, scale: 3, mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  productIngredientUnq: unique().on(table.product_id, table.ingredient_id)
}))

export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  ingredient_id: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  quantity: numeric('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull(),
  cost_total: numeric('cost_total', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  supplier: varchar('supplier', { length: 255 }),
  purchase_date: timestamp('purchase_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('idx_customers_name').on(table.name)
}))

export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  sale_code: varchar('sale_code', { length: 50 }).notNull(),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  customer_id: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  total_amount: numeric('total_amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  amount_paid: numeric('amount_paid', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  payment_status: varchar('payment_status', { length: 20 }).notNull().default('Credit'),
  sale_date: timestamp('sale_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  saleCodeIdx: index('idx_sales_sale_code').on(table.sale_code),
  customerIdx: index('idx_sales_customer_id').on(table.customer_id)
}))

export const production_batches = pgTable('production_batches', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity_produced: integer('quantity_produced').notNull(),
  material_cost: numeric('material_cost', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  labor_cost: numeric('labor_cost', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  equipment_cost: numeric('equipment_cost', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  other_overhead: numeric('other_overhead', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  total_cost: numeric('total_cost', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  cost_per_unit: numeric('cost_per_unit', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  produced_at: timestamp('produced_at').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  productIdx: index('idx_production_batches_product_id').on(table.product_id),
  producedAtIdx: index('idx_production_batches_produced_at').on(table.produced_at)
}))

export const repayments = pgTable('repayments', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  payment_date: timestamp('payment_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  expense_date: timestamp('expense_date').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
})

export const admin_users = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  usernameIdx: index('idx_admin_users_username').on(table.username)
}))

export const cash_entries = pgTable('cash_entries', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  notes: text('notes'),
  entry_date: timestamp('entry_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
})

export const liabilities = pgTable('liabilities', {
  id: serial('id').primaryKey(),
  creditor_name: varchar('creditor_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('other'),
  title: varchar('title', { length: 255 }).notNull(),
  total_amount: numeric('total_amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  amount_paid: numeric('amount_paid', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  liability_date: timestamp('liability_date').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  creditorIdx: index('idx_liabilities_creditor').on(table.creditor_name),
  categoryIdx: index('idx_liabilities_category').on(table.category)
}))

export const liability_payments = pgTable('liability_payments', {
  id: serial('id').primaryKey(),
  liability_id: integer('liability_id').notNull().references(() => liabilities.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  payment_date: timestamp('payment_date').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
})
