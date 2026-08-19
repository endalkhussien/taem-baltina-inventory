"use client"

import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'
import { useToast } from '../../../components/ToastProvider'
import { formatEtb } from '../../../lib/formatCurrency'
import {
  useCashEntries,
  useCreditLedgers,
  useCustomers,
  useExpenses,
  useIngredients,
  useLiabilities,
  useLiabilityPayments,
  usePurchases,
  useRepayments,
  useSales
} from '../../../hooks/useModules'
import { useProducts } from '../../../hooks/useProducts'
import { useQueryClient } from '@tanstack/react-query'
import { isInSalesPeriod, salesPeriodLabels, summarizeSales, type SalesPeriod } from '../../../lib/periods'
import { formatCreditProductLines } from '../../../lib/credit'
import { exportBusinessBackup } from '../../../lib/exportReport'
import { todayLocalKey } from '../../../lib/dates'

const today = todayLocalKey()

export default function FinancePage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data: cashEntries, createCashEntry, isCreatingCashEntry } = useCashEntries()
  const { data: liabilities, createLiability, isCreatingLiability, deleteLiability } = useLiabilities()
  const { data: liabilityPayments, createLiabilityPayment, isCreatingLiabilityPayment } = useLiabilityPayments()
  const { data: sales } = useSales()
  const { data: customers } = useCustomers()
  const { data: expenses } = useExpenses()
  const { data: purchases } = usePurchases()
  const { data: repayments } = useRepayments()
  const { data: creditLedgers } = useCreditLedgers()
  const { data: products } = useProducts()
  const { data: ingredients } = useIngredients()

  const [payLiabilityId, setPayLiabilityId] = useState<number | null>(null)
  const [resetConfirm, setResetConfirm] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const cashForm = useForm({ defaultValues: { amount: 0, notes: '', entryDate: today } })
  const liabilityForm = useForm({
    defaultValues: {
      creditorName: '',
      category: 'other',
      title: '',
      totalAmount: 0,
      amountPaid: 0,
      liabilityDate: today,
      notes: ''
    }
  })
  const paymentForm = useForm({ defaultValues: { amount: 0, paymentDate: today, notes: '' } })

  const cashList = useMemo(() => (Array.isArray(cashEntries) ? cashEntries : []), [cashEntries])
  const liabilityList = useMemo(() => (Array.isArray(liabilities) ? liabilities : []), [liabilities])
  const salesList = useMemo(() => (Array.isArray(sales) ? sales : []), [sales])
  const customerList = useMemo(() => (Array.isArray(customers) ? customers : []), [customers])
  const expenseList = useMemo(() => (Array.isArray(expenses) ? expenses : []), [expenses])
  const purchaseList = useMemo(() => (Array.isArray(purchases) ? purchases : []), [purchases])
  const repaymentList = useMemo(() => (Array.isArray(repayments) ? repayments : []), [repayments])
  const ledgerList = useMemo(() => (Array.isArray(creditLedgers) ? creditLedgers : []), [creditLedgers])
  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const ingredientList = useMemo(() => (Array.isArray(ingredients) ? ingredients : []), [ingredients])

  const latestCash = cashList[0] ? Number(cashList[0].amount) : 0
  const salesCreditReceivable = salesList.reduce((sum, sale) => sum + Number(sale.balance), 0)
  const ledgerCreditReceivable = ledgerList.reduce((sum, row) => sum + Number(row.balance), 0)
  const creditReceivable = salesCreditReceivable + ledgerCreditReceivable
  const debtsPayable = liabilityList.reduce((sum, item) => sum + Number(item.balance), 0)
  const netPosition = latestCash + creditReceivable - debtsPayable

  const totalSalesRevenue = salesList.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
  const totalSaleCash = salesList.reduce((sum, sale) => sum + Number(sale.amount_paid), 0)
  const totalRepaymentCash = repaymentList.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const totalExpenses = expenseList.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const totalPurchases = purchaseList.reduce((sum, purchase) => sum + Number(purchase.cost_total), 0)
  const computedCashFlow = totalSaleCash + totalRepaymentCash - totalExpenses - totalPurchases
  const stockValue = productList.reduce((sum, product) => sum + Number(product.stock_quantity) * Number(product.selling_price), 0)

  const openCreditSales = useMemo(
    () => salesList.filter((sale) => Number(sale.balance) > 0).sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()),
    [salesList]
  )

  const weekSales = useMemo(() => salesList.filter((sale) => isInSalesPeriod(sale.sale_date, 'week')), [salesList])
  const monthSales = useMemo(() => salesList.filter((sale) => isInSalesPeriod(sale.sale_date, 'month')), [salesList])
  const allTimeSummary = useMemo(() => summarizeSales(salesList), [salesList])
  const weekSummary = useMemo(() => summarizeSales(weekSales), [weekSales])
  const monthSummary = useMemo(() => summarizeSales(monthSales), [monthSales])

  const openCreditLedger = useMemo(
    () => ledgerList.filter((row) => Number(row.balance) > 0).sort((a, b) => new Date(b.credit_date).getTime() - new Date(a.credit_date).getTime()),
    [ledgerList]
  )
  const totalLedgerCreditCreated = ledgerList.reduce((sum, row) => sum + Number(row.total_amount), 0)

  const selectedLiability = liabilityList.find((item) => item.id === payLiabilityId)

  const onCashSubmit = async (values: any) => {
    try {
      await createCashEntry(values)
      cashForm.reset({ amount: 0, notes: '', entryDate: today })
      toast.success('Cash on hand recorded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record cash.')
    }
  }

  const onLiabilitySubmit = async (values: any) => {
    try {
      await createLiability(values)
      liabilityForm.reset({
        creditorName: '',
        category: 'other',
        title: '',
        totalAmount: 0,
        amountPaid: 0,
        liabilityDate: today,
        notes: ''
      })
      toast.success('Debt recorded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record debt.')
    }
  }

  const onPaymentSubmit = async (values: any) => {
    if (!payLiabilityId) return
    try {
      await createLiabilityPayment({ liabilityId: payLiabilityId, ...values })
      setPayLiabilityId(null)
      paymentForm.reset({ amount: 0, paymentDate: today, notes: '' })
      toast.success('Debt payment recorded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record payment.')
    }
  }

  const onReset = async () => {
    if (resetConfirm !== 'RESET ALL') {
      toast.error('Type RESET ALL exactly to confirm.')
      return
    }

    if (!confirm('Delete ALL sales, production, expenses, purchases, cash counts, debts, and zero all stock? This cannot be undone.')) {
      return
    }

    setIsResetting(true)
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ confirm: 'RESET ALL' })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Reset failed.')

      setResetConfirm('')
      await qc.invalidateQueries()
      toast.success(body.message || 'All amounts reset to zero. You can start fresh.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reset data.')
    } finally {
      setIsResetting(false)
    }
  }

  const salesPeriodCards: Array<{ key: SalesPeriod | 'all'; summary: ReturnType<typeof summarizeSales> }> = [
    { key: 'all', summary: allTimeSummary },
    { key: 'week', summary: weekSummary },
    { key: 'month', summary: monthSummary }
  ]

  const handleExport = (period: 'week' | 'month') => {
    exportBusinessBackup({
      period,
      sales: salesList,
      purchases: purchaseList,
      ingredients: ingredientList,
      creditLedgers: ledgerList,
      customers: customerList,
      expenses: expenseList,
      repayments: repaymentList
    })
    toast.success(
      period === 'week'
        ? 'Weekly backup downloaded (Excel-compatible CSV).'
        : 'Monthly backup downloaded (Excel-compatible CSV).'
    )
  }

  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero-subtle flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow">Finance desk</div>
              <h1 className="mt-2 font-display text-4xl font-bold text-earth-950">Balances and daily money</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-500">
                Record cash on hand manually, track money customers owe you, track money you owe banks/family/others, and see your net position.
              </p>
            </div>
            <div className="rounded-lg bg-surface-container px-5 py-4 border border-outline/20">
              <div className="text-xs uppercase tracking-wide text-earth-500">Net position estimate</div>
              <div className={`text-3xl font-black ${netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatEtb(netPosition)}</div>
              <div className="mt-1 text-xs text-earth-500">Cash on hand + customer credit − your debts</div>
            </div>
          </div>

          <div className="mb-6 card">
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Backup reports (Excel)</h2>
            <p className="mb-4 text-sm text-earth-500">
              Download weekly (Mon–Sun) or monthly CSV files for sales, raw material purchases, stock snapshot, credit ledger, expenses, and summaries. Opens in Excel.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => handleExport('week')}>
                Export this week
              </button>
              <button type="button" className="btn-secondary" onClick={() => handleExport('month')}>
                Export this month
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {salesPeriodCards.map(({ key, summary }) => (
              <div key={key} className="metric-card">
                <div className="metric-label">{key === 'all' ? 'All-time sales' : `${salesPeriodLabels[key]} sales`}</div>
                <div className="metric-value text-spice-700">{formatEtb(summary.revenue)}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-semibold text-earth-500">
                  <span>Cash {formatEtb(summary.cash)}</span>
                  <span>Credit {formatEtb(summary.credit)}</span>
                  <span>{summary.kg} kg</span>
                </div>
                <div className="mt-1 text-xs text-earth-400">{summary.count} sale{summary.count === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="metric-card">
              <div className="metric-label">Cash on hand (manual)</div>
              <div className="metric-value text-green-700">{formatEtb(latestCash)}</div>
              <div className="mt-2 text-xs text-earth-500">{cashList[0] ? `Last count: ${new Date(cashList[0].entry_date).toLocaleDateString()}` : 'No cash count yet'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Customers owe you</div>
              <div className="metric-value text-amber-700">{formatEtb(creditReceivable)}</div>
              <div className="mt-2 text-xs text-earth-500">
                Ledger {formatEtb(ledgerCreditReceivable)} + sales credit {formatEtb(salesCreditReceivable)}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Credit ledger recorded</div>
              <div className="metric-value text-spice-700">{formatEtb(totalLedgerCreditCreated)}</div>
              <div className="mt-2 text-xs text-earth-500">Open balance {formatEtb(ledgerCreditReceivable)} • {openCreditLedger.length} open</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">You owe others</div>
              <div className="metric-value text-red-700">{formatEtb(debtsPayable)}</div>
              <div className="mt-2 text-xs text-earth-500">
                <a href="#record-debt" className="font-bold text-spice-700 hover:text-spice-900">Record debt ↓</a>
                {' '}• {liabilityList.filter((item) => Number(item.balance) > 0).length} open
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Finished stock value</div>
              <div className="metric-value text-spice-700">{formatEtb(stockValue)}</div>
              <div className="mt-2 text-xs text-earth-500">Inventory asset estimate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="metric-card">
              <div className="metric-label">Lifetime sales revenue</div>
              <div className="metric-value text-blue-700">{formatEtb(totalSalesRevenue)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Computed cash movement</div>
              <div className={`metric-value ${computedCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatEtb(computedCashFlow)}</div>
              <div className="mt-2 text-xs text-earth-500">Sale cash + repayments − expenses − purchases</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Customer accounts</div>
              <div className="metric-value text-earth-900">{customerList.length}</div>
              <div className="mt-2 text-xs text-earth-500">{customerList.filter((c) => Number(c.outstanding_balance) > 0).length} with outstanding credit</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record Cash On Hand</h2>
              <p className="mb-5 text-sm text-earth-500">Count physical cash in your shop or pocket and enter it here.</p>
              <form onSubmit={cashForm.handleSubmit(onCashSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Cash amount (ETB)</label>
                  <input type="number" step="0.01" className="input-field" {...cashForm.register('amount', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Count date</label>
                  <input type="date" className="input-field" {...cashForm.register('entryDate')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Notes</label>
                  <input className="input-field" {...cashForm.register('notes')} placeholder="Morning count, drawer, safe..." />
                </div>
                <button className="btn-primary w-full" type="submit" disabled={isCreatingCashEntry}>
                  {isCreatingCashEntry ? 'Saving...' : 'Save cash count'}
                </button>
              </form>
            </div>

            <div className="card" id="record-debt">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">You Owe Others (Record Debt)</h2>
              <p className="mb-5 text-sm text-earth-500">Bank loan, family loan, supplier credit, or any money you must pay back.</p>
              <form onSubmit={liabilityForm.handleSubmit(onLiabilitySubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Creditor</label>
                  <input className="input-field" {...liabilityForm.register('creditorName', { required: true })} placeholder="Bank, uncle, supplier..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Category</label>
                  <select className="input-field" {...liabilityForm.register('category')}>
                    <option value="bank">Bank</option>
                    <option value="family">Family</option>
                    <option value="supplier">Supplier</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Description</label>
                  <input className="input-field" {...liabilityForm.register('title', { required: true })} placeholder="Equipment loan, borrowed cash..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Total owed</label>
                    <input type="number" step="0.01" className="input-field" {...liabilityForm.register('totalAmount', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Already paid</label>
                    <input type="number" step="0.01" className="input-field" {...liabilityForm.register('amountPaid', { valueAsNumber: true })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Date</label>
                  <input type="date" className="input-field" {...liabilityForm.register('liabilityDate')} />
                </div>
                <button className="btn-primary w-full" type="submit" disabled={isCreatingLiability}>
                  {isCreatingLiability ? 'Saving...' : 'Save debt'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Recent Cash Counts</h2>
              <p className="mb-4 text-sm text-earth-500">Your manual cash history.</p>
              {cashList.length === 0 ? (
                <div className="text-sm text-earth-500">No cash counts yet.</div>
              ) : (
                <div className="space-y-3">
                  {cashList.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-earth-100 bg-earth-50 px-4 py-3">
                      <div className="font-black text-earth-950">{formatEtb(Number(entry.amount))}</div>
                      <div className="text-xs text-earth-500">{new Date(entry.entry_date).toLocaleDateString()} {entry.notes ? `• ${entry.notes}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="card overflow-x-auto">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-black text-earth-950">Open Credit Ledger</h2>
                  <p className="text-sm text-earth-500">Credit recorded on Customers page (not from sales).</p>
                </div>
                <Link href="/admin/customers" className="text-sm font-bold text-spice-700">Go to Credit</Link>
              </div>
              {openCreditLedger.length === 0 ? (
                <div className="text-sm text-earth-500">No open credit ledger entries.</div>
              ) : (
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Products</th>
                      <th className="px-3 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openCreditLedger.map((row) => (
                      <tr key={row.id} className="table-row">
                        <td className="px-3 py-3">{new Date(row.credit_date).toLocaleDateString()}</td>
                        <td className="px-3 py-3">{row.customer_name}</td>
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            {formatCreditProductLines(row.items, row.product_name, row.quantity_kg).map((line) => (
                              <div key={`${row.id}-${line.name}`} className="font-semibold text-earth-900">
                                {line.name} = {line.kg} kg
                              </div>
                            ))}
                            {formatCreditProductLines(row.items, row.product_name, row.quantity_kg).length === 0 && (
                              <span className="text-earth-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-bold text-red-700">{formatEtb(Number(row.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card overflow-x-auto">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-black text-earth-950">Open Customer Credit</h2>
                  <p className="text-sm text-earth-500">Every unpaid or partial sale.</p>
                </div>
                <Link href="/admin/sales" className="text-sm font-bold text-spice-700">Go to Sales</Link>
              </div>
              {openCreditSales.length === 0 ? (
                <div className="text-sm text-earth-500">No open credit sales.</div>
              ) : (
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openCreditSales.map((sale) => (
                      <tr key={sale.id} className="table-row">
                        <td className="px-3 py-3">{new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td className="px-3 py-3">{sale.customer_name || 'No customer'}</td>
                        <td className="px-3 py-3">{sale.product_name}</td>
                        <td className="px-3 py-3 font-bold text-red-700">{formatEtb(Number(sale.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card overflow-x-auto">
              <div className="mb-4">
                <h2 className="font-display text-xl font-black text-earth-950">Debts You Owe</h2>
                <p className="text-sm text-earth-500">Bank, family, supplier, and other liabilities.</p>
              </div>
              {liabilityList.length === 0 ? (
                <div className="text-sm text-earth-500">No debts recorded yet.</div>
              ) : (
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Creditor</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Balance</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liabilityList.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="px-3 py-3">
                          <div className="font-bold text-earth-950">{item.creditor_name}</div>
                          <div className="text-xs text-earth-500">{item.category}</div>
                        </td>
                        <td className="px-3 py-3">{item.title}</td>
                        <td className="px-3 py-3 font-bold text-red-700">{formatEtb(Number(item.balance))}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {Number(item.balance) > 0 && (
                            <button className="text-spice-700 font-bold mr-3" onClick={() => setPayLiabilityId(item.id)}>Pay</button>
                          )}
                          <button
                            className="text-red-600 font-bold"
                            onClick={async () => {
                              if (!confirm('Delete this debt record?')) return
                              try {
                                await deleteLiability(item.id)
                                toast.success('Debt record deleted.')
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Could not delete debt.')
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {payLiabilityId && selectedLiability && (
            <div className="card max-w-xl mb-6">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Pay Debt</h2>
              <p className="mb-4 text-sm text-earth-500">
                {selectedLiability.creditor_name} • {selectedLiability.title} • remaining {formatEtb(Number(selectedLiability.balance))}
              </p>
              <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                <input type="number" step="0.01" className="input-field" placeholder="Amount" {...paymentForm.register('amount', { valueAsNumber: true })} />
                <input type="date" className="input-field" {...paymentForm.register('paymentDate')} />
                <button className="btn-primary" type="submit" disabled={isCreatingLiabilityPayment}>
                  {isCreatingLiabilityPayment ? 'Saving...' : 'Save'}
                </button>
              </form>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className="text-sm font-bold text-spice-700"
                  onClick={() => paymentForm.setValue('amount', Number(selectedLiability.balance))}
                >
                  Pay full balance
                </button>
                <button type="button" className="text-sm text-earth-500" onClick={() => setPayLiabilityId(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="card overflow-x-auto">
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Debt Payments Made</h2>
            <p className="mb-4 text-sm text-earth-500">Payments you made toward bank, family, or supplier debts.</p>
            {liabilityPayments && liabilityPayments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-head">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Creditor</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {liabilityPayments.slice(0, 12).map((payment) => (
                    <tr key={payment.id} className="table-row">
                      <td className="px-3 py-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="px-3 py-3">{payment.creditor_name}</td>
                      <td className="px-3 py-3">{payment.title}</td>
                      <td className="px-3 py-3 font-bold text-red-700">{formatEtb(Number(payment.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-earth-500">No debt payments yet.</div>
            )}
          </div>
          <div className="card border-2 border-red-200 bg-red-50/40 mb-6 mt-6">
            <h2 className="font-display text-xl font-black text-red-900 mb-1">Start fresh — reset all amounts to zero</h2>
            <p className="mb-4 text-sm text-red-800">
              Clears all sales, production batches, purchases, expenses, cash counts, debts, and repayments. Sets finished goods and raw material stock to 0 kg.
              Products, recipes, customers, and your login are kept.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-red-900 mb-1.5">Type RESET ALL to confirm</label>
                <input
                  className="input-field border-red-200"
                  value={resetConfirm}
                  onChange={(event) => setResetConfirm(event.target.value)}
                  placeholder="RESET ALL"
                />
              </div>
              <button
                type="button"
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isResetting || resetConfirm !== 'RESET ALL'}
                onClick={onReset}
              >
                {isResetting ? 'Resetting...' : 'Reset everything to zero'}
              </button>
            </div>
            <p className="mt-3 text-xs text-red-700">
              Or from terminal: <code className="rounded bg-white/70 px-1">CONFIRM_RESET=yes npm run reset</code>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
