import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/taem_baltina_dev'
const pool = new Pool({ connectionString })

const products = [
  { name: 'Berbere', selling_price: 150.0, stock_quantity: 100, alert_threshold: 10 },
  { name: 'Shiro', selling_price: 120.0, stock_quantity: 100, alert_threshold: 10 },
  { name: 'Mitmita', selling_price: 200.0, stock_quantity: 100, alert_threshold: 10 }
]

async function seed() {
  const client = await pool.connect()
  try {
    for (const p of products) {
      const res = await client.query('SELECT id FROM products WHERE name = $1', [p.name])
      if (res.rowCount === 0) {
        await client.query(
          `INSERT INTO products (name, selling_price, stock_quantity, alert_threshold, created_at, updated_at)
           VALUES ($1, $2, $3, $4, now(), now())`,
          [p.name, p.selling_price, p.stock_quantity, p.alert_threshold]
        )
        console.log('Inserted', p.name)
      } else {
        console.log('Already exists:', p.name)
      }
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
