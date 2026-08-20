import { and, eq, sql } from 'drizzle-orm'
import { schema } from './db'

// Drizzle transaction client is structurally compatible with these queries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StockTx = any

export async function addPartnerStock(
  tx: StockTx,
  shopId: number,
  productId: number,
  qty: number,
  unitCost: number
) {
  const [row] = await tx
    .select()
    .from(schema.partner_stock)
    .where(and(eq(schema.partner_stock.shop_id, shopId), eq(schema.partner_stock.product_id, productId)))
    .limit(1)

  if (!row) {
    await tx.insert(schema.partner_stock).values({
      shop_id: shopId,
      product_id: productId,
      quantity_kg: qty,
      avg_cost: unitCost
    })
    return
  }

  const oldQty = Number(row.quantity_kg)
  const oldCost = Number(row.avg_cost)
  const newQty = oldQty + qty
  const avg = newQty > 0 ? (oldQty * oldCost + qty * unitCost) / newQty : unitCost

  await tx
    .update(schema.partner_stock)
    .set({ quantity_kg: newQty, avg_cost: Math.round(avg * 100) / 100, updated_at: new Date() })
    .where(eq(schema.partner_stock.id, row.id))
}

export async function deductPartnerStock(tx: StockTx, shopId: number, productId: number, qty: number) {
  const [row] = await tx
    .select()
    .from(schema.partner_stock)
    .where(and(eq(schema.partner_stock.shop_id, shopId), eq(schema.partner_stock.product_id, productId)))
    .limit(1)

  if (!row || Number(row.quantity_kg) < qty) {
    return { ok: false as const, available: Number(row?.quantity_kg ?? 0) }
  }

  const [updated] = await tx
    .update(schema.partner_stock)
    .set({
      quantity_kg: sql`${schema.partner_stock.quantity_kg} - ${qty}`,
      updated_at: new Date()
    })
    .where(and(eq(schema.partner_stock.id, row.id), sql`${schema.partner_stock.quantity_kg} >= ${qty}`))
    .returning({ id: schema.partner_stock.id })

  if (!updated) return { ok: false as const, available: Number(row.quantity_kg) }
  return { ok: true as const }
}
