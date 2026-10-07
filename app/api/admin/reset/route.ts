import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '../../../../lib/auth'
import { db, schema } from '../../../../lib/db'
import { sql } from 'drizzle-orm'
import { databaseErrorResponse } from '../../../../lib/apiErrors'
import { ensureMarketplaceSchema } from '../../../../lib/ensureSchema'

async function deleteIfExists(tx: { execute: (query: ReturnType<typeof sql>) => Promise<unknown> }, table: string) {
  await tx.execute(sql.raw(`DELETE FROM ${table}`))
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (body?.confirm !== 'RESET ALL') {
      return NextResponse.json({ error: 'Type RESET ALL to confirm.' }, { status: 422 })
    }

    // Create marketplace tables if a deploy skipped migrate:orders — otherwise DELETE fails and nothing resets.
    await ensureMarketplaceSchema()

    await db.transaction(async (tx) => {
      await deleteIfExists(tx, 'market_order_items')
      await deleteIfExists(tx, 'market_orders')

      // Branch / wholesale activity tied to HQ stock
      await tx.execute(sql.raw(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_buy_order_items') THEN
            DELETE FROM partner_buy_order_items;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_buy_orders') THEN
            DELETE FROM partner_buy_orders;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_sales') THEN
            DELETE FROM partner_sales;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_expenses') THEN
            DELETE FROM partner_expenses;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_stock') THEN
            UPDATE partner_stock SET quantity_kg = 0, updated_at = NOW();
          END IF;
        END $$;
      `))

      await deleteIfExists(tx, 'credit_payments')
      await tx.execute(sql.raw(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_ledger_items') THEN
            DELETE FROM credit_ledger_items;
          END IF;
        END $$;
      `))
      await deleteIfExists(tx, 'credit_ledgers')
      await deleteIfExists(tx, 'liability_payments')
      await deleteIfExists(tx, 'liabilities')
      await deleteIfExists(tx, 'cash_entries')
      await deleteIfExists(tx, 'repayments')
      await deleteIfExists(tx, 'sales')
      await deleteIfExists(tx, 'production_batches')
      await deleteIfExists(tx, 'purchases')
      await deleteIfExists(tx, 'expenses')
      await tx.update(schema.products).set({ stock_quantity: 0 })
      await tx.update(schema.ingredients).set({ quantity: 0 })
    })

    return NextResponse.json({
      ok: true,
      message:
        'All sales, web orders, production, expenses, cash counts, debts, and stock quantities were reset to zero. Produce stock again before the public shop can take new orders.'
    })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not reset data')
  }
}
