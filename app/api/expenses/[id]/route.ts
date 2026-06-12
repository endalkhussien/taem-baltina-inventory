import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { eq } from 'drizzle-orm'
import { expensePatchSchema } from '../../../../lib/validators/expense'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    const expense = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).limit(1)
    if (!expense[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(expense[0])
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load operating cost')
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = expensePatchSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const updateData: any = {}
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

    const [updated] = await db.update(schema.expenses).set(updateData).where(eq(schema.expenses.id, id)).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not update operating cost')
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete operating cost')
  }
}
