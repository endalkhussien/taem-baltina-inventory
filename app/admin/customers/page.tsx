"use client"

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'
import { useCustomers } from '../../../hooks/useModules'

export default function CustomersPage() {
  const { data: customers, isLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const [editing, setEditing] = useState<number | null>(null)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: '', phone: '', notes: '' } })
  const list = Array.isArray(customers) ? customers : []

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
    if (editing) await updateCustomer(editing, values)
    else await createCustomer(values)
    setEditing(null)
    reset()
  }

  const totalOutstanding = list.reduce((sum, customer) => sum + Number(customer.outstanding_balance), 0)

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-earth-900">Customers</h1>
              <p className="text-earth-500 text-sm mt-1">Track credit customers, phone numbers, notes, and open balances.</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-3 shadow-spice border border-earth-100">
              <div className="text-xs uppercase tracking-wide text-earth-500">Total customer credit</div>
              <div className="text-2xl font-bold text-spice-700">{totalOutstanding.toFixed(2)} ETB</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">{editing ? 'Edit Customer' : 'New Customer'}</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Name</label>
                  <input className="input-field" {...register('name', { required: true })} placeholder="Customer or shop name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Phone</label>
                  <input className="input-field" {...register('phone')} placeholder="+251..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Notes</label>
                  <textarea className="input-field" {...register('notes')} rows={3} placeholder="Location, credit terms, contact person..." />
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" type="submit">{editing ? 'Update Customer' : 'Create Customer'}</button>
                  {editing && <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="card md:col-span-2">Loading customers...</div>
              ) : list.length === 0 ? (
                <div className="card md:col-span-2 text-earth-500">No customers yet. Add credit customers before recording unpaid sales.</div>
              ) : list.map((customer) => (
                <div key={customer.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-earth-900">{customer.name}</h2>
                      <p className="text-sm text-earth-500">{customer.phone || 'No phone recorded'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(customer.outstanding_balance) > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {Number(customer.outstanding_balance).toFixed(2)} ETB
                    </span>
                  </div>
                  {customer.notes && <p className="mt-4 text-sm text-earth-600">{customer.notes}</p>}
                  <div className="mt-5 flex gap-3 text-sm">
                    <button className="font-medium text-spice-700 hover:text-spice-900" onClick={() => setEditing(customer.id)}>Edit</button>
                    <button className="font-medium text-red-600 hover:text-red-800" onClick={() => deleteCustomer(customer.id)}>Delete</button>
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
