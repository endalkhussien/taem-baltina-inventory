"use client"
import React from 'react'
import { useProducts } from '../../../hooks/useProducts'
import { useIngredients, useSales, useExpenses } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { data: products } = useProducts()
  const { data: ingredients } = useIngredients()
  const { data: sales } = useSales()
  const { data: expenses } = useExpenses()

  const productList = Array.isArray(products) ? products : []
  const ingredientList = Array.isArray(ingredients) ? ingredients : []
  const salesList = Array.isArray(sales) ? sales : []
  const expensesList = Array.isArray(expenses) ? expenses : []

  const totalRevenue = salesList.reduce((acc, s: any) => acc + Number(s.total_amount), 0)
  const totalCashCollected = salesList.reduce((acc, s: any) => acc + Number(s.amount_paid), 0)
  const totalExpenses = expensesList.reduce((acc, e: any) => acc + Number(e.amount), 0)
  const outstandingCredit = salesList.reduce((acc, s: any) => acc + Number(s.balance), 0)
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
      <div className="min-h-screen bg-spice-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-earth-900">Financial Dashboard</h1>
        <p className="text-earth-500 text-sm mt-1">Overview of revenue, expenses, and profit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card !p-5 border-l-4 border-l-blue-500">
          <div className="text-sm text-earth-500">Total Revenue (ETB)</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{totalRevenue.toFixed(2)}</div>
        </div>
        <div className="card !p-5 border-l-4 border-l-green-500">
          <div className="text-sm text-earth-500">Cash Collected (ETB)</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{totalCashCollected.toFixed(2)}</div>
        </div>
        <div className="card !p-5 border-l-4 border-l-red-500">
          <div className="text-sm text-earth-500">Outstanding Credit (ETB)</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{outstandingCredit.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card !p-5 border-l-4 border-l-purple-500">
          <div className="text-sm text-earth-500">Total Expenses (ETB)</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{totalExpenses.toFixed(2)}</div>
        </div>
        <div className="card !p-5 border-l-4 border-l-spice-500">
          <div className="text-sm text-earth-500">Net Profit (ETB)</div>
          <div className="text-2xl font-bold text-spice-600 mt-1">{netProfit.toFixed(2)}</div>
        </div>
        <div className="card !p-5 border-l-4 border-l-amber-500">
          <div className="text-sm text-earth-500">Profit Margin (%)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{profitMargin}%</div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Low Product Stock Alert</h2>
          <div className="text-sm text-amber-700">{lowStockProducts.map((p: any) => `${p.name}: ${p.stock_quantity} units`).join(', ')}</div>
        </div>
      )}

      {lowStockIngredients.length > 0 && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
          <h2 className="text-lg font-semibold text-orange-800 mb-2">Low Ingredient Stock Alert</h2>
          <div className="text-sm text-orange-700">{lowStockIngredients.map((i: any) => `${i.name}: ${Number(i.quantity).toFixed(3)} ${i.unit}`).join(', ')}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-earth-900 mb-3">Revenue by Product</h2>
          {revenueByProduct.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByProduct}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#c05e20" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div>No sales data</div>}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-earth-900 mb-3">Expense Breakdown</h2>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>{expenseByCategory.map((entry: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          ) : <div>No expense data</div>}
        </div>
      </div>
    </div>
    </div>
    </>
  )
}
