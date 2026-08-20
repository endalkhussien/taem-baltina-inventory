import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse } from '../../../lib/apiErrors'

export async function GET() {
  try {
    const shops = await db
      .select({
        id: schema.partner_shops.id,
        shop_name: schema.partner_shops.shop_name,
        owner_name: schema.partner_shops.owner_name,
        phone: schema.partner_shops.phone,
        city: schema.partner_shops.city,
        address: schema.partner_shops.address,
        status: schema.partner_shops.status,
        created_at: schema.partner_shops.created_at
      })
      .from(schema.partner_shops)
      .orderBy(desc(schema.partner_shops.created_at))

    return NextResponse.json(shops)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load branch shops')
  }
}
