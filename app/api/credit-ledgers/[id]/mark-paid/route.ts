import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../../../lib/db'
import { databaseErrorResponse } from '../../../../../lib/apiErrors'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const result = await db.transaction(async (tx) => {
      const [credit] = await tx
        .select()
        .from(schema.credit_ledgers)
        .where(eq(schema.credit_ledgers.id, id))
        .limit(1)

      if (!credit) return { error: 'Credit entry not found.', status: 404 as const }

      const remaining = Number(credit.balance)
      if (remaining <= 0) return { error: 'This credit is already marked paid.', status: 409 as const }

      const newPaid = Number(credit.amount_paid) + remaining

      await tx
        .update(schema.credit_ledgers)
        .set({ balance: 0, amount_paid: newPaid })
        .where(eq(schema.credit_ledgers.id, id))

      const [payment] = await tx
        .insert(schema.credit_payments)
        .values({
          credit_id: id,
          amount: remaining,
          notes: 'Marked paid'
        })
        .returning()

      return { credit_id: id, balance_after: 0, payment }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(result)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not mark credit as paid')
  }
}
