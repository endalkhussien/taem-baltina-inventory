import { NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse } from '../../../lib/apiErrors'

export async function GET() {
  try {
    const orders = await db
      .select({
        id: schema.partner_buy_orders.id,
        shop_id: schema.partner_buy_orders.shop_id,
        order_code: schema.partner_buy_orders.order_code,
        status: schema.partner_buy_orders.status,
        total_amount: schema.partner_buy_orders.total_amount,
        notes: schema.partner_buy_orders.notes,
        created_at: schema.partner_buy_orders.created_at,
        shop_name: schema.partner_shops.shop_name,
        owner_name: schema.partner_shops.owner_name,
        phone: schema.partner_shops.phone,
        city: schema.partner_shops.city
      })
      .from(schema.partner_buy_orders)
      .innerJoin(schema.partner_shops, eq(schema.partner_shops.id, schema.partner_buy_orders.shop_id))
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
    return databaseErrorResponse(err, 'Could not load wholesale orders')
  }
}
