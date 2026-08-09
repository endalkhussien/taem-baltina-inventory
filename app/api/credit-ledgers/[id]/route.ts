import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const [deleted] = await db.delete(schema.credit_ledgers).where(eq(schema.credit_ledgers.id, id)).returning()
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete credit entry')
  }
}
