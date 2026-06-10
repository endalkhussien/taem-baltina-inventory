import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { repaymentSchema } from '../../../lib/validators/sale'
import { desc, eq } from 'drizzle-orm'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  const repayments = await db
    .select({
      id: schema.repayments.id,
      sale_id: schema.repayments.sale_id,
      sale_code: schema.sales.sale_code,
      amount: schema.repayments.amount,
      payment_date: schema.repayments.payment_date,
      created_at: schema.repayments.created_at
    })
    .from(schema.repayments)
    .leftJoin(schema.sales, eq(schema.repayments.sale_id, schema.sales.id))
    .orderBy(desc(schema.repayments.payment_date))

  return NextResponse.json(repayments)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = repaymentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { saleId, amount, paymentDate } = parsed.data
    const parsedPaymentDate = parseDate(paymentDate)
    if (!parsedPaymentDate) return NextResponse.json({ error: 'Invalid payment date.' }, { status: 422 })

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1)
      if (!sale) return { error: 'Sale not found.', status: 404 as const }
      if (Number(sale.balance) <= 0) return { error: 'This sale is already fully paid.', status: 409 as const }
      if (amount > Number(sale.balance)) {
        return { error: 'Payment cannot exceed the remaining sale balance.', status: 422 as const }
      }

      const newBalance = Number(sale.balance) - amount
      const newPaid = Number(sale.amount_paid) + amount
      const newStatus = newBalance === 0 ? 'Paid' : 'Partial'

      await tx
        .update(schema.sales)
        .set({ balance: newBalance, amount_paid: newPaid, payment_status: newStatus })
        .where(eq(schema.sales.id, saleId))

      const [created] = await tx
        .insert(schema.repayments)
        .values({ sale_id: saleId, amount, payment_date: parsedPaymentDate })
        .returning()

      return { created }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(result.created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
