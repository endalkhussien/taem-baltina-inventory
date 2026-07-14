import { NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'
import { creditLedgerCreateSchema } from '../../../lib/validators/credit'
import {
  buildCreditLinesFromProducts,
  buildCreditTitleFromLines,
  parseCreditLinesFromTitle,
  sumCreditLineTotals
} from '../../../lib/credit'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

function isMissingCreditTableError(err: unknown) {
  const message = errorMessage(err)
  return message.includes('credit_ledgers') && message.includes('does not exist')
}

function isMissingCreditItemsTableError(err: unknown) {
  const message = errorMessage(err)
  return message.includes('credit_ledger_items') && message.includes('does not exist')
}

function isMissingProductColumnError(err: unknown) {
  const message = errorMessage(err)
  return message.includes('product_id') && message.includes('does not exist')
}

function missingCreditTableResponse() {
  return NextResponse.json(
    {
      error: 'Credit tables are not set up yet. Run: npm run migrate:credit (safe — does not change sales or stock).',
      hint: 'In PowerShell: $env:DATABASE_URL = "postgresql://..."; npm run migrate:credit'
    },
    { status: 503 }
  )
}

async function loadCreditItems(creditIds: number[]) {
  if (creditIds.length === 0) {
    return new Map<number, Array<{ product_id: number; product_name: string | null; quantity_kg: number; line_total: number }>>()
  }

  try {
    const rows = await db
      .select({
        credit_id: schema.credit_ledger_items.credit_id,
        product_id: schema.credit_ledger_items.product_id,
        product_name: schema.products.name,
        quantity_kg: schema.credit_ledger_items.quantity_kg,
        line_total: schema.credit_ledger_items.line_total
      })
      .from(schema.credit_ledger_items)
      .leftJoin(schema.products, eq(schema.credit_ledger_items.product_id, schema.products.id))
      .where(inArray(schema.credit_ledger_items.credit_id, creditIds))

    const byCredit = new Map<number, Array<{ product_id: number; product_name: string | null; quantity_kg: number; line_total: number }>>()

    for (const row of rows) {
      const list = byCredit.get(row.credit_id) ?? []
      list.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity_kg: Number(row.quantity_kg),
        line_total: Number(row.line_total)
      })
      byCredit.set(row.credit_id, list)
    }

    return byCredit
  } catch {
    return new Map()
  }
}

async function loadCreditLedgerRows() {
  try {
    return await db
      .select({
        id: schema.credit_ledgers.id,
        customer_id: schema.credit_ledgers.customer_id,
        customer_name: schema.customers.name,
        product_id: schema.credit_ledgers.product_id,
        product_name: schema.products.name,
        quantity_kg: schema.credit_ledgers.quantity_kg,
        title: schema.credit_ledgers.title,
        total_amount: schema.credit_ledgers.total_amount,
        amount_paid: schema.credit_ledgers.amount_paid,
        balance: schema.credit_ledgers.balance,
        credit_date: schema.credit_ledgers.credit_date,
        notes: schema.credit_ledgers.notes,
        created_at: schema.credit_ledgers.created_at
      })
      .from(schema.credit_ledgers)
      .leftJoin(schema.customers, eq(schema.credit_ledgers.customer_id, schema.customers.id))
      .leftJoin(schema.products, eq(schema.credit_ledgers.product_id, schema.products.id))
      .orderBy(desc(schema.credit_ledgers.credit_date))
  } catch (err) {
    if (!isMissingProductColumnError(err)) throw err

    const basicRows = await db
      .select({
        id: schema.credit_ledgers.id,
        customer_id: schema.credit_ledgers.customer_id,
        customer_name: schema.customers.name,
        title: schema.credit_ledgers.title,
        total_amount: schema.credit_ledgers.total_amount,
        amount_paid: schema.credit_ledgers.amount_paid,
        balance: schema.credit_ledgers.balance,
        credit_date: schema.credit_ledgers.credit_date,
        notes: schema.credit_ledgers.notes,
        created_at: schema.credit_ledgers.created_at
      })
      .from(schema.credit_ledgers)
      .leftJoin(schema.customers, eq(schema.credit_ledgers.customer_id, schema.customers.id))
      .orderBy(desc(schema.credit_ledgers.credit_date))

    return basicRows.map((row) => ({
      ...row,
      product_id: null,
      product_name: null,
      quantity_kg: null
    }))
  }
}

