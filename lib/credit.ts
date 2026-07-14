export type CreditLineDraft = {
  productId: number
  productName: string
  quantityKg: number
  unitPrice: number
  lineTotal: number
}

export function buildCreditLinesFromProducts(
  lines: Array<{ productId: number; quantityKg: number }>,
  products: Array<{ id: number; name: string; selling_price: number }>
) {
  const drafts: CreditLineDraft[] = []

  for (const line of lines) {
    const product = products.find((item) => item.id === line.productId)
    if (!product) throw new Error(`Product #${line.productId} not found.`)

    const unitPrice = Number(product.selling_price)
    const quantityKg = Number(line.quantityKg)
    const lineTotal = Number((quantityKg * unitPrice).toFixed(2))

    drafts.push({
      productId: product.id,
      productName: product.name,
      quantityKg,
      unitPrice,
      lineTotal
    })
  }

  return drafts
}

export function sumCreditLineTotals(lines: CreditLineDraft[]) {
  return Number(lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2))
}

export function buildCreditTitleFromLines(lines: CreditLineDraft[], customTitle?: string) {
  if (customTitle?.trim()) return customTitle.trim()
  if (lines.length === 0) return 'Credit'
  return `${lines.map((line) => `${line.productName} ${line.quantityKg}kg`).join(', ')} on credit`
}

export function formatCreditProductsSummary(
  items?: Array<{ product_name?: string | null; quantity_kg?: number | null }> | null,
  productName?: string | null,
  quantityKg?: number | null
) {
  if (items && items.length > 0) {
    return items.map((item) => `${item.product_name} (${Number(item.quantity_kg)} kg)`).join(', ')
  }
  if (productName) {
    return quantityKg ? `${productName} (${Number(quantityKg)} kg)` : productName
  }
  return 'Mixed / manual'
}

export function creditStatusFromBalance(balance: number) {
  return Number(balance) > 0 ? 'Open' : 'Paid'
}
