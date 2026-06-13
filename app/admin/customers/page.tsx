"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'
import { useCustomers, useRepayments, useSales } from '../../../hooks/useModules'

const today = new Date().toISOString().slice(0, 10)

export default function CustomersPage() {
  const { data: customers, isLoading, createCustomer, updateCustomer, isCreatingCustomer, isUpdatingCustomer, deleteCustomer } = useCustomers()
  const { data: sales } = useSales()
  const { createRepayment, isCreatingRepayment } = useRepayments()
  const [editing, setEditing] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [payAmounts, setPayAmounts] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: '', phone: '', notes: '' } })
  const list = useMemo(() => (Array.isArray(customers) ? customers : []), [customers])
  const salesList = useMemo(() => (Array.isArray(sales) ? sales : []), [sales])
  const isSaving = isCreatingCustomer || isUpdatingCustomer

  useEffect(() => {
    if (!editing) {
      reset({ name: '', phone: '', notes: '' })
      return
    }

    const customer = list.find((item) => item.id === editing)
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone ?? '',
        notes: customer.notes ?? ''
      })
    }
  }, [editing, list, reset])

  const customerStats = useMemo(() => {
    return list.map((customer) => {
      const allCustomerSales = salesList.filter((sale) => sale.customer_id === customer.id)
      const openSales = allCustomerSales.filter((sale) => Number(sale.balance) > 0)
      const totalCredit = allCustomerSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
      const totalPaid = allCustomerSales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0)
      const outstanding = Number(customer.outstanding_balance)
      return { customer, allCustomerSales, openSales, totalCredit, totalPaid, outstanding }
    })
  }, [list, salesList])

  const totalOutstanding = list.reduce((sum, customer) => sum + Number(customer.outstanding_balance), 0)
  const customersWithOpenCredit = customerStats.filter((row) => row.outstanding > 0).length

  const onSubmit = async (values: any) => {
    setMessage(null)

    try {
      if (editing) await updateCustomer(editing, values)
      else await createCustomer(values)
      setEditing(null)
      reset()
      setMessage({ type: 'success', text: 'Customer account saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not save customer account.' })
    }
  }

  const handleRepay = async (saleId: number, amount: number, customerName: string) => {
    if (amount <= 0) return
    setMessage(null)
    try {
      await createRepayment({ saleId, amount, paymentDate: today })
      setPayAmounts((prev) => ({ ...prev, [saleId]: '' }))
      setMessage({ type: 'success', text: `Payment recorded for ${customerName}.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record payment.' })
    }
  }

  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero-subtle flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow">Customer accounts</div>
              <h1 className="mt-2 font-display text-4xl font-black text-earth-950">Credit Customers and Balances</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-500">
                Maintain every client, expand to see each credit sale, and record partial or full repayments in one place.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-spice-50 px-5 py-4 shadow-sm border border-spice-100">
                <div className="text-xs uppercase tracking-wide text-earth-500">Total customer credit</div>
                <div className="text-3xl font-black text-spice-800">{totalOutstanding.toFixed(2)} ETB</div>
              </div>
              <div className="rounded-3xl bg-earth-50 px-5 py-4 shadow-sm border border-earth-100">
                <div className="text-xs uppercase tracking-wide text-earth-500">Open credit accounts</div>
                <div className="text-3xl font-black text-earth-900">{customersWithOpenCredit}</div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">{editing ? 'Edit Customer Account' : 'Add Customer Account'}</h2>
              <p className="mb-5 text-sm text-earth-500">Use customer accounts for buyers who take products on partial payment or credit.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Customer / Shop Name</label>
                  <input className="input-field" {...register('name', { required: true })} placeholder="Customer or shop name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Phone Number</label>
                  <input className="input-field" {...register('phone')} placeholder="+251..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Account Notes</label>
                  <textarea className="input-field" {...register('notes')} rows={3} placeholder="Location, credit terms, contact person..." />
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editing ? 'Update Account' : 'Create Account'}
                  </button>
                  {editing && <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Customer credit ledger</h2>
              <p className="mb-4 text-sm text-earth-500">Expand a row to see every sale and record repayments without leaving this page.</p>
              {isLoading ? (
                <p className="text-earth-500">Loading customers...</p>
              ) : customerStats.length === 0 ? (
                <p className="text-earth-500">No customers yet. Add credit customers before recording unpaid sales.</p>
              ) : (
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-earth-200 text-earth-600">
                      <th className="pb-2 pr-4">Customer</th>
                      <th className="pb-2 pr-4">Phone</th>
                      <th className="pb-2 pr-4 text-right">Sales total</th>
                      <th className="pb-2 pr-4 text-right">Paid</th>
                      <th className="pb-2 pr-4 text-right">Balance</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerStats.map(({ customer, allCustomerSales, openSales, totalCredit, totalPaid, outstanding }) => (
                      <React.Fragment key={customer.id}>
                        <tr className="border-b border-earth-100">
                          <td className="py-3 pr-4 font-bold text-earth-950">{customer.name}</td>
                          <td className="py-3 pr-4 text-earth-500">{customer.phone || '—'}</td>
                          <td className="py-3 pr-4 text-right">{totalCredit.toFixed(2)}</td>
                          <td className="py-3 pr-4 text-right text-green-700">{totalPaid.toFixed(2)}</td>
                          <td className={`py-3 pr-4 text-right font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
                            {outstanding.toFixed(2)}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap items-center gap-3">
                              {allCustomerSales.length > 0 && (
                                <button
                                  type="button"
                                  className="font-medium text-spice-700 hover:text-spice-900"
                                  onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                                >
                                  {expandedId === customer.id ? 'Hide sales' : `View ${openSales.length} open`}
                                </button>
                              )}
                              <button className="font-medium text-spice-700 hover:text-spice-900" onClick={() => setEditing(customer.id)}>Edit</button>
                              <button
                                className="font-medium text-red-600 hover:text-red-800"
                                onClick={async () => {
                                  if (!confirm('Delete this customer account? Credit sales may prevent deletion.')) return
                                  setMessage(null)
                                  try {
                                    await deleteCustomer(customer.id)
                                    setMessage({ type: 'success', text: 'Customer account deleted.' })
                                  } catch (err) {
                                    setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not delete customer account.' })
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedId === customer.id && (
                          <tr className="border-b border-earth-100 bg-earth-50/70">
                            <td colSpan={6} className="px-4 py-4">
                              {allCustomerSales.length === 0 ? (
                                <p className="text-sm text-earth-500">No sales recorded for this customer yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-earth-500">Credit sales for {customer.name}</p>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-earth-600">
                                        <th className="pb-2 pr-3">Date</th>
                                        <th className="pb-2 pr-3">Product</th>
                                        <th className="pb-2 pr-3 text-right">Total</th>
                                        <th className="pb-2 pr-3 text-right">Paid</th>
                                        <th className="pb-2 pr-3 text-right">Balance</th>
                                        <th className="pb-2">Repayment</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {allCustomerSales.map((sale) => {
                                        const balance = Number(sale.balance)
                                        return (
                                          <tr key={sale.id} className="border-t border-earth-200">
                                            <td className="py-2 pr-3">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                            <td className="py-2 pr-3">{sale.product_name ?? sale.sale_code}</td>
                                            <td className="py-2 pr-3 text-right">{Number(sale.total_amount).toFixed(2)}</td>
                                            <td className="py-2 pr-3 text-right">{Number(sale.amount_paid).toFixed(2)}</td>
                                            <td className={`py-2 pr-3 text-right font-semibold ${balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                              {balance > 0 ? balance.toFixed(2) : 'Paid'}
                                            </td>
                                            <td className="py-2">
                                              {balance > 0 ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    className="input-field w-24 py-1 text-sm"
                                                    placeholder="Amount"
                                                    value={payAmounts[sale.id] ?? ''}
                                                    onChange={(event) =>
                                                      setPayAmounts((prev) => ({ ...prev, [sale.id]: event.target.value }))
                                                    }
                                                  />
                                                  <button
                                                    type="button"
                                                    className="btn-secondary py-1 text-xs"
                                                    disabled={isCreatingRepayment}
                                                    onClick={() => handleRepay(sale.id, Number(payAmounts[sale.id] || 0), customer.name)}
                                                  >
                                                    Pay
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="text-xs font-bold text-spice-700 hover:text-spice-900"
                                                    onClick={() => handleRepay(sale.id, balance, customer.name)}
                                                  >
                                                    Pay full
                                                  </button>
                                                </div>
                                              ) : (
                                                <span className="text-green-700 font-medium">Settled</span>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
