"use client"

import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import AdminNav from '../../../components/AdminNav'
import { useProduction } from '../../../hooks/useModules'
import { useProducts } from '../../../hooks/useProducts'
import { computeBatchMaterialCost, computeBatchTotalCost, computeCostPerKg } from '../../../lib/productionCost'
import { formatStockKg } from '../../../lib/productStock'
import { computeEstimatedBatchProfit, computeProfitMarginPercent, computeProfitPerKg } from '../../../lib/profit'

const today = new Date().toISOString().slice(0, 10)

export default function ProductionPage() {
  const { data: products } = useProducts()
  const { data: batches, isLoading, createProduction, isCreatingProduction } = useProduction()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      productId: 0,
      batchCount: 1,
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
  const batchCount = Number(watch('batchCount') || 0)
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
      perBatch: Number(line.quantity_per_unit),
      quantity: Number(line.quantity_per_unit) * batchCount
    }))
  }, [batchCount, recipe.data])

  const materialCost = useMemo(
    () => computeBatchMaterialCost(recipe.data?.lines ?? [], batchCount),
    [batchCount, recipe.data]
  )
  const selectedProduct = productList.find((product) => product.id === selectedProductId) ?? null
  const overheadCost = laborCost + equipmentCost + otherOverhead
  const totalBatchCost = computeBatchTotalCost(materialCost, laborCost, equipmentCost, otherOverhead)
  const costPerKg = computeCostPerKg(totalBatchCost, quantityProduced)
  const sellingPricePerKg = selectedProduct ? Number(selectedProduct.selling_price) : 0
  const profitPerKg = computeProfitPerKg(sellingPricePerKg, costPerKg)
  const estimatedBatchProfit = computeEstimatedBatchProfit(quantityProduced, sellingPricePerKg, totalBatchCost)
  const batchRevenue = quantityProduced * sellingPricePerKg
  const profitMargin = computeProfitMarginPercent(estimatedBatchProfit, batchRevenue)
  const currentStockKg = selectedProduct ? Number(selectedProduct.stock_quantity) : 0
  const projectedStockKg = currentStockKg + quantityProduced

  const onSubmit = async (values: any) => {
    setMessage(null)
    try {
      const result = await createProduction(values)
      reset({
        productId: 0,
        batchCount: 1,
        quantityProduced: 1,
        producedAt: today,
        notes: '',
        laborCost: 0,
        equipmentCost: 0,
        otherOverhead: 0
      })
      const addedKg = Number(result.quantity_added_kg ?? values.quantityProduced)
      const batchesRun = Number(result.batch_count ?? values.batchCount)
      const afterKg = Number(result.stock_kg_after ?? 0)
      const productName = result.product_name ?? selectedProduct?.name ?? 'Product'
      setMessage({
        type: 'success',
        text: `Production recorded: ${batchesRun} batch${batchesRun === 1 ? '' : 'es'}, +${addedKg} kg for ${productName}. Stock is now ${afterKg} kg.`
      })
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
                Recipe materials are consumed per batch. Kg produced is added to finished goods stock separately.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record New Batch</h2>
              <p className="mb-5 text-sm text-earth-500">
                Enter how many batches you ran and how many kg you produced. Materials use recipe × batches; stock adds kg only.
              </p>
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
                          {product.name} ({formatStockKg(product.stock_quantity)} • {recipeLabel})
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Number of batches</label>
                    <input type="number" min="1" className="input-field" {...register('batchCount', { valueAsNumber: true })} />
                    <p className="mt-1 text-xs text-earth-500">Recipe materials × batches</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Kg produced</label>
                    <input type="number" min="1" className="input-field" {...register('quantityProduced', { valueAsNumber: true })} />
                    <p className="mt-1 text-xs text-earth-500">Added to finished stock</p>
                  </div>
                </div>
                {selectedProductId > 0 && quantityProduced > 0 && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                    Stock: {formatStockKg(currentStockKg)} → <span className="font-bold">{formatStockKg(projectedStockKg)}</span> after +{quantityProduced} kg
                    {batchCount > 0 && (
                      <span className="block mt-1 text-green-700">Materials for {batchCount} batch{batchCount === 1 ? '' : 'es'}</span>
                    )}
                  </div>
                )}
                <div className="rounded-2xl border border-earth-100 bg-earth-50 p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Production overhead (ETB)</div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1">Labour</label>
                    <input type="number" min="0" step="0.01" className="input-field" {...register('laborCost', { valueAsNumber: true })} placeholder="Workers for this run" />
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
                  <div className="flex justify-between"><span>Raw materials ({batchCount || 0} batch{batchCount === 1 ? '' : 'es'})</span><span className="font-bold">{materialCost.toFixed(2)} ETB</span></div>
                  <div className="flex justify-between mt-1"><span>Overhead</span><span className="font-bold">{overheadCost.toFixed(2)} ETB</span></div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-spice-200 text-base"><span className="font-black">Total batch cost</span><span className="font-black text-spice-800">{totalBatchCost.toFixed(2)} ETB</span></div>
                  {quantityProduced > 0 && (
                    <div className="mt-1 text-xs text-earth-600">{costPerKg.toFixed(2)} ETB cost per kg produced</div>
                  )}
                  {selectedProductId > 0 && quantityProduced > 0 && sellingPricePerKg > 0 && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm">
                      <p className="font-bold text-emerald-900">Estimated profit (this batch)</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <p className="text-earth-700">
                          Cost to produce: <span className="font-bold">{costPerKg.toFixed(2)} ETB</span>/kg
                        </p>
                        <p className="text-earth-700">
                          Selling price: <span className="font-bold">{sellingPricePerKg.toFixed(2)} ETB</span>/kg
                        </p>
                        <p className="text-earth-700">
                          Profit per kg:{' '}
                          <span className={`font-bold ${profitPerKg >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {profitPerKg.toFixed(2)} ETB
                          </span>
                        </p>
                        <p className="text-earth-700">
                          Margin: <span className="font-bold">{profitMargin.toFixed(1)}%</span>
                        </p>
                      </div>
                      <p className="mt-2 border-t border-emerald-200 pt-2 font-bold text-emerald-900">
                        If you sell all {quantityProduced.toLocaleString()} kg at list price: {estimatedBatchProfit.toFixed(2)} ETB profit
                      </p>
                      <p className="mt-1 text-xs text-earth-500">
                        Cost = materials + labour + machine + other overhead. Operating expenses (rent, etc.) are tracked on Expenses.
                      </p>
                    </div>
                  )}
                </div>
                <button className="btn-primary w-full" type="submit" disabled={isCreatingProduction || selectedProductId === 0 || batchCount < 1}>
                  {isCreatingProduction ? 'Posting batch...' : 'Post production batch'}
                </button>
              </form>
              {message && <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div>}
            </div>

            <div className="card lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-black text-earth-950">Material Consumption Preview</h2>
                  <p className="text-sm text-earth-500">
                    Recipe amounts per batch × {batchCount || 0} batch{batchCount === 1 ? '' : 'es'}.
                  </p>
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
                    <div className="text-sm text-earth-500">
                      {line.perBatch.toFixed(3)} {line.unit}/batch × {batchCount} = {line.quantity.toFixed(3)} {line.unit}
                    </div>
                    <div className="text-xs text-earth-400 mt-1">@ {line.costPerUnit.toFixed(2)} ETB/{line.unit}</div>
                    <div className="text-sm font-bold text-spice-700 mt-1">{(line.quantity * line.costPerUnit).toFixed(2)} ETB</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Production Batch History</h2>
            <p className="mb-4 text-sm text-earth-500">Batches run, kg produced, and cost per kg for profit tracking.</p>
            {isLoading ? <div>Loading...</div> : batchList.length === 0 ? (
              <div className="text-earth-500">No production batches yet.</div>
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Batches</th>
                    <th className="pb-3">Kg</th>
                    <th className="pb-3">Materials</th>
                    <th className="pb-3">Labour</th>
                    <th className="pb-3">Machine</th>
                    <th className="pb-3">Other</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Per kg</th>
                  </tr>
                </thead>
                <tbody>
                  {batchList.map((batch) => (
                    <tr key={batch.id} className="border-t border-earth-100">
                      <td className="py-3">{new Date(batch.produced_at).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-earth-900">{batch.product_name}</td>
                      <td className="py-3">{batch.batch_count ?? 1}</td>
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
