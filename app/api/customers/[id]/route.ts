import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { customerPatchSchema } from '../../../../lib/validators/customer'
import { eq } from 'drizzle-orm'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1)
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(customer)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await request.json()
  const parsed = customerPatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

  const [updated] = await db
    .update(schema.customers)
    .set(parsed.data)
    .where(eq(schema.customers.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  await db.delete(schema.customers).where(eq(schema.customers.id, id))

  return NextResponse.json({ ok: true })
}
