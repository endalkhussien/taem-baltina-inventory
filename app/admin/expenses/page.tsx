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
      <div className="min-h-screen bg-spice-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-earth-900">Expenses</h1>
          <p className="text-earth-500 text-sm mt-1">Track operating costs for accurate profit reporting.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
          <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">{editing ? 'Edit Expense' : 'New Expense'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Title</label>
              <input className="input-field" {...register('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-600">Title is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Category</label>
              <select className="input-field" {...register('category')}>{categories.map(c => (<option key={c} value={c}>{c}</option>))}</select>
              {errors.category && <p className="mt-1 text-xs text-red-600">Category is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Amount (ETB)</label>
              <input type="number" step="0.01" className="input-field" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="mt-1 text-xs text-red-600">Amount must be greater than zero.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Notes</label>
              <textarea className="input-field" {...register('notes')} rows={3} />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" type="submit">{editing ? 'Update Expense' : 'Create Expense'}</button>
              {editing && (
                <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="lg:col-span-2 card overflow-x-auto">
          <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Expenses List</h2>
          {isLoading ? <div>Loading...</div> : <table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Title</th><th className="pb-2">Category</th><th className="pb-2">Amount</th><th className="pb-2">Actions</th></tr></thead><tbody>{list.map((e: any) => (<tr key={e.id} className="border-t"><td className="py-2">{e.title}</td><td className="py-2">{e.category}</td><td className="py-2">{Number(e.amount).toFixed(2)}</td><td className="py-2 text-sm"><button className="text-blue-600 mr-2" onClick={() => setEditing(e.id)}>Edit</button><button className="text-red-600" onClick={() => deleteExpense(e.id)}>Delete</button></td></tr>))}</tbody></table>}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}


