import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { marketplaceProductPayload } from '../../../../lib/productDisplay'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

/** Public catalog: finished products with live price + stock. */
export async function GET() {
  try {
    const rows = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        selling_price: schema.products.selling_price,
        stock_quantity: schema.products.stock_quantity,
        alert_threshold: schema.products.alert_threshold
      })
      .from(schema.products)
      .orderBy(desc(schema.products.stock_quantity), desc(schema.products.updated_at))

    return NextResponse.json(rows.map(marketplaceProductPayload))
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load shop products')
  }
}
