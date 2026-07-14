import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { customerPatchSchema } from '../../../../lib/validators/customer'
import { eq, sql } from 'drizzle-orm'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1)
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(customer)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load customer account')
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = customerPatchSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name.trim()
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone.trim() || null
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes.trim() || null

    const [updated] = await db
      .update(schema.customers)
      .set(updateData)
      .where(eq(schema.customers.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(updated)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not update customer account')
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const [credit] = await db
      .select({ balance: sql<number>`coalesce(sum(${schema.sales.balance}), 0)` })
      .from(schema.sales)
      .where(eq(schema.sales.customer_id, id))

    if (Number(credit?.balance ?? 0) > 0) {
      return NextResponse.json({ error: 'Cannot delete a customer account with outstanding credit. Record repayments first.' }, { status: 409 })
    }

    let ledgerBalance = 0
    try {
      const [ledger] = await db
        .select({ balance: sql<number>`coalesce(sum(${schema.credit_ledgers.balance}), 0)` })
        .from(schema.credit_ledgers)
        .where(eq(schema.credit_ledgers.customer_id, id))

      ledgerBalance = Number(ledger?.balance ?? 0)
    } catch {
      // credit ledger table may not exist yet on older databases
    }

    if (ledgerBalance > 0) {
      return NextResponse.json({ error: 'Cannot delete a customer with open credit ledger balance. Record payments first.' }, { status: 409 })
    }

    await db.delete(schema.customers).where(eq(schema.customers.id, id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete customer account')
  }
}
