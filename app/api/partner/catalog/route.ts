import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { requirePartner } from '../../../../lib/partnerAuth'
import { marketplaceProductPayload } from '../../../../lib/productDisplay'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

/** Wholesale catalog: finished goods available from Taem Baltina. */
export async function GET(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

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
      .map((row) => {
        const payload = marketplaceProductPayload(row)
        return {
          ...payload,
          wholesale_price: Number(row.selling_price)
        }
      })

    return NextResponse.json(catalog)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load wholesale catalog')
  }
}
