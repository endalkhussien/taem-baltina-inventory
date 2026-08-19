import {
  ethiopianFromInput,
  ethiopianPeriodKey,
  formatEthiopianPeriod,
  type EthiopianDate,
} from './ethiopian-calendar'

export type MonthlyFinancialRow = {
  key: string
  year: number
  month: number
  label: string
  revenue: number
  cashCollected: number
  expenses: number
  purchases: number
  profit: number
  salesCount: number
  marginPct: number
}

type SaleLike = {
  sale_date?: string | Date | null
  created_at?: string | Date | null
  total_amount?: number | string | null
  amount_paid?: number | string | null
}

type ExpenseLike = {
  expense_date?: string | Date | null
  created_at?: string | Date | null
  amount?: number | string | null
}

function ethFromRecord(primary?: string | Date | null, fallback?: string | Date | null): EthiopianDate | null {
  return ethiopianFromInput(primary) ?? ethiopianFromInput(fallback)
}

function num(v: number | string | null | undefined): number {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

type PurchaseLike = {
  purchase_date?: string | Date | null
  created_at?: string | Date | null
  cost_total?: number | string | null
}

/**
 * Group sales, operating expenses, and raw-material purchases by Ethiopian month.
 * Profit = sales revenue − operating expenses (purchases shown separately).
 */
export function buildEthiopianMonthlyFinancials(
  sales: SaleLike[],
  expenses: ExpenseLike[],
  purchases: PurchaseLike[] = []
): MonthlyFinancialRow[] {
  const map = new Map<string, MonthlyFinancialRow>()

  const ensure = (eth: EthiopianDate): MonthlyFinancialRow => {
    const key = ethiopianPeriodKey(eth)
    let row = map.get(key)
    if (!row) {
      row = {
        key,
        year: eth.year,
        month: eth.month,
        label: formatEthiopianPeriod(eth),
        revenue: 0,
        cashCollected: 0,
        expenses: 0,
        purchases: 0,
        profit: 0,
        salesCount: 0,
        marginPct: 0,
      }
      map.set(key, row)
    }
    return row
  }

  for (const s of sales) {
    const eth = ethFromRecord(s.sale_date, s.created_at)
    if (!eth) continue
    const row = ensure(eth)
    row.revenue += num(s.total_amount)
    row.cashCollected += num(s.amount_paid)
    row.salesCount += 1
  }

  for (const e of expenses) {
    const eth = ethFromRecord(e.expense_date, e.created_at)
    if (!eth) continue
    const row = ensure(eth)
    row.expenses += num(e.amount)
  }

  for (const p of purchases) {
    const eth = ethFromRecord(p.purchase_date, p.created_at)
    if (!eth) continue
    const row = ensure(eth)
    row.purchases += num(p.cost_total)
  }

  const rows = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))

  for (const row of rows) {
    row.profit = row.revenue - row.expenses
    row.marginPct = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0
  }

  return rows
}

/** Distinct Ethiopian years present in the monthly series (newest first). */
export function ethiopianYearsFromMonthly(rows: MonthlyFinancialRow[]): number[] {
  const years = Array.from(new Set(rows.map((r) => r.year)))
  return years.sort((a, b) => b - a)
}

export function filterMonthlyByEthYear(
  rows: MonthlyFinancialRow[],
  year: number | 'all'
): MonthlyFinancialRow[] {
  if (year === 'all') return rows
  return rows.filter((r) => r.year === year)
}
