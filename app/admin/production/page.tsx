"use client"

import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import AdminNav from '../../../components/AdminNav'
import { useProduction } from '../../../hooks/useModules'
import { useProducts } from '../../../hooks/useProducts'
import { computeBatchMaterialCost, computeBatchTotalCost, computeCostPerUnit } from '../../../lib/productionCost'

const today = new Date().toISOString().slice(0, 10)

export default function ProductionPage() {
  const { data: products } = useProducts()
  const { data: batches, isLoading, createProduction, isCreatingProduction } = useProduction()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      productId: 0,
      quantityProduced: 1,
      producedAt: today,
      notes: '',
      laborCost: 0,
      equipmentCost: 0,
      otherOverhead: 0
    }
  })

  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const batchList = Array.isArray(batches) ? batches : []
  const selectedProductId = Number(watch('productId'))
  const quantityProduced = Number(watch('quantityProduced') || 0)
  const laborCost = Number(watch('laborCost') || 0)
  const equipmentCost = Number(watch('equipmentCost') || 0)
  const otherOverhead = Number(watch('otherOverhead') || 0)

  const recipe = useQuery({
    queryKey: ['recipe', selectedProductId],
    enabled: selectedProductId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/products/${selectedProductId}/recipe`, { credentials: 'same-origin' })
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

  const materialCost = useMemo(
    () => computeBatchMaterialCost(recipe.data?.lines ?? [], quantityProduced),
    [quantityProduced, recipe.data]
  )
  const overheadCost = laborCost + equipmentCost + otherOverhead
  const totalBatchCost = computeBatchTotalCost(materialCost, laborCost, equipmentCost, otherOverhead)
  const costPerUnit = computeCostPerUnit(totalBatchCost, quantityProduced)

  const onSubmit = async (values: any) => {
    setMessage(null)
    try {
      await createProduction(values)
      reset({
        productId: 0,
        quantityProduced: 1,
        producedAt: today,
        notes: '',
        laborCost: 0,
        equipmentCost: 0,
        otherOverhead: 0
      })
      setMessage({ type: 'success', text: 'Production batch recorded with full cost breakdown.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record production batch.' })
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
                Raw material cost is calculated from ingredient prices. Add labour, grinding machine, and other batch costs for true production profit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record New Batch</h2>
              <p className="mb-5 text-sm text-earth-500">Material cost is automatic. Enter labour and machine costs for this batch.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Finished Good Produced</label>
                  <select className="input-field" {...register('productId', { valueAsNumber: true })}>
                    <option value={0}>Select product</option>
                    {productList.map((product) => {
                      const recipeLines = Number(product.recipe_line_count ?? 0)
                      const recipeLabel = recipeLines > 0 ? `${recipeLines} recipe lines` : 'no recipe yet'
                      return (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.stock_quantity} in stock • {recipeLabel})
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Batch Output Quantity</label>
                  <input type="number" min="1" className="input-field" {...register('quantityProduced', { valueAsNumber: true })} />
                </div>
                <div className="rounded-2xl border border-earth-100 bg-earth-50 p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Production overhead (ETB)</div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1">Labour</label>
                    <input type="number" min="0" step="0.01" className="input-field" {...register('laborCost', { valueAsNumber: true })} placeholder="Workers for this batch" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1">Grinding machine / equipment</label>
                    <input type="number" min="0" step="0.01" className="input-field" {...register('equipmentCost', { valueAsNumber: true })} placeholder="Machine use, fuel, maintenance" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1">Other overhead</label>
                    <input type="number" min="0" step="0.01" className="input-field" {...register('otherOverhead', { valueAsNumber: true })} placeholder="Packaging, bags, labels..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Batch Date</label>
                  <input type="date" className="input-field" {...register('producedAt')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Batch Notes</label>
                  <textarea className="input-field" rows={3} {...register('notes')} placeholder="Batch notes, staff names..." />
                </div>
                <div className="rounded-2xl border border-spice-200 bg-spice-50 p-4 text-sm">
                  <div className="flex justify-between"><span>Raw materials</span><span className="font-bold">{materialCost.toFixed(2)} ETB</span></div>
                  <div className="flex justify-between mt-1"><span>Overhead</span><span className="font-bold">{overheadCost.toFixed(2)} ETB</span></div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-spice-200 text-base"><span className="font-black">Total batch cost</span><span className="font-black text-spice-800">{totalBatchCost.toFixed(2)} ETB</span></div>
                  {quantityProduced > 0 && (
                    <div className="mt-1 text-xs text-earth-600">{costPerUnit.toFixed(2)} ETB cost per unit produced</div>
                  )}
                </div>
                <button className="btn-primary w-full" type="submit" disabled={isCreatingProduction || selectedProductId === 0}>
                  {isCreatingProduction ? 'Posting batch...' : 'Post production batch'}
                </button>
              </form>
              {message && <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div>}
            </div>

            <div className="card lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-black text-earth-950">Material Consumption Preview</h2>
                  <p className="text-sm text-earth-500">Each ingredient cost uses the current raw material price per unit.</p>
                </div>
                <div className="rounded-xl bg-spice-50 px-3 py-2 text-sm text-spice-800">
                  Raw material cost: <span className="font-semibold">{materialCost.toFixed(2)} ETB</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProductId === 0 ? (
                  <div className="rounded-xl border border-dashed border-earth-200 p-4 text-sm text-earth-500 sm:col-span-2">Choose a product to preview material usage.</div>
                ) : requiredMaterials.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:col-span-2">
                    No recipe found for this product. Open the{' '}
                    <a href="/admin/products" className="font-bold underline">Finished Goods workspace</a>{' '}
                    and save a production recipe first.
                  </div>
                ) : requiredMaterials.map((line: any, index: number) => (
                  <div key={`${line.name}-${index}`} className="rounded-xl bg-earth-50 border border-earth-100 p-4">
                    <div className="font-medium text-earth-900">{line.name}</div>
                    <div className="text-sm text-earth-500">{line.quantity.toFixed(3)} {line.unit} required</div>
                    <div className="text-xs text-earth-400 mt-1">@ {line.costPerUnit.toFixed(2)} ETB/{line.unit}</div>
                    <div className="text-sm font-bold text-spice-700 mt-1">{(line.quantity * line.costPerUnit).toFixed(2)} ETB</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Production Batch History</h2>
            <p className="mb-4 text-sm text-earth-500">Every batch with material, overhead, and cost per unit saved for profit tracking.</p>
            {isLoading ? <div>Loading...</div> : batchList.length === 0 ? (
              <div className="text-earth-500">No production batches yet.</div>
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Materials</th>
                    <th className="pb-3">Labour</th>
                    <th className="pb-3">Machine</th>
                    <th className="pb-3">Other</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Per unit</th>
                  </tr>
                </thead>
                <tbody>
                  {batchList.map((batch) => (
                    <tr key={batch.id} className="border-t border-earth-100">
                      <td className="py-3">{new Date(batch.produced_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-earth-900">{batch.product_name}</td>
                      <td className="py-3">{batch.quantity_produced}</td>
                      <td className="py-3">{Number(batch.material_cost).toFixed(2)}</td>
                      <td className="py-3">{Number(batch.labor_cost).toFixed(2)}</td>
                      <td className="py-3">{Number(batch.equipment_cost).toFixed(2)}</td>
                      <td className="py-3">{Number(batch.other_overhead).toFixed(2)}</td>
                      <td className="py-3 font-bold text-spice-700">{Number(batch.total_cost).toFixed(2)}</td>
                      <td className="py-3">{Number(batch.cost_per_unit).toFixed(2)}</td>
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
