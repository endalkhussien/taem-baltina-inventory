import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { customerCreateSchema } from '../../../lib/validators/customer'
import { desc, sql } from 'drizzle-orm'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'

function enrichCustomer(
  customer: typeof schema.customers.$inferSelect,
  salesTotals: Map<number, { outstanding_balance: number; total_sales: number }>,
  ledgerByCustomer: Map<number, number>
) {
  const sales = salesTotals.get(customer.id) ?? { outstanding_balance: 0, total_sales: 0 }
  const ledger_balance = ledgerByCustomer.get(customer.id) ?? 0
  const sales_balance = sales.outstanding_balance

  return {
    ...customer,
    outstanding_balance: sales_balance,
    total_sales: sales.total_sales,
    ledger_balance,
    total_credit: sales_balance + ledger_balance
  }
}

export async function GET() {
  try {
    const baseCustomers = await db
      .select()
      .from(schema.customers)
      .orderBy(desc(schema.customers.created_at))

    const salesTotals = new Map<number, { outstanding_balance: number; total_sales: number }>()

    try {
      const salesRows = await db
        .select({
          customer_id: schema.sales.customer_id,
          outstanding_balance: sql<number>`coalesce(sum(${schema.sales.balance}), 0)`,
          total_sales: sql<number>`coalesce(sum(${schema.sales.total_amount}), 0)`
        })
        .from(schema.sales)
        .groupBy(schema.sales.customer_id)

      for (const row of salesRows) {
        if (row.customer_id) {
          salesTotals.set(row.customer_id, {
            outstanding_balance: Number(row.outstanding_balance),
            total_sales: Number(row.total_sales)
          })
        }
      }
    } catch (err) {
      console.error('Could not load sales totals for customers', err)
    }

    const ledgerByCustomer = new Map<number, number>()

    try {
      const ledgerRows = await db
        .select({
          customer_id: schema.credit_ledgers.customer_id,
          ledger_balance: sql<number>`coalesce(sum(${schema.credit_ledgers.balance}), 0)`
        })
        .from(schema.credit_ledgers)
        .groupBy(schema.credit_ledgers.customer_id)

      for (const row of ledgerRows) {
        ledgerByCustomer.set(row.customer_id, Number(row.ledger_balance))
      }
    } catch (err) {
      console.error('Could not load credit ledger totals for customers', err)
    }

    return NextResponse.json(baseCustomers.map((customer) => enrichCustomer(customer, salesTotals, ledgerByCustomer)))
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

    const payload = {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone?.trim() || null,
      notes: parsed.data.notes?.trim() || null
    }

    const [created] = await db.insert(schema.customers).values(payload).returning()

    return NextResponse.json(
      {
        ...created,
        outstanding_balance: 0,
        total_sales: 0,
        ledger_balance: 0,
        total_credit: 0
      },
      { status: 201 }
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not create customer account')
  }
}
