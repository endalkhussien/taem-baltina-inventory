import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { partnerShopStatusSchema } from '../../../../lib/validators/partner'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid shop.' }, { status: 400 })

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = partnerShopStatusSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid status.' }, { status: 422 })

    const [updated] = await db
      .update(schema.partner_shops)
      .set({ status: parsed.data.status, updated_at: new Date() })
      .where(eq(schema.partner_shops.id, id))
      .returning({
        id: schema.partner_shops.id,
        shop_name: schema.partner_shops.shop_name,
        status: schema.partner_shops.status
      })

    if (!updated) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not update shop')
  }
}
