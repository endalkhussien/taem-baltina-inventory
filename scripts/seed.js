const { Pool } = require('pg')
const { randomBytes, scrypt } = require('crypto')
const { promisify } = require('util')

const scryptAsync = promisify(scrypt)

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL environment variable is required in production.')
    }

    return 'postgresql://postgres:postgres@localhost:5432/taem_baltina_dev'
  }

  return url
}

function createPgPoolOptions(connectionString) {
  const requiresSsl = /sslmode=require|neon\.tech|supabase\.co/i.test(connectionString)

  return {
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  }
}

const connectionString = resolveDatabaseUrl()
const pool = new Pool(createPgPoolOptions(connectionString))

const products = [
  { name: 'Berbere', selling_price: 150.0, stock_quantity: 100, alert_threshold: 10 },
  { name: 'Shiro', selling_price: 120.0, stock_quantity: 100, alert_threshold: 10 },
  { name: 'Mitmita', selling_price: 200.0, stock_quantity: 100, alert_threshold: 10 }
]

const ingredients = [
  { name: 'Red pepper', category: 'Spices', quantity: 50, unit: 'kg', cost_per_unit: 80, alert_threshold: 5 },
  { name: 'Fenugreek', category: 'Spices', quantity: 20, unit: 'kg', cost_per_unit: 120, alert_threshold: 2 },
  { name: 'Garlic', category: 'Fresh aromatics', quantity: 15, unit: 'kg', cost_per_unit: 90, alert_threshold: 2 },
  { name: 'Ginger', category: 'Fresh aromatics', quantity: 15, unit: 'kg', cost_per_unit: 95, alert_threshold: 2 },
  { name: 'Black cumin', category: 'Spices', quantity: 10, unit: 'kg', cost_per_unit: 140, alert_threshold: 1 },
  { name: 'Chickpea flour', category: 'Flours', quantity: 80, unit: 'kg', cost_per_unit: 65, alert_threshold: 10 },
  { name: 'Birds eye chili', category: 'Spices', quantity: 12, unit: 'kg', cost_per_unit: 180, alert_threshold: 2 },
  { name: 'Salt', category: 'Seasoning', quantity: 25, unit: 'kg', cost_per_unit: 20, alert_threshold: 5 }
]

const recipes = [
  {
    product: 'Berbere',
    ingredients: [
      { ingredient: 'Red pepper', quantity_per_unit: 0.65 },
      { ingredient: 'Fenugreek', quantity_per_unit: 0.12 },
      { ingredient: 'Garlic', quantity_per_unit: 0.08 },
      { ingredient: 'Ginger', quantity_per_unit: 0.07 },
      { ingredient: 'Black cumin', quantity_per_unit: 0.03 },
      { ingredient: 'Salt', quantity_per_unit: 0.05 }
    ]
  },
  {
    product: 'Shiro',
    ingredients: [
      { ingredient: 'Chickpea flour', quantity_per_unit: 0.82 },
      { ingredient: 'Garlic', quantity_per_unit: 0.04 },
      { ingredient: 'Ginger', quantity_per_unit: 0.04 },
      { ingredient: 'Red pepper', quantity_per_unit: 0.06 },
      { ingredient: 'Salt', quantity_per_unit: 0.04 }
    ]
  },
  {
    product: 'Mitmita',
    ingredients: [
      { ingredient: 'Birds eye chili', quantity_per_unit: 0.78 },
      { ingredient: 'Black cumin', quantity_per_unit: 0.08 },
      { ingredient: 'Ginger', quantity_per_unit: 0.06 },
      { ingredient: 'Garlic', quantity_per_unit: 0.03 },
      { ingredient: 'Salt', quantity_per_unit: 0.05 }
    ]
  }
]

const customers = [
  { name: 'Merkato Mini Market', phone: '+251911000001', notes: 'Wholesale buyer, usually pays weekly.' },
  { name: 'Addis Restaurant Supply', phone: '+251911000002', notes: 'Buys Berbere and Shiro on partial credit.' },
  { name: 'Bole Grocery', phone: '+251911000003', notes: 'Prefers monthly statement.' }
]

async function seed() {
  const client = await pool.connect()
  try {
    const productIds = new Map()
    const ingredientIds = new Map()

    for (const p of products) {
      const res = await client.query('SELECT id FROM products WHERE name = $1', [p.name])
      if (res.rowCount === 0) {
        const inserted = await client.query(
          `INSERT INTO products (name, selling_price, stock_quantity, alert_threshold, created_at, updated_at)
           VALUES ($1, $2, $3, $4, now(), now())
           RETURNING id`,
          [p.name, p.selling_price, p.stock_quantity, p.alert_threshold]
        )
        productIds.set(p.name, inserted.rows[0].id)
        console.log('Inserted', p.name)
      } else {
        productIds.set(p.name, res.rows[0].id)
        console.log('Already exists:', p.name)
      }
    }

    for (const ingredient of ingredients) {
      const res = await client.query('SELECT id FROM ingredients WHERE name = $1', [ingredient.name])
      if (res.rowCount === 0) {
        const inserted = await client.query(
          `INSERT INTO ingredients (name, category, quantity, unit, cost_per_unit, alert_threshold, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, now(), now())
           RETURNING id`,
          [ingredient.name, ingredient.category, ingredient.quantity, ingredient.unit, ingredient.cost_per_unit, ingredient.alert_threshold]
        )
        ingredientIds.set(ingredient.name, inserted.rows[0].id)
        console.log('Inserted ingredient', ingredient.name)
      } else {
        ingredientIds.set(ingredient.name, res.rows[0].id)
        await client.query('UPDATE ingredients SET category = $1 WHERE id = $2', [ingredient.category, res.rows[0].id])
        console.log('Already exists ingredient:', ingredient.name)
      }
    }

    for (const recipe of recipes) {
      const productId = productIds.get(recipe.product)
      if (!productId) continue

      for (const line of recipe.ingredients) {
        const ingredientId = ingredientIds.get(line.ingredient)
        if (!ingredientId) continue

        await client.query(
          `INSERT INTO product_ingredients (product_id, ingredient_id, quantity_per_unit, created_at)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (product_id, ingredient_id)
           DO UPDATE SET quantity_per_unit = EXCLUDED.quantity_per_unit`,
          [productId, ingredientId, line.quantity_per_unit]
        )
      }

      console.log('Seeded recipe for', recipe.product)
    }

    for (const customer of customers) {
      const res = await client.query('SELECT id FROM customers WHERE name = $1', [customer.name])
      if (res.rowCount === 0) {
        await client.query(
          `INSERT INTO customers (name, phone, notes, created_at, updated_at)
           VALUES ($1, $2, $3, now(), now())`,
          [customer.name, customer.phone, customer.notes]
        )
        console.log('Inserted customer', customer.name)
      } else {
        console.log('Already exists customer:', customer.name)
      }
    }

    const adminUsername = process.env.ADMIN_USER || 'admin'
    const adminPassword = process.env.ADMIN_PASS || 'password'
    const adminRes = await client.query('SELECT id FROM admin_users WHERE username = $1', [adminUsername])

    if (adminRes.rowCount === 0) {
      const passwordHash = await hashPassword(adminPassword)
      await client.query(
        `INSERT INTO admin_users (username, password_hash, created_at, updated_at)
         VALUES ($1, $2, now(), now())`,
        [adminUsername, passwordHash]
      )
      console.log('Inserted admin user', adminUsername)
    } else {
      console.log('Already exists admin user:', adminUsername)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
