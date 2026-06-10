import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { eq } from 'drizzle-orm'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const sale = await db.select().from(schema.sales).where(eq(schema.sales.id, id)).limit(1)
  if (!sale[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(sale[0])
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  await db.delete(schema.sales).where(eq(schema.sales.id, id))
  return NextResponse.json({ ok: true })
}
