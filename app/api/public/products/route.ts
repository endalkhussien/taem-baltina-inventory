import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { marketplaceProductPayload } from '../../../../lib/productDisplay'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

/** Public catalog: finished goods that are available to order. Stock amounts stay internal. */
export async function GET() {
  try {
    const rows = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        selling_price: schema.products.selling_price,
        stock_quantity: schema.products.stock_quantity
      })
      .from(schema.products)
      .orderBy(desc(schema.products.updated_at))

    const catalog = rows
      .filter((row) => Number(row.stock_quantity) > 0)
      .map(marketplaceProductPayload)

    return NextResponse.json(catalog)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load shop products')
  }
}
