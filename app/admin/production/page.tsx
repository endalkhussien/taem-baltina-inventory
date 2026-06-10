"use client"

import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import AdminNav from '../../../components/AdminNav'
import { useProduction } from '../../../hooks/useModules'
import { useProducts } from '../../../hooks/useProducts'

const today = new Date().toISOString().slice(0, 10)

export default function ProductionPage() {
  const { data: products } = useProducts()
  const { data: batches, isLoading, createProduction } = useProduction()
  const [message, setMessage] = useState('')
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { productId: 0, quantityProduced: 1, producedAt: today, notes: '' }
  })

  const productList = Array.isArray(products) ? products : []
  const batchList = Array.isArray(batches) ? batches : []
  const selectedProductId = Number(watch('productId'))
  const quantityProduced = Number(watch('quantityProduced') || 0)

  const recipe = useQuery({
    queryKey: ['recipe', selectedProductId],
    enabled: selectedProductId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/products/${selectedProductId}/recipe`)
      if (!res.ok) throw new Error('Failed to load recipe')
      return res.json()
    }
  })

  const requiredMaterials = useMemo(() => {
    if (!recipe.data?.lines) return []
    return recipe.data.lines.map((line: any) => ({
      name: line.ingredient_name,
      unit: line.ingredient_unit,
      costPerUnit: Number(line.ingredient_cost_per_unit),
      quantity: Number(line.quantity_per_unit) * quantityProduced
    }))
  }, [quantityProduced, recipe.data])

  const materialCost = requiredMaterials.reduce((sum, line) => sum + line.quantity * line.costPerUnit, 0)

  const onSubmit = async (values: any) => {
    setMessage('')
    try {
      await createProduction(values)
      reset({ productId: 0, quantityProduced: 1, producedAt: today, notes: '' })
      setMessage('Production batch recorded and inventory updated.')
    } catch {
      setMessage('Could not record production. Check that the product has a recipe and enough raw materials.')
    }
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-earth-900">Production</h1>
            <p className="text-earth-500 text-sm mt-1">Record finished products made from recurring raw-material recipes.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">New Production Batch</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Product</label>
                  <select className="input-field" {...register('productId', { valueAsNumber: true })}>
                    <option value={0}>Select product</option>
                    {productList.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} ({product.stock_quantity} in stock)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Quantity Produced</label>
                  <input type="number" min="1" className="input-field" {...register('quantityProduced', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Production Date</label>
                  <input type="date" className="input-field" {...register('producedAt')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Notes</label>
                  <textarea className="input-field" rows={3} {...register('notes')} placeholder="Batch notes, staff, packaging..." />
                </div>
                <button className="btn-primary w-full" type="submit">Record production</button>
              </form>
              {message && <div className="mt-4 rounded-xl bg-earth-50 border border-earth-100 p-3 text-sm text-earth-700">{message}</div>}
            </div>

            <div className="card lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-earth-900">Materials Required</h2>
                  <p className="text-sm text-earth-500">Preview of raw materials consumed by this batch.</p>
                </div>
                <div className="rounded-xl bg-spice-50 px-3 py-2 text-sm text-spice-800">
                  Estimated material cost: <span className="font-semibold">{materialCost.toFixed(2)} ETB</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProductId === 0 ? (
                  <div className="rounded-xl border border-dashed border-earth-200 p-4 text-sm text-earth-500 sm:col-span-2">Choose a product to preview material usage.</div>
                ) : requiredMaterials.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-earth-200 p-4 text-sm text-earth-500 sm:col-span-2">No recipe found. Add recipe lines from the Products page.</div>
                ) : requiredMaterials.map((line: any) => (
                  <div key={line.name} className="rounded-xl bg-earth-50 border border-earth-100 p-4">
                    <div className="font-medium text-earth-900">{line.name}</div>
                    <div className="text-sm text-earth-500">{line.quantity.toFixed(3)} {line.unit} required</div>
                    <div className="text-xs text-earth-400 mt-1">{(line.quantity * line.costPerUnit).toFixed(2)} ETB estimated cost</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Recent Production</h2>
            {isLoading ? <div>Loading...</div> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Produced</th>
                    <th className="pb-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {batchList.map((batch) => (
                    <tr key={batch.id} className="border-t border-earth-100">
                      <td className="py-3">{new Date(batch.produced_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-earth-900">{batch.product_name}</td>
                      <td className="py-3">{batch.quantity_produced}</td>
                      <td className="py-3 text-earth-500">{batch.notes || '-'}</td>
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
