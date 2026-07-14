"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'
import { useCreditLedgers, useCreditPayments, useCustomers } from '../../../hooks/useModules'

const today = new Date().toISOString().slice(0, 10)

export default function CustomersPage() {
  const { data: customers, isLoading, createCustomer, updateCustomer, isCreatingCustomer, isUpdatingCustomer, deleteCustomer } = useCustomers()
  const { data: creditLedgers, createCreditLedger, isCreatingCreditLedger, deleteCreditLedger } = useCreditLedgers()
  const { createCreditPayment, isCreatingCreditPayment } = useCreditPayments()
  const [editing, setEditing] = useState<number | null>(null)
  const [payCreditId, setPayCreditId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: '', phone: '', notes: '' } })
  const creditForm = useForm({
    defaultValues: { customerId: 0, title: '', totalAmount: 0, amountPaid: 0, creditDate: today, notes: '' }
  })
  const paymentForm = useForm({ defaultValues: { amount: 0, paymentDate: today, notes: '' } })

  const list = useMemo(() => (Array.isArray(customers) ? customers : []), [customers])
  const ledgerList = useMemo(() => (Array.isArray(creditLedgers) ? creditLedgers : []), [creditLedgers])
  const isSaving = isCreatingCustomer || isUpdatingCustomer

  const openCredits = useMemo(() => ledgerList.filter((row) => Number(row.balance) > 0), [ledgerList])
  const totalLedgerCredit = ledgerList.reduce((sum, row) => sum + Number(row.balance), 0)
  const totalSalesCredit = list.reduce((sum, customer) => sum + Number(customer.outstanding_balance), 0)
  const totalAllCredit = totalLedgerCredit + totalSalesCredit

  const selectedCredit = openCredits.find((row) => row.id === payCreditId) ?? null

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

  const onSubmitCustomer = async (values: any) => {
    setMessage(null)
    try {
      if (editing) await updateCustomer(editing, values)
      else await createCustomer(values)
      setEditing(null)
      reset()
      setMessage({ type: 'success', text: 'Customer saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not save customer.' })
    }
  }

  const onSubmitCredit = async (values: any) => {
    setMessage(null)
    try {
      await createCreditLedger(values)
      creditForm.reset({ customerId: 0, title: '', totalAmount: 0, amountPaid: 0, creditDate: today, notes: '' })
      setMessage({ type: 'success', text: 'Credit recorded. Balance tracked separately from sales.' })
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
                Record credit owed to you without linking to sales. Enter total amount, optional payment now, then collect partial or full payments later.
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
              <p className="mb-5 text-sm text-earth-500">Simple credit — not tied to a sale. Example: customer took 5,000 ETB goods on credit.</p>
              <form onSubmit={creditForm.handleSubmit(onSubmitCredit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Customer</label>
                  <select className="input-field" {...creditForm.register('customerId', { valueAsNumber: true })}>
                    <option value={0}>Select customer</option>
                    {list.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">What is owed for?</label>
                  <input className="input-field" {...creditForm.register('title', { required: true })} placeholder="e.g. Berbere 20kg on credit" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Total credit (ETB)</label>
                    <input type="number" step="0.01" min="0" className="input-field" {...creditForm.register('totalAmount', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Paid now (ETB)</label>
                    <input type="number" step="0.01" min="0" className="input-field" {...creditForm.register('amountPaid', { valueAsNumber: true })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Credit date</label>
                  <input type="date" className="input-field" {...creditForm.register('creditDate')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Notes</label>
                  <input className="input-field" {...creditForm.register('notes')} placeholder="Optional" />
                </div>
                <button className="btn-primary w-full" type="submit" disabled={isCreatingCreditLedger}>
                  {isCreatingCreditLedger ? 'Saving...' : 'Save credit'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Open credit list</h2>
              <p className="mb-4 text-sm text-earth-500">{openCredits.length} open entr{openCredits.length === 1 ? 'y' : 'ies'} • Pay partial or full anytime.</p>
              {openCredits.length === 0 ? (
                <p className="text-sm text-earth-500">No open credit. Record credit above when a customer owes you money.</p>
              ) : (
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Paid</th>
                      <th className="px-3 py-2">Balance</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openCredits.map((row) => (
                      <tr key={row.id} className="table-row">
                        <td className="px-3 py-3">{new Date(row.credit_date).toLocaleDateString()}</td>
                        <td className="px-3 py-3 font-bold">{row.customer_name}</td>
                        <td className="px-3 py-3">{row.title}</td>
                        <td className="px-3 py-3">{Number(row.total_amount).toFixed(2)}</td>
                        <td className="px-3 py-3 text-green-700">{Number(row.amount_paid).toFixed(2)}</td>
                        <td className="px-3 py-3 font-bold text-red-700">{Number(row.balance).toFixed(2)}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button type="button" className="text-spice-700 font-bold mr-3" onClick={() => setPayCreditId(row.id)}>Pay</button>
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {payCreditId && selectedCredit && (
            <div className="card max-w-xl">
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
              <form onSubmit={handleSubmit(onSubmitCustomer)} className="space-y-4 mt-4">
                <input className="input-field" placeholder="Customer name" {...register('name', { required: true })} />
                <input className="input-field" placeholder="Phone" {...register('phone')} />
                <textarea className="input-field" rows={2} placeholder="Notes" {...register('notes')} />
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editing ? 'Update' : 'Add'}</button>
                  {editing && <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Customers</h2>
              {isLoading ? <p className="text-earth-500">Loading...</p> : list.length === 0 ? (
                <p className="text-earth-500">Add a customer first, then record credit above.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-head">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Phone</th>
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
