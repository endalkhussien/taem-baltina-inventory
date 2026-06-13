import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'
import { liabilityCreateSchema } from '../../../lib/validators/finance'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(schema.liabilities)
      .orderBy(desc(schema.liabilities.liability_date))

    return NextResponse.json(rows)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load liabilities')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = liabilityCreateSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const liabilityDate = parseDate(parsed.data.liabilityDate)
    if (!liabilityDate) return NextResponse.json({ error: 'Invalid liability date.' }, { status: 422 })

    const amountPaid = parsed.data.amountPaid ?? 0
    if (amountPaid > parsed.data.totalAmount) {
      return NextResponse.json({ error: 'Amount paid cannot exceed total debt.' }, { status: 422 })
    }

    const balance = parsed.data.totalAmount - amountPaid

    const [created] = await db
      .insert(schema.liabilities)
      .values({
        creditor_name: parsed.data.creditorName,
        category: parsed.data.category,
        title: parsed.data.title,
        total_amount: parsed.data.totalAmount,
        amount_paid: amountPaid,
        balance,
        liability_date: liabilityDate,
        notes: parsed.data.notes
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record liability')
  }
}
