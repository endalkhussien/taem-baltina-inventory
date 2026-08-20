import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { requirePartner } from '../../../../lib/partnerAuth'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

/** Product names for registering prepared items the shop already holds. */
export async function GET(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const rows = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        selling_price: schema.products.selling_price
      })
      .from(schema.products)
      .orderBy(asc(schema.products.name))

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        wholesale_price: Number(row.selling_price)
      }))
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load products')
  }
}
