import { NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse } from '../../../lib/apiErrors'

export async function GET() {
  try {
    const orders = await db
      .select()
      .from(schema.market_orders)
      .orderBy(desc(schema.market_orders.created_at))

    if (orders.length === 0) return NextResponse.json([])

    const orderIds = orders.map((o) => o.id)
    const items = await db
      .select()
      .from(schema.market_order_items)
      .where(inArray(schema.market_order_items.order_id, orderIds))

    const byOrder = new Map<number, typeof items>()
    for (const item of items) {
      const list = byOrder.get(item.order_id) ?? []
      list.push(item)
      byOrder.set(item.order_id, list)
    }

    return NextResponse.json(
      orders.map((order) => ({
        ...order,
        items: byOrder.get(order.id) ?? []
      }))
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load marketplace orders')
  }
}
