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
  return `${lines.map((line) => `${line.productName} = ${line.quantityKg} kg`).join(', ')} on credit`
}

export function formatCreditProductsSummary(
  items?: Array<{ product_name?: string | null; quantity_kg?: number | null }> | null,
  productName?: string | null,
  quantityKg?: number | null
) {
  return formatCreditProductLines(items, productName, quantityKg)
    .map((line) => `${line.name} = ${line.kg} kg`)
    .join(', ')
}

export function formatCreditProductLines(
  items?: Array<{ product_id?: number; product_name?: string | null; quantity_kg?: number | null }> | null,
  productName?: string | null,
  quantityKg?: number | null
) {
  if (items && items.length > 0) {
    return items
      .filter((item) => Number(item.quantity_kg) > 0)
      .map((item) => ({
        productId: item.product_id,
        name: item.product_name || 'Product',
        kg: Number(item.quantity_kg)
      }))
  }
  if (productName && Number(quantityKg) > 0) {
    return [{ productId: undefined, name: productName, kg: Number(quantityKg) }]
  }
  return []
}

export function creditKgByProduct(
  ledgerRows: Array<{
    balance: number
    items?: Array<{ product_id?: number; product_name?: string | null; quantity_kg?: number | null }> | null
    product_id?: number | null
    product_name?: string | null
    quantity_kg?: number | null
  }>,
  productId: number,
  openOnly = true
) {
  return ledgerRows.reduce((sum, row) => {
    if (openOnly && Number(row.balance) <= 0) return sum
    const lines = formatCreditProductLines(row.items, row.product_name, row.quantity_kg)
    const match = lines.find((line) => line.productId === productId)
    return sum + (match?.kg ?? 0)
  }, 0)
}

export function creditStatusFromBalance(balance: number) {
  return Number(balance) > 0 ? 'Open' : 'Paid'
}

/** Parse "Berbere = 10 kg, Shiro = 5 kg on credit" style titles when item rows are missing. */
export function parseCreditLinesFromTitle(
  title: string,
  products?: Array<{ id: number; name: string }>
) {
  const matches = [...title.matchAll(/([^=,]+?)\s*=\s*([\d.]+)\s*kg/gi)]

  return matches
    .map((match) => {
      const productName = match[1].trim()
      const quantityKg = Number(match[2])
      const product = products?.find((item) => item.name.toLowerCase() === productName.toLowerCase())

      return {
        product_id: product?.id,
        product_name: productName,
        quantity_kg: quantityKg,
        line_total: 0
      }
    })
    .filter((line) => line.quantity_kg > 0)
}
