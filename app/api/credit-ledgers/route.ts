import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../lib/db'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'
import { creditLedgerCreateSchema } from '../../../lib/validators/credit'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildCreditTitle(productName: string | null, quantityKg: number, customTitle?: string) {
  if (customTitle?.trim()) return customTitle.trim()
  if (productName && quantityKg > 0) return `${productName} — ${quantityKg} kg on credit`
  return 'Credit'
}

export async function GET() {
  try {
    const rows = await db
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

    return NextResponse.json(rows)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load credit ledger')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = creditLedgerCreateSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

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

    const productId = Number(parsed.data.productId ?? 0)
    const quantityKg = Number(parsed.data.quantityKg ?? 0)
    let productName: string | null = null

    if (productId > 0) {
      const [product] = await db
        .select({ id: schema.products.id, name: schema.products.name, selling_price: schema.products.selling_price })
        .from(schema.products)
        .where(eq(schema.products.id, productId))
        .limit(1)

      if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

      productName = product.name
      const expectedTotal = Number((quantityKg * Number(product.selling_price)).toFixed(2))
      if (Math.abs(expectedTotal - parsed.data.totalAmount) > 0.02) {
        return NextResponse.json(
          { error: `Total should be ${expectedTotal.toFixed(2)} ETB (${quantityKg} kg × ${Number(product.selling_price).toFixed(2)}).` },
          { status: 422 }
        )
      }
    }

    const title = buildCreditTitle(productName, quantityKg, parsed.data.title)
    const balance = parsed.data.totalAmount - amountPaid

    const [created] = await db
      .insert(schema.credit_ledgers)
      .values({
        customer_id: parsed.data.customerId,
        product_id: productId > 0 ? productId : null,
        quantity_kg: productId > 0 ? quantityKg : null,
        title,
        total_amount: parsed.data.totalAmount,
        amount_paid: amountPaid,
        balance,
        credit_date: creditDate,
        notes: parsed.data.notes
      })
      .returning()

    return NextResponse.json(
      {
        ...created,
        customer_name: customer.name,
        product_name: productName
      },
      { status: 201 }
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record credit')
  }
}
