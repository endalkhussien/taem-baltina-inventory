import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { expenseCreateSchema } from '../../../lib/validators/expense'

export async function GET() {
  const expenses = await db.select().from(schema.expenses)
  return NextResponse.json(expenses)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = expenseCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { title, category, amount, notes } = parsed.data

    const [created] = await db.insert(schema.expenses).values({ title, category, amount, notes } as any).returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
