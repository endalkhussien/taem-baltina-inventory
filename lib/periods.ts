import {
  calendarWeekEnd,
  calendarWeekStart,
  formatWeekRange,
  isInCalendarWeek,
  parseLocalDate,
  toLocalDateKey,
  todayLocalKey,
  weekKeyForDate
} from './dates'

export type SalesPeriod = 'today' | 'week' | 'month' | 'all'

export const salesPeriodLabels: Record<SalesPeriod, string> = {
  today: 'Today',
  week: 'This week (Mon–Sun)',
  month: 'Last 30 days',
  all: 'All time'
}

export function periodStart(period: Exclude<SalesPeriod, 'all' | 'today'>): Date {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (period === 'week') return calendarWeekStart(now)
  if (period === 'month') start.setMonth(now.getMonth() - 1)

  return start
}

export function periodEnd(period: SalesPeriod): Date | null {
  if (period === 'week') return calendarWeekEnd(calendarWeekStart())
  if (period === 'today') {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return end
  }
  return null
}

export function periodDescription(period: SalesPeriod, todayKey = todayLocalKey()) {
  if (period === 'today') return `Today (${todayKey})`
  if (period === 'week') return formatWeekRange(calendarWeekStart())
  if (period === 'month') return 'Last 30 days'
  return 'All recorded sales'
}

export function isInSalesPeriod(saleDate: string, period: SalesPeriod, todayKey?: string) {
  if (period === 'all') return true

  if (period === 'today') {
    const key = todayKey ?? todayLocalKey()
    return toLocalDateKey(saleDate) === key
  }

  if (period === 'week') {
    return isInCalendarWeek(saleDate)
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

export function groupSalesByCalendarWeek<
  T extends { sale_date: string; total_amount: number; amount_paid: number; balance: number; quantity: number }
>(sales: T[]) {
  const groups = new Map<string, { weekStart: Date; label: string; sales: T[]; summary: ReturnType<typeof summarizeSales> }>()

  for (const sale of sales) {
    const parsed = parseLocalDate(toLocalDateKey(sale.sale_date)) ?? new Date(sale.sale_date)
    const weekStart = calendarWeekStart(parsed)
    const key = weekKeyForDate(parsed)
    const existing = groups.get(key)

    if (existing) {
      existing.sales.push(sale)
      existing.summary = summarizeSales(existing.sales)
    } else {
      groups.set(key, {
        weekStart,
        label: formatWeekRange(weekStart),
        sales: [sale],
        summary: summarizeSales([sale])
      })
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
    .map((group) => ({
      ...group,
      sales: [...group.sales].sort(
        (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      )
    }))
}
