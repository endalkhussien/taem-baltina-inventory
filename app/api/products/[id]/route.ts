import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { databaseErrorResponse } from '../../../../lib/apiErrors'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    const product = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1)
    if (!product[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product[0])
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load finished good')
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const patchSchema = z.object({
    name: z.string().min(1).optional(),
    sellingPrice: z.union([z.string(), z.number()]).transform((v) => Number(v)).optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    alertThreshold: z.number().int().nonnegative().optional()
  })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

  const updateData: any = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.sellingPrice !== undefined) updateData.selling_price = parsed.data.sellingPrice
  if (parsed.data.stockQuantity !== undefined) updateData.stock_quantity = parsed.data.stockQuantity
  if (parsed.data.alertThreshold !== undefined) updateData.alert_threshold = parsed.data.alertThreshold

  try {
    const [updated] = await db.update(schema.products).set(updateData).where(eq(schema.products.id, id)).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not update finished good')
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    await db.delete(schema.products).where(eq(schema.products.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete finished good')
  }
}
