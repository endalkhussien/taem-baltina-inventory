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
      <div className="app-page">
      <div className="app-container">
        <div className="page-hero-subtle">
          <div className="eyebrow">Raw material ledger</div>
          <h1 className="mt-2 font-display text-4xl font-black text-earth-950">Inputs, Costs, and Reorder Points</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-500">
            Track every raw material you buy, how much remains, weighted unit cost, and the point where you need to restock.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
          <div className="card">
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">{editing ? 'Edit Raw Material' : 'Add Raw Material'}</h2>
            <p className="mb-5 text-sm text-earth-500">Use this for reusable inputs like pepper, garlic, flour, oil, or packaging.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Raw Material Name</label>
                <input className="input-field" placeholder="e.g. Red pepper" {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-red-600">Name is required.</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Current Quantity On Hand</label>
                <input type="number" step="0.001" className="input-field" {...register('quantity', { valueAsNumber: true })} />
                {errors.quantity && <p className="mt-1 text-xs text-red-600">Quantity must be zero or higher.</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Unit of Measure</label>
                <input className="input-field" placeholder="kg" {...register('unit')} />
                {errors.unit && <p className="mt-1 text-xs text-red-600">Unit is required.</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Average Cost Per Unit (ETB)</label>
                <input type="number" step="0.01" className="input-field" {...register('costPerUnit', { valueAsNumber: true })} />
                {errors.costPerUnit && <p className="mt-1 text-xs text-red-600">Cost must be zero or higher.</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Reorder Alert Level</label>
                <input type="number" step="0.001" className="input-field" {...register('alertThreshold', { valueAsNumber: true })} />
                {errors.alertThreshold && <p className="mt-1 text-xs text-red-600">Alert threshold must be zero or higher.</p>}
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1" type="submit">{editing ? 'Update Raw Material' : 'Create Raw Material'}</button>
                {editing && (
                  <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="card">
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record Purchase / Restock</h2>
            <p className="mb-5 text-sm text-earth-500">Adds stock and recalculates average cost per unit.</p>
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
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Raw Material Stock</h2>
            <p className="mb-4 text-sm text-earth-500">Live inventory levels used by production batches.</p>
            {isLoading ? (
              <div className="text-earth-500">Loading ingredients...</div>
            ) : list.length === 0 ? (
              <div className="text-earth-500">No ingredients yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                    <th className="pb-3">Raw Material</th>
                    <th className="pb-3">On Hand</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Avg Cost</th>
                    <th className="pb-3">Reorder At</th>
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
          <h2 className="font-display text-xl font-black text-earth-950 mb-1">Raw Material Purchase History</h2>
          <p className="mb-4 text-sm text-earth-500">Recent restocks that explain inventory quantity and cost changes.</p>
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

