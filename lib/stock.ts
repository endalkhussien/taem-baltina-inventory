export type StockItem = {
  stock_quantity?: number
  quantity?: number
  alert_threshold?: number
}

export function isLowStock(item: StockItem): boolean {
  const stock = Number(item.stock_quantity ?? item.quantity ?? 0)
  const threshold = Number(item.alert_threshold ?? 0)
  return stock <= threshold
}

export function stockLevelLabel(item: StockItem): 'low' | 'ok' {
  return isLowStock(item) ? 'low' : 'ok'
}
