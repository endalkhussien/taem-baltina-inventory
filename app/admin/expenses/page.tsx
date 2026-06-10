"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useExpenses } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'

export default function ExpensesPage() {
  const { data: expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [editing, setEditing] = useState<number | null>(null)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { title: '', category: 'Other', amount: 0, notes: '' } })

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
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Expenses</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-medium mb-3">{editing ? 'Edit' : 'Create'} Expense</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div><label className="block text-sm text-gray-700">Title</label><input className="w-full border rounded px-2 py-1" {...register('title')} /></div>
            <div><label className="block text-sm text-gray-700">Category</label><select className="w-full border rounded px-2 py-1" {...register('category')}>{categories.map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
            <div><label className="block text-sm text-gray-700">Amount (ETB)</label><input type="number" step="0.01" className="w-full border rounded px-2 py-1" {...register('amount')} /></div>
            <div><label className="block text-sm text-gray-700">Notes</label><textarea className="w-full border rounded px-2 py-1" {...register('notes')} rows={3} /></div>
            <button className="w-full bg-blue-600 text-white py-2 rounded">{editing ? 'Update' : 'Create'}</button>
          </form>
        </div>
        <div className="lg:col-span-2 bg-white shadow rounded p-4">
          <h2 className="text-lg font-medium mb-3">Expenses List</h2>
          {isLoading ? <div>Loading...</div> : <table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Title</th><th className="pb-2">Category</th><th className="pb-2">Amount</th><th className="pb-2">Actions</th></tr></thead><tbody>{list.map((e: any) => (<tr key={e.id} className="border-t"><td className="py-2">{e.title}</td><td className="py-2">{e.category}</td><td className="py-2">{Number(e.amount).toFixed(2)}</td><td className="py-2 text-sm"><button className="text-blue-600 mr-2" onClick={() => setEditing(e.id)}>Edit</button><button className="text-red-600" onClick={() => deleteExpense(e.id)}>Delete</button></td></tr>))}</tbody></table>}
          </div>
        </div>
      </div>
    </>
  )
}


