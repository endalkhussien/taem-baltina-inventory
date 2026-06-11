import { NextResponse } from 'next/server'
import { db, schema } from '../../../lib/db'
import { ingredientCreateSchema } from '../../../lib/validators/ingredient'
import { databaseErrorResponse } from '../../../lib/apiErrors'

export async function GET() {
  try {
    const ingredients = await db.select().from(schema.ingredients)
    return NextResponse.json(ingredients)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load raw materials')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = ingredientCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const { name, category, quantity, unit, costPerUnit, alertThreshold = 0 } = parsed.data

    const [created] = await db
      .insert(schema.ingredients)
      .values({
        name,
        category,
        quantity,
        unit,
        cost_per_unit: costPerUnit,
        alert_threshold: alertThreshold
      } as any)
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not create raw material')
  }
}
