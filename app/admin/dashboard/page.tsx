"use client"
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useProducts } from '../../../hooks/useProducts'
import {
  useCustomers,
  useIngredients,
  useSales,
  useExpenses,
  usePurchases,
  useRepayments,
  useCashEntries,
  useLiabilities,
  useCreditLedgers,
  useProduction
} from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { averageCostPerProduct, estimateSalesCogs } from '../../../lib/productionCost'
import { isInSalesPeriod, salesPeriodLabels, type SalesPeriod } from '../../../lib/periods'
import { toLocalDateKey } from '../../../lib/dates'
import {
  buildSalesVsPurchaseChart,
  customerInsight,
  lowStockSummary,
  recentSalesList,
  topSellingProducts
} from '../../../lib/dashboardMetrics'
import { formatEtb } from '../../../lib/formatCurrency'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const CHART_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6']

function KpiCard({
  label,
  value,
  hint,
  href,
  tone = 'neutral'
}: {
  label: string
  value: string
  hint?: string
  href?: string
  tone?: 'sales' | 'purchase' | 'expense' | 'credit' | 'profit' | 'neutral'
}) {
  const tones = {
    sales: 'bg-rose-50 border-rose-100',
    purchase: 'bg-emerald-50 border-emerald-100',
    expense: 'bg-sky-50 border-sky-100',
    credit: 'bg-amber-50 border-amber-100',
    profit: 'bg-orange-50 border-orange-100',
    neutral: 'bg-white border-earth-100'
  }
  const iconTones = {
    sales: 'bg-rose-100 text-rose-600',
    purchase: 'bg-emerald-100 text-emerald-600',
    expense: 'bg-sky-100 text-sky-600',
    credit: 'bg-amber-100 text-amber-600',
    profit: 'bg-orange-100 text-orange-600',
    neutral: 'bg-earth-100 text-earth-600'
  }
  const icons = {
    sales: '₿',
    purchase: '↺',
    expense: '◆',
    credit: '!',
    profit: '▲',
    neutral: '•'
  }

  const body = (
    <div className={`kpi-card border ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="kpi-card-label">{label}</div>
          <div className="kpi-card-value">{value}</div>
          {hint && <div className="mt-2 text-xs text-earth-500">{hint}</div>}
        </div>
        <div className={`kpi-card-icon ${iconTones[tone]}`}>{icons[tone]}</div>
      </div>
    </div>
  )

  return href ? <Link href={href}>{body}</Link> : body
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<SalesPeriod>('week')
  const { data: products } = useProducts()
  const { data: ingredients } = useIngredients()
  const { data: customers } = useCustomers()
  const { data: sales } = useSales()
  const { data: expenses } = useExpenses()
  const { data: purchases } = usePurchases()
  const { data: repayments } = useRepayments()
  const { data: cashEntries } = useCashEntries()
  const { data: liabilities } = useLiabilities()
  const { data: creditLedgers } = useCreditLedgers()
  const { data: production } = useProduction()

  const productList = Array.isArray(products) ? products : []
  const ingredientList = Array.isArray(ingredients) ? ingredients : []
  const customerList = Array.isArray(customers) ? customers : []
  const salesList = Array.isArray(sales) ? sales : []
  const expensesList = Array.isArray(expenses) ? expenses : []
  const purchaseList = Array.isArray(purchases) ? purchases : []
  const repaymentList = Array.isArray(repayments) ? repayments : []
  const cashList = Array.isArray(cashEntries) ? cashEntries : []
  const liabilityList = Array.isArray(liabilities) ? liabilities : []
  const ledgerList = Array.isArray(creditLedgers) ? creditLedgers : []
  const productionList = Array.isArray(production) ? production : []

  const periodSales = useMemo(
    () => salesList.filter((sale) => isInSalesPeriod(sale.sale_date, period)),
    [salesList, period]
  )
  const periodExpenses = useMemo(
    () => expensesList.filter((expense) => isInSalesPeriod(expense.expense_date ?? '', period)),
    [expensesList, period]
  )
  const periodPurchases = useMemo(
    () => purchaseList.filter((purchase) => isInSalesPeriod(purchase.purchase_date, period)),
    [purchaseList, period]
  )
  const periodRepayments = useMemo(
    () => repaymentList.filter((payment) => isInSalesPeriod(payment.payment_date, period)),
    [repaymentList, period]
  )

  const periodRevenue = periodSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
  const periodPurchaseCosts = periodPurchases.reduce((sum, purchase) => sum + Number(purchase.cost_total), 0)
  const periodOperatingCosts = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const periodCreditCreated = periodSales.reduce((sum, sale) => sum + Number(sale.balance), 0)
  const ledgerCredit = ledgerList.reduce((sum, row) => sum + Number(row.balance), 0)
  const salesCredit = salesList.reduce((sum, sale) => sum + Number(sale.balance), 0)
  const totalCreditOwed = salesCredit + ledgerCredit
  const latestCash = cashList[0] ? Number(cashList[0].amount) : 0
  const debtsPayable = liabilityList.reduce((sum, item) => sum + Number(item.balance), 0)
  const netPosition = latestCash + totalCreditOwed - debtsPayable

  const avgCostByProduct = useMemo(() => averageCostPerProduct(productionList), [productionList])
  const periodCogs = estimateSalesCogs(periodSales, avgCostByProduct)
  const periodNetProfit = periodRevenue - periodCogs - periodOperatingCosts
  const periodCash = periodSales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0)
  const periodRepaymentCash = periodRepayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const periodNetCash = periodCash + periodRepaymentCash - periodOperatingCosts - periodPurchaseCosts

  const chartData = useMemo(
    () => buildSalesVsPurchaseChart(salesList, purchaseList, period),
    [salesList, purchaseList, period]
  )
  const topProducts = useMemo(() => topSellingProducts(salesList, period), [salesList, period])
  const recentSales = useMemo(() => recentSalesList(salesList, period), [salesList, period])
  const stockAlerts = useMemo(() => lowStockSummary(productList, ingredientList), [productList, ingredientList])
  const customersSummary = useMemo(
    () => customerInsight(customerList, salesList, period),
    [customerList, salesList, period]
  )

  const expenseByCategory = periodExpenses.reduce((acc: Array<{ name: string; value: number }>, expense) => {
    const existing = acc.find((row) => row.name === expense.category)
    if (existing) existing.value += Number(expense.amount)
    else acc.push({ name: expense.category, value: Number(expense.amount) })
    return acc
  }, [])

  const customerPie = [
    { name: 'Cash sales', value: customersSummary.periodCashFromSales },
    { name: 'New credit', value: customersSummary.periodCreditCreated },
    { name: 'Open credit', value: customersSummary.creditOwed }
  ].filter((row) => row.value > 0)

  const periodOptions: SalesPeriod[] = ['today', 'week', 'month', 'all']

  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow">Business insight</div>
              <h1 className="mt-2 font-display text-3xl font-black text-earth-950 sm:text-4xl">Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-earth-500">
                Sales, purchases, expenses, credit, and stock at a glance for {salesPeriodLabels[period].toLowerCase()}.
              </p>
            </div>
            <div className="flex rounded-2xl border border-earth-200 bg-white p-1 shadow-sm">
              {periodOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriod(item)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                    period === item ? 'bg-spice-700 text-white' : 'text-earth-600 hover:bg-earth-50'
                  }`}
                >
                  {item === 'today' ? 'Today' : item === 'week' ? 'Week' : item === 'month' ? 'Month' : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total sales" value={formatEtb(periodRevenue)} hint={`${periodSales.length} sale${periodSales.length === 1 ? '' : 's'}`} href="/admin/sales" tone="sales" />
            <KpiCard label="Total purchase" value={formatEtb(periodPurchaseCosts)} hint={`${periodPurchases.length} restock${periodPurchases.length === 1 ? '' : 's'}`} href="/admin/ingredients" tone="purchase" />
            <KpiCard label="Total expenses" value={formatEtb(periodOperatingCosts)} hint={`${periodExpenses.length} expense${periodExpenses.length === 1 ? '' : 's'}`} href="/admin/finance" tone="expense" />
            <KpiCard label="Credit due" value={formatEtb(totalCreditOwed)} hint={`${customersSummary.creditCustomers} customer${customersSummary.creditCustomers === 1 ? '' : 's'}`} href="/admin/customers" tone="credit" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard label="Estimated profit" value={formatEtb(periodNetProfit)} hint="Sales − COGS − expenses" tone="profit" />
            <KpiCard label="Net cash movement" value={formatEtb(periodNetCash)} hint="Cash in − purchases − expenses" tone="neutral" />
            <KpiCard label="Net position" value={formatEtb(netPosition)} hint={`Cash ${formatEtb(latestCash, 2)} − debts ${formatEtb(debtsPayable, 2)}`} href="/admin/finance" tone="neutral" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="insight-panel xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="insight-panel-title">Sales vs purchase</h2>
                  <p className="insight-panel-subtitle">Daily comparison for {salesPeriodLabels[period].toLowerCase()}</p>
                </div>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece7e1" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatEtb(value)} />
                    <Bar dataKey="sales" name="Sales" fill="#f97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="purchases" name="Purchases" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="rounded-2xl border border-dashed border-earth-200 p-8 text-center text-sm text-earth-500">
                  No sales or purchases in this period yet.
                </div>
              )}
            </div>

            <div className="insight-panel">
              <h2 className="insight-panel-title">Customer overview</h2>
              <p className="insight-panel-subtitle">Cash vs credit for this period</p>
              {customerPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={customerPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72}>
                        {customerPie.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatEtb(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-earth-50 p-3">
                      <div className="text-earth-500">Customers</div>
                      <div className="font-bold">{customersSummary.totalCustomers}</div>
                    </div>
                    <div className="rounded-xl bg-earth-50 p-3">
                      <div className="text-earth-500">On credit</div>
                      <div className="font-bold">{customersSummary.creditCustomers}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">
                  No customer money activity in this period.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="insight-panel">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="insight-panel-title">Top selling products</h2>
                <Link href="/admin/sales" className="text-xs font-bold text-spice-700">View all</Link>
              </div>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product) => (
                    <div key={product.name} className="flex items-center justify-between rounded-xl bg-earth-50 px-3 py-2.5">
                      <div>
                        <div className="font-semibold text-earth-900">{product.name}</div>
                        <div className="text-xs text-earth-500">{product.qty.toFixed(2)} kg sold</div>
                      </div>
                      <div className="font-bold text-spice-700">{formatEtb(product.revenue)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-earth-500">No sales in this period.</div>
              )}
            </div>

            <div className="insight-panel">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="insight-panel-title">Low stock alerts</h2>
                <Link href="/admin/ingredients?filter=low" className="text-xs font-bold text-spice-700">View all</Link>
              </div>
              <div className="space-y-3">
                {stockAlerts.lowProducts.map((item) => (
                  <Link key={`p-${item.id}`} href="/admin/products?filter=low" className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
                    <div className="font-semibold text-earth-900">{item.name}</div>
                    <div className="text-sm font-bold text-amber-700">{item.qty.toFixed(2)} {item.unit}</div>
                  </Link>
                ))}
                {stockAlerts.lowIngredients.map((item) => (
                  <Link key={`i-${item.id}`} href="/admin/ingredients?filter=low" className="flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5">
                    <div className="font-semibold text-earth-900">{item.name}</div>
                    <div className="text-sm font-bold text-orange-700">{item.qty.toFixed(3)} {item.unit}</div>
                  </Link>
                ))}
                {stockAlerts.lowProducts.length === 0 && stockAlerts.lowIngredients.length === 0 && (
                  <div className="text-sm text-earth-500">All stock levels look healthy.</div>
                )}
              </div>
            </div>

            <div className="insight-panel">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="insight-panel-title">Recent sales</h2>
                <Link href="/admin/sales" className="text-xs font-bold text-spice-700">View all</Link>
              </div>
              {recentSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale) => (
                        <tr key={sale.id} className="border-t border-earth-100">
                          <td className="py-2.5">{toLocalDateKey(sale.sale_date)}</td>
                          <td className="py-2.5">
                            <div className="font-medium">{sale.product_name}</div>
                            <div className="text-xs text-earth-500">{sale.customer_name || 'Walk-in'}</div>
                          </td>
                          <td className="py-2.5 font-bold">{formatEtb(Number(sale.total_amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-earth-500">No recent sales in this period.</div>
              )}
            </div>
          </div>

          {expenseByCategory.length > 0 && (
            <div className="insight-panel">
              <h2 className="insight-panel-title">Expense breakdown</h2>
              <p className="insight-panel-subtitle">Where money went this period</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} label>
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatEtb(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
