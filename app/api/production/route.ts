import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { productionCreateSchema } from '../../../lib/validators/production'
import {
  computeBatchMaterialCost,
  computeBatchTotalCost,
  computeCostPerUnit
} from '../../../lib/productionCost'
import { desc, eq, sql } from 'drizzle-orm'
import { databaseErrorResponse } from '../../../lib/apiErrors'

function parseDate(value?: string) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  try {
    const batches = await db
      .select({
        id: schema.production_batches.id,
        product_id: schema.production_batches.product_id,
        product_name: schema.products.name,
        batch_count: schema.production_batches.batch_count,
        quantity_produced: schema.production_batches.quantity_produced,
        material_cost: schema.production_batches.material_cost,
        labor_cost: schema.production_batches.labor_cost,
        equipment_cost: schema.production_batches.equipment_cost,
        other_overhead: schema.production_batches.other_overhead,
        total_cost: schema.production_batches.total_cost,
        cost_per_unit: schema.production_batches.cost_per_unit,
        produced_at: schema.production_batches.produced_at,
        notes: schema.production_batches.notes,
        created_at: schema.production_batches.created_at
      })
      .from(schema.production_batches)
      .leftJoin(schema.products, eq(schema.production_batches.product_id, schema.products.id))
      .orderBy(desc(schema.production_batches.produced_at))

    return NextResponse.json(batches)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load production batches')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = productionCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const {
      productId,
      batchCount = 1,
      quantityProduced,
      producedAt,
      notes,
      laborCost = 0,
      equipmentCost = 0,
      otherOverhead = 0
    } = parsed.data
    const parsedDate = parseDate(producedAt)
    if (!parsedDate) return NextResponse.json({ error: 'Invalid production date.' }, { status: 422 })

    const result = await db.transaction(async (tx) => {
      const [product] = await tx
        .select({
          id: schema.products.id,
          name: schema.products.name,
          stock_quantity: schema.products.stock_quantity
        })
        .from(schema.products)
        .where(eq(schema.products.id, productId))
        .limit(1)

      if (!product) return { error: 'Product not found.', status: 404 as const }

      const recipe = await tx
        .select({
          ingredient_id: schema.product_ingredients.ingredient_id,
          ingredient_name: schema.ingredients.name,
          available_quantity: schema.ingredients.quantity,
          quantity_per_unit: schema.product_ingredients.quantity_per_unit,
          ingredient_cost_per_unit: schema.ingredients.cost_per_unit
        })
        .from(schema.product_ingredients)
        .leftJoin(schema.ingredients, eq(schema.product_ingredients.ingredient_id, schema.ingredients.id))
        .where(eq(schema.product_ingredients.product_id, productId))

      if (recipe.length === 0) {
        return { error: 'Add a recipe before recording production for this product.', status: 409 as const }
      }

      const shortages = recipe
        .map((line) => {
          const required = Number(line.quantity_per_unit) * batchCount
          const available = Number(line.available_quantity)
          return available < required
            ? `${line.ingredient_name ?? 'Ingredient'} needs ${required.toFixed(3)} but has ${available.toFixed(3)}`
            : null
        })
        .filter(Boolean)

      if (shortages.length > 0) {
        return { error: `Insufficient raw materials: ${shortages.join('; ')}`, status: 409 as const }
      }

      const materialCost = computeBatchMaterialCost(recipe, batchCount)
      const totalCost = computeBatchTotalCost(materialCost, laborCost, equipmentCost, otherOverhead)
      const costPerUnit = computeCostPerUnit(totalCost, quantityProduced)

      for (const line of recipe) {
        const required = Number(line.quantity_per_unit) * batchCount
        await tx
          .update(schema.ingredients)
          .set({ quantity: sql`${schema.ingredients.quantity} - ${required}` })
          .where(eq(schema.ingredients.id, line.ingredient_id))
      }

      const stockKgBefore = Number(product.stock_quantity)

      await tx
        .update(schema.products)
        .set({ stock_quantity: sql`${schema.products.stock_quantity} + ${quantityProduced}` })
        .where(eq(schema.products.id, productId))

      const stockKgAfter = stockKgBefore + quantityProduced

      const [created] = await tx
        .insert(schema.production_batches)
        .values({
          product_id: productId,
          batch_count: batchCount,
          quantity_produced: quantityProduced,
          material_cost: materialCost,
          labor_cost: laborCost,
          equipment_cost: equipmentCost,
          other_overhead: otherOverhead,
          total_cost: totalCost,
          cost_per_unit: costPerUnit,
          produced_at: parsedDate,
          notes
        })
        .returning()

      return {
        created,
        stock_kg_before: stockKgBefore,
        stock_kg_after: stockKgAfter,
        quantity_added_kg: quantityProduced,
        batch_count: batchCount,
        product_name: product.name
      }
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    const { created, stock_kg_before, stock_kg_after, quantity_added_kg, batch_count, product_name } = result

    return NextResponse.json(
      {
        ...created,
        stock_kg_before,
        stock_kg_after,
        quantity_added_kg,
        batch_count,
        product_name
      },
      { status: 201 }
    )
  } catch (err) {
    return databaseErrorResponse(err, 'Could not post production batch')
  }
}
