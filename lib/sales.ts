export function toLocalDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function computeSaleTotals(quantity: number, unitPrice: number, amountPaid: number) {
  const total = Math.round(quantity * unitPrice * 100) / 100
  const paid = Math.round(amountPaid * 100) / 100
  const balance = Math.max(0, Math.round((total - paid) * 100) / 100)

  let status: 'Paid' | 'Partial' | 'Credit' = 'Credit'
  if (balance === 0) status = 'Paid'
  else if (paid > 0) status = 'Partial'

  return { total, paid, balance, status }
}
