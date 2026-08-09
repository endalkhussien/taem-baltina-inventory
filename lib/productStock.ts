export function formatStockKg(quantity: number): string {
  const kg = Number(quantity)
  if (!Number.isFinite(kg)) return '0 kg'
  return `${kg} kg`
}

export function stockKgLabel(quantity: number): string {
  const kg = Number(quantity)
  if (!Number.isFinite(kg)) return '0 kg in stock'
  return `${kg} kg in stock`
}
