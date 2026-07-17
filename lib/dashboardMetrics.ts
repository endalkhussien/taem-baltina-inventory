import { isInSalesPeriod, type SalesPeriod } from './periods'
import { toLocalDateKey } from './dates'
import { isLowStock } from './stock'

type DatedRow = { [key: string]: unknown }

export function filterByPeriod<T extends DatedRow>(
  rows: T[],
  period: SalesPeriod,
  dateKey: keyof T & string
) {
  if (period === 'all') return rows
  return rows.filter((row) => isInSalesPeriod(String(row[dateKey]), period))
}

export function buildSalesVsPurchaseChart(
  sales: Array<{ sale_date: string; total_amount: number }>,
  purchases: Array<{ purchase_date: string; cost_total: number }>,
  period: SalesPeriod
) {
  const periodSales = filterByPeriod(sales, period, 'sale_date')
  const periodPurchases = filterByPeriod(purchases, period, 'purchase_date')

  const bucket = new Map<string, { label: string; sales: number; purchases: number }>()

  for (const sale of periodSales) {
    const key = toLocalDateKey(sale.sale_date)
    const existing = bucket.get(key) ?? { label: formatShortDate(key), sales: 0, purchases: 0 }
    existing.sales += Number(sale.total_amount)
    bucket.set(key, existing)
  }

  for (const purchase of periodPurchases) {
    const key = toLocalDateKey(purchase.purchase_date)
    const existing = bucket.get(key) ?? { label: formatShortDate(key), sales: 0, purchases: 0 }
    existing.purchases += Number(purchase.cost_total)
    bucket.set(key, existing)
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value)
}

function formatShortDate(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function topSellingProducts(
  sales: Array<{ product_id: number; product_name?: string | null; quantity: number; total_amount: number; sale_date: string }>,
  period: SalesPeriod,
  limit = 5
) {
  const periodSales = filterByPeriod(sales, period, 'sale_date')
  const byProduct = new Map<number, { name: string; qty: number; revenue: number }>()

  for (const sale of periodSales) {
    const existing = byProduct.get(sale.product_id) ?? {
      name: sale.product_name || 'Product',
      qty: 0,
      revenue: 0
    }
    existing.qty += Number(sale.quantity)
    existing.revenue += Number(sale.total_amount)
    byProduct.set(sale.product_id, existing)
  }

  return [...byProduct.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function recentSalesList(
  sales: Array<{
    id: number
    sale_date: string
    product_name?: string | null
    customer_name?: string | null
    quantity: number
    total_amount: number
    payment_status: string
  }>,
  period: SalesPeriod,
  limit = 8
) {
  return filterByPeriod(sales, period, 'sale_date')
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
    .slice(0, limit)
}

export function lowStockSummary(
  products: Array<{ id: number; name: string; stock_quantity: number; alert_threshold?: number }>,
  ingredients: Array<{ id: number; name: string; quantity: number; unit: string; alert_threshold?: number }>
) {
  const lowProducts = products
    .filter((item) => isLowStock(item))
    .map((item) => ({
      id: item.id,
      name: item.name,
      qty: Number(item.stock_quantity),
      unit: 'kg',
      type: 'product' as const
    }))
    .slice(0, 5)

  const lowIngredients = ingredients
    .filter((item) => isLowStock(item))
    .map((item) => ({
      id: item.id,
      name: item.name,
      qty: Number(item.quantity),
      unit: item.unit,
      type: 'ingredient' as const
    }))
    .slice(0, 5)

  return { lowProducts, lowIngredients }
}

export function customerInsight(
  customers: Array<{ outstanding_balance?: number; ledger_balance?: number; total_credit?: number }>,
  sales: Array<{ customer_id?: number | null; balance: number; amount_paid: number; sale_date: string }>,
  period: SalesPeriod
) {
  const periodSales = filterByPeriod(sales, period, 'sale_date')
  const creditCustomers = customers.filter(
    (customer) => Number(customer.outstanding_balance ?? 0) + Number(customer.ledger_balance ?? 0) > 0
  )
  const creditOwed = creditCustomers.reduce(
    (sum, customer) => sum + Number(customer.total_credit ?? customer.outstanding_balance ?? 0),
    0
  )
  const periodCreditCreated = periodSales.reduce((sum, sale) => sum + Number(sale.balance), 0)
  const periodCashFromSales = periodSales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0)

  return {
    totalCustomers: customers.length,
    creditCustomers: creditCustomers.length,
    creditOwed,
    periodCreditCreated,
    periodCashFromSales
  }
}
