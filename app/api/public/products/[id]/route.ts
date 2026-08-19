import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../../../lib/db'
import { marketplaceProductPayload } from '../../../../../lib/productDisplay'
import { databaseErrorResponse } from '../../../../../lib/apiErrors'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid product.' }, { status: 400 })
    }

    const [product] = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        selling_price: schema.products.selling_price,
        stock_quantity: schema.products.stock_quantity
      })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1)

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    if (Number(product.stock_quantity) <= 0) {
      return NextResponse.json({ error: 'This blend is not available.' }, { status: 404 })
    }

    return NextResponse.json(marketplaceProductPayload(product))
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load product')
  }
}
