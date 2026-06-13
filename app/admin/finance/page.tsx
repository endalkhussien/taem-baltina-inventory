"use client"

import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'
import {
  useCashEntries,
  useCustomers,
  useExpenses,
  useLiabilities,
  useLiabilityPayments,
  usePurchases,
  useRepayments,
  useSales
} from '../../../hooks/useModules'
import { useProducts } from '../../../hooks/useProducts'

const today = new Date().toISOString().slice(0, 10)

export default function FinancePage() {
  const { data: cashEntries, createCashEntry, isCreatingCashEntry } = useCashEntries()
  const { data: liabilities, createLiability, isCreatingLiability, deleteLiability } = useLiabilities()
  const { data: liabilityPayments, createLiabilityPayment, isCreatingLiabilityPayment } = useLiabilityPayments()
  const { data: sales } = useSales()
  const { data: customers } = useCustomers()
  const { data: expenses } = useExpenses()
  const { data: purchases } = usePurchases()
  const { data: repayments } = useRepayments()
  const { data: products } = useProducts()

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [payLiabilityId, setPayLiabilityId] = useState<number | null>(null)

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
  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])

  const latestCash = cashList[0] ? Number(cashList[0].amount) : 0
  const creditReceivable = salesList.reduce((sum, sale) => sum + Number(sale.balance), 0)
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

  const selectedLiability = liabilityList.find((item) => item.id === payLiabilityId)

  const onCashSubmit = async (values: any) => {
    setMessage(null)
    try {
      await createCashEntry(values)
      cashForm.reset({ amount: 0, notes: '', entryDate: today })
      setMessage({ type: 'success', text: 'Cash on hand recorded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record cash.' })
    }
  }

  const onLiabilitySubmit = async (values: any) => {
    setMessage(null)
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
      setMessage({ type: 'success', text: 'Debt recorded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record debt.' })
    }
  }

  const onPaymentSubmit = async (values: any) => {
    if (!payLiabilityId) return
    setMessage(null)
    try {
      await createLiabilityPayment({ liabilityId: payLiabilityId, ...values })
      setPayLiabilityId(null)
      paymentForm.reset({ amount: 0, paymentDate: today, notes: '' })
      setMessage({ type: 'success', text: 'Debt payment recorded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record payment.' })
    }
  }

  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero-subtle flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow">Finance desk</div>
              <h1 className="mt-2 font-display text-4xl font-black text-earth-950">Balances and Daily Money</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-500">
                Record cash on hand manually, track money customers owe you, track money you owe banks/family/others, and see your net position.
              </p>
            </div>
            <div className="rounded-3xl bg-spice-50 px-5 py-4 border border-spice-100">
              <div className="text-xs uppercase tracking-wide text-earth-500">Net position estimate</div>
              <div className={`text-3xl font-black ${netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>{netPosition.toFixed(2)} ETB</div>
              <div className="mt-1 text-xs text-earth-500">Cash on hand + customer credit − your debts</div>
            </div>
          </div>

          {message && (
            <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="metric-card">
              <div className="metric-label">Cash on hand (manual)</div>
              <div className="metric-value text-green-700">{latestCash.toFixed(2)} ETB</div>
              <div className="mt-2 text-xs text-earth-500">{cashList[0] ? `Last count: ${new Date(cashList[0].entry_date).toLocaleDateString()}` : 'No cash count yet'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Customers owe you</div>
              <div className="metric-value text-amber-700">{creditReceivable.toFixed(2)} ETB</div>
              <div className="mt-2 text-xs text-earth-500">{openCreditSales.length} open credit sales</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">You owe others</div>
              <div className="metric-value text-red-700">{debtsPayable.toFixed(2)} ETB</div>
              <div className="mt-2 text-xs text-earth-500">{liabilityList.filter((item) => Number(item.balance) > 0).length} open debts</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Finished stock value</div>
              <div className="metric-value text-spice-700">{stockValue.toFixed(2)} ETB</div>
              <div className="mt-2 text-xs text-earth-500">Inventory asset estimate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="metric-card">
              <div className="metric-label">Lifetime sales revenue</div>
              <div className="metric-value text-blue-700">{totalSalesRevenue.toFixed(2)} ETB</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Computed cash movement</div>
              <div className={`metric-value ${computedCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>{computedCashFlow.toFixed(2)} ETB</div>
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

            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record Debt You Owe</h2>
              <p className="mb-5 text-sm text-earth-500">Bank loan, family loan, supplier credit, or other money you must pay back.</p>
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
                      <div className="font-black text-earth-950">{Number(entry.amount).toFixed(2)} ETB</div>
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
                        <td className="px-3 py-3 font-bold text-red-700">{Number(sale.balance).toFixed(2)} ETB</td>
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
                        <td className="px-3 py-3 font-bold text-red-700">{Number(item.balance).toFixed(2)} ETB</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {Number(item.balance) > 0 && (
                            <button className="text-spice-700 font-bold mr-3" onClick={() => setPayLiabilityId(item.id)}>Pay</button>
                          )}
                          <button
                            className="text-red-600 font-bold"
                            onClick={async () => {
                              if (!confirm('Delete this debt record?')) return
                              setMessage(null)
                              try {
                                await deleteLiability(item.id)
                                setMessage({ type: 'success', text: 'Debt record deleted.' })
                              } catch (err) {
                                setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not delete debt.' })
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
                {selectedLiability.creditor_name} • {selectedLiability.title} • remaining {Number(selectedLiability.balance).toFixed(2)} ETB
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
                      <td className="px-3 py-3 font-bold text-red-700">{Number(payment.amount).toFixed(2)} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-earth-500">No debt payments yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
