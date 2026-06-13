import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'
import { cashEntrySchema } from '../../../lib/validators/finance'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  try {
    const entries = await db
      .select()
      .from(schema.cash_entries)
      .orderBy(desc(schema.cash_entries.entry_date))

    return NextResponse.json(entries)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load cash entries')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = cashEntrySchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const entryDate = parseDate(parsed.data.entryDate)
    if (!entryDate) return NextResponse.json({ error: 'Invalid entry date.' }, { status: 422 })

    const [created] = await db
      .insert(schema.cash_entries)
      .values({
        amount: parsed.data.amount,
        notes: parsed.data.notes,
        entry_date: entryDate
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record cash on hand')
  }
}
