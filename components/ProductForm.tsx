"use client"

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productCreateSchema } from '../lib/validators/product'
import { useProducts } from '../hooks/useProducts'
import { useToast } from './ToastProvider'
import { formatStockKg } from '../lib/productStock'

type Props = {
  editingId: number | null
  onDone?: () => void
}

export default function ProductForm({ editingId, onDone }: Props) {
  const toast = useToast()
  const { data: products, createProduct, updateProduct, isCreatingProduct, isUpdatingProduct } = useProducts()
  const isSaving = isCreatingProduct || isUpdatingProduct
  const editingProduct = editingId && Array.isArray(products) ? products.find((x) => x.id === editingId) : null

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productCreateSchema as any),
    defaultValues: { name: '', sellingPrice: 0, stockQuantity: 0, alertThreshold: 0 }
  })

  useEffect(() => {
    if (editingId && Array.isArray(products)) {
      const p = products.find((x: any) => x.id === editingId)
      if (p) {
        reset({
          name: p.name,
          sellingPrice: Number(p.selling_price),
          stockQuantity: p.stock_quantity,
          alertThreshold: p.alert_threshold
        })
      }
    } else {
      reset({ name: '', sellingPrice: 0, stockQuantity: 0, alertThreshold: 0 })
    }
  }, [editingId, products, reset])

  const onSubmit = async (vals: any) => {
    try {
      if (editingId) {
        const { stockQuantity: _ignored, ...updateVals } = vals
        await updateProduct(editingId, updateVals)
      } else {
        await createProduct(vals)
      }
      reset()
      onDone?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save finished good.')
    }
  }

  return (
    <div className="card">
      <h2 className="font-display text-xl font-black text-earth-950 mb-1">
        {editingId ? 'Edit Finished Good' : 'Add Finished Good'}
      </h2>
      <p className="mb-5 text-sm text-earth-500">
        Finished goods are items you produce and sell. Stock in kg updates automatically when you record production or sales.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Product Name</label>
          <input className="input-field" placeholder="e.g. Berbere" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">Product name is required.</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Selling Price (ETB per kg)</label>
          <input type="number" step="0.01" className="input-field" {...register('sellingPrice', { valueAsNumber: true })} />
          {errors.sellingPrice && <p className="mt-1 text-xs font-semibold text-red-600">Selling price must be zero or higher.</p>}
        </div>
        {editingId && editingProduct ? (
          <div className="rounded-2xl border border-earth-100 bg-earth-50 p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Current stock (auto-tracked)</div>
            <div className="text-2xl font-black text-earth-950">{formatStockKg(editingProduct.stock_quantity)}</div>
            <div className="text-sm text-earth-600">
              Produced: {formatStockKg(editingProduct.total_produced ?? 0)} · Sold: {formatStockKg(editingProduct.total_sold ?? 0)}
            </div>
            <p className="text-xs text-earth-500">
              Stock increases when you post a production batch and decreases when you record a sale.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-earth-700 mb-1.5">Opening Stock (kg)</label>
            <input type="number" min="0" className="input-field" {...register('stockQuantity', { valueAsNumber: true })} />
            {errors.stockQuantity && <p className="mt-1 text-xs font-semibold text-red-600">Stock must be a whole number zero or higher.</p>}
            <p className="mt-1 text-xs text-earth-500">Optional starting balance. After creation, stock is updated only by production and sales.</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Low Stock Alert (kg)</label>
          <input type="number" min="0" className="input-field" {...register('alertThreshold', { valueAsNumber: true })} />
          {errors.alertThreshold && <p className="mt-1 text-xs font-semibold text-red-600">Alert level must be a whole number zero or higher.</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : editingId ? 'Update Finished Good' : 'Create Finished Good'}
          </button>
          {editingId && (
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                reset({ name: '', sellingPrice: 0, stockQuantity: 0, alertThreshold: 0 })
                onDone?.()
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
