"use client"
import Link from 'next/link'
import React, { useState } from 'react'
import { useProducts } from '../../../hooks/useProducts'
import { useCustomers, useIngredients, useProduction, useSales, useExpenses, usePurchases, useRepayments, useCashEntries, useLiabilities, useCreditLedgers } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { isLowStock } from '../../../lib/stock'
import { formatStockKg } from '../../../lib/productStock'
import { averageCostPerProduct, estimateSalesCogs } from '../../../lib/productionCost'
import { isInSalesPeriod, salesPeriodLabels, type SalesPeriod } from '../../../lib/periods'
import { toLocalDateKey, todayLocalKey } from '../../../lib/dates'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Period = Exclude<SalesPeriod, 'today'>

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('all')
  const { data: products } = useProducts()
  const { data: ingredients } = useIngredients()
  const { data: customers } = useCustomers()
  const { data: production } = useProduction()
  const { data: sales } = useSales()
  const { data: expenses } = useExpenses()
  const { data: purchases } = usePurchases()
  const { data: repayments } = useRepayments()
  const { data: cashEntries } = useCashEntries()
  const { data: liabilities } = useLiabilities()
  const { data: creditLedgers } = useCreditLedgers()

  const productList = Array.isArray(products) ? products : []
  const ingredientList = Array.isArray(ingredients) ? ingredients : []
  const customerList = Array.isArray(customers) ? customers : []
  const productionList = Array.isArray(production) ? production : []
  const salesList = Array.isArray(sales) ? sales : []
  const expensesList = Array.isArray(expenses) ? expenses : []
  const purchaseList = Array.isArray(purchases) ? purchases : []
  const repaymentList = Array.isArray(repayments) ? repayments : []
  const cashList = Array.isArray(cashEntries) ? cashEntries : []
  const liabilityList = Array.isArray(liabilities) ? liabilities : []
  const ledgerList = Array.isArray(creditLedgers) ? creditLedgers : []
  const totalLedgerCreditCreated = ledgerList.reduce((acc, row) => acc + Number(row.total_amount), 0)
  const today = todayLocalKey()
  const todaySales = salesList.filter((s: any) => toLocalDateKey(s.sale_date) === today)
  const todayProduction = productionList.filter((batch: any) => toLocalDateKey(batch.produced_at) === today)
  const todayPurchases = purchaseList.filter((purchase: any) => toLocalDateKey(purchase.purchase_date) === today)
  const periodSales = salesList.filter((sale: any) => isInSalesPeriod(sale.sale_date, period))
  const periodExpenses = expensesList.filter((expense: any) => isInSalesPeriod(expense.expense_date ?? expense.created_at, period))
  const periodPurchases = purchaseList.filter((purchase: any) => isInSalesPeriod(purchase.purchase_date, period))
  const periodProduction = productionList.filter((batch: any) => isInSalesPeriod(batch.produced_at, period))
  const periodRepayments = repaymentList.filter((payment: any) => isInSalesPeriod(payment.payment_date, period))

  const totalRevenue = salesList.reduce((acc, s: any) => acc + Number(s.total_amount), 0)
  const totalCashCollected = salesList.reduce((acc, s: any) => acc + Number(s.amount_paid), 0)
  const totalExpenses = expensesList.reduce((acc, e: any) => acc + Number(e.amount), 0)
  const outstandingCredit = salesList.reduce((acc, s: any) => acc + Number(s.balance), 0)
  const ledgerCredit = ledgerList.reduce((acc, row) => acc + Number(row.balance), 0)
  const totalCreditOwed = outstandingCredit + ledgerCredit
  const latestCash = cashList[0] ? Number(cashList[0].amount) : 0
  const debtsPayable = liabilityList.reduce((acc, item) => acc + Number(item.balance), 0)
  const netPosition = latestCash + totalCreditOwed - debtsPayable
  const todayRevenue = todaySales.reduce((acc, s: any) => acc + Number(s.total_amount), 0)
  const todayProduced = todayProduction.reduce((acc, batch: any) => acc + Number(batch.quantity_produced), 0)
  const customersWithCredit = customerList.filter((customer: any) => Number(customer.outstanding_balance) > 0)
  const periodRevenue = periodSales.reduce((acc, sale: any) => acc + Number(sale.total_amount), 0)
  const periodCash = periodSales.reduce((acc, sale: any) => acc + Number(sale.amount_paid), 0)
  const periodCreditCreated = periodSales.reduce((acc, sale: any) => acc + Number(sale.balance), 0)
  const periodRepaymentCash = periodRepayments.reduce((acc, payment: any) => acc + Number(payment.amount), 0)
  const periodOperatingCosts = periodExpenses.reduce((acc, expense: any) => acc + Number(expense.amount), 0)
  const periodPurchaseCosts = periodPurchases.reduce((acc, purchase: any) => acc + Number(purchase.cost_total), 0)
  const periodProduced = periodProduction.reduce((acc, batch: any) => acc + Number(batch.quantity_produced), 0)
  const periodSoldUnits = periodSales.reduce((acc, sale: any) => acc + Number(sale.quantity), 0)

  const avgCostByProduct = averageCostPerProduct(productionList)
  const periodCogs = estimateSalesCogs(periodSales, avgCostByProduct)
  const totalCogs = estimateSalesCogs(salesList, avgCostByProduct)
  const periodProductionSpend = periodProduction.reduce((acc, batch: any) => acc + Number(batch.total_cost ?? 0), 0)
  const periodMaterialSpend = periodProduction.reduce((acc, batch: any) => acc + Number(batch.material_cost ?? 0), 0)
  const periodOverheadSpend = periodProduction.reduce(
    (acc, batch: any) => acc + Number(batch.labor_cost ?? 0) + Number(batch.equipment_cost ?? 0) + Number(batch.other_overhead ?? 0),
    0
  )

  const periodNetCash = periodCash + periodRepaymentCash - periodOperatingCosts - periodPurchaseCosts
  const periodNetProfit = periodRevenue - periodCogs - periodOperatingCosts
  const periodProfitMargin = periodRevenue > 0 ? ((periodNetProfit / periodRevenue) * 100).toFixed(1) : '0'
  const totalPurchaseCosts = purchaseList.reduce((acc, purchase: any) => acc + Number(purchase.cost_total), 0)
  const netProfit = totalRevenue - totalCogs - totalExpenses
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

  const lowStockProducts = productList.filter((product: any) => isLowStock(product))
  const lowStockIngredients = ingredientList.filter((ingredient: any) => isLowStock(ingredient))
  const rawMaterialValue = ingredientList.reduce((acc: number, i: any) => acc + Number(i.quantity) * Number(i.cost_per_unit), 0)
  const finishedStockValue = productList.reduce((acc: number, p: any) => acc + Number(p.stock_quantity) * Number(p.selling_price), 0)
  const totalFinishedKg = productList.reduce((acc: number, p: any) => acc + Number(p.stock_quantity), 0)
  const totalRawMaterialKg = ingredientList.reduce((acc: number, i: any) => acc + Number(i.quantity), 0)
  const ingredientCategories = Object.values(ingredientList.reduce((acc: any, ingredient: any) => {
    const category = ingredient.category || 'Other'
    if (!acc[category]) acc[category] = { name: category, count: 0, value: 0, low: 0 }
    acc[category].count += 1
    acc[category].value += Number(ingredient.quantity) * Number(ingredient.cost_per_unit)
    if (isLowStock(ingredient)) acc[category].low += 1
    return acc
  }, {}))
  const recentTransactions = [
    ...periodSales.map((sale: any) => ({
      date: sale.sale_date,
      type: 'Sale cash',
      label: `${sale.product_name ?? 'Product'}${sale.customer_name ? ` • ${sale.customer_name}` : ''}`,
      cashIn: Number(sale.amount_paid),
      cashOut: 0
    })),
    ...periodRepayments.map((payment: any) => ({
      date: payment.payment_date,
      type: 'Credit repayment',
      label: payment.sale_code ?? 'Sale repayment',
      cashIn: Number(payment.amount),
      cashOut: 0
    })),
    ...periodPurchases.map((purchase: any) => ({
      date: purchase.purchase_date,
      type: 'Raw material purchase',
      label: purchase.ingredient_name ?? 'Raw material',
      cashIn: 0,
      cashOut: Number(purchase.cost_total)
    })),
    ...periodExpenses.map((expense: any) => ({
      date: expense.expense_date ?? expense.created_at,
      type: 'Expense',
      label: expense.title,
      cashIn: 0,
      cashOut: Number(expense.amount)
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12)

  const revenueByProduct = productList.map((p: any) => {
    const productSales = periodSales.filter((s: any) => s.product_id === p.id)
    const revenue = productSales.reduce((acc, s: any) => acc + Number(s.total_amount), 0)
    const unitsSold = productSales.reduce((acc, s: any) => acc + Number(s.quantity), 0)
    const productionCost = unitsSold * (avgCostByProduct[p.id] ?? 0)
    return {
      name: p.name,
      revenue,
      productionCost,
      profit: revenue - productionCost
    }
  }).filter((x) => x.revenue > 0)

  const expenseByCategory = periodExpenses.reduce((acc: any, e: any) => {
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
            <div className="text-xs font-bold uppercase tracking-[0.28em] text-spice-200">Dashboard</div>
            <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">Inventory, Sales, and Finance</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-100 sm:text-base">
              See raw materials, stock, sales, credit, purchases, expenses, and cash flow for the selected period.
            </p>
          </div>
            <div className="space-y-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
              <div className="text-xs uppercase tracking-[0.18em] text-spice-100">All-time sales (never deleted by updates)</div>
              <div className="mt-1 text-3xl font-black">{totalRevenue.toFixed(2)} ETB</div>
              <div className="mt-1 text-xs text-spice-100">{salesList.length} sale{salesList.length === 1 ? '' : 's'} in your database</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
              <div className="text-xs uppercase tracking-[0.18em] text-spice-100">{salesPeriodLabels[period]} sales (filtered view)</div>
              <div className="mt-1 text-2xl font-black">{periodRevenue.toFixed(2)} ETB</div>
            </div>
            <div className="flex rounded-2xl bg-white/10 p-1 ring-1 ring-white/15">
              {(['week', 'month', 'all'] as Period[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors ${period === item ? 'bg-white text-earth-950' : 'text-earth-100 hover:bg-white/10'}`}
                >
                  {item === 'week' ? 'Week' : item === 'month' ? 'Month' : 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/products" className="metric-card block border-2 border-green-200 bg-green-50/50">
          <div className="metric-label">Finished goods in stock</div>
          <div className="metric-value text-green-700">{formatStockKg(totalFinishedKg)}</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">
            {productList.length} product{productList.length === 1 ? '' : 's'} • {finishedStockValue.toFixed(2)} ETB value
          </div>
        </Link>
        <Link href="/admin/ingredients" className="metric-card block border-2 border-amber-200 bg-amber-50/40">
          <div className="metric-label">Raw materials on hand</div>
          <div className="metric-value text-amber-800">{totalRawMaterialKg.toFixed(1)} kg total</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">
            {ingredientList.length} materials • {rawMaterialValue.toFixed(2)} ETB value
          </div>
        </Link>
        <Link href="/admin/production" className="metric-card block">
          <div className="metric-label">Stock changes today</div>
          <div className="metric-value text-spice-700">+{todayProduced} / −{todaySales.reduce((acc, s: any) => acc + Number(s.quantity), 0)} kg</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Produced today minus sold today</div>
        </Link>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Current Finished Goods Stock</h2>
            <p className="text-sm text-earth-500">Kg available to sell. Updates when you record production or sales.</p>
          </div>
          <Link href="/admin/products" className="text-sm font-bold text-spice-700 hover:text-spice-900">Manage products</Link>
        </div>
        {productList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">No finished goods yet. Add products under Stock.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">In stock (kg)</th>
                  <th className="px-4 py-3 text-left">Produced</th>
                  <th className="px-4 py-3 text-left">Sold</th>
                  <th className="px-4 py-3 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product: any) => {
                  const low = isLowStock(product)
                  const stockKg = Number(product.stock_quantity)
                  const value = stockKg * Number(product.selling_price)
                  return (
                    <tr key={product.id} className={`table-row ${low ? 'bg-red-50/60' : ''}`}>
                      <td className="px-4 py-3 font-bold text-earth-950">
                        {product.name}
                        {low && <span className="ml-2 text-xs font-bold text-red-600">LOW</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-black ${stockKg > 0 ? 'text-green-700' : 'text-earth-400'}`}>
                          {formatStockKg(stockKg)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-earth-600">{formatStockKg(product.total_produced ?? 0)}</td>
                      <td className="px-4 py-3 text-earth-600">{formatStockKg(product.total_sold ?? 0)}</td>
                      <td className="px-4 py-3 font-semibold text-earth-800">{value.toFixed(2)} ETB</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-earth-200 bg-earth-50 font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-green-700">{formatStockKg(totalFinishedKg)}</td>
                  <td className="px-4 py-3" colSpan={2} />
                  <td className="px-4 py-3">{finishedStockValue.toFixed(2)} ETB</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/finance" className="metric-card block border-2 border-spice-200 bg-spice-50/50">
          <div className="metric-label">Total money (net position)</div>
          <div className={`metric-value ${netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>{netPosition.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">
            Cash {latestCash.toFixed(2)} + customer credit {totalCreditOwed.toFixed(2)} − debts {debtsPayable.toFixed(2)}. Tap for Finance desk.
          </div>
        </Link>
        <Link href="/admin/sales" className="metric-card block">
          <div className="metric-label">{salesPeriodLabels[period]} sales trace</div>
          <div className="metric-value text-spice-700">{periodRevenue.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">{periodSoldUnits} kg sold • {periodSales.length} sales. Open Sales for full list.</div>
        </Link>
        <Link href="/admin/finance" className="metric-card block">
          <div className="metric-label">Cash on hand (last count)</div>
          <div className="metric-value text-green-700">{latestCash.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">{cashList[0] ? `Counted ${new Date(cashList[0].entry_date).toLocaleDateString()}` : 'Record a cash count on Finance page'}</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Today&apos;s sales</div>
          <div className="metric-value text-spice-700">{todayRevenue.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">{todaySales.length} sale{todaySales.length === 1 ? '' : 's'} posted today.</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Today&apos;s production</div>
          <div className="metric-value text-amber-700">{todayProduced} kg</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">{todayProduction.length} batch{todayProduction.length === 1 ? '' : 'es'} completed today.</div>
        </div>
        <Link href="/admin/customers" className="metric-card block">
          <div className="metric-label">Credit customers</div>
          <div className="metric-value text-red-700">{customersWithCredit.length}</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Click to review customer balances.</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/ingredients" className="metric-card block">
          <div className="metric-label">Raw materials value</div>
          <div className="metric-value text-green-700">{rawMaterialValue.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">{ingredientList.length} materials. Click to view stock.</div>
        </Link>
        <Link href="/admin/products" className="metric-card block">
          <div className="metric-label">Finished stock value</div>
          <div className="metric-value text-spice-700">{finishedStockValue.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">{formatStockKg(totalFinishedKg)} on hand. Click for full list.</div>
        </Link>
        <Link href="/admin/products?filter=low" className="metric-card block">
          <div className="metric-label">Low finished goods</div>
          <div className="metric-value text-red-700">{lowStockProducts.length}</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Click to open reorder list.</div>
        </Link>
        <Link href="/admin/ingredients?filter=low" className="metric-card block">
          <div className="metric-label">Low raw materials</div>
          <div className="metric-value text-orange-700">{lowStockIngredients.length}</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Click to open reorder list.</div>
        </Link>
        <Link href="/admin/customers" className="metric-card block">
          <div className="metric-label">Credit ledger (customers owe)</div>
          <div className="metric-value text-spice-700">{ledgerCredit.toFixed(2)} ETB open</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">
            {totalLedgerCreditCreated.toFixed(2)} ETB recorded total • {ledgerList.filter((row) => Number(row.balance) > 0).length} open
          </div>
        </Link>
        <Link href="/admin/finance#record-debt" className="metric-card block">
          <div className="metric-label">You owe others</div>
          <div className="metric-value text-red-700">{debtsPayable.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Record bank, family, supplier debts on Finance</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Sold this period</div>
          <div className="metric-value text-blue-700">{periodSoldUnits} kg</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Produced this period</div>
          <div className="metric-value text-amber-700">{periodProduced} kg</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Credit created</div>
          <div className="metric-value text-red-700">{periodCreditCreated.toFixed(2)} ETB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Cash collected</div>
          <div className="metric-value text-green-700">{(periodCash + periodRepaymentCash).toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Sales cash + credit repayments.</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Costs paid</div>
          <div className="metric-value text-purple-700">{(periodOperatingCosts + periodPurchaseCosts).toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Raw purchases + expenses.</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Net cash movement</div>
          <div className={`metric-value ${periodNetCash >= 0 ? 'text-green-700' : 'text-red-700'}`}>{periodNetCash.toFixed(2)} ETB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">{salesPeriodLabels[period]} production cost</div>
          <div className="metric-value text-amber-700">{periodProductionSpend.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">
            Materials {periodMaterialSpend.toFixed(2)} + overhead {periodOverheadSpend.toFixed(2)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{salesPeriodLabels[period]} cost of goods sold</div>
          <div className="metric-value text-orange-700">{periodCogs.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Based on average production cost per unit sold.</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{salesPeriodLabels[period]} operating costs</div>
          <div className="metric-value text-purple-700">{periodOperatingCosts.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Rent, transport, packaging, salaries, etc.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">{salesPeriodLabels[period]} estimated net profit</div>
          <div className={`metric-value ${periodNetProfit >= 0 ? 'text-spice-700' : 'text-red-700'}`}>{periodNetProfit.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Sales − production cost of goods sold − operating expenses.</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{salesPeriodLabels[period]} margin estimate</div>
          <div className={`metric-value ${Number(periodProfitMargin) >= 0 ? 'text-amber-700' : 'text-red-700'}`}>{periodProfitMargin}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{salesPeriodLabels[period]} raw material purchases</div>
          <div className="metric-value text-earth-700">{periodPurchaseCosts.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Cash spent restocking (separate from production COGS).</div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-5 shadow-sm">
          <h2 className="text-lg font-black text-amber-900 mb-2">Finished goods need attention</h2>
          <Link href="/admin/products?filter=low" className="text-sm font-semibold text-amber-700 hover:text-amber-900">{lowStockProducts.map((p: any) => `${p.name}: ${p.stock_quantity} kg`).join(', ')}</Link>
        </div>
      )}

      {lowStockIngredients.length > 0 && (
        <div className="rounded-3xl bg-orange-50 border border-orange-200 p-5 shadow-sm">
          <h2 className="text-lg font-black text-orange-900 mb-2">Raw material reorder list</h2>
          <Link href="/admin/ingredients?filter=low" className="text-sm font-semibold text-orange-700 hover:text-orange-900">{lowStockIngredients.map((i: any) => `${i.name}: ${Number(i.quantity).toFixed(3)} ${i.unit}`).join(', ')}</Link>
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Raw Materials by Category</h2>
            <p className="text-sm text-earth-500">Click a category to open the filtered stock view.</p>
          </div>
          <Link href="/admin/ingredients" className="text-sm font-bold text-spice-700 hover:text-spice-900">View all raw materials</Link>
        </div>
        {ingredientCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">No raw materials yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ingredientCategories.map((category: any) => (
              <Link key={category.name} href={`/admin/ingredients?category=${encodeURIComponent(category.name)}`} className="rounded-2xl border border-earth-100 bg-earth-50 p-4 transition hover:-translate-y-0.5 hover:bg-spice-50">
                <div className="text-sm font-black text-earth-950">{category.name}</div>
                <div className="mt-2 text-2xl font-black text-spice-700">{category.value.toFixed(2)} ETB</div>
                <div className="mt-1 text-xs font-semibold text-earth-500">{category.count} items {category.low > 0 ? `• ${category.low} low` : ''}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Financial Transactions</h2>
            <p className="text-sm text-earth-500">Cash in and cash out for {salesPeriodLabels[period].toLowerCase()}.</p>
          </div>
          <div className={`rounded-2xl px-4 py-2 text-sm font-black ${periodNetCash >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            Net cash: {periodNetCash.toFixed(2)} ETB
          </div>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">No financial transactions in this period.</div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="table-head">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Cash In</th>
                <th className="px-4 py-3">Cash Out</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction, index) => (
                <tr key={`${transaction.type}-${transaction.date}-${index}`} className="table-row">
                  <td className="px-4 py-3">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-bold text-earth-950">{transaction.type}</td>
                  <td className="px-4 py-3 text-earth-600">{transaction.label}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{transaction.cashIn > 0 ? `${transaction.cashIn.toFixed(2)} ETB` : '-'}</td>
                  <td className="px-4 py-3 font-bold text-red-700">{transaction.cashOut > 0 ? `${transaction.cashOut.toFixed(2)} ETB` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-label">Lifetime revenue</div>
          <div className="metric-value text-blue-700">{totalRevenue.toFixed(2)} ETB</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Lifetime cash collected</div>
          <div className="metric-value text-green-700">{totalCashCollected.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Sale payments only, excluding repayments.</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">All-time net estimate</div>
          <div className={`metric-value ${netProfit >= 0 ? 'text-spice-700' : 'text-red-700'}`}>{netProfit.toFixed(2)} ETB</div>
          <div className="mt-2 text-xs font-semibold text-earth-500">Revenue − production COGS ({totalCogs.toFixed(2)}) − expenses. Margin: {profitMargin}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display text-xl font-black text-earth-950 mb-1">Sales & Profit by Product</h2>
          <p className="mb-4 text-sm text-earth-500">Revenue and estimated profit after production cost per unit sold.</p>
          {revenueByProduct.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByProduct}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue" fill="#c05e20" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#2f855a" radius={[6, 6, 0, 0]} />
              </BarChart>
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
