import { NextResponse } from 'next/server'
import { db, schema } from '../../../../../lib/db'
import { recipeUpdateSchema } from '../../../../../lib/validators/recipe'
import { eq } from 'drizzle-orm'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const productId = Number(params.id)
  if (!Number.isInteger(productId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const lines = await db
    .select({
      id: schema.product_ingredients.id,
      product_id: schema.product_ingredients.product_id,
      ingredient_id: schema.product_ingredients.ingredient_id,
      ingredient_name: schema.ingredients.name,
      ingredient_unit: schema.ingredients.unit,
      ingredient_cost_per_unit: schema.ingredients.cost_per_unit,
      quantity_per_unit: schema.product_ingredients.quantity_per_unit
    })
    .from(schema.product_ingredients)
    .leftJoin(schema.ingredients, eq(schema.product_ingredients.ingredient_id, schema.ingredients.id))
    .where(eq(schema.product_ingredients.product_id, productId))

  const materialCost = lines.reduce(
    (sum, line) => sum + Number(line.quantity_per_unit) * Number(line.ingredient_cost_per_unit),
    0
  )

  return NextResponse.json({ lines, materialCost })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const productId = Number(params.id)
  if (!Number.isInteger(productId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await request.json()
  const parsed = recipeUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1)

    if (!product) return { error: 'Product not found.', status: 404 as const }

    await tx.delete(schema.product_ingredients).where(eq(schema.product_ingredients.product_id, productId))

    if (parsed.data.lines.length > 0) {
      await tx.insert(schema.product_ingredients).values(
        parsed.data.lines.map((line) => ({
          product_id: productId,
          ingredient_id: line.ingredientId,
          quantity_per_unit: line.quantityPerUnit
        }))
      )
    }

    return { ok: true }
  })

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json(result)
}
