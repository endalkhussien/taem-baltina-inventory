import { NextResponse } from 'next/server'
import { and, eq, gte, sql } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { marketOrderStatusSchema } from '../../../../lib/validators/order'
import { computeSaleTotals } from '../../../../lib/sales'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid order.' }, { status: 400 })

    const [order] = await db.select().from(schema.market_orders).where(eq(schema.market_orders.id, id)).limit(1)
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    const items = await db
      .select()
      .from(schema.market_order_items)
      .where(eq(schema.market_order_items.order_id, id))

    return NextResponse.json({ ...order, items })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load order')
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid order.' }, { status: 400 })

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = marketOrderStatusSchema.safeParse(body.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 422 })
    }

    const nextStatus = parsed.data.status

    const outcome = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(schema.market_orders)
        .where(eq(schema.market_orders.id, id))
        .limit(1)

      if (!order) return { error: 'Order not found.', status: 404 as const }

      if (order.status === 'cancelled') {
        return { error: 'Cancelled orders cannot be updated.', status: 409 as const }
      }

      if (order.status === 'fulfilled' && nextStatus !== 'fulfilled') {
        return { error: 'Fulfilled orders are final.', status: 409 as const }
      }

      // Fulfill: deduct stock and create walk-in/customer sales (paid in full for prepaid; COD still create sale as paid when delivered)
      if (nextStatus === 'fulfilled' && order.status !== 'fulfilled') {
        const items = await tx
          .select()
          .from(schema.market_order_items)
          .where(eq(schema.market_order_items.order_id, id))

        for (const item of items) {
          const qty = Number(item.quantity_kg)
          const [product] = await tx
            .select({
              id: schema.products.id,
              name: schema.products.name,
              stock_quantity: schema.products.stock_quantity,
              selling_price: schema.products.selling_price
            })
            .from(schema.products)
            .where(eq(schema.products.id, item.product_id))
            .limit(1)

          if (!product) {
            return { error: `Product missing for line ${item.product_name}.`, status: 404 as const }
          }

          if (Number(product.stock_quantity) < qty) {
            return {
              error: `Not enough stock for ${product.name} to fulfill (need ${qty} kg, have ${product.stock_quantity} kg).`,
              status: 409 as const
            }
          }

          const [updated] = await tx
            .update(schema.products)
            .set({ stock_quantity: sql`${schema.products.stock_quantity} - ${qty}` })
            .where(and(eq(schema.products.id, product.id), gte(schema.products.stock_quantity, qty)))
            .returning({ id: schema.products.id })

          if (!updated) {
            return {
              error: `Could not reserve stock for ${product.name}. Try again.`,
              status: 409 as const
            }
          }

          const unitPrice = Number(item.unit_price)
          const totals = computeSaleTotals(qty, unitPrice, qty * unitPrice)
          const saleCode = `WEB-${order.order_code}-${item.id}`

          await tx.insert(schema.sales).values({
            sale_code: saleCode,
            product_id: product.id,
            customer_id: order.customer_id,
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
        .update(schema.market_orders)
        .set({ status: nextStatus, updated_at: new Date() })
        .where(eq(schema.market_orders.id, id))
        .returning()

      return { order: updatedOrder }
    })

    if ('error' in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status })
    }

    return NextResponse.json(outcome.order)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not update order')
  }
}
