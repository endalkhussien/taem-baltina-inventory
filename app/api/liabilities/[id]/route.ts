import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    await db.delete(schema.liabilities).where(eq(schema.liabilities.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete liability')
  }
}
