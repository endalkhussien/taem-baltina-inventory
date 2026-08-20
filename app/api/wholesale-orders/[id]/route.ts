import { NextResponse } from 'next/server'
import { and, eq, gte, sql } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { partnerBuyStatusSchema } from '../../../../lib/validators/partner'
import { addPartnerStock } from '../../../../lib/partnerStock'
import { computeSaleTotals } from '../../../../lib/sales'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid order.' }, { status: 400 })

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = partnerBuyStatusSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid status.' }, { status: 422 })

    const nextStatus = parsed.data.status

    const outcome = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(schema.partner_buy_orders)
        .where(eq(schema.partner_buy_orders.id, id))
        .limit(1)

      if (!order) return { error: 'Order not found.', status: 404 as const }
      if (order.status === 'cancelled') {
        return { error: 'Cancelled wholesale orders cannot be updated.', status: 409 as const }
      }
      if (order.status === 'fulfilled' && nextStatus !== 'fulfilled') {
        return { error: 'Fulfilled wholesale orders are final.', status: 409 as const }
      }

      if (nextStatus === 'fulfilled' && order.status !== 'fulfilled') {
        const items = await tx
          .select()
          .from(schema.partner_buy_order_items)
          .where(eq(schema.partner_buy_order_items.order_id, id))

        for (const item of items) {
          const qty = Number(item.quantity_kg)
          const [product] = await tx
            .select({
              id: schema.products.id,
              name: schema.products.name,
              stock_quantity: schema.products.stock_quantity
            })
            .from(schema.products)
            .where(eq(schema.products.id, item.product_id))
            .limit(1)

          if (!product) {
            return { error: `Product missing for ${item.product_name}.`, status: 404 as const }
          }

          if (Number(product.stock_quantity) < qty) {
            return {
              error: `Not enough warehouse stock for ${product.name} (need ${qty} kg, have ${product.stock_quantity} kg).`,
              status: 409 as const
            }
          }

          const [updated] = await tx
            .update(schema.products)
            .set({ stock_quantity: sql`${schema.products.stock_quantity} - ${qty}` })
            .where(and(eq(schema.products.id, product.id), gte(schema.products.stock_quantity, qty)))
            .returning({ id: schema.products.id })

          if (!updated) {
            return { error: `Could not reserve warehouse stock for ${product.name}.`, status: 409 as const }
          }

          await addPartnerStock(tx, order.shop_id, product.id, qty, Number(item.unit_price))

          const unitPrice = Number(item.unit_price)
          const totals = computeSaleTotals(qty, unitPrice, qty * unitPrice)
          await tx.insert(schema.sales).values({
            sale_code: `WHL-${order.order_code}-${item.id}`,
            product_id: product.id,
            customer_id: null,
            quantity: qty,
            unit_price: unitPrice,
            total_amount: totals.total,
            amount_paid: totals.paid,
            balance: totals.balance,
            payment_status: totals.status,
            sale_date: new Date()
          })
        }
      }

      const [updatedOrder] = await tx
        .update(schema.partner_buy_orders)
        .set({ status: nextStatus, updated_at: new Date() })
        .where(eq(schema.partner_buy_orders.id, id))
        .returning()

      return { order: updatedOrder }
    })

    if ('error' in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status })
    }

    return NextResponse.json(outcome.order)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not update wholesale order')
  }
}
