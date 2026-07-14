"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AdminNav from '../../../components/AdminNav'
import { useCreditLedgers, useCreditPayments, useCustomers } from '../../../hooks/useModules'
import { useProducts } from '../../../hooks/useProducts'
import { creditLedgerCreateSchema } from '../../../lib/validators/credit'
import { customerCreateSchema } from '../../../lib/validators/customer'
import { buildCreditLinesFromProducts, creditKgByProduct, sumCreditLineTotals } from '../../../lib/credit'

const today = new Date().toISOString().slice(0, 10)

export default function CustomersPage() {
  const { data: products } = useProducts()
  const { data: customers, isLoading, isError: customersLoadError, error: customersLoadErrorMessage, createCustomer, updateCustomer, isCreatingCustomer, isUpdatingCustomer, deleteCustomer } = useCustomers()
  const { data: creditLedgers, isLoading: creditLoading, isError: creditLoadError, error: creditLoadErrorMessage, createCreditLedger, isCreatingCreditLedger, deleteCreditLedger, markCreditPaid } = useCreditLedgers()
  const { createCreditPayment, isCreatingCreditPayment } = useCreditPayments()
  const [editing, setEditing] = useState<number | null>(null)
  const [payCreditId, setPayCreditId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { register, handleSubmit, reset, formState: { errors: customerErrors } } = useForm({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: { name: '', phone: '', notes: '' }
  })

  const [productQtys, setProductQtys] = useState<Record<number, string>>({})

  const creditForm = useForm({
    resolver: zodResolver(creditLedgerCreateSchema),
    defaultValues: { customerId: 0, lines: [], productId: 0, quantityKg: 0, title: '', totalAmount: 0, amountPaid: 0, creditDate: today, notes: '' }
  })

  const paymentForm = useForm({ defaultValues: { amount: 0, paymentDate: today, notes: '' } })

  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const list = useMemo(() => (Array.isArray(customers) ? customers : []), [customers])
  const ledgerList = useMemo(() => (Array.isArray(creditLedgers) ? creditLedgers : []), [creditLedgers])
  const isSaving = isCreatingCustomer || isUpdatingCustomer

  const selectedProductLines = useMemo(() => {
    const drafts = Object.entries(productQtys)
      .map(([productId, qty]) => ({ productId: Number(productId), quantityKg: Number(qty) }))
      .filter((line) => line.quantityKg > 0)

    try {
      return buildCreditLinesFromProducts(drafts, productList)
    } catch {
      return []
    }
  }, [productList, productQtys])

  const autoCreditTotal = useMemo(() => sumCreditLineTotals(selectedProductLines), [selectedProductLines])

  const openCredits = useMemo(() => ledgerList.filter((row) => Number(row.balance) > 0), [ledgerList])
  const sortedLedger = useMemo(
    () => [...ledgerList].sort((a, b) => new Date(b.credit_date).getTime() - new Date(a.credit_date).getTime()),
    [ledgerList]
  )
  const totalLedgerCredit = ledgerList.reduce((sum, row) => sum + Number(row.balance), 0)
  const totalSalesCredit = list.reduce((sum, customer) => sum + Number(customer.outstanding_balance), 0)
  const totalAllCredit = totalLedgerCredit + totalSalesCredit

  const openCreditKgByProduct = useMemo(
    () =>
      productList.map((product) => ({
        product,
        kg: creditKgByProduct(openCredits, product.id, true)
      })),
    [openCredits, productList]
  )

  const selectedCredit = ledgerList.find((row) => row.id === payCreditId && Number(row.balance) > 0) ?? null

  const getCreditKgForProduct = (row: (typeof sortedLedger)[number], productId: number) => {
    if (row.items && row.items.length > 0) {
      const item = row.items.find((entry) => entry.product_id === productId)
      return item ? Number(item.quantity_kg) : 0
    }
    if (row.product_id === productId && row.quantity_kg) return Number(row.quantity_kg)
    return 0
  }

  useEffect(() => {
    if (selectedProductLines.length === 0) return
    creditForm.setValue('totalAmount', autoCreditTotal, { shouldValidate: true })
    creditForm.setValue(
      'title',
      `${selectedProductLines.map((line) => `${line.productName} = ${line.quantityKg} kg`).join(', ')} on credit`,
      { shouldValidate: true }
    )
  }, [autoCreditTotal, creditForm, selectedProductLines])

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
    if (selectedProductLines.length === 0) {
      setMessage({ type: 'error', text: 'Enter kg for at least one product (e.g. Berbere = 5, Shiro = 3).' })
      return
    }
    try {
      const lines = selectedProductLines.map((line) => ({ productId: line.productId, quantityKg: line.quantityKg }))
      await createCreditLedger({ ...values, lines })
      creditForm.reset({ customerId: 0, lines: [], productId: 0, quantityKg: 0, title: '', totalAmount: 0, amountPaid: 0, creditDate: today, notes: '' })
      setProductQtys({})
      setMessage({ type: 'success', text: 'Credit recorded with product amounts.' })
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
                Enter how many kg of each product the customer took on credit. Example: Berbere = 10, Shiro = 5, Mitmita = 2.
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
                  <label className="block text-sm font-bold text-earth-700 mb-2">Kg taken on credit (per product)</label>
                  <div className="space-y-2 rounded-2xl border border-earth-100 bg-earth-50 p-3">
                    {productList.length === 0 ? (
                      <p className="text-sm text-earth-500">Add Berbere, Shiro, Mitmita under Stock first.</p>
                    ) : productList.map((product) => {
                      const qty = productQtys[product.id] ?? ''
                      const lineTotal = Number(qty) > 0 ? Number(qty) * Number(product.selling_price) : 0
                      return (
                        <div key={product.id} className="grid grid-cols-[minmax(100px,1fr)_auto_1fr_auto] items-center gap-2 rounded-xl border border-earth-100 bg-white px-3 py-2">
                          <span className="font-bold text-earth-900">{product.name}</span>
                          <span className="text-earth-500">=</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            className="input-field"
                            placeholder="0"
                            value={qty}
                            onChange={(event) => {
                              const next = event.target.value
                              setProductQtys((current) => {
                                const copy = { ...current }
                                if (!next || Number(next) <= 0) delete copy[product.id]
                                else copy[product.id] = next
                                return copy
                              })
                            }}
                          />
                          <span className="text-xs text-earth-500 whitespace-nowrap">
                            kg {lineTotal > 0 ? `• ${lineTotal.toFixed(2)} ETB` : `• ${Number(product.selling_price).toFixed(2)}/kg`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {selectedProductLines.length > 0 && (
                    <div className="mt-3 rounded-xl border border-spice-200 bg-spice-50 px-3 py-2 text-sm text-spice-900">
                      <div className="font-bold">Registered:</div>
                      <div className="mt-1">
                        {selectedProductLines.map((line) => (
                          <span key={line.productId} className="mr-3 inline-block">
                            {line.productName} = {line.quantityKg} kg
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Total credit (auto)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="input-field bg-earth-50"
                      readOnly={selectedProductLines.length > 0}
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
                {openCredits.length} open • {sortedLedger.length} total — kg taken per product is saved for each entry.
              </p>
              {productList.length > 0 && openCredits.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {openCreditKgByProduct.map(({ product, kg }) => (
                    <div key={product.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                      <span className="font-bold text-earth-900">{product.name}</span>
                      <span className="text-amber-800"> = {kg.toFixed(2)} kg on open credit</span>
                    </div>
                  ))}
                </div>
              )}
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
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Customer</th>
                      {productList.map((product) => (
                        <th key={product.id} className="px-3 py-2">{product.name} (kg)</th>
                      ))}
                      <th className="px-3 py-2">Total ETB</th>
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
                          {productList.map((product) => {
                            const kg = getCreditKgForProduct(row, product.id)
                            return (
                              <td key={product.id} className={`px-3 py-3 ${kg > 0 ? 'font-bold text-earth-900' : 'text-earth-300'}`}>
                                {kg > 0 ? kg.toFixed(2) : '—'}
                              </td>
                            )
                          })}
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
                            <>
                              <button type="button" className="text-spice-700 font-bold mr-3" onClick={() => setPayCreditId(row.id)}>Pay</button>
                              <button
                                type="button"
                                className="text-green-700 font-bold mr-3"
                                onClick={async () => {
                                  if (!confirm('Mark this credit as fully paid?')) return
                                  try {
                                    await markCreditPaid(row.id)
                                    setMessage({ type: 'success', text: 'Credit marked as paid.' })
                                  } catch (err) {
                                    setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not mark as paid.' })
                                  }
                                }}
                              >
                                Mark paid
                              </button>
                            </>
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
