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

  const materialCost = requiredMaterials.reduce((sum: number, line: { quantity: number; costPerUnit: number }) => sum + line.quantity * line.costPerUnit, 0)

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
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero">
            <div className="relative z-10 max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-spice-200">Batch production</div>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">Convert Raw Materials Into Finished Goods</h1>
              <p className="mt-3 text-sm leading-6 text-earth-100 sm:text-base">
                Select a product, enter the batch quantity, and the system deducts every recipe ingredient while increasing finished stock.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record New Batch</h2>
              <p className="mb-5 text-sm text-earth-500">A batch consumes raw materials from the saved production recipe.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Finished Good Produced</label>
                  <select className="input-field" {...register('productId', { valueAsNumber: true })}>
                    <option value={0}>Select product</option>
                    {productList.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} ({product.stock_quantity} in stock)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Batch Output Quantity</label>
                  <input type="number" min="1" className="input-field" {...register('quantityProduced', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Batch Date</label>
                  <input type="date" className="input-field" {...register('producedAt')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Batch Notes</label>
                  <textarea className="input-field" rows={3} {...register('notes')} placeholder="Batch notes, staff, packaging..." />
                </div>
                <button className="btn-primary w-full" type="submit">Post production batch</button>
              </form>
              {message && <div className="mt-4 rounded-xl bg-earth-50 border border-earth-100 p-3 text-sm text-earth-700">{message}</div>}
            </div>

            <div className="card lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-black text-earth-950">Material Consumption Preview</h2>
                  <p className="text-sm text-earth-500">Raw materials that will be deducted when this batch is posted.</p>
                </div>
                <div className="rounded-xl bg-spice-50 px-3 py-2 text-sm text-spice-800">
                  Estimated batch cost: <span className="font-semibold">{materialCost.toFixed(2)} ETB</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProductId === 0 ? (
                  <div className="rounded-xl border border-dashed border-earth-200 p-4 text-sm text-earth-500 sm:col-span-2">Choose a product to preview material usage.</div>
                ) : requiredMaterials.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-earth-200 p-4 text-sm text-earth-500 sm:col-span-2">No recipe found. Add recipe lines from the Finished Goods workspace.</div>
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
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Production Batch History</h2>
            <p className="mb-4 text-sm text-earth-500">Completed batches and finished goods added to inventory.</p>
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
