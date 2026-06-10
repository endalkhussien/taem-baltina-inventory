import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { saleCreateSchema } from '../../../lib/validators/sale'
import { and, eq, gte, sql } from 'drizzle-orm'

export async function GET() {
  const sales = await db.select().from(schema.sales)
  return NextResponse.json(sales)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = saleCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { productId, quantity, unitPrice, amountPaid = 0 } = parsed.data

    const totalAmount = quantity * unitPrice
    if (amountPaid > totalAmount) {
      return NextResponse.json({ error: 'Amount paid cannot exceed the sale total.' }, { status: 422 })
    }

    const balance = totalAmount - amountPaid
    const paymentStatus = balance === 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Credit'

    const saleCode = `S-${Date.now()}`

    const result = await db.transaction(async (tx) => {
      const [updatedProduct] = await tx
        .update(schema.products)
        .set({ stock_quantity: sql`${schema.products.stock_quantity} - ${quantity}` })
        .where(and(eq(schema.products.id, productId), gte(schema.products.stock_quantity, quantity)))
        .returning({ id: schema.products.id })

      if (!updatedProduct) {
        const [product] = await tx.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.id, productId)).limit(1)

        return product
          ? { error: 'Insufficient stock for this sale.', status: 409 as const }
          : { error: 'Product not found.', status: 404 as const }
      }

      const [created] = await tx
        .insert(schema.sales)
        .values({
          sale_code: saleCode,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          balance,
          payment_status: paymentStatus
        })
        .returning()

      return { created }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(result.created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
