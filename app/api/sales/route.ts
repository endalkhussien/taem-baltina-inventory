import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { saleCreateSchema } from '../../../lib/validators/sale'
import { computeSaleTotals } from '../../../lib/sales'
import { parseLocalDate } from '../../../lib/dates'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'

export async function GET() {
  try {
    const sales = await db
      .select({
        id: schema.sales.id,
        sale_code: schema.sales.sale_code,
        product_id: schema.sales.product_id,
        product_name: schema.products.name,
        customer_id: schema.sales.customer_id,
        customer_name: schema.customers.name,
        quantity: schema.sales.quantity,
        unit_price: schema.sales.unit_price,
        total_amount: schema.sales.total_amount,
        amount_paid: schema.sales.amount_paid,
        balance: schema.sales.balance,
        payment_status: schema.sales.payment_status,
        sale_date: schema.sales.sale_date,
        created_at: schema.sales.created_at
      })
      .from(schema.sales)
      .leftJoin(schema.products, eq(schema.sales.product_id, schema.products.id))
      .leftJoin(schema.customers, eq(schema.sales.customer_id, schema.customers.id))
      .orderBy(desc(schema.sales.sale_date))

    return NextResponse.json(sales)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load sales')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = saleCreateSchema.safeParse(body.data)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return NextResponse.json({ error: firstIssue?.message ?? 'Invalid sale data.' }, { status: 422 })
    }

    const { productId, customerId = 0, quantity, amountPaid = 0, saleDate } = parsed.data
    const parsedSaleDate = parseLocalDate(saleDate)
    if (!parsedSaleDate) return NextResponse.json({ error: 'Invalid sale date.' }, { status: 422 })

    const result = await db.transaction(async (tx) => {
      const [product] = await tx
        .select({
          id: schema.products.id,
          name: schema.products.name,
          selling_price: schema.products.selling_price,
          stock_quantity: schema.products.stock_quantity
        })
        .from(schema.products)
        .where(eq(schema.products.id, productId))
        .limit(1)

      if (!product) return { error: 'Product not found.', status: 404 as const }

      if (product.stock_quantity < quantity) {
        return {
          error: `Not enough stock for ${product.name}. Only ${product.stock_quantity} kg available.`,
          status: 409 as const
        }
      }

      if (product.stock_quantity <= 0) {
        return {
          error: `${product.name} is out of stock. Produce or restock before selling.`,
          status: 409 as const
        }
      }

      const unitPrice = Number(product.selling_price)
      const { total: totalAmount, paid, balance, status: paymentStatus } = computeSaleTotals(
        quantity,
        unitPrice,
        customerId === 0 ? quantity * unitPrice : amountPaid
      )

      if (customerId === 0 && balance > 0) {
        return { error: 'Walk-in sales must be paid in full. Select a customer for credit or partial payment.', status: 422 as const }
      }

      if (paid > totalAmount) {
        return { error: 'Amount paid cannot exceed the sale total.', status: 422 as const }
      }

      if (balance > 0 && customerId === 0) {
        return { error: 'Credit or partial sales must be linked to a customer.', status: 422 as const }
      }

      if (customerId > 0) {
        const [customer] = await tx
          .select({ id: schema.customers.id })
          .from(schema.customers)
          .where(eq(schema.customers.id, customerId))
          .limit(1)

        if (!customer) return { error: 'Customer not found.', status: 404 as const }
      }

      const [updatedProduct] = await tx
        .update(schema.products)
        .set({ stock_quantity: sql`${schema.products.stock_quantity} - ${quantity}` })
        .where(and(eq(schema.products.id, productId), gte(schema.products.stock_quantity, quantity)))
        .returning({
          id: schema.products.id,
          stock_quantity: schema.products.stock_quantity
        })

      if (!updatedProduct) {
        return {
          error: `Not enough stock for ${product.name}. Another sale may have used the remaining kg.`,
          status: 409 as const
        }
      }

      const saleCode = `S-${Date.now()}`

      const [created] = await tx
        .insert(schema.sales)
        .values({
          sale_code: saleCode,
          product_id: productId,
          customer_id: customerId > 0 ? customerId : null,
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          amount_paid: paid,
          balance,
          payment_status: paymentStatus,
          sale_date: parsedSaleDate
        })
        .returning()

      return {
        created,
        stock_kg_before: Number(product.stock_quantity),
        stock_kg_after: Number(updatedProduct.stock_quantity),
        quantity_sold_kg: quantity
      }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    const { created, stock_kg_before, stock_kg_after, quantity_sold_kg } = result

    return NextResponse.json(
      {
        ...created,
        stock_kg_before,
        stock_kg_after,
        quantity_sold_kg
      },
      { status: 201 }
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record sale')
  }
}
