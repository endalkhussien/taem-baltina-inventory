import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { purchaseCreateSchema } from '../../../lib/validators/purchase'
import { desc, eq, sql } from 'drizzle-orm'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  const purchases = await db
    .select({
      id: schema.purchases.id,
      ingredient_id: schema.purchases.ingredient_id,
      ingredient_name: schema.ingredients.name,
      quantity: schema.purchases.quantity,
      cost_total: schema.purchases.cost_total,
      supplier: schema.purchases.supplier,
      purchase_date: schema.purchases.purchase_date,
      created_at: schema.purchases.created_at
    })
    .from(schema.purchases)
    .leftJoin(schema.ingredients, eq(schema.purchases.ingredient_id, schema.ingredients.id))
    .orderBy(desc(schema.purchases.purchase_date))

  return NextResponse.json(purchases)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = purchaseCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { ingredientId, quantity, costTotal, supplier, purchaseDate } = parsed.data
    const parsedDate = parseDate(purchaseDate)
    if (!parsedDate) return NextResponse.json({ error: 'Invalid purchase date.' }, { status: 422 })

    const result = await db.transaction(async (tx) => {
      const [ingredient] = await tx
        .select()
        .from(schema.ingredients)
        .where(eq(schema.ingredients.id, ingredientId))
        .limit(1)

      if (!ingredient) return { error: 'Ingredient not found.', status: 404 as const }

      const oldQuantity = Number(ingredient.quantity)
      const oldValue = oldQuantity * Number(ingredient.cost_per_unit)
      const newQuantity = oldQuantity + quantity
      const newCostPerUnit = newQuantity > 0 ? (oldValue + costTotal) / newQuantity : 0

      const [created] = await tx
        .insert(schema.purchases)
        .values({
          ingredient_id: ingredientId,
          quantity,
          cost_total: costTotal,
          supplier,
          purchase_date: parsedDate
        })
        .returning()

      await tx
        .update(schema.ingredients)
        .set({
          quantity: sql`${schema.ingredients.quantity} + ${quantity}`,
          cost_per_unit: Number(newCostPerUnit.toFixed(2))
        })
        .where(eq(schema.ingredients.id, ingredientId))

      return { created }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(result.created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
