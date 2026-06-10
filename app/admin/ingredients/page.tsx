"use client"
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useIngredients, usePurchases } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { ingredientCreateSchema } from '../../../lib/validators/ingredient'

const today = new Date().toISOString().slice(0, 10)

export default function IngredientsPage() {
  const { data: ingredients, isLoading, createIngredient, updateIngredient, deleteIngredient } = useIngredients()
  const { data: purchases, createPurchase } = usePurchases()
  const [editing, setEditing] = useState<number | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(ingredientCreateSchema as any),
    defaultValues: { name: '', quantity: 0, unit: '', costPerUnit: 0, alertThreshold: 0 }
  })
  const { register: registerPurchase, handleSubmit: handlePurchaseSubmit, reset: resetPurchase } = useForm({
    defaultValues: { ingredientId: 0, quantity: 0, costTotal: 0, supplier: '', purchaseDate: today }
  })

  const list = Array.isArray(ingredients) ? ingredients : []
  const purchaseList = Array.isArray(purchases) ? purchases : []

  useEffect(() => {
    if (editing) {
      const ingredient = Array.isArray(ingredients) ? ingredients.find((item) => item.id === editing) : null
      if (ingredient) {
        reset({
          name: ingredient.name,
          quantity: Number(ingredient.quantity),
          unit: ingredient.unit,
          costPerUnit: Number(ingredient.cost_per_unit),
          alertThreshold: Number(ingredient.alert_threshold)
        })
      }
    } else {
      reset({ name: '', quantity: 0, unit: '', costPerUnit: 0, alertThreshold: 0 })
    }
  }, [editing, ingredients, reset])

  const onSubmit = async (vals: any) => {
    if (editing) await updateIngredient(editing, vals)
    else await createIngredient(vals)
    reset()
    setEditing(null)
  }

  const onPurchaseSubmit = async (vals: any) => {
    await createPurchase(vals)
    resetPurchase({ ingredientId: 0, quantity: 0, costTotal: 0, supplier: '', purchaseDate: today })
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-earth-900">Ingredients</h1>
          <p className="text-earth-500 text-sm mt-1">Manage raw material inventory, costs, and reorder alerts.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">{editing ? 'Edit Ingredient' : 'New Ingredient'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Name</label>
                <input className="input-field" placeholder="e.g. Red pepper" {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-red-600">Name is required.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Quantity</label>
                <input type="number" step="0.001" className="input-field" {...register('quantity', { valueAsNumber: true })} />
                {errors.quantity && <p className="mt-1 text-xs text-red-600">Quantity must be zero or higher.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Unit (kg, L, etc)</label>
                <input className="input-field" placeholder="kg" {...register('unit')} />
                {errors.unit && <p className="mt-1 text-xs text-red-600">Unit is required.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Cost Per Unit (ETB)</label>
                <input type="number" step="0.01" className="input-field" {...register('costPerUnit', { valueAsNumber: true })} />
                {errors.costPerUnit && <p className="mt-1 text-xs text-red-600">Cost must be zero or higher.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Alert Threshold</label>
                <input type="number" step="0.001" className="input-field" {...register('alertThreshold', { valueAsNumber: true })} />
                {errors.alertThreshold && <p className="mt-1 text-xs text-red-600">Alert threshold must be zero or higher.</p>}
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1" type="submit">{editing ? 'Update Ingredient' : 'Create Ingredient'}</button>
                {editing && (
                  <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Restock Raw Material</h2>
            <form onSubmit={handlePurchaseSubmit(onPurchaseSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Ingredient</label>
                <select className="input-field" {...registerPurchase('ingredientId', { valueAsNumber: true })}>
                  <option value={0}>Select ingredient</option>
                  {list.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Quantity</label>
                  <input type="number" step="0.001" className="input-field" {...registerPurchase('quantity', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Total Cost</label>
                  <input type="number" step="0.01" className="input-field" {...registerPurchase('costTotal', { valueAsNumber: true })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Supplier</label>
                <input className="input-field" {...registerPurchase('supplier')} placeholder="Market, farmer, vendor..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Purchase Date</label>
                <input type="date" className="input-field" {...registerPurchase('purchaseDate')} />
              </div>
              <button className="btn-primary w-full" type="submit">Record restock</button>
            </form>
          </div>
          </div>
          <div className="lg:col-span-2 card overflow-x-auto">
            <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Ingredients List</h2>
            {isLoading ? (
              <div className="text-earth-500">Loading ingredients...</div>
            ) : list.length === 0 ? (
              <div className="text-earth-500">No ingredients yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Cost</th>
                    <th className="pb-3">Alert</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((ingredient) => {
                    const isLowStock = Number(ingredient.quantity) <= Number(ingredient.alert_threshold)

                    return (
                      <tr key={ingredient.id} className={`border-t border-earth-100 ${isLowStock ? 'bg-amber-50' : ''}`}>
                        <td className="py-3 font-medium text-earth-900">{ingredient.name}</td>
                        <td className="py-3 text-earth-700">{Number(ingredient.quantity).toFixed(3)}</td>
                        <td className="py-3 text-earth-700">{ingredient.unit}</td>
                        <td className="py-3 text-earth-700">{Number(ingredient.cost_per_unit).toFixed(2)}</td>
                        <td className="py-3">
                          <span className={isLowStock ? 'text-amber-700 font-medium' : 'text-earth-700'}>
                            {Number(ingredient.alert_threshold).toFixed(3)}
                          </span>
                        </td>
                        <td className="py-3 text-sm">
                          <button className="text-spice-700 hover:text-spice-900 mr-3" onClick={() => setEditing(ingredient.id)}>Edit</button>
                          <button className="text-red-600 hover:text-red-800" onClick={() => deleteIngredient(ingredient.id)}>Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="card overflow-x-auto mt-6">
          <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Purchase History</h2>
          {purchaseList.length === 0 ? (
            <div className="text-earth-500">No purchases recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Ingredient</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3">Cost</th>
                  <th className="pb-3">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {purchaseList.slice(0, 12).map((purchase) => (
                  <tr key={purchase.id} className="border-t border-earth-100">
                    <td className="py-3">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                    <td className="py-3 font-medium text-earth-900">{purchase.ingredient_name}</td>
                    <td className="py-3">{Number(purchase.quantity).toFixed(3)}</td>
                    <td className="py-3">{Number(purchase.cost_total).toFixed(2)} ETB</td>
                    <td className="py-3 text-earth-500">{purchase.supplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </>
  )
}

