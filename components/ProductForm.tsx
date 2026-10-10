'use client'

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
          stockQuantity: Number(p.stock_quantity),
          alertThreshold: Number(p.alert_threshold)
        })
      }
    } else {
      reset({ name: '', sellingPrice: 0, stockQuantity: 0, alertThreshold: 0 })
    }
  }, [editingId, products, reset])

  const onSubmit = async (vals: any) => {
    try {
      if (editingId) {
        await updateProduct(editingId, vals)
        toast.success('Finished good updated. On-hand stock saved.')
      } else {
        await createProduct(vals)
        toast.success('Finished good created.')
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
        Finished goods are items you produce and sell. Set on-hand kg manually for beginning inventory; production and sales still update stock afterward.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Product Name</label>
          <input className="input-field" placeholder="e.g. Berbere" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">Product name is required.</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Selling Price (ETB per kg)</label>
          <input type="number" step="0.01" min="0" className="input-field" {...register('sellingPrice', { valueAsNumber: true })} />
          {errors.sellingPrice && <p className="mt-1 text-xs font-semibold text-red-600">Selling price must be zero or higher.</p>}
        </div>
        <div>
          <label htmlFor="product-stock-quantity" className="block text-sm font-bold text-earth-700 mb-1.5">
            {editingId ? 'On-hand stock (kg)' : 'Opening stock (kg)'}
          </label>
          <input
            id="product-stock-quantity"
            type="number"
            min="0"
            step="0.001"
            className="input-field"
            {...register('stockQuantity', { valueAsNumber: true })}
          />
          {errors.stockQuantity && (
            <p className="mt-1 text-xs font-semibold text-red-600">Stock must be zero or higher.</p>
          )}
          {editingId && editingProduct ? (
            <div className="mt-2 rounded-2xl border border-earth-100 bg-earth-50 p-3 text-sm text-earth-600">
              <p>
                Current recorded stock: <span className="font-bold text-earth-950">{formatStockKg(editingProduct.stock_quantity)}</span>
              </p>
              <p className="mt-1">
                Produced: {formatStockKg(editingProduct.total_produced ?? 0)} · Sold: {formatStockKg(editingProduct.total_sold ?? 0)}
              </p>
              <p className="mt-1 text-xs text-earth-500">
                Type the real on-hand kg here to import beginning inventory or correct the balance. Saving replaces the on-hand amount.
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-earth-500">
              Optional beginning balance when you first add the product.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Low Stock Alert (kg)</label>
          <input type="number" min="0" step="1" className="input-field" {...register('alertThreshold', { valueAsNumber: true })} />
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
