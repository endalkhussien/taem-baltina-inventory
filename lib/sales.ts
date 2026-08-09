export { toLocalDateKey, todayLocalKey, parseLocalDate } from './dates'

export function computeSaleTotals(quantity: number, unitPrice: number, amountPaid: number) {
  const total = Math.round(quantity * unitPrice * 100) / 100
  const paid = Math.round(amountPaid * 100) / 100
  const balance = Math.max(0, Math.round((total - paid) * 100) / 100)

  let status: 'Paid' | 'Partial' | 'Credit' = 'Credit'
  if (balance === 0) status = 'Paid'
  else if (paid > 0) status = 'Partial'

  return { total, paid, balance, status }
}
