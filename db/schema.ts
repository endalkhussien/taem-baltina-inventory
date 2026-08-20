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
  stock_quantity: numeric('stock_quantity', { precision: 14, scale: 3, mode: 'number' }).notNull().default(0),
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
  quantity: numeric('quantity', { precision: 14, scale: 3, mode: 'number' }).notNull(),
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
  batch_count: integer('batch_count').notNull().default(1),
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

export const credit_ledgers = pgTable('credit_ledgers', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  product_id: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  quantity_kg: numeric('quantity_kg', { precision: 14, scale: 3, mode: 'number' }),
  title: varchar('title', { length: 255 }).notNull(),
  total_amount: numeric('total_amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  amount_paid: numeric('amount_paid', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  credit_date: timestamp('credit_date').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  customerIdx: index('idx_credit_ledgers_customer_id').on(table.customer_id),
  creditDateIdx: index('idx_credit_ledgers_credit_date').on(table.credit_date),
  productIdx: index('idx_credit_ledgers_product_id').on(table.product_id)
}))

export const credit_payments = pgTable('credit_payments', {
  id: serial('id').primaryKey(),
  credit_id: integer('credit_id').notNull().references(() => credit_ledgers.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  payment_date: timestamp('payment_date').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
})

export const credit_ledger_items = pgTable('credit_ledger_items', {
  id: serial('id').primaryKey(),
  credit_id: integer('credit_id').notNull().references(() => credit_ledgers.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity_kg: numeric('quantity_kg', { precision: 14, scale: 3, mode: 'number' }).notNull(),
  unit_price: numeric('unit_price', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  line_total: numeric('line_total', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  creditIdx: index('idx_credit_ledger_items_credit_id').on(table.credit_id),
  productIdx: index('idx_credit_ledger_items_product_id').on(table.product_id)
}))

/** Public marketplace orders (pending fulfillment by ops). */
export const market_orders = pgTable('market_orders', {
  id: serial('id').primaryKey(),
  order_code: varchar('order_code', { length: 50 }).notNull().unique(),
  customer_id: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customer_name: varchar('customer_name', { length: 255 }).notNull(),
  customer_phone: varchar('customer_phone', { length: 50 }).notNull(),
  customer_email: varchar('customer_email', { length: 255 }),
  delivery_address: text('delivery_address').notNull(),
  city: varchar('city', { length: 120 }).notNull().default('Addis Ababa'),
  notes: text('notes'),
  payment_method: varchar('payment_method', { length: 30 }).notNull().default('cod'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  subtotal: numeric('subtotal', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  total_amount: numeric('total_amount', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  orderCodeIdx: index('idx_market_orders_order_code').on(table.order_code),
  statusIdx: index('idx_market_orders_status').on(table.status),
  createdAtIdx: index('idx_market_orders_created_at').on(table.created_at)
}))

export const market_order_items = pgTable('market_order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => market_orders.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  product_name: varchar('product_name', { length: 255 }).notNull(),
  quantity_kg: numeric('quantity_kg', { precision: 14, scale: 3, mode: 'number' }).notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  line_total: numeric('line_total', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  orderIdx: index('idx_market_order_items_order_id').on(table.order_id),
  productIdx: index('idx_market_order_items_product_id').on(table.product_id)
}))

/** Independent reseller shops: they buy prepared goods from HQ and sell their own stock. */
export const partner_shops = pgTable('partner_shops', {
  id: serial('id').primaryKey(),
  shop_name: varchar('shop_name', { length: 255 }).notNull(),
  owner_name: varchar('owner_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  city: varchar('city', { length: 120 }).notNull().default('Addis Ababa'),
  address: text('address'),
  status: varchar('status', { length: 30 }).notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  phoneIdx: index('idx_partner_shops_phone').on(table.phone),
  statusIdx: index('idx_partner_shops_status').on(table.status)
}))

export const partner_stock = pgTable('partner_stock', {
  id: serial('id').primaryKey(),
  shop_id: integer('shop_id').notNull().references(() => partner_shops.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity_kg: numeric('quantity_kg', { precision: 14, scale: 3, mode: 'number' }).notNull().default(0),
  avg_cost: numeric('avg_cost', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  shopProductUnq: unique().on(table.shop_id, table.product_id),
  shopIdx: index('idx_partner_stock_shop_id').on(table.shop_id)
}))

export const partner_buy_orders = pgTable('partner_buy_orders', {
  id: serial('id').primaryKey(),
  shop_id: integer('shop_id').notNull().references(() => partner_shops.id, { onDelete: 'cascade' }),
  order_code: varchar('order_code', { length: 50 }).notNull().unique(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  total_amount: numeric('total_amount', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  shopIdx: index('idx_partner_buy_orders_shop_id').on(table.shop_id),
  statusIdx: index('idx_partner_buy_orders_status').on(table.status)
}))

export const partner_buy_order_items = pgTable('partner_buy_order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => partner_buy_orders.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  product_name: varchar('product_name', { length: 255 }).notNull(),
  quantity_kg: numeric('quantity_kg', { precision: 14, scale: 3, mode: 'number' }).notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  line_total: numeric('line_total', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  orderIdx: index('idx_partner_buy_order_items_order_id').on(table.order_id)
}))

export const partner_sales = pgTable('partner_sales', {
  id: serial('id').primaryKey(),
  shop_id: integer('shop_id').notNull().references(() => partner_shops.id, { onDelete: 'cascade' }),
  sale_code: varchar('sale_code', { length: 50 }).notNull(),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  product_name: varchar('product_name', { length: 255 }).notNull(),
  quantity_kg: numeric('quantity_kg', { precision: 14, scale: 3, mode: 'number' }).notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  total_amount: numeric('total_amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  amount_paid: numeric('amount_paid', { precision: 14, scale: 2, mode: 'number' }).notNull().default(0),
  customer_name: varchar('customer_name', { length: 255 }),
  sale_date: timestamp('sale_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  shopIdx: index('idx_partner_sales_shop_id').on(table.shop_id),
  saleDateIdx: index('idx_partner_sales_sale_date').on(table.sale_date)
}))

export const partner_expenses = pgTable('partner_expenses', {
  id: serial('id').primaryKey(),
  shop_id: integer('shop_id').notNull().references(() => partner_shops.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull().default('other'),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  expense_date: timestamp('expense_date').defaultNow().notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  shopIdx: index('idx_partner_expenses_shop_id').on(table.shop_id)
}))
