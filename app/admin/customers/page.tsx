"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AdminNav from '../../../components/AdminNav'
import { useCreditLedgers, useCreditPayments, useCustomers } from '../../../hooks/useModules'
import { useProducts } from '../../../hooks/useProducts'
import { creditLedgerCreateSchema } from '../../../lib/validators/credit'
import { customerCreateSchema } from '../../../lib/validators/customer'
import { formatStockKg } from '../../../lib/productStock'

const today = new Date().toISOString().slice(0, 10)

export default function CustomersPage() {
  const { data: products } = useProducts()
  const { data: customers, isLoading, isError: customersLoadError, error: customersLoadErrorMessage, createCustomer, updateCustomer, isCreatingCustomer, isUpdatingCustomer, deleteCustomer } = useCustomers()
  const { data: creditLedgers, isLoading: creditLoading, isError: creditLoadError, error: creditLoadErrorMessage, createCreditLedger, isCreatingCreditLedger, deleteCreditLedger } = useCreditLedgers()
  const { createCreditPayment, isCreatingCreditPayment } = useCreditPayments()
  const [editing, setEditing] = useState<number | null>(null)
  const [payCreditId, setPayCreditId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { register, handleSubmit, reset, formState: { errors: customerErrors } } = useForm({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: { name: '', phone: '', notes: '' }
  })

  const creditForm = useForm({
    resolver: zodResolver(creditLedgerCreateSchema),
    defaultValues: { customerId: 0, productId: 0, quantityKg: 0, title: '', totalAmount: 0, amountPaid: 0, creditDate: today, notes: '' }
  })

  const paymentForm = useForm({ defaultValues: { amount: 0, paymentDate: today, notes: '' } })

  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const list = useMemo(() => (Array.isArray(customers) ? customers : []), [customers])
  const ledgerList = useMemo(() => (Array.isArray(creditLedgers) ? creditLedgers : []), [creditLedgers])
  const isSaving = isCreatingCustomer || isUpdatingCustomer

  const creditProductId = Number(creditForm.watch('productId') || 0)
  const creditQuantityKg = Number(creditForm.watch('quantityKg') || 0)
  const selectedCreditProduct = productList.find((product) => product.id === creditProductId) ?? null
  const unitPrice = selectedCreditProduct ? Number(selectedCreditProduct.selling_price) : 0
  const isProductCredit = creditProductId > 0

  const openCredits = useMemo(() => ledgerList.filter((row) => Number(row.balance) > 0), [ledgerList])
  const sortedLedger = useMemo(
    () => [...ledgerList].sort((a, b) => new Date(b.credit_date).getTime() - new Date(a.credit_date).getTime()),
    [ledgerList]
  )
  const totalLedgerCredit = ledgerList.reduce((sum, row) => sum + Number(row.balance), 0)
  const totalSalesCredit = list.reduce((sum, customer) => sum + Number(customer.outstanding_balance), 0)
  const totalAllCredit = totalLedgerCredit + totalSalesCredit

  const selectedCredit = ledgerList.find((row) => row.id === payCreditId && Number(row.balance) > 0) ?? null

  useEffect(() => {
    if (!isProductCredit || !selectedCreditProduct) return

    const nextTotal = Number((creditQuantityKg * unitPrice).toFixed(2))
    if (creditQuantityKg > 0) {
      creditForm.setValue('totalAmount', nextTotal, { shouldValidate: true })
      creditForm.setValue('title', `${selectedCreditProduct.name} — ${creditQuantityKg} kg on credit`, { shouldValidate: true })
    }
  }, [creditForm, creditQuantityKg, isProductCredit, selectedCreditProduct, unitPrice])

  useEffect(() => {
    if (!editing) {
      reset({ name: '', phone: '', notes: '' })
      return
    }
    const customer = list.find((item) => item.id === editing)
    if (customer) {
      reset({ name: customer.name, phone: customer.phone ?? '', notes: customer.notes ?? '' })
    }
  }, [editing, list, reset])

  const onSubmitCustomer = async (values: { name: string; phone?: string; notes?: string }) => {
    setMessage(null)
    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        notes: values.notes?.trim() || undefined
      }
      if (editing) await updateCustomer(editing, payload)
      else await createCustomer(payload)
      setEditing(null)
      reset()
      setMessage({ type: 'success', text: editing ? 'Customer updated.' : 'Customer added. You can record credit for them now.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not save customer.' })
    }
  }

  const onSubmitCredit = async (values: any) => {
    setMessage(null)
    try {
      await createCreditLedger(values)
      creditForm.reset({ customerId: 0, productId: 0, quantityKg: 0, title: '', totalAmount: 0, amountPaid: 0, creditDate: today, notes: '' })
      setMessage({ type: 'success', text: 'Credit recorded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record credit.' })
    }
  }

  const onSubmitPayment = async (values: any) => {
    if (!payCreditId) return
    setMessage(null)
    try {
      await createCreditPayment({ creditId: payCreditId, ...values })
      setPayCreditId(null)
      paymentForm.reset({ amount: 0, paymentDate: today, notes: '' })
      setMessage({ type: 'success', text: 'Payment recorded.' })
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
              <div className="eyebrow">Credit desk</div>
              <h1 className="mt-2 font-display text-4xl font-black text-earth-950">Customer Credit Ledger</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-500">
                Add customers first, then record credit for one finished good or for mixed / all products. Total auto-calculates when you pick a product and kg.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-spice-50 px-5 py-4 border border-spice-100">
                <div className="text-xs uppercase tracking-wide text-earth-500">Credit ledger owed</div>
                <div className="text-2xl font-black text-spice-800">{totalLedgerCredit.toFixed(2)} ETB</div>
              </div>
              <div className="rounded-3xl bg-amber-50 px-5 py-4 border border-amber-100">
                <div className="text-xs uppercase tracking-wide text-earth-500">From sales (old)</div>
                <div className="text-2xl font-black text-amber-800">{totalSalesCredit.toFixed(2)} ETB</div>
              </div>
              <div className="rounded-3xl bg-earth-50 px-5 py-4 border border-earth-100">
                <div className="text-xs uppercase tracking-wide text-earth-500">Total owed to you</div>
                <div className="text-2xl font-black text-earth-900">{totalAllCredit.toFixed(2)} ETB</div>
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
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record credit</h2>
              <p className="mb-5 text-sm text-earth-500">
                Pick a finished good for one-product credit, or choose &quot;Mixed / all products&quot; when the credit covers more than one stock item.
              </p>
              <form onSubmit={creditForm.handleSubmit(onSubmitCredit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Customer</label>
                  <select className="input-field" {...creditForm.register('customerId', { valueAsNumber: true })}>
                    <option value={0}>Select customer</option>
                    {list.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  {list.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">Add a customer below before recording credit.</p>
                  )}
                  {creditForm.formState.errors.customerId && (
                    <p className="mt-1 text-xs text-red-600">Select a customer.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Credit for (finished good)</label>
                  <select className="input-field" {...creditForm.register('productId', { valueAsNumber: true })}>
                    <option value={0}>Mixed / all products</option>
                    {productList.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({formatStockKg(product.stock_quantity)} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                {isProductCredit ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-earth-700 mb-1.5">Quantity (kg)</label>
                      <input type="number" step="0.001" min="0.001" className="input-field" {...creditForm.register('quantityKg', { valueAsNumber: true })} />
                      {creditForm.formState.errors.quantityKg && (
                        <p className="mt-1 text-xs text-red-600">{creditForm.formState.errors.quantityKg.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-earth-700 mb-1.5">Price per kg (auto)</label>
                      <div className="input-field bg-earth-50 font-semibold text-earth-800">
                        {unitPrice > 0 ? `${unitPrice.toFixed(2)} ETB` : '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">What is owed for?</label>
                    <input className="input-field" {...creditForm.register('title')} placeholder="e.g. Berbere + Shiro mix on credit" />
                    {creditForm.formState.errors.title && (
                      <p className="mt-1 text-xs text-red-600">{creditForm.formState.errors.title.message}</p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">
                      {isProductCredit ? 'Total credit (auto)' : 'Total credit (ETB)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={`input-field ${isProductCredit ? 'bg-earth-50' : ''}`}
                      readOnly={isProductCredit}
                      {...creditForm.register('totalAmount', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Paid now (ETB)</label>
                    <input type="number" step="0.01" min="0" className="input-field" {...creditForm.register('amountPaid', { valueAsNumber: true })} />
                  </div>
                </div>
                {(creditForm.formState.errors.totalAmount || creditForm.formState.errors.amountPaid) && (
                  <p className="text-xs text-red-600">
                    {creditForm.formState.errors.totalAmount?.message || creditForm.formState.errors.amountPaid?.message}
                  </p>
                )}
                <p className="text-xs text-earth-500">Leave &quot;Paid now&quot; at 0 for full credit.</p>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Credit date</label>
                  <input type="date" className="input-field" {...creditForm.register('creditDate')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Notes</label>
                  <input className="input-field" {...creditForm.register('notes')} placeholder="Optional" />
                </div>
                <button className="btn-primary w-full" type="submit" disabled={isCreatingCreditLedger || list.length === 0}>
                  {isCreatingCreditLedger ? 'Saving...' : 'Save credit'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Credit ledger</h2>
              <p className="mb-4 text-sm text-earth-500">
                {openCredits.length} open • {sortedLedger.length} total entr{sortedLedger.length === 1 ? 'y' : 'ies'}
              </p>
              {creditLoading ? (
                <p className="text-sm text-earth-500">Loading credit entries...</p>
              ) : creditLoadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="font-bold">Could not load credit list.</p>
                  <p className="mt-1">{creditLoadErrorMessage instanceof Error ? creditLoadErrorMessage.message : 'Unknown error.'}</p>
                  <p className="mt-2 text-xs">Run once (safe — only adds credit tables, does not touch sales):</p>
                  <p className="mt-1 text-xs font-mono">$env:DATABASE_URL = &quot;postgresql://...&quot;; npm run migrate:credit</p>
                </div>
              ) : sortedLedger.length === 0 ? (
                <p className="text-sm text-earth-500">No credit recorded yet.</p>
              ) : (
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Paid</th>
                      <th className="px-3 py-2">Balance</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLedger.map((row) => {
                      const balance = Number(row.balance)
                      const isOpen = balance > 0
                      return (
                        <tr key={row.id} className="table-row">
                          <td className="px-3 py-3">{new Date(row.credit_date).toLocaleDateString()}</td>
                          <td className="px-3 py-3 font-bold">{row.customer_name || '—'}</td>
                          <td className="px-3 py-3">
                            {row.product_name ? (
                              <span>{row.product_name}{row.quantity_kg ? ` (${Number(row.quantity_kg)} kg)` : ''}</span>
                            ) : (
                              <span className="text-earth-500">Mixed / all</span>
                            )}
                          </td>
                          <td className="px-3 py-3">{row.title}</td>
                          <td className="px-3 py-3">{Number(row.total_amount).toFixed(2)}</td>
                          <td className="px-3 py-3 text-green-700">{Number(row.amount_paid).toFixed(2)}</td>
                          <td className={`px-3 py-3 font-bold ${isOpen ? 'text-red-700' : 'text-green-700'}`}>{balance.toFixed(2)}</td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isOpen ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                              {isOpen ? 'Open' : 'Paid'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {isOpen && (
                              <button type="button" className="text-spice-700 font-bold mr-3" onClick={() => setPayCreditId(row.id)}>Pay</button>
                            )}
                            <button
                              type="button"
                              className="text-red-600 font-bold"
                              onClick={async () => {
                                if (!confirm('Delete this credit entry?')) return
                                try {
                                  await deleteCreditLedger(row.id)
                                  setMessage({ type: 'success', text: 'Credit entry deleted.' })
                                } catch (err) {
                                  setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not delete.' })
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {payCreditId && selectedCredit && (
            <div className="card max-w-xl mt-6">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record payment</h2>
              <p className="mb-4 text-sm text-earth-500">
                {selectedCredit.customer_name} • {selectedCredit.title} • balance {Number(selectedCredit.balance).toFixed(2)} ETB
              </p>
              <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                <input type="number" step="0.01" className="input-field" placeholder="Amount" {...paymentForm.register('amount', { valueAsNumber: true })} />
                <input type="date" className="input-field" {...paymentForm.register('paymentDate')} />
                <button className="btn-primary" type="submit" disabled={isCreatingCreditPayment}>
                  {isCreatingCreditPayment ? 'Saving...' : 'Save'}
                </button>
              </form>
              <div className="mt-3 flex gap-3">
                <button type="button" className="text-sm font-bold text-spice-700" onClick={() => paymentForm.setValue('amount', Number(selectedCredit.balance))}>
                  Pay full balance
                </button>
                <button type="button" className="text-sm text-earth-500" onClick={() => setPayCreditId(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">{editing ? 'Edit customer' : 'Add customer'}</h2>
              <p className="mb-4 text-sm text-earth-500">Create the customer here first, then record credit above.</p>
              <form onSubmit={handleSubmit(onSubmitCustomer)} className="space-y-4">
                <div>
                  <input className="input-field" placeholder="Customer name *" {...register('name')} />
                  {customerErrors.name && <p className="mt-1 text-xs text-red-600">Customer name is required.</p>}
                </div>
                <input className="input-field" placeholder="Phone (optional)" {...register('phone')} />
                <textarea className="input-field" rows={2} placeholder="Notes (optional)" {...register('notes')} />
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editing ? 'Update' : 'Add customer'}</button>
                  {editing && <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Customers</h2>
              <p className="mb-4 text-sm text-earth-500">Per-customer sales from the Sales register. Walk-in sales (no customer) appear only on the Sales page total.</p>
              {isLoading ? (
                <p className="text-earth-500">Loading customers...</p>
              ) : customersLoadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="font-bold">Could not load customers.</p>
                  <p className="mt-1">{customersLoadErrorMessage instanceof Error ? customersLoadErrorMessage.message : 'Unknown error.'}</p>
                </div>
              ) : list.length === 0 ? (
                <p className="text-earth-500">No customers yet. Add one using the form on the left.</p>
              ) : (
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Sales to customer</th>
                      <th className="px-3 py-2">Ledger credit</th>
                      <th className="px-3 py-2">Sales credit</th>
                      <th className="px-3 py-2">Total owed</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((customer) => (
                      <tr key={customer.id} className="table-row">
                        <td className="px-3 py-3 font-bold">{customer.name}</td>
                        <td className="px-3 py-3">{customer.phone || '—'}</td>
                        <td className="px-3 py-3 font-semibold text-spice-700">{Number(customer.total_sales ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-3">{Number(customer.ledger_balance ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-3">{Number(customer.outstanding_balance).toFixed(2)}</td>
                        <td className="px-3 py-3 font-bold text-red-700">{Number(customer.total_credit ?? customer.outstanding_balance).toFixed(2)}</td>
                        <td className="px-3 py-3">
                          <button className="text-spice-700 font-bold mr-3" onClick={() => setEditing(customer.id)}>Edit</button>
                          <button
                            className="text-red-600 font-bold"
                            onClick={async () => {
                              if (!confirm('Delete customer?')) return
                              try {
                                await deleteCustomer(customer.id)
                                setMessage({ type: 'success', text: 'Customer deleted.' })
                              } catch (err) {
                                setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not delete.' })
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
        </div>
      </div>
    </>
  )
}
