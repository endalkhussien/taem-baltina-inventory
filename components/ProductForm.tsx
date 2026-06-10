"use client"

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productCreateSchema } from '../lib/validators/product'
import { useProducts } from '../hooks/useProducts'

type Props = {
  editingId: number | null
  onDone?: () => void
}

export default function ProductForm({ editingId, onDone }: Props) {
  const { data: products, createProduct, updateProduct } = useProducts()

  const { register, handleSubmit, reset } = useForm({
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
    if (editingId) await updateProduct(editingId, vals)
    else await createProduct(vals)
    reset()
    onDone?.()
  }

  return (
    <div className="card">
      <h2 className="font-display text-xl font-black text-earth-950 mb-1">
        {editingId ? 'Edit Finished Good' : 'Add Finished Good'}
      </h2>
      <p className="mb-5 text-sm text-earth-500">Finished goods are items you produce and sell to customers.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Product Name</label>
          <input className="input-field" placeholder="e.g. Berbere" {...register('name')} />
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Selling Price (ETB)</label>
          <input type="number" step="0.01" className="input-field" {...register('sellingPrice', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Finished Stock On Hand</label>
          <input type="number" className="input-field" {...register('stockQuantity', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-bold text-earth-700 mb-1.5">Reorder Alert Level</label>
          <input type="number" className="input-field" {...register('alertThreshold', { valueAsNumber: true })} />
        </div>
        <button className="btn-primary w-full" type="submit">
          {editingId ? 'Update Finished Good' : 'Create Finished Good'}
        </button>
      </form>
    </div>
  )
}
