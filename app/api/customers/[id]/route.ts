import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { customerPatchSchema } from '../../../../lib/validators/customer'
import { eq, sql } from 'drizzle-orm'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

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
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await request.json()
  const parsed = customerPatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

  try {
    const [updated] = await db
      .update(schema.customers)
      .set(parsed.data)
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

    await db.delete(schema.customers).where(eq(schema.customers.id, id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete customer account')
  }
}
