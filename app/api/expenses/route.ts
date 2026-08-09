import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { expenseCreateSchema } from '../../../lib/validators/expense'
import { databaseErrorResponse } from '../../../lib/apiErrors'

export async function GET() {
  try {
    const expenses = await db.select().from(schema.expenses)
    return NextResponse.json(expenses)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load operating costs')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = expenseCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { title, category, amount, expenseDate, notes } = parsed.data

    const [created] = await db.insert(schema.expenses).values({
      title,
      category,
      amount,
      notes,
      expense_date: expenseDate ? new Date(expenseDate) : new Date()
    } as any).returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record operating cost')
  }
}
