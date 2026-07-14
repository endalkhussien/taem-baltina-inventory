import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '../../../../lib/auth'
import { db, schema } from '../../../../lib/db'
import { sql } from 'drizzle-orm'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (body?.confirm !== 'RESET ALL') {
      return NextResponse.json({ error: 'Type RESET ALL to confirm.' }, { status: 422 })
    }

    await db.transaction(async (tx) => {
      await tx.execute(sql`DELETE FROM credit_payments`)
      await tx.execute(sql`DELETE FROM credit_ledgers`)
      await tx.execute(sql`DELETE FROM liability_payments`)
      await tx.execute(sql`DELETE FROM liabilities`)
      await tx.execute(sql`DELETE FROM cash_entries`)
      await tx.execute(sql`DELETE FROM repayments`)
      await tx.execute(sql`DELETE FROM sales`)
      await tx.execute(sql`DELETE FROM production_batches`)
      await tx.execute(sql`DELETE FROM purchases`)
      await tx.execute(sql`DELETE FROM expenses`)
      await tx.update(schema.products).set({ stock_quantity: 0 })
      await tx.update(schema.ingredients).set({ quantity: 0 })
    })

    return NextResponse.json({
      ok: true,
      message: 'All sales, production, expenses, cash counts, debts, and stock quantities were reset to zero.'
    })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not reset data')
  }
}
