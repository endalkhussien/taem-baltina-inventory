import { NextResponse } from 'next/server'
import { eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../../../lib/db'
import { marketOrderCreateSchema } from '../../../../lib/validators/order'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

function orderCode() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.floor(Math.random() * 900 + 100)
  return `WEB-${stamp}-${rand}`
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = marketOrderCreateSchema.safeParse(body.data)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json({ error: first?.message ?? 'Invalid order.' }, { status: 422 })
    }

    const data = parsed.data
    const productIds = data.items.map((item) => item.productId)

    const result = await db.transaction(async (tx) => {
      const products = await tx
        .select({
          id: schema.products.id,
          name: schema.products.name,
          selling_price: schema.products.selling_price,
          stock_quantity: schema.products.stock_quantity
        })
        .from(schema.products)
        .where(inArray(schema.products.id, productIds))

      const byId = new Map(products.map((p) => [p.id, p]))

      const lines: {
        product_id: number
        product_name: string
        quantity_kg: number
        unit_price: number
        line_total: number
      }[] = []

      for (const item of data.items) {
        const product = byId.get(item.productId)
        if (!product) {
          return { error: `Product #${item.productId} was not found.`, status: 404 as const }
        }
        if (Number(product.stock_quantity) < item.quantityKg) {
          return {
            error: `Not enough stock for ${product.name}. Only ${product.stock_quantity} kg available.`,
            status: 409 as const
          }
        }
        const unit = Number(product.selling_price)
        const lineTotal = Number((unit * item.quantityKg).toFixed(2))
        lines.push({
          product_id: product.id,
          product_name: product.name,
          quantity_kg: item.quantityKg,
          unit_price: unit,
          line_total: lineTotal
        })
      }

      const subtotal = Number(lines.reduce((sum, line) => sum + line.line_total, 0).toFixed(2))

      // Upsert-ish customer by phone for ops CRM
      let customerId: number | null = null
      const phone = data.customerPhone.trim()
      const [existing] = await tx
        .select({ id: schema.customers.id })
        .from(schema.customers)
        .where(eq(schema.customers.phone, phone))
        .limit(1)

      if (existing) {
        customerId = existing.id
        await tx
          .update(schema.customers)
          .set({
            name: data.customerName.trim(),
            notes: data.customerEmail ? `Email: ${data.customerEmail}` : undefined,
            updated_at: new Date()
          })
          .where(eq(schema.customers.id, existing.id))
      } else {
        const [created] = await tx
          .insert(schema.customers)
          .values({
            name: data.customerName.trim(),
            phone,
            notes: data.customerEmail
              ? `Web order contact · ${data.customerEmail}`
              : 'Web marketplace customer'
          })
          .returning({ id: schema.customers.id })
        customerId = created.id
      }

      const code = orderCode()
      const [order] = await tx
        .insert(schema.market_orders)
        .values({
          order_code: code,
          customer_id: customerId,
          customer_name: data.customerName.trim(),
          customer_phone: phone,
          customer_email: data.customerEmail?.trim() || null,
          delivery_address: data.deliveryAddress.trim(),
          city: data.city.trim(),
          notes: data.notes?.trim() || null,
          payment_method: data.paymentMethod,
          status: 'pending',
          subtotal,
          total_amount: subtotal
        })
        .returning()

      await tx.insert(schema.market_order_items).values(
        lines.map((line) => ({
          order_id: order.id,
          product_id: line.product_id,
          product_name: line.product_name,
          quantity_kg: line.quantity_kg,
          unit_price: line.unit_price,
          line_total: line.line_total
        }))
      )

      return { order, lines }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(
      {
        id: result.order.id,
        order_code: result.order.order_code,
        status: result.order.status,
        total_amount: result.order.total_amount,
        payment_method: result.order.payment_method,
        items: result.lines
      },
      { status: 201 }
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not place order')
  }
}
