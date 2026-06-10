import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { saleCreateSchema } from '../../../lib/validators/sale'
import { eq } from 'drizzle-orm'

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
    const balance = totalAmount - amountPaid
    const paymentStatus = balance === 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Credit'

    const saleCode = `S-${Date.now()}`

    const [created] = await db
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
      } as any)
      .returning()

    await db.update(schema.products).set({ stock_quantity: null as any }).where(eq(schema.products.id, productId))

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
