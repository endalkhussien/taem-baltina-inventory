"use client"
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useExpenses } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { expenseCreateSchema } from '../../../lib/validators/expense'

export default function ExpensesPage() {
  const { data: expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [editing, setEditing] = useState<number | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(expenseCreateSchema as any),
    defaultValues: { title: '', category: 'Other', amount: 0, notes: '' }
  })

  useEffect(() => {
    if (editing) {
      const expense = Array.isArray(expenses) ? expenses.find((item) => item.id === editing) : null
      if (expense) {
        reset({
          title: expense.title,
          category: expense.category,
          amount: Number(expense.amount),
          notes: expense.notes ?? ''
        })
      }
    } else {
      reset({ title: '', category: 'Other', amount: 0, notes: '' })
    }
  }, [editing, expenses, reset])

  const onSubmit = async (vals: any) => {
    if (editing) await updateExpense(editing, vals)
    else await createExpense(vals)
    reset()
    setEditing(null)
  }

  const list = Array.isArray(expenses) ? expenses : []
  const categories = ['Transport', 'Packaging', 'Rent', 'Salary', 'Utilities', 'Other']

  return (
    <>
      <AdminNav />
      <div className="app-page">
      <div className="app-container">
        <div className="page-hero-subtle">
          <div className="eyebrow">Operating costs</div>
          <h1 className="mt-2 font-display text-4xl font-black text-earth-950">Business Cost Register</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-500">
            Track packaging, transport, salaries, rent, utilities, and other costs that affect profit.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
          <h2 className="font-display text-xl font-black text-earth-950 mb-1">{editing ? 'Edit Cost Entry' : 'Add Cost Entry'}</h2>
          <p className="mb-5 text-sm text-earth-500">Use this for daily business expenses outside raw-material purchases.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1.5">Cost Description</label>
              <input className="input-field" {...register('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-600">Title is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1.5">Cost Category</label>
              <select className="input-field" {...register('category')}>{categories.map(c => (<option key={c} value={c}>{c}</option>))}</select>
              {errors.category && <p className="mt-1 text-xs text-red-600">Category is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1.5">Amount (ETB)</label>
              <input type="number" step="0.01" className="input-field" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="mt-1 text-xs text-red-600">Amount must be greater than zero.</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1.5">Notes</label>
              <textarea className="input-field" {...register('notes')} rows={3} />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" type="submit">{editing ? 'Update Cost' : 'Record Cost'}</button>
              {editing && (
                <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="lg:col-span-2 card overflow-x-auto">
          <h2 className="font-display text-xl font-black text-earth-950 mb-1">Operating Cost Ledger</h2>
          <p className="mb-4 text-sm text-earth-500">Recent non-material business costs.</p>
          {isLoading ? <div>Loading...</div> : <table className="w-full text-sm"><thead><tr className="table-head"><th className="pb-3">Description</th><th className="pb-3">Category</th><th className="pb-3">Amount</th><th className="pb-3">Actions</th></tr></thead><tbody>{list.map((e: any) => (<tr key={e.id} className="table-row"><td className="py-3 font-bold text-earth-950">{e.title}</td><td className="py-3">{e.category}</td><td className="py-3">{Number(e.amount).toFixed(2)} ETB</td><td className="py-3 text-sm"><button className="text-spice-700 font-bold mr-2" onClick={() => setEditing(e.id)}>Edit</button><button className="text-red-600 font-bold" onClick={() => deleteExpense(e.id)}>Delete</button></td></tr>))}</tbody></table>}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}


