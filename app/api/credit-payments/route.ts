import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'
import { creditPaymentSchema } from '../../../lib/validators/credit'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  try {
    const payments = await db
      .select({
        id: schema.credit_payments.id,
        credit_id: schema.credit_payments.credit_id,
        customer_name: schema.customers.name,
        credit_title: schema.credit_ledgers.title,
        amount: schema.credit_payments.amount,
        payment_date: schema.credit_payments.payment_date,
        notes: schema.credit_payments.notes,
        created_at: schema.credit_payments.created_at
      })
      .from(schema.credit_payments)
      .leftJoin(schema.credit_ledgers, eq(schema.credit_payments.credit_id, schema.credit_ledgers.id))
      .leftJoin(schema.customers, eq(schema.credit_ledgers.customer_id, schema.customers.id))
      .orderBy(desc(schema.credit_payments.payment_date))

    return NextResponse.json(payments)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load credit payments')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = creditPaymentSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const paymentDate = parseDate(parsed.data.paymentDate)
    if (!paymentDate) return NextResponse.json({ error: 'Invalid payment date.' }, { status: 422 })

    const result = await db.transaction(async (tx) => {
      const [credit] = await tx
        .select()
        .from(schema.credit_ledgers)
        .where(eq(schema.credit_ledgers.id, parsed.data.creditId))
        .limit(1)

      if (!credit) return { error: 'Credit entry not found.', status: 404 as const }
      if (Number(credit.balance) <= 0) return { error: 'This credit is already fully paid.', status: 409 as const }
      if (parsed.data.amount > Number(credit.balance)) {
        return { error: 'Payment cannot exceed the remaining balance.', status: 422 as const }
      }

      const newBalance = Number(credit.balance) - parsed.data.amount
      const newPaid = Number(credit.amount_paid) + parsed.data.amount

      await tx
        .update(schema.credit_ledgers)
        .set({ balance: newBalance, amount_paid: newPaid })
        .where(eq(schema.credit_ledgers.id, parsed.data.creditId))

      const [created] = await tx
        .insert(schema.credit_payments)
        .values({
          credit_id: parsed.data.creditId,
          amount: parsed.data.amount,
          payment_date: paymentDate,
          notes: parsed.data.notes
        })
        .returning()

      return { created, balance_after: newBalance }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json({ ...result.created, balance_after: result.balance_after }, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record credit payment')
  }
}
