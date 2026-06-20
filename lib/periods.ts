import { toLocalDateKey } from './sales'

export type SalesPeriod = 'today' | 'week' | 'month' | 'all'

export const salesPeriodLabels: Record<SalesPeriod, string> = {
  today: 'Today',
  week: 'Last 7 days',
  month: 'Last 30 days',
  all: 'All time'
}

export function periodStart(period: Exclude<SalesPeriod, 'all' | 'today'>): Date {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (period === 'week') start.setDate(now.getDate() - 6)
  if (period === 'month') start.setMonth(now.getMonth() - 1)

  return start
}

export function isInSalesPeriod(saleDate: string, period: SalesPeriod, todayKey?: string) {
  if (period === 'all') return true

  if (period === 'today') {
    return todayKey ? toLocalDateKey(saleDate) === todayKey : toLocalDateKey(saleDate) === toLocalDateKey(new Date())
  }

  const date = new Date(saleDate)
  if (Number.isNaN(date.getTime())) return false
  return date >= periodStart(period)
}

export function summarizeSales<T extends { total_amount: number; amount_paid: number; balance: number; quantity: number }>(
  sales: T[]
) {
  return sales.reduce(
    (acc, sale) => ({
      count: acc.count + 1,
      revenue: acc.revenue + Number(sale.total_amount),
      cash: acc.cash + Number(sale.amount_paid),
      credit: acc.credit + Number(sale.balance),
      kg: acc.kg + Number(sale.quantity)
    }),
    { count: 0, revenue: 0, cash: 0, credit: 0, kg: 0 }
  )
}
