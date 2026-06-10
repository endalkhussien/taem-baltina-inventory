"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIngredients } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'

export default function IngredientsPage() {
  const { data: ingredients, isLoading, createIngredient, updateIngredient, deleteIngredient } = useIngredients()
  const [editing, setEditing] = useState<number | null>(null)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: '', quantity: 0, unit: '', costPerUnit: 0, alertThreshold: 0 } })

  const onSubmit = async (vals: any) => {
    if (editing) await updateIngredient(editing, vals)
    else await createIngredient(vals)
    reset()
    setEditing(null)
  }

  const list = Array.isArray(ingredients) ? ingredients : []

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Ingredients</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-medium mb-3">{editing ? 'Edit' : 'Create'} Ingredient</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div><label className="block text-sm text-gray-700">Name</label><input className="w-full border rounded px-2 py-1" {...register('name')} /></div>
              <div><label className="block text-sm text-gray-700">Quantity</label><input type="number" step="0.01" className="w-full border rounded px-2 py-1" {...register('quantity')} /></div>
              <div><label className="block text-sm text-gray-700">Unit (kg, L, etc)</label><input className="w-full border rounded px-2 py-1" {...register('unit')} /></div>
              <div><label className="block text-sm text-gray-700">Cost Per Unit (ETB)</label><input type="number" step="0.01" className="w-full border rounded px-2 py-1" {...register('costPerUnit')} /></div>
              <div><label className="block text-sm text-gray-700">Alert Threshold</label><input type="number" step="0.01" className="w-full border rounded px-2 py-1" {...register('alertThreshold')} /></div>
              <button className="w-full bg-blue-600 text-white py-2 rounded">{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white shadow rounded p-4">
            <h2 className="text-lg font-medium mb-3">Ingredients List</h2>
            {isLoading ? <div>Loading...</div> : <table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Name</th><th className="pb-2">Qty</th><th className="pb-2">Unit</th><th className="pb-2">Cost</th><th className="pb-2">Actions</th></tr></thead><tbody>{list.map((i: any) => (<tr key={i.id} className="border-t"><td className="py-2">{i.name}</td><td className="py-2">{i.quantity}</td><td className="py-2">{i.unit}</td><td className="py-2">{Number(i.cost_per_unit).toFixed(2)}</td><td className="py-2 text-sm"><button className="text-blue-600 mr-2" onClick={() => setEditing(i.id)}>Edit</button><button className="text-red-600" onClick={() => deleteIngredient(i.id)}>Delete</button></td></tr>))}</tbody></table>}
          </div>
        </div>
      </div>
    </>
  )
}

