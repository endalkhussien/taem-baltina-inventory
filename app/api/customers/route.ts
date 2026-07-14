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

    const ledgerTotals = await db
      .select({
        customer_id: schema.credit_ledgers.customer_id,
        ledger_balance: sql<number>`coalesce(sum(${schema.credit_ledgers.balance}), 0)`
      })
      .from(schema.credit_ledgers)
      .groupBy(schema.credit_ledgers.customer_id)

    const ledgerByCustomer = new Map(ledgerTotals.map((row) => [row.customer_id, Number(row.ledger_balance)]))

    return NextResponse.json(
      customers.map((customer) => {
        const ledger_balance = ledgerByCustomer.get(customer.id) ?? 0
        const sales_balance = Number(customer.outstanding_balance)
        return {
          ...customer,
          ledger_balance,
          outstanding_balance: sales_balance,
          total_credit: sales_balance + ledger_balance
        }
      })
    )
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
