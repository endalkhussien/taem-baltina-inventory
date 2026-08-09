"use client"
import React, { useMemo, useState } from 'react'
import { useProducts } from '../../../hooks/useProducts'
import { useSales, useExpenses } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts'
import {
  buildEthiopianMonthlyFinancials,
  ethiopianYearsFromMonthly,
  filterMonthlyByEthYear,
} from '../../../lib/monthly-financials'
import { formatEthiopianDate, parseBusinessDate } from '../../../lib/ethiopian-calendar'

function etb(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DashboardPage() {
  const { data: products } = useProducts()
  const { data: sales } = useSales()
  const { data: expenses } = useExpenses()

  const productList = Array.isArray(products) ? products : []
  const salesList = Array.isArray(sales) ? sales : []
  const expensesList = Array.isArray(expenses) ? expenses : []

  const monthlyAll = useMemo(
    () => buildEthiopianMonthlyFinancials(salesList, expensesList),
    [salesList, expensesList]
  )
  const ethYears = useMemo(() => ethiopianYearsFromMonthly(monthlyAll), [monthlyAll])
  /** null = not chosen yet → default to latest Ethiopian year */
  const [ethYear, setEthYear] = useState<number | 'all' | null>(null)
  const activeYear: number | 'all' = ethYear ?? ethYears[0] ?? 'all'

  const monthly = useMemo(
    () => filterMonthlyByEthYear(monthlyAll, activeYear),
    [monthlyAll, activeYear]
  )

  const totalRevenue = monthly.reduce((acc, r) => acc + r.revenue, 0)
  const totalCashCollected = monthly.reduce((acc, r) => acc + r.cashCollected, 0)
  const totalExpenses = monthly.reduce((acc, r) => acc + r.expenses, 0)
  const outstandingCredit = salesList.reduce((acc, s: any) => acc + Number(s.balance), 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

  const lowStockProducts = productList.filter((p: any) => p.stock_quantity <= p.alert_threshold)

  const revenueByProduct = productList.map((p: any) => ({
    name: p.name,
    revenue: salesList
      .filter((s: any) => s.product_id === p.id)
      .reduce((acc, s: any) => acc + Number(s.total_amount), 0),
  })).filter((x) => x.revenue > 0)

  const expenseByCategory = expensesList.reduce((acc: any[], e: any) => {
    const existing = acc.find((x) => x.name === e.category)
    if (existing) existing.value += Number(e.amount)
    else acc.push({ name: e.category, value: Number(e.amount) })
    return acc
  }, [])

  const chartData = monthly.map((r) => ({
    name: r.label.replace(` ${r.year}`, ''),
    fullLabel: r.label,
    revenue: Number(r.revenue.toFixed(2)),
    expenses: Number(r.expenses.toFixed(2)),
    profit: Number(r.profit.toFixed(2)),
  }))

  const COLORS = ['#c05e20', '#de9447', '#7d5f48', '#d4782a', '#a0471c', '#937456']

  const yearLabel =
    activeYear === 'all' ? 'All years' : `Eth. year ${activeYear}`

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-earth-900">Financial Dashboard</h1>
              <p className="text-earth-500 text-sm mt-1">
                Monthly sales & profit by Ethiopian calendar · {yearLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="eth-year" className="text-sm text-earth-600 whitespace-nowrap">
                Ethiopian year
              </label>
              <select
                id="eth-year"
                className="border border-earth-200 rounded-lg px-3 py-2 text-sm bg-white text-earth-900"
                value={activeYear === 'all' ? 'all' : String(activeYear)}
                onChange={(e) => {
                  const v = e.target.value
                  setEthYear(v === 'all' ? 'all' : Number(v))
                }}
              >
                {ethYears.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
                <option value="all">All years</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card !p-5 border-l-4 border-l-blue-500">
              <div className="text-sm text-earth-500">Revenue (ETB)</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{etb(totalRevenue)}</div>
            </div>
            <div className="card !p-5 border-l-4 border-l-green-500">
              <div className="text-sm text-earth-500">Cash Collected (ETB)</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{etb(totalCashCollected)}</div>
            </div>
            <div className="card !p-5 border-l-4 border-l-red-500">
              <div className="text-sm text-earth-500">Outstanding Credit (ETB)</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{etb(outstandingCredit)}</div>
              <div className="text-xs text-earth-400 mt-1">All-time (not filtered by month)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card !p-5 border-l-4 border-l-purple-500">
              <div className="text-sm text-earth-500">Expenses (ETB)</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{etb(totalExpenses)}</div>
            </div>
            <div className="card !p-5 border-l-4 border-l-spice-500">
              <div className="text-sm text-earth-500">Net Profit (ETB)</div>
              <div className="text-2xl font-bold text-spice-600 mt-1">{etb(netProfit)}</div>
            </div>
            <div className="card !p-5 border-l-4 border-l-amber-500">
              <div className="text-sm text-earth-500">Profit Margin</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{profitMargin}%</div>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <h2 className="text-lg font-semibold text-amber-800 mb-2">Low Stock Alert</h2>
              <div className="text-sm text-amber-700">
                {lowStockProducts.map((p: any) => `${p.name}: ${p.stock_quantity} units`).join(', ')}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold text-earth-900 mb-1">Monthly comparison (Ethiopian)</h2>
            <p className="text-sm text-earth-500 mb-4">
              Sales revenue, expenses, and profit per Ethiopian month — use this to close and compare months.
            </p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => etb(Number(value))}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullLabel ?? ''
                    }
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#9333ea" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#c05e20"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-earth-500 py-8 text-center">No monthly data yet</div>
            )}
          </div>

          <div className="card overflow-x-auto">
            <h2 className="text-lg font-semibold text-earth-900 mb-3">Month-by-month ledger</h2>
            {monthly.length === 0 ? (
              <div className="text-earth-500">No sales or expenses in this period</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-earth-500 border-b border-earth-100">
                    <th className="pb-2 pr-3 font-medium">Ethiopian month</th>
                    <th className="pb-2 pr-3 font-medium text-right">Sales (ETB)</th>
                    <th className="pb-2 pr-3 font-medium text-right">Cash (ETB)</th>
                    <th className="pb-2 pr-3 font-medium text-right">Expenses (ETB)</th>
                    <th className="pb-2 pr-3 font-medium text-right">Profit (ETB)</th>
                    <th className="pb-2 pr-3 font-medium text-right">Margin</th>
                    <th className="pb-2 font-medium text-right"># Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthly].reverse().map((row) => (
                    <tr key={row.key} className="border-t border-earth-50">
                      <td className="py-2.5 pr-3 font-medium text-earth-900">{row.label}</td>
                      <td className="py-2.5 pr-3 text-right text-blue-700">{etb(row.revenue)}</td>
                      <td className="py-2.5 pr-3 text-right text-green-700">{etb(row.cashCollected)}</td>
                      <td className="py-2.5 pr-3 text-right text-purple-700">{etb(row.expenses)}</td>
                      <td
                        className={`py-2.5 pr-3 text-right font-medium ${
                          row.profit >= 0 ? 'text-spice-600' : 'text-red-600'
                        }`}
                      >
                        {etb(row.profit)}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-earth-600">
                        {row.marginPct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-right text-earth-600">{row.salesCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-earth-200 font-semibold">
                    <td className="pt-3 pr-3 text-earth-900">Total</td>
                    <td className="pt-3 pr-3 text-right">{etb(totalRevenue)}</td>
                    <td className="pt-3 pr-3 text-right">{etb(totalCashCollected)}</td>
                    <td className="pt-3 pr-3 text-right">{etb(totalExpenses)}</td>
                    <td className={`pt-3 pr-3 text-right ${netProfit >= 0 ? 'text-spice-600' : 'text-red-600'}`}>
                      {etb(netProfit)}
                    </td>
                    <td className="pt-3 pr-3 text-right">{profitMargin}%</td>
                    <td className="pt-3 text-right">
                      {monthly.reduce((a, r) => a + r.salesCount, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-earth-900 mb-3">Revenue by Product</h2>
              {revenueByProduct.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByProduct}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => etb(Number(v))} />
                    <Bar dataKey="revenue" fill="#c05e20" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div>No sales data</div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-earth-900 mb-3">Expense Breakdown</h2>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      label
                    >
                      {expenseByCategory.map((_entry: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => etb(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div>No expense data</div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-earth-900 mb-3">Recent sales (Ethiopian date)</h2>
            {salesList.length === 0 ? (
              <div className="text-earth-500">No sales yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-earth-500 border-b">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Ethiopian date</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">Paid</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...salesList]
                    .sort((a: any, b: any) => {
                      const da = new Date(a.sale_date || a.created_at).getTime()
                      const db = new Date(b.sale_date || b.created_at).getTime()
                      return db - da
                    })
                    .slice(0, 12)
                    .map((s: any) => {
                      const d = parseBusinessDate(s.sale_date || s.created_at)
                      return (
                        <tr key={s.id} className="border-t border-earth-50">
                          <td className="py-2">{s.sale_code}</td>
                          <td className="py-2 text-earth-700">
                            {d ? formatEthiopianDate(d) : '—'}
                          </td>
                          <td className="py-2 text-right">{etb(Number(s.total_amount))}</td>
                          <td className="py-2 text-right">{etb(Number(s.amount_paid))}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                s.payment_status === 'Paid'
                                  ? 'bg-green-100 text-green-700'
                                  : s.payment_status === 'Partial'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {s.payment_status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
