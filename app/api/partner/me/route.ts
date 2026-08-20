import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { requirePartner } from '../../../../lib/partnerAuth'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

export async function GET(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const [shop] = await db
      .select({
        id: schema.partner_shops.id,
        shop_name: schema.partner_shops.shop_name,
        owner_name: schema.partner_shops.owner_name,
        phone: schema.partner_shops.phone,
        city: schema.partner_shops.city,
        address: schema.partner_shops.address,
        status: schema.partner_shops.status
      })
      .from(schema.partner_shops)
      .where(eq(schema.partner_shops.id, auth.session.shopId))
      .limit(1)

    if (!shop) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })
    return NextResponse.json(shop)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load shop')
  }
}
