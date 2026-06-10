import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { repaymentSchema } from '../../../lib/validators/sale'
import { eq } from 'drizzle-orm'

export async function GET() {
  const repayments = await db.select().from(schema.repayments)
  return NextResponse.json(repayments)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = repaymentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { saleId, amount } = parsed.data

    const [sale] = await db.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1)
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

    const newBalance = Math.max(0, sale.balance - amount)
    const newPaid = sale.amount_paid + amount
    const newStatus = newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Credit'

    await db.update(schema.sales).set({ balance: newBalance, amount_paid: newPaid, payment_status: newStatus }).where(eq(schema.sales.id, saleId))

    const [created] = await db.insert(schema.repayments).values({ sale_id: saleId, amount }).returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
