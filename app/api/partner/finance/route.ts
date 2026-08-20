import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { requirePartner } from '../../../../lib/partnerAuth'
import { partnerExpenseSchema } from '../../../../lib/validators/partner'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function GET(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const shopId = auth.session.shopId

    const [stockRows, sales, expenses, purchases] = await Promise.all([
      db
        .select({
          quantity_kg: schema.partner_stock.quantity_kg,
          avg_cost: schema.partner_stock.avg_cost
        })
        .from(schema.partner_stock)
        .where(eq(schema.partner_stock.shop_id, shopId)),
      db
        .select()
        .from(schema.partner_sales)
        .where(eq(schema.partner_sales.shop_id, shopId))
        .orderBy(desc(schema.partner_sales.sale_date)),
      db
        .select()
        .from(schema.partner_expenses)
        .where(eq(schema.partner_expenses.shop_id, shopId))
        .orderBy(desc(schema.partner_expenses.expense_date)),
      db
        .select()
        .from(schema.partner_buy_orders)
        .where(eq(schema.partner_buy_orders.shop_id, shopId))
        .orderBy(desc(schema.partner_buy_orders.created_at))
    ])

    const stockValue = stockRows.reduce(
      (sum, row) => sum + Number(row.quantity_kg) * Number(row.avg_cost),
      0
    )
    const revenue = sales.reduce((sum, row) => sum + Number(row.total_amount), 0)
    const cashIn = sales.reduce((sum, row) => sum + Number(row.amount_paid), 0)
    const expenseTotal = expenses.reduce((sum, row) => sum + Number(row.amount), 0)
    const purchaseCost = purchases
      .filter((row) => row.status === 'fulfilled')
      .reduce((sum, row) => sum + Number(row.total_amount), 0)
    const pendingBuys = purchases
      .filter((row) => row.status === 'pending')
      .reduce((sum, row) => sum + Number(row.total_amount), 0)

    return NextResponse.json({
      stockValue: Math.round(stockValue * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      cashIn: Math.round(cashIn * 100) / 100,
      expenses: Math.round(expenseTotal * 100) / 100,
      purchaseCost: Math.round(purchaseCost * 100) / 100,
      pendingBuys: Math.round(pendingBuys * 100) / 100,
      profit: Math.round((cashIn - expenseTotal - purchaseCost) * 100) / 100,
      expenseRows: expenses.map((row) => ({
        ...row,
        amount: Number(row.amount)
      }))
    })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load finance')
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePartner(request)
    if (!auth.session) return auth.response

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = partnerExpenseSchema.safeParse(body.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter an expense title and amount.' }, { status: 422 })
    }

    const [row] = await db
      .insert(schema.partner_expenses)
      .values({
        shop_id: auth.session.shopId,
        title: parsed.data.title,
        category: parsed.data.category || 'other',
        amount: parsed.data.amount,
        notes: parsed.data.notes || null,
        expense_date: new Date()
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not save expense')
  }
}
