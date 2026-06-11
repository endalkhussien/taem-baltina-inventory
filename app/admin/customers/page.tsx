"use client"

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'
import { useCustomers } from '../../../hooks/useModules'

export default function CustomersPage() {
  const { data: customers, isLoading, createCustomer, updateCustomer, isCreatingCustomer, isUpdatingCustomer, deleteCustomer } = useCustomers()
  const [editing, setEditing] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: '', phone: '', notes: '' } })
  const list = Array.isArray(customers) ? customers : []
  const isSaving = isCreatingCustomer || isUpdatingCustomer

  useEffect(() => {
    if (!editing) {
      reset({ name: '', phone: '', notes: '' })
      return
    }

    const customer = Array.isArray(customers) ? customers.find((item) => item.id === editing) : null
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone ?? '',
        notes: customer.notes ?? ''
      })
    }
  }, [editing, customers, reset])

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

  const totalOutstanding = list.reduce((sum, customer) => sum + Number(customer.outstanding_balance), 0)

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
                Maintain customer contact details and see who still owes money from partial or unpaid sales.
              </p>
            </div>
            <div className="rounded-3xl bg-spice-50 px-5 py-4 shadow-sm border border-spice-100">
              <div className="text-xs uppercase tracking-wide text-earth-500">Total customer credit</div>
              <div className="text-3xl font-black text-spice-800">{totalOutstanding.toFixed(2)} ETB</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                {message && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {message.text}
                  </div>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="card md:col-span-2">Loading customers...</div>
              ) : list.length === 0 ? (
                <div className="card md:col-span-2 text-earth-500">No customers yet. Add credit customers before recording unpaid sales.</div>
              ) : list.map((customer) => (
                <div key={customer.id} className="card relative overflow-hidden">
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${Number(customer.outstanding_balance) > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-earth-950">{customer.name}</h2>
                      <p className="text-sm text-earth-500">{customer.phone || 'No phone recorded'}</p>
                    </div>
                    <span className={`status-pill ${Number(customer.outstanding_balance) > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {Number(customer.outstanding_balance).toFixed(2)} ETB
                    </span>
                  </div>
                  {customer.notes && <p className="mt-4 text-sm text-earth-600">{customer.notes}</p>}
                  <div className="mt-5 flex gap-3 text-sm">
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
