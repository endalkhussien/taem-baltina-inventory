export type RecipeCostLine = {
  quantity_per_unit: number | string
  ingredient_cost_per_unit?: number | string | null
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function computeBatchMaterialCost(lines: RecipeCostLine[], quantityProduced: number) {
  return roundMoney(
    lines.reduce((sum, line) => {
      const perUnit = Number(line.quantity_per_unit)
      const unitCost = Number(line.ingredient_cost_per_unit ?? 0)
      return sum + perUnit * quantityProduced * unitCost
    }, 0)
  )
}

export function computeBatchTotalCost(
  materialCost: number,
  laborCost = 0,
  equipmentCost = 0,
  otherOverhead = 0
) {
  return roundMoney(materialCost + laborCost + equipmentCost + otherOverhead)
}

export function computeCostPerUnit(totalCost: number, quantityProduced: number) {
  if (quantityProduced <= 0) return 0
  return roundMoney(totalCost / quantityProduced)
}

export function averageCostPerProduct(
  batches: Array<{ product_id: number; quantity_produced: number; total_cost?: number | null }>
) {
  const totals = new Map<number, { cost: number; quantity: number }>()

  for (const batch of batches) {
    const current = totals.get(batch.product_id) ?? { cost: 0, quantity: 0 }
    current.cost += Number(batch.total_cost ?? 0)
    current.quantity += Number(batch.quantity_produced)
    totals.set(batch.product_id, current)
  }

  const averages: Record<number, number> = {}
  totals.forEach((value, productId) => {
    averages[productId] = value.quantity > 0 ? roundMoney(value.cost / value.quantity) : 0
  })

  return averages
}

export function estimateSalesCogs(
  sales: Array<{ product_id: number; quantity: number }>,
  avgCostByProduct: Record<number, number>
) {
  return roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.quantity) * (avgCostByProduct[sale.product_id] ?? 0), 0)
  )
}
