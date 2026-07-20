import { averageCostPerProduct } from './productionCost'

export type IngredientStockRow = {
  quantity: number | string
  cost_per_unit: number | string
}

export type ProductStockRow = {
  id: number
  stock_quantity: number | string
  selling_price: number | string
}

export function ingredientLineValue(item: IngredientStockRow) {
  return Number(item.quantity) * Number(item.cost_per_unit)
}

export function productRetailValue(item: ProductStockRow) {
  return Number(item.stock_quantity) * Number(item.selling_price)
}

export function productCostValue(item: ProductStockRow, avgCostPerKg: number) {
  return Number(item.stock_quantity) * avgCostPerKg
}

export function sumIngredientStockValue(items: IngredientStockRow[]) {
  return items.reduce((sum, item) => sum + ingredientLineValue(item), 0)
}

export function sumProductRetailValue(items: ProductStockRow[]) {
  return items.reduce((sum, item) => sum + productRetailValue(item), 0)
}

export function sumProductCostValue(
  items: ProductStockRow[],
  avgCostByProduct: Record<number, number>
) {
  return items.reduce((sum, item) => sum + productCostValue(item, avgCostByProduct[item.id] ?? 0), 0)
}

export function buildProductCostMap(
  batches: Array<{ product_id: number; quantity_produced: number; total_cost?: number | null }>
) {
  return averageCostPerProduct(batches)
}

export function totalInventoryValue(rawMaterialValue: number, finishedRetailValue: number) {
  return rawMaterialValue + finishedRetailValue
}
