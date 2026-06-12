import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { customerCreateSchema } from '../../../lib/validators/customer'
import { desc, eq, sql } from 'drizzle-orm'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'

export async function GET() {
  try {
    const customers = await db
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        notes: schema.customers.notes,
        created_at: schema.customers.created_at,
        outstanding_balance: sql<number>`coalesce(sum(${schema.sales.balance}), 0)`
      })
      .from(schema.customers)
      .leftJoin(schema.sales, eq(schema.sales.customer_id, schema.customers.id))
      .groupBy(schema.customers.id)
      .orderBy(desc(schema.customers.created_at))

    return NextResponse.json(customers)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load customer accounts')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = customerCreateSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const [created] = await db.insert(schema.customers).values(parsed.data).returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not create customer account')
  }
}
