import { roundMoney } from './productionCost'

export function computeProfitPerKg(sellingPricePerKg: number, costPerKg: number) {
  return roundMoney(sellingPricePerKg - costPerKg)
}

export function computeEstimatedBatchProfit(kgProduced: number, sellingPricePerKg: number, totalBatchCost: number) {
  if (kgProduced <= 0) return 0
  const revenue = kgProduced * sellingPricePerKg
  return roundMoney(revenue - totalBatchCost)
}

export function computeProfitMarginPercent(profit: number, revenue: number) {
  if (revenue <= 0) return 0
  return roundMoney((profit / revenue) * 100)
}

export function computeSimpleNetProfit(salesRevenue: number, productionCost: number, operatingExpenses: number) {
  return roundMoney(salesRevenue - productionCost - operatingExpenses)
}
