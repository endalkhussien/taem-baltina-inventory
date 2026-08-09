import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { productCreateSchema } from '../../../lib/validators/product'
import { databaseErrorResponse } from '../../../lib/apiErrors'
import { count, eq, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const products = await db.select().from(schema.products)
    const recipeCounts = await db
      .select({
        product_id: schema.product_ingredients.product_id,
        recipe_line_count: count()
      })
      .from(schema.product_ingredients)
      .groupBy(schema.product_ingredients.product_id)

    const producedTotals = await db
      .select({
        product_id: schema.production_batches.product_id,
        total_produced: sql<number>`coalesce(sum(${schema.production_batches.quantity_produced}), 0)`.mapWith(Number)
      })
      .from(schema.production_batches)
      .groupBy(schema.production_batches.product_id)

    const soldTotals = await db
      .select({
        product_id: schema.sales.product_id,
        total_sold: sql<number>`coalesce(sum(${schema.sales.quantity}), 0)`.mapWith(Number)
      })
      .from(schema.sales)
      .groupBy(schema.sales.product_id)

    const countByProductId = new Map(recipeCounts.map((row) => [row.product_id, Number(row.recipe_line_count)]))
    const producedByProductId = new Map(producedTotals.map((row) => [row.product_id, Number(row.total_produced)]))
    const soldByProductId = new Map(soldTotals.map((row) => [row.product_id, Number(row.total_sold)]))

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        recipe_line_count: countByProductId.get(product.id) ?? 0,
        total_produced: producedByProductId.get(product.id) ?? 0,
        total_sold: soldByProductId.get(product.id) ?? 0
      }))
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load finished goods')
  }
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
    return databaseErrorResponse(err, 'Could not create finished good')
  }
}
