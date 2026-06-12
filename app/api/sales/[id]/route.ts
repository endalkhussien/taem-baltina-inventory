import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { eq, sql } from 'drizzle-orm'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    const sale = await db.select().from(schema.sales).where(eq(schema.sales.id, id)).limit(1)
    if (!sale[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(sale[0])
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load sale')
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const deleted = await db.transaction(async (tx) => {
      const [sale] = await tx.select().from(schema.sales).where(eq(schema.sales.id, id)).limit(1)
      if (!sale) return false

      await tx.delete(schema.sales).where(eq(schema.sales.id, id))
      await tx
        .update(schema.products)
        .set({ stock_quantity: sql`${schema.products.stock_quantity} + ${sale.quantity}` })
        .where(eq(schema.products.id, sale.product_id))

      return true
    })

    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete sale')
  }
}
