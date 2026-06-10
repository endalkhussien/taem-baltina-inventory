import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { productCreateSchema } from '../../../lib/validators/product'

export async function GET() {
  const products = await db.select().from(schema.products)
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = productCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { name, sellingPrice, stockQuantity = 0, alertThreshold = 0 } = parsed.data

    const [created] = await db
      .insert(schema.products)
      .values({
        name,
        selling_price: sellingPrice,
        stock_quantity: stockQuantity,
        alert_threshold: alertThreshold
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
