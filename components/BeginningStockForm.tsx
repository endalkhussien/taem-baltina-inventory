'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useToast } from './ToastProvider'
import { formatStockKg } from '../lib/productStock'

/**
 * Simple opening-balance entry: pick an existing finished good from a dropdown
 * and set on-hand kg. Does not change name, price, or recipe.
 */
export default function BeginningStockForm() {
  const toast = useToast()
  const { data: products, updateProduct, isUpdatingProduct } = useProducts()
  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])

  const [productId, setProductId] = useState<number>(0)
  const [stockKg, setStockKg] = useState<string>('')

  const selected = productList.find((p) => p.id === productId) ?? null

  useEffect(() => {
    if (productId === 0 && productList.length > 0) {
      setProductId(productList[0].id)
    }
  }, [productList, productId])

  useEffect(() => {
    if (!productId) return
    const product = productList.find((p) => p.id === productId)
    if (product) setStockKg(String(Number(product.stock_quantity) || 0))
    // Only reset the input when the selected finished good changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) {
      toast.error('Select a finished good first.')
      return
    }
    const qty = Number(stockKg)
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error('Enter a stock amount of zero or higher.')
      return
    }

    try {
      await updateProduct(selected.id, { stockQuantity: qty })
      toast.success(`Beginning stock saved for ${selected.name}: ${formatStockKg(qty)}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save beginning stock.')
    }
  }

  if (productList.length === 0) {
    return (
      <div className="card">
        <h2 className="font-display text-xl font-black text-earth-950 mb-1">Beginning stock</h2>
        <p className="text-sm text-earth-500">
          Add finished goods first (Berbere, Shiro, Mitmita), then set opening balances here.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="font-display text-xl font-black text-earth-950 mb-1">Beginning stock</h2>
      <p className="mb-5 text-sm text-earth-500">
        Choose a finished good and enter the opening on-hand kg. Production and sales will keep updating stock after this.
      </p>

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label htmlFor="beginning-stock-product" className="block text-sm font-bold text-earth-700 mb-1.5">
            Finished good
          </label>
          <select
            id="beginning-stock-product"
            className="input-field"
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
          >
            {productList.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — now {formatStockKg(product.stock_quantity)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="beginning-stock-kg" className="block text-sm font-bold text-earth-700 mb-1.5">
            Beginning / on-hand stock (kg)
          </label>
          <input
            id="beginning-stock-kg"
            type="number"
            min="0"
            step="0.001"
            className="input-field"
            value={stockKg}
            onChange={(e) => setStockKg(e.target.value)}
            placeholder="e.g. 50"
          />
          {selected && (
            <p className="mt-1 text-xs text-earth-500">
              Current on hand: {formatStockKg(selected.stock_quantity)}. Saving replaces this amount only — name and price stay the same.
            </p>
          )}
        </div>

        <button className="btn-primary w-full" type="submit" disabled={isUpdatingProduct || !selected}>
          {isUpdatingProduct ? 'Saving…' : 'Save beginning stock'}
        </button>
      </form>
    </div>
  )
}
