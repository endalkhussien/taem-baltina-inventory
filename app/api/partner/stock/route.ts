import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { requirePartner } from '../../../../lib/partnerAuth'
import { addPartnerStock } from '../../../../lib/partnerStock'
import { partnerStockRegisterSchema } from '../../../../lib/validators/partner'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function GET(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const rows = await db
      .select({
        id: schema.partner_stock.id,
        product_id: schema.partner_stock.product_id,
        quantity_kg: schema.partner_stock.quantity_kg,
        avg_cost: schema.partner_stock.avg_cost,
        product_name: schema.products.name,
        suggested_price: schema.products.selling_price
      })
      .from(schema.partner_stock)
      .innerJoin(schema.products, eq(schema.products.id, schema.partner_stock.product_id))
      .where(eq(schema.partner_stock.shop_id, auth.session.shopId))
      .orderBy(desc(schema.partner_stock.updated_at))

    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        quantity_kg: Number(row.quantity_kg),
        avg_cost: Number(row.avg_cost),
        suggested_price: Number(row.suggested_price),
        value: Math.round(Number(row.quantity_kg) * Number(row.avg_cost) * 100) / 100
      }))
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load stock')
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = partnerStockRegisterSchema.safeParse(body.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter a product, kilograms, and cost.' }, { status: 422 })
    }

    const [product] = await db
      .select({ id: schema.products.id, name: schema.products.name })
      .from(schema.products)
      .where(eq(schema.products.id, parsed.data.product_id))
      .limit(1)

    if (!product) return NextResponse.json({ error: 'Unknown product.' }, { status: 404 })

    await db.transaction(async (tx) => {
      await addPartnerStock(
        tx,
        auth.session!.shopId,
        product.id,
        parsed.data.quantity_kg,
        parsed.data.unit_cost
      )
    })

    return NextResponse.json({ ok: true, product_name: product.name })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not register stock')
  }
}
