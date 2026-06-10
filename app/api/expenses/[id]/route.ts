import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { eq } from 'drizzle-orm'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const expense = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).limit(1)
  if (!expense[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(expense[0])
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await request.json()
  const updateData: any = {}
  if (body.title !== undefined) updateData.title = body.title
  if (body.category !== undefined) updateData.category = body.category
  if (body.amount !== undefined) updateData.amount = body.amount
  if (body.notes !== undefined) updateData.notes = body.notes

  const [updated] = await db.update(schema.expenses).set(updateData).where(eq(schema.expenses.id, id)).returning()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  await db.delete(schema.expenses).where(eq(schema.expenses.id, id))
  return NextResponse.json({ ok: true })
}
