import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'
import { creditLedgerCreateSchema } from '../../../lib/validators/credit'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: schema.credit_ledgers.id,
        customer_id: schema.credit_ledgers.customer_id,
        customer_name: schema.customers.name,
        title: schema.credit_ledgers.title,
        total_amount: schema.credit_ledgers.total_amount,
        amount_paid: schema.credit_ledgers.amount_paid,
        balance: schema.credit_ledgers.balance,
        credit_date: schema.credit_ledgers.credit_date,
        notes: schema.credit_ledgers.notes,
        created_at: schema.credit_ledgers.created_at
      })
      .from(schema.credit_ledgers)
      .leftJoin(schema.customers, eq(schema.credit_ledgers.customer_id, schema.customers.id))
      .orderBy(desc(schema.credit_ledgers.credit_date))

    return NextResponse.json(rows)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load credit ledger')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = creditLedgerCreateSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const creditDate = parseDate(parsed.data.creditDate)
    if (!creditDate) return NextResponse.json({ error: 'Invalid credit date.' }, { status: 422 })

    const amountPaid = parsed.data.amountPaid ?? 0
    if (amountPaid > parsed.data.totalAmount) {
      return NextResponse.json({ error: 'Amount paid cannot exceed total credit.' }, { status: 422 })
    }

    const [customer] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.id, parsed.data.customerId))
      .limit(1)

    if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

    const balance = parsed.data.totalAmount - amountPaid

    const [created] = await db
      .insert(schema.credit_ledgers)
      .values({
        customer_id: parsed.data.customerId,
        title: parsed.data.title,
        total_amount: parsed.data.totalAmount,
        amount_paid: amountPaid,
        balance,
        credit_date: creditDate,
        notes: parsed.data.notes
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record credit')
  }
}