function enrichCreditItems(
  row: {
    id: number
    title: string
    product_id: number | null
    product_name: string | null
    quantity_kg: number | null
    items?: Array<{ product_id: number; product_name: string | null; quantity_kg: number; line_total: number }>
  },
  itemsByCredit: Map<number, Array<{ product_id: number; product_name: string | null; quantity_kg: number; line_total: number }>>,
  products: Array<{ id: number; name: string }>
) {
  const storedItems = itemsByCredit.get(row.id) ?? []
  if (storedItems.length > 0) return storedItems

  const parsedFromTitle = parseCreditLinesFromTitle(row.title, products)
  if (parsedFromTitle.length > 0) {
    return parsedFromTitle.map((line) => ({
      product_id: line.product_id ?? 0,
      product_name: line.product_name,
      quantity_kg: line.quantity_kg,
      line_total: line.line_total
    }))
  }

  if (row.product_id && row.quantity_kg) {
    return [{
      product_id: row.product_id,
      product_name: row.product_name,
      quantity_kg: Number(row.quantity_kg),
      line_total: 0
    }]
  }

  return []
}

export async function GET() {
  try {
    const [rows, productRows] = await Promise.all([
      loadCreditLedgerRows(),
      db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products)
    ])

    const itemsByCredit = await loadCreditItems(rows.map((row) => row.id))

    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        items: enrichCreditItems(row, itemsByCredit, productRows)
      }))
    )
  } catch (err) {
    if (isMissingCreditTableError(err)) return missingCreditTableResponse()
    return databaseErrorResponse(err, 'Could not load credit ledger')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = creditLedgerCreateSchema.safeParse(body.data)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstIssue?.message ?? 'Invalid credit data.' },
        { status: 422 }
      )
    }

    const creditDate = parseDate(parsed.data.creditDate)
    if (!creditDate) return NextResponse.json({ error: 'Invalid credit date.' }, { status: 422 })

    const amountPaid = parsed.data.amountPaid ?? 0
    if (amountPaid > parsed.data.totalAmount) {
      return NextResponse.json({ error: 'Amount paid cannot exceed total credit.' }, { status: 422 })
    }

    const [customer] = await db
      .select({ id: schema.customers.id, name: schema.customers.name })
      .from(schema.customers)
      .where(eq(schema.customers.id, parsed.data.customerId))
      .limit(1)

    if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

    const productRows = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        selling_price: schema.products.selling_price
      })
      .from(schema.products)

    let lineDrafts = buildCreditLinesFromProducts(parsed.data.lines ?? [], productRows)

    if (lineDrafts.length === 0 && Number(parsed.data.productId ?? 0) > 0) {
      lineDrafts = buildCreditLinesFromProducts(
        [{ productId: Number(parsed.data.productId), quantityKg: Number(parsed.data.quantityKg) }],
        productRows
      )
    }

    if (lineDrafts.length > 0) {
      const expectedTotal = sumCreditLineTotals(lineDrafts)
      if (Math.abs(expectedTotal - parsed.data.totalAmount) > 0.02) {
        return NextResponse.json(
          { error: `Total should be ${expectedTotal.toFixed(2)} ETB based on selected products.` },
          { status: 422 }
        )
      }
    }

    const title = lineDrafts.length > 0
      ? buildCreditTitleFromLines(lineDrafts, parsed.data.title)
      : (parsed.data.title?.trim() || 'Mixed products on credit')

    const balance = parsed.data.totalAmount - amountPaid
    const primaryLine = lineDrafts.length === 1 ? lineDrafts[0] : null

    const [created] = await db
      .insert(schema.credit_ledgers)
      .values({
        customer_id: parsed.data.customerId,
        product_id: primaryLine?.productId ?? null,
        quantity_kg: primaryLine?.quantityKg ?? null,
        title,
        total_amount: parsed.data.totalAmount,
        amount_paid: amountPaid,
        balance,
        credit_date: creditDate,
        notes: parsed.data.notes
      })
      .returning()

    if (lineDrafts.length > 0) {
      try {
        await db.insert(schema.credit_ledger_items).values(
          lineDrafts.map((line) => ({
            credit_id: created.id,
            product_id: line.productId,
            quantity_kg: line.quantityKg,
            unit_price: line.unitPrice,
            line_total: line.lineTotal
          }))
        )
      } catch (itemsErr) {
        if (!isMissingCreditItemsTableError(itemsErr)) throw itemsErr
      }
    }

    return NextResponse.json(
      {
        ...created,
        customer_name: customer.name,
        product_name: primaryLine?.productName ?? null,
        items: lineDrafts.map((line) => ({
          product_id: line.productId,
          product_name: line.productName,
          quantity_kg: line.quantityKg,
          line_total: line.lineTotal
        }))
      },
      { status: 201 }
    )
  } catch (err) {
    if (isMissingCreditTableError(err)) return missingCreditTableResponse()
    return databaseErrorResponse(err, 'Could not record credit')
  }
}
