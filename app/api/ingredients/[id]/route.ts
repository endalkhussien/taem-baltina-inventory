import { NextResponse } from 'next/server'
import { db, schema } from '../../../../lib/db'
import { eq } from 'drizzle-orm'
import { ingredientPatchSchema } from '../../../../lib/validators/ingredient'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    const ingredient = await db.select().from(schema.ingredients).where(eq(schema.ingredients.id, id)).limit(1)
    if (!ingredient[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ingredient[0])
  } catch (err) {
    return databaseErrorResponse(err, 'Could not load raw material')
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = ingredientPatchSchema.safeParse(body.data)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 422 })

    const updateData: any = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category
    if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity
    if (parsed.data.unit !== undefined) updateData.unit = parsed.data.unit
    if (parsed.data.costPerUnit !== undefined) updateData.cost_per_unit = parsed.data.costPerUnit
    if (parsed.data.alertThreshold !== undefined) updateData.alert_threshold = parsed.data.alertThreshold

    const [updated] = await db.update(schema.ingredients).set(updateData).where(eq(schema.ingredients.id, id)).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    return databaseErrorResponse(err, 'Could not update raw material')
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    await db.delete(schema.ingredients).where(eq(schema.ingredients.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not delete raw material')
  }
}
