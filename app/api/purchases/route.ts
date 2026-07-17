import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { purchaseCreateSchema } from '../../../lib/validators/purchase'
import { desc, eq, sql } from 'drizzle-orm'
import { parseLocalDate } from '../../../lib/dates'
import { weightedAverageCost } from '../../../lib/inventoryCost'
import { databaseErrorResponse, parseJsonBody } from '../../../lib/apiErrors'

export async function GET() {
  try {
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
      .orderBy(desc(schema.purchases.purchase_date), desc(schema.purchases.created_at), desc(schema.purchases.id))

    return NextResponse.json(purchases)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load raw-material purchases')
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = purchaseCreateSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { ingredientId, quantity, costTotal, supplier, purchaseDate } = parsed.data
    const parsedDate = parseLocalDate(purchaseDate)
    if (!parsedDate) return NextResponse.json({ error: 'Invalid purchase date.' }, { status: 422 })

    const result = await db.transaction(async (tx) => {
      const [ingredient] = await tx
        .select()
        .from(schema.ingredients)
        .where(eq(schema.ingredients.id, ingredientId))
        .limit(1)

      if (!ingredient) return { error: 'Ingredient not found.', status: 404 as const }

      const oldQuantity = Number(ingredient.quantity)
      const newCostPerUnit = weightedAverageCost(oldQuantity, Number(ingredient.cost_per_unit), quantity, costTotal)

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

      const [updatedIngredient] = await tx
        .update(schema.ingredients)
        .set({
          quantity: sql`${schema.ingredients.quantity} + ${quantity}`,
          cost_per_unit: Number(newCostPerUnit.toFixed(4))
        })
        .where(eq(schema.ingredients.id, ingredientId))
        .returning({
          id: schema.ingredients.id,
          quantity: schema.ingredients.quantity,
          cost_per_unit: schema.ingredients.cost_per_unit,
          unit: schema.ingredients.unit
        })

      return {
        created,
        newAverageCost: updatedIngredient?.cost_per_unit ?? newCostPerUnit,
        unit: updatedIngredient?.unit ?? ingredient.unit
      }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(
      {
        ...result.created,
        new_average_cost: result.newAverageCost,
        unit: result.unit
      },
      { status: 201 }
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not record purchase')
  }
}
