import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { requirePartner } from '../../../../lib/partnerAuth'
import { deductPartnerStock } from '../../../../lib/partnerStock'
import { partnerSaleSchema } from '../../../../lib/validators/partner'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

function saleCode(shopId: number) {
  return `PS-${shopId}-${Date.now().toString(36).toUpperCase()}`
}

export async function GET(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const rows = await db
      .select()
      .from(schema.partner_sales)
      .where(eq(schema.partner_sales.shop_id, auth.session.shopId))
      .orderBy(desc(schema.partner_sales.sale_date))

    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        quantity_kg: Number(row.quantity_kg),
        unit_price: Number(row.unit_price),
        total_amount: Number(row.total_amount),
        amount_paid: Number(row.amount_paid)
      }))
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load sales')
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = partnerSaleSchema.safeParse(body.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter product, kilograms, price, and amount paid.' }, { status: 422 })
    }

    const outcome = await db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: schema.products.id, name: schema.products.name })
        .from(schema.products)
        .where(eq(schema.products.id, parsed.data.product_id))
        .limit(1)

      if (!product) return { error: 'Unknown product.', status: 404 as const }

      const deducted = await deductPartnerStock(tx, auth.session!.shopId, product.id, parsed.data.quantity_kg)
      if (!deducted.ok) {
        return {
          error: `Not enough shop stock for ${product.name} (have ${deducted.available} kg).`,
          status: 409 as const
        }
      }

      const total = Math.round(parsed.data.quantity_kg * parsed.data.unit_price * 100) / 100
      const paid = Math.min(total, Math.round(parsed.data.amount_paid * 100) / 100)

      const [sale] = await tx
        .insert(schema.partner_sales)
        .values({
          shop_id: auth.session!.shopId,
          sale_code: saleCode(auth.session!.shopId),
          product_id: product.id,
          product_name: product.name,
          quantity_kg: parsed.data.quantity_kg,
          unit_price: parsed.data.unit_price,
          total_amount: total,
          amount_paid: paid,
          customer_name: parsed.data.customer_name || null,
          sale_date: new Date()
        })
        .returning()

      return { sale }
    })

    if ('error' in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status })
    }

    return NextResponse.json(outcome.sale, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record sale')
  }
}
