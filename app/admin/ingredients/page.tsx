"use client"
import React, { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useIngredients, usePurchases } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { ingredientCreateSchema } from '../../../lib/validators/ingredient'
import {
  formatCostFormula,
  purchaseUnitCost,
  weightedAverageCost
} from '../../../lib/inventoryCost'
import { toLocalDateKey, todayLocalKey } from '../../../lib/dates'

const today = todayLocalKey()
const defaultCategories = ['Spices', 'Fresh aromatics', 'Flours', 'Seasoning', 'Packaging', 'Other']

function IngredientsContent() {
  const { data: ingredients, isLoading, createIngredient, updateIngredient, isCreatingIngredient, isUpdatingIngredient, deleteIngredient } = useIngredients()
  const { data: purchases, createPurchase, isCreatingPurchase } = usePurchases()
  const [editing, setEditing] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [costEntryMode, setCostEntryMode] = useState<'unit' | 'total'>('unit')
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [pendingPurchase, setPendingPurchase] = useState<{
    ingredientId: number
    ingredientName: string
    quantity: number
    costTotal: number
    supplier: string
    purchaseDate: string
    unit: string
    stockAfter: number
  } | null>(null)
  const isSaving = isCreatingIngredient || isUpdatingIngredient
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') || ''
  const lowOnly = searchParams.get('filter') === 'low'
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(ingredientCreateSchema as any),
    defaultValues: { name: '', category: 'Spices', quantity: 0, unit: '', costPerUnit: 0, alertThreshold: 0 }
  })
  const { register: registerPurchase, handleSubmit: handlePurchaseSubmit, reset: resetPurchase, watch: watchPurchase, setValue: setPurchaseValue } = useForm({
    defaultValues: { ingredientId: 0, quantity: 1, costTotal: 0, supplier: '', purchaseDate: today }
  })

  const list = Array.isArray(ingredients) ? ingredients : []
  const categories = Array.from(new Set([...defaultCategories, ...list.map((ingredient) => ingredient.category || 'Other')]))
  const filteredList = list.filter((ingredient) => {
    const matchesCategory = activeCategory ? ingredient.category === activeCategory : true
    const matchesLowStock = lowOnly ? Number(ingredient.quantity) <= Number(ingredient.alert_threshold) : true
    return matchesCategory && matchesLowStock
  })
  const totalStockValue = filteredList.reduce((sum, ingredient) => sum + Number(ingredient.quantity) * Number(ingredient.cost_per_unit), 0)
  const purchaseList = Array.isArray(purchases) ? purchases : []
  const purchaseIngredientId = Number(watchPurchase('ingredientId') || 0)
  const purchaseQuantity = Number(watchPurchase('quantity') || 0)
  const purchaseCostTotal = Number(watchPurchase('costTotal') || 0)
  const selectedPurchaseIngredient = list.find((ingredient) => ingredient.id === purchaseIngredientId)
  const restockUnitCost = purchaseUnitCost(purchaseQuantity, purchaseCostTotal)
  const stockAfterRestock = selectedPurchaseIngredient ? Number(selectedPurchaseIngredient.quantity) + purchaseQuantity : purchaseQuantity
  const weightedAverageAfterRestock = selectedPurchaseIngredient
    ? weightedAverageCost(
        Number(selectedPurchaseIngredient.quantity),
        Number(selectedPurchaseIngredient.cost_per_unit),
        purchaseQuantity,
        purchaseCostTotal
      )
    : restockUnitCost
  const costFormulaText = selectedPurchaseIngredient
    ? formatCostFormula(
        Number(selectedPurchaseIngredient.quantity),
        Number(selectedPurchaseIngredient.cost_per_unit),
        purchaseQuantity,
        purchaseCostTotal,
        selectedPurchaseIngredient.unit
      )
    : purchaseQuantity > 0 && purchaseCostTotal > 0
      ? `This purchase unit cost: ${restockUnitCost.toFixed(2)} ETB per unit`
      : 'Select ingredient and enter quantity + cost.'

  const todayPurchases = purchaseList.filter(
    (purchase) => toLocalDateKey(purchase.purchase_date) === today
  )
  const costTotalRegister = registerPurchase('costTotal', { valueAsNumber: true })
  const currentAvgCost = selectedPurchaseIngredient ? Number(selectedPurchaseIngredient.cost_per_unit) : 0
  const lastPurchase = purchaseList[0] ?? null

  useEffect(() => {
    const unitPrice = Number(unitPriceInput)
    if (costEntryMode !== 'unit') return
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || purchaseQuantity <= 0) return
    setPurchaseValue('costTotal', Number((purchaseQuantity * unitPrice).toFixed(2)))
  }, [costEntryMode, purchaseQuantity, setPurchaseValue, unitPriceInput])

  useEffect(() => {
    if (costEntryMode !== 'total') return
    if (purchaseQuantity <= 0 || purchaseCostTotal <= 0) return
    setUnitPriceInput(String(purchaseUnitCost(purchaseQuantity, purchaseCostTotal)))
  }, [costEntryMode, purchaseCostTotal, purchaseQuantity])

  useEffect(() => {
    if (editing) {
      const ingredient = Array.isArray(ingredients) ? ingredients.find((item) => item.id === editing) : null
      if (ingredient) {
        reset({
          name: ingredient.name,
          category: ingredient.category || 'Spices',
          quantity: Number(ingredient.quantity),
          unit: ingredient.unit,
          costPerUnit: Number(ingredient.cost_per_unit),
          alertThreshold: Number(ingredient.alert_threshold)
        })
      }
    } else {
      reset({ name: '', category: 'Spices', quantity: 0, unit: '', costPerUnit: 0, alertThreshold: 0 })
    }
  }, [editing, ingredients, reset])

  const onSubmit = async (vals: any) => {
    setSubmitError('')

    try {
      if (editing) await updateIngredient(editing, vals)
      else await createIngredient(vals)
      reset()
      setEditing(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save raw material.')
    }
  }

  const resolvePurchaseCost = (quantity: number, formCostTotal: number) => {
    const unitPrice = Number(unitPriceInput)
    if (costEntryMode === 'unit' && Number.isFinite(unitPrice) && unitPrice > 0 && quantity > 0) {
      return Number((quantity * unitPrice).toFixed(2))
    }
    return Number(formCostTotal)
  }

  const onPurchaseSubmit = (vals: { ingredientId: number; quantity: number; costTotal: number; supplier?: string; purchaseDate: string }) => {
    setPurchaseMessage(null)

    const ingredient = list.find((item) => item.id === vals.ingredientId)
    if (!ingredient) {
      setPurchaseMessage({ type: 'error', text: 'Select an ingredient to restock.' })
      return
    }

    const quantity = Number(vals.quantity)
    const costTotal = resolvePurchaseCost(quantity, Number(vals.costTotal))
    if (!quantity || quantity <= 0) {
      setPurchaseMessage({ type: 'error', text: 'Enter a quantity greater than zero.' })
      return
    }
    if (!costTotal || costTotal <= 0) {
      setPurchaseMessage({ type: 'error', text: 'Enter the total cost or unit price × quantity.' })
      return
    }

    setPendingPurchase({
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity,
      costTotal,
      supplier: vals.supplier?.trim() || '',
      purchaseDate: vals.purchaseDate || today,
      unit: ingredient.unit,
      stockAfter: Number(ingredient.quantity) + quantity
    })
  }

  const confirmPurchase = async () => {
    if (!pendingPurchase) return
    setPurchaseMessage(null)
    const snapshot = pendingPurchase

    try {
      const result = await createPurchase({
        ingredientId: snapshot.ingredientId,
        quantity: snapshot.quantity,
        costTotal: snapshot.costTotal,
        supplier: snapshot.supplier || undefined,
        purchaseDate: snapshot.purchaseDate
      })
      const newAvg = Number((result as { new_average_cost?: number }).new_average_cost ?? weightedAverageCost(
        Number(list.find((item) => item.id === snapshot.ingredientId)?.quantity ?? 0),
        Number(list.find((item) => item.id === snapshot.ingredientId)?.cost_per_unit ?? 0),
        snapshot.quantity,
        snapshot.costTotal
      ))
      setPendingPurchase(null)
      setUnitPriceInput('')
      resetPurchase({ ingredientId: 0, quantity: 1, costTotal: 0, supplier: '', purchaseDate: today })
      setPurchaseMessage({
        type: 'success',
        text: `Restock saved: +${snapshot.quantity} ${snapshot.unit} ${snapshot.ingredientName}. New average cost: ${newAvg.toFixed(2)} ETB/${snapshot.unit}.`
      })
    } catch (err) {
      setPurchaseMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record purchase.' })
    }
  }

  const repeatLastPurchase = () => {
    if (!lastPurchase) return
    setPurchaseValue('ingredientId', lastPurchase.ingredient_id)
    setPurchaseValue('quantity', Number(lastPurchase.quantity))
    setPurchaseValue('costTotal', Number(lastPurchase.cost_total))
    setPurchaseValue('supplier', lastPurchase.supplier || '')
    setPurchaseValue('purchaseDate', today)
    const unitCost = Number(lastPurchase.quantity) > 0 ? Number(lastPurchase.cost_total) / Number(lastPurchase.quantity) : 0
    setUnitPriceInput(unitCost > 0 ? String(unitCost) : '')
    setPendingPurchase(null)
    setPurchaseMessage(null)
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
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Category</label>
                <select className="input-field" {...register('category')}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-600">Category is required.</p>}
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
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Alert Stock Level</label>
                <input type="number" step="0.001" className="input-field" {...register('alertThreshold', { valueAsNumber: true })} />
                {errors.alertThreshold && <p className="mt-1 text-xs text-red-600">Alert threshold must be zero or higher.</p>}
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editing ? 'Update Raw Material' : 'Create Raw Material'}
                </button>
                {editing && (
                  <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                )}
              </div>
              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {submitError}
                </div>
              )}
            </form>
          </div>
          <div className="card border-l-4 border-l-spice-500">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-black text-earth-950">Restock</h2>
                <p className="text-sm text-earth-500">Adds stock and updates weighted average cost.</p>
              </div>
              {lastPurchase && (
                <button type="button" className="rounded-lg bg-earth-100 px-3 py-1.5 text-xs font-bold text-earth-700" onClick={repeatLastPurchase}>
                  Repeat last
                </button>
              )}
            </div>

            {selectedPurchaseIngredient && (
              <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl bg-earth-50 p-3 text-sm">
                <div>
                  <div className="text-xs text-earth-500">On hand now</div>
                  <div className="font-bold">{Number(selectedPurchaseIngredient.quantity).toFixed(3)} {selectedPurchaseIngredient.unit}</div>
                </div>
                <div>
                  <div className="text-xs text-earth-500">Current avg cost</div>
                  <div className="font-bold">{currentAvgCost.toFixed(2)} ETB/{selectedPurchaseIngredient.unit}</div>
                </div>
              </div>
            )}

            <form onSubmit={handlePurchaseSubmit(onPurchaseSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Raw material</label>
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
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    inputMode="decimal"
                    className="input-field"
                    {...registerPurchase('quantity', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Date</label>
                  <input type="date" className="input-field" {...registerPurchase('purchaseDate')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Unit price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    className="input-field"
                    placeholder="Per kg/unit"
                    value={unitPriceInput}
                    onChange={(event) => {
                      setCostEntryMode('unit')
                      setUnitPriceInput(event.target.value)
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Total cost (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input-field"
                    {...costTotalRegister}
                    onChange={(event) => {
                      costTotalRegister.onChange(event)
                      setCostEntryMode('total')
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Supplier (optional)</label>
                <input className="input-field" {...registerPurchase('supplier')} placeholder="Market, farmer..." />
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-spice-50 to-earth-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-earth-500">New average cost preview</div>
                <div className="mt-2 text-2xl font-black text-spice-800">
                  {weightedAverageAfterRestock.toFixed(2)} ETB/{selectedPurchaseIngredient?.unit || 'unit'}
                </div>
                <p className="mt-2 text-xs leading-5 text-earth-600">{costFormulaText}</p>
              </div>

              <button className="btn-primary w-full" type="submit" disabled={isCreatingPurchase || !!pendingPurchase}>
                {isCreatingPurchase ? 'Saving...' : 'Review restock'}
              </button>

              {pendingPurchase && (
                <div className="rounded-2xl border-2 border-spice-300 bg-spice-50 p-4">
                  <h3 className="font-display text-lg font-black text-earth-950">Confirm before posting</h3>
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-earth-500">Date</dt><dd className="font-bold">{toLocalDateKey(pendingPurchase.purchaseDate)}</dd></div>
                    <div><dt className="text-earth-500">Ingredient</dt><dd className="font-bold">{pendingPurchase.ingredientName}</dd></div>
                    <div><dt className="text-earth-500">Quantity</dt><dd className="font-bold">+{pendingPurchase.quantity} {pendingPurchase.unit}</dd></div>
                    <div><dt className="text-earth-500">Total cost</dt><dd className="font-bold">{pendingPurchase.costTotal.toFixed(2)} ETB</dd></div>
                    <div><dt className="text-earth-500">Unit cost (this purchase)</dt><dd className="font-bold">{purchaseUnitCost(pendingPurchase.quantity, pendingPurchase.costTotal).toFixed(2)} ETB</dd></div>
                    <div><dt className="text-earth-500">New average cost</dt><dd className="font-bold">{weightedAverageCost(
                      Number(list.find((item) => item.id === pendingPurchase.ingredientId)?.quantity ?? 0),
                      Number(list.find((item) => item.id === pendingPurchase.ingredientId)?.cost_per_unit ?? 0),
                      pendingPurchase.quantity,
                      pendingPurchase.costTotal
                    ).toFixed(2)} ETB/{pendingPurchase.unit}</dd></div>
                    <div><dt className="text-earth-500">Stock after</dt><dd className="font-bold">{pendingPurchase.stockAfter.toFixed(3)} {pendingPurchase.unit}</dd></div>
                    {pendingPurchase.supplier && (
                      <div><dt className="text-earth-500">Supplier</dt><dd className="font-bold">{pendingPurchase.supplier}</dd></div>
                    )}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="btn-primary" type="button" onClick={confirmPurchase} disabled={isCreatingPurchase}>
                      {isCreatingPurchase ? 'Posting...' : 'Confirm & record restock'}
                    </button>
                    <button className="btn-secondary" type="button" onClick={() => setPendingPurchase(null)} disabled={isCreatingPurchase}>
                      Edit
                    </button>
                  </div>
                </div>
              )}

              {todayPurchases.length > 0 && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <div className="font-bold">Today&apos;s restocks ({todayPurchases.length})</div>
                  <ul className="mt-2 space-y-1">
                    {todayPurchases.slice(0, 5).map((purchase) => (
                      <li key={purchase.id}>
                        {purchase.ingredient_name}: +{Number(purchase.quantity)} • {Number(purchase.cost_total).toFixed(2)} ETB
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {purchaseMessage && (
                <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${purchaseMessage.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {purchaseMessage.text}
                </div>
              )}
            </form>
          </div>
          </div>
          <div className="lg:col-span-2 card overflow-x-auto">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-display text-xl font-black text-earth-950 mb-1">Raw Material Stock</h2>
                <p className="text-sm text-earth-500">
                  {lowOnly ? 'Showing low-stock materials.' : activeCategory ? `Showing ${activeCategory}.` : 'Live inventory levels used by production batches.'}
                </p>
              </div>
              <div className="rounded-2xl bg-spice-50 px-4 py-3 text-sm text-spice-800">
                Stock value: <span className="font-black">{totalStockValue.toFixed(2)} ETB</span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <a href="/admin/ingredients" className={`rounded-full px-3 py-1 text-xs font-bold ${!activeCategory && !lowOnly ? 'bg-spice-700 text-white' : 'bg-earth-100 text-earth-700'}`}>All</a>
              <a href="/admin/ingredients?filter=low" className={`rounded-full px-3 py-1 text-xs font-bold ${lowOnly ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>Low stock</a>
              {categories.map((category) => (
                <a key={category} href={`/admin/ingredients?category=${encodeURIComponent(category)}`} className={`rounded-full px-3 py-1 text-xs font-bold ${activeCategory === category ? 'bg-spice-700 text-white' : 'bg-earth-100 text-earth-700'}`}>
                  {category}
                </a>
              ))}
            </div>
            {isLoading ? (
              <div className="text-earth-500">Loading ingredients...</div>
            ) : filteredList.length === 0 ? (
              <div className="text-earth-500">No raw materials match this view.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                    <th className="pb-3">Raw Material</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">On Hand</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Avg Cost</th>
                    <th className="pb-3">Alert Stock</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((ingredient) => {
                    const isLowStock = Number(ingredient.quantity) <= Number(ingredient.alert_threshold)

                    return (
                      <tr key={ingredient.id} className={`border-t border-earth-100 ${isLowStock ? 'bg-amber-50' : ''}`}>
                        <td className="py-3 font-medium text-earth-900">{ingredient.name}</td>
                        <td className="py-3 text-earth-700">{ingredient.category}</td>
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
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={async () => {
                              if (!confirm('Delete this raw material? Purchases or recipes may prevent deletion.')) return
                              setSubmitError('')
                              try {
                                await deleteIngredient(ingredient.id)
                              } catch (err) {
                                setSubmitError(err instanceof Error ? err.message : 'Could not delete raw material.')
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

export default function IngredientsPage() {
  return (
    <Suspense fallback={<div className="app-page"><div className="app-container"><div className="card">Loading raw materials...</div></div></div>}>
      <IngredientsContent />
    </Suspense>
  )
}

