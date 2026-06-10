"use client"
import React from 'react'
import { useProducts } from '../../../hooks/useProducts'
import { useCustomers, useIngredients, useProduction, useSales, useExpenses } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { data: products } = useProducts()
  const { data: ingredients } = useIngredients()
  const { data: customers } = useCustomers()
  const { data: production } = useProduction()
  const { data: sales } = useSales()
  const { data: expenses } = useExpenses()

  const productList = Array.isArray(products) ? products : []
  const ingredientList = Array.isArray(ingredients) ? ingredients : []
  const customerList = Array.isArray(customers) ? customers : []
  const productionList = Array.isArray(production) ? production : []
  const salesList = Array.isArray(sales) ? sales : []
  const expensesList = Array.isArray(expenses) ? expenses : []
  const today = new Date().toISOString().slice(0, 10)
  const todaySales = salesList.filter((s: any) => new Date(s.sale_date).toISOString().slice(0, 10) === today)
  const todayProduction = productionList.filter((batch: any) => new Date(batch.produced_at).toISOString().slice(0, 10) === today)

  const totalRevenue = salesList.reduce((acc, s: any) => acc + Number(s.total_amount), 0)
  const totalCashCollected = salesList.reduce((acc, s: any) => acc + Number(s.amount_paid), 0)
  const totalExpenses = expensesList.reduce((acc, e: any) => acc + Number(e.amount), 0)
  const outstandingCredit = salesList.reduce((acc, s: any) => acc + Number(s.balance), 0)
  const todayRevenue = todaySales.reduce((acc, s: any) => acc + Number(s.total_amount), 0)
  const todayProduced = todayProduction.reduce((acc, batch: any) => acc + Number(batch.quantity_produced), 0)
  const customersWithCredit = customerList.filter((customer: any) => Number(customer.outstanding_balance) > 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

  const lowStockProducts = productList.filter((p: any) => p.stock_quantity <= p.alert_threshold)
  const lowStockIngredients = ingredientList.filter((i: any) => Number(i.quantity) <= Number(i.alert_threshold))

  const revenueByProduct = productList.map((p: any) => ({
    name: p.name,
    revenue: salesList.filter((s: any) => s.product_id === p.id).reduce((acc, s: any) => acc + Number(s.total_amount), 0)
  })).filter(x => x.revenue > 0)

  const expenseByCategory = expensesList.reduce((acc: any, e: any) => {
    const existing = acc.find((x: any) => x.name === e.category)
    if (existing) existing.value += Number(e.amount)
    else acc.push({ name: e.category, value: Number(e.amount) })
    return acc
  }, [])

  const COLORS = ['#c05e20', '#de9447', '#7d5f48', '#d4782a', '#a0471c', '#937456']

  return (
    <>
      <AdminNav />
      <div className="app-page">
      <div className="app-container">
      <div className="page-hero">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.28em] text-spice-200">Command center</div>
            <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">Today&apos;s Inventory Pulse</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-100 sm:text-base">
              Production output, daily sales, customer credit, and low-stock risk in one operations view.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
            <div className="text-xs uppercase tracking-[0.18em] text-spice-100">Today&apos;s sales</div>
            <div className="mt-1 text-3xl font-black">{todayRevenue.toFixed(2)} ETB</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-label">Today sales</div>
          <div className="metric-value text-spice-700">{todayRevenue.toFixed(2)} ETB</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Today produced</div>
          <div className="metric-value text-amber-700">{todayProduced} units</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Credit customers</div>
          <div className="metric-value text-red-700">{customersWithCredit.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Low raw materials</div>
          <div className="metric-value text-orange-700">{lowStockIngredients.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Lifetime revenue</div>
          <div className="metric-value text-blue-700">{totalRevenue.toFixed(2)} ETB</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cash collected</div>
          <div className="metric-value text-green-700">{totalCashCollected.toFixed(2)} ETB</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Outstanding credit</div>
          <div className="metric-value text-red-700">{outstandingCredit.toFixed(2)} ETB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Operating costs</div>
          <div className="metric-value text-purple-700">{totalExpenses.toFixed(2)} ETB</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Estimated net</div>
          <div className="metric-value text-spice-700">{netProfit.toFixed(2)} ETB</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Margin estimate</div>
          <div className="metric-value text-amber-700">{profitMargin}%</div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-5 shadow-sm">
          <h2 className="text-lg font-black text-amber-900 mb-2">Finished goods need attention</h2>
          <div className="text-sm text-amber-700">{lowStockProducts.map((p: any) => `${p.name}: ${p.stock_quantity} units`).join(', ')}</div>
        </div>
      )}

      {lowStockIngredients.length > 0 && (
        <div className="rounded-3xl bg-orange-50 border border-orange-200 p-5 shadow-sm">
          <h2 className="text-lg font-black text-orange-900 mb-2">Raw material reorder list</h2>
          <div className="text-sm text-orange-700">{lowStockIngredients.map((i: any) => `${i.name}: ${Number(i.quantity).toFixed(3)} ${i.unit}`).join(', ')}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display text-xl font-black text-earth-950 mb-1">Revenue by Finished Good</h2>
          <p className="mb-4 text-sm text-earth-500">Which products are driving sales value.</p>
          {revenueByProduct.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByProduct}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#c05e20" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div className="rounded-2xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">No sales data yet.</div>}
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-black text-earth-950 mb-1">Operating Cost Split</h2>
          <p className="mb-4 text-sm text-earth-500">Where money is being spent across the business.</p>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>{expenseByCategory.map((entry: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          ) : <div className="rounded-2xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">No operating costs recorded yet.</div>}
        </div>
      </div>
    </div>
    </div>
    </>
  )
}
