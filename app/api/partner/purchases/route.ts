import { NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { requirePartner } from '../../../../lib/partnerAuth'
import { partnerBuySchema } from '../../../../lib/validators/partner'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

function orderCode() {
  return `PB-${Date.now().toString(36).toUpperCase()}`
}

export async function GET(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const orders = await db
      .select()
      .from(schema.partner_buy_orders)
      .where(eq(schema.partner_buy_orders.shop_id, auth.session.shopId))
      .orderBy(desc(schema.partner_buy_orders.created_at))

    if (orders.length === 0) return NextResponse.json([])

    const items = await db
      .select()
      .from(schema.partner_buy_order_items)
      .where(inArray(schema.partner_buy_order_items.order_id, orders.map((o) => o.id)))

    const byOrder = new Map<number, typeof items>()
    for (const item of items) {
      const list = byOrder.get(item.order_id) ?? []
      list.push(item)
      byOrder.set(item.order_id, list)
    }

    return NextResponse.json(
      orders.map((order) => ({
        ...order,
        total_amount: Number(order.total_amount),
        items: (byOrder.get(order.id) ?? []).map((item) => ({
          ...item,
          quantity_kg: Number(item.quantity_kg),
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total)
        }))
      }))
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load purchases')
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = partnerBuySchema.safeParse(body.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Add at least one product to buy.' }, { status: 422 })
    }

    const outcome = await db.transaction(async (tx) => {
      const lines: {
        product_id: number
        product_name: string
        quantity_kg: number
        unit_price: number
        line_total: number
      }[] = []

      for (const item of parsed.data.items) {
        const [product] = await tx
          .select({
            id: schema.products.id,
            name: schema.products.name,
            selling_price: schema.products.selling_price,
            stock_quantity: schema.products.stock_quantity
          })
          .from(schema.products)
          .where(eq(schema.products.id, item.product_id))
          .limit(1)

        if (!product) return { error: 'A product in the order is missing.', status: 404 as const }
        if (Number(product.stock_quantity) <= 0) {
          return { error: `${product.name} is not available from the wholesaler right now.`, status: 409 as const }
        }

        const unit = Number(product.selling_price)
        const qty = item.quantity_kg
        lines.push({
          product_id: product.id,
          product_name: product.name,
          quantity_kg: qty,
          unit_price: unit,
          line_total: Math.round(qty * unit * 100) / 100
        })
      }

      const total = Math.round(lines.reduce((sum, line) => sum + line.line_total, 0) * 100) / 100
      const [order] = await tx
        .insert(schema.partner_buy_orders)
        .values({
          shop_id: auth.session!.shopId,
          order_code: orderCode(),
          status: 'pending',
          total_amount: total,
          notes: parsed.data.notes || null
        })
        .returning()

      await tx.insert(schema.partner_buy_order_items).values(
        lines.map((line) => ({
          order_id: order.id,
          ...line
        }))
      )

      return { order: { ...order, items: lines, total_amount: total } }
    })

    if ('error' in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status })
    }

    return NextResponse.json(outcome.order, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not place wholesale order')
  }
}
