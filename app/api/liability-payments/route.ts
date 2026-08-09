import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'
import { liabilityPaymentSchema } from '../../../lib/validators/finance'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  try {
    const payments = await db
      .select({
        id: schema.liability_payments.id,
        liability_id: schema.liability_payments.liability_id,
        creditor_name: schema.liabilities.creditor_name,
        title: schema.liabilities.title,
        amount: schema.liability_payments.amount,
        payment_date: schema.liability_payments.payment_date,
        notes: schema.liability_payments.notes,
        created_at: schema.liability_payments.created_at
      })
      .from(schema.liability_payments)
      .leftJoin(schema.liabilities, eq(schema.liability_payments.liability_id, schema.liabilities.id))
      .orderBy(desc(schema.liability_payments.payment_date))

    return NextResponse.json(payments)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load liability payments')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = liabilityPaymentSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const paymentDate = parseDate(parsed.data.paymentDate)
    if (!paymentDate) return NextResponse.json({ error: 'Invalid payment date.' }, { status: 422 })

    const result = await db.transaction(async (tx) => {
      const [liability] = await tx
        .select()
        .from(schema.liabilities)
        .where(eq(schema.liabilities.id, parsed.data.liabilityId))
        .limit(1)

      if (!liability) return { error: 'Liability not found.', status: 404 as const }
      if (Number(liability.balance) <= 0) return { error: 'This debt is already fully paid.', status: 409 as const }
      if (parsed.data.amount > Number(liability.balance)) {
        return { error: 'Payment cannot exceed the remaining balance.', status: 422 as const }
      }

      const newBalance = Number(liability.balance) - parsed.data.amount
      const newPaid = Number(liability.amount_paid) + parsed.data.amount

      await tx
        .update(schema.liabilities)
        .set({ balance: newBalance, amount_paid: newPaid })
        .where(eq(schema.liabilities.id, parsed.data.liabilityId))

      const [created] = await tx
        .insert(schema.liability_payments)
        .values({
          liability_id: parsed.data.liabilityId,
          amount: parsed.data.amount,
          payment_date: paymentDate,
          notes: parsed.data.notes
        })
        .returning()

      return { created }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(result.created, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record liability payment')
  }
}
