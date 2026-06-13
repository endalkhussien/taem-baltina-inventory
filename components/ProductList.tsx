"use client"

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useProducts } from '../hooks/useProducts'
import { isLowStock } from '../lib/stock'
import { formatStockKg } from '../lib/productStock'

export default function ProductList({ onEdit, onRecipe }: { onEdit: (id: number) => void; onRecipe: (id: number) => void }) {
  const searchParams = useSearchParams()
  const lowOnly = searchParams.get('filter') === 'low'
  const { data: products, isLoading, refetch, deleteProduct } = useProducts()

  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const filteredList = useMemo(
    () => productList.filter((product) => (lowOnly ? isLowStock(product) : true)),
    [lowOnly, productList]
  )

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-spice-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const lowCount = productList.filter((product) => isLowStock(product)).length

  return (
    <div className="card overflow-hidden !p-0">
      <div className="px-6 py-4 border-b border-earth-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-black text-earth-950">Finished Goods Inventory</h2>
            <p className="text-sm text-earth-500">
              {productList.length} product{productList.length !== 1 ? 's' : ''} ready for pricing, recipes, and stock control.
              {lowCount > 0 && <span className="ml-2 font-bold text-red-700">{lowCount} low stock</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products"
              className={`rounded-full px-3 py-1 text-xs font-bold ${!lowOnly ? 'bg-earth-900 text-white' : 'bg-earth-100 text-earth-700'}`}
            >
              All
            </Link>
            <Link
              href="/admin/products?filter=low"
              className={`rounded-full px-3 py-1 text-xs font-bold ${lowOnly ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
            >
              Low stock
            </Link>
          </div>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="px-6 py-12 text-center text-earth-400 text-sm">
          {lowOnly ? 'No low-stock finished goods right now.' : 'No products yet. Create one to get started.'}
        </div>
      ) : (
        <div className="table-shell rounded-none border-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="px-6 py-3">Finished Good</th>
                <th className="px-6 py-3">Selling Price</th>
                <th className="px-6 py-3">Available Stock</th>
                <th className="px-6 py-3">Produced</th>
                <th className="px-6 py-3">Sold</th>
                <th className="px-6 py-3">Recipe</th>
                <th className="px-6 py-3">Workflow</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((product) => {
                const low = isLowStock(product)
                const recipeLines = Number(product.recipe_line_count ?? 0)

                return (
                  <tr key={product.id} className={`table-row ${low ? 'bg-red-50/70' : ''}`}>
                    <td className="px-6 py-4 font-bold text-earth-950">{product.name}</td>
                    <td className="px-6 py-4 text-earth-700">{Number(product.selling_price).toFixed(2)} ETB</td>
                    <td className="px-6 py-3">
                      <span className={`status-pill ${low ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {formatStockKg(product.stock_quantity)}
                      </span>
                      {low && <div className="mt-1 text-xs font-bold text-red-600">Below {product.alert_threshold} kg</div>}
                    </td>
                    <td className="px-6 py-4 text-earth-700">{formatStockKg(product.total_produced ?? 0)}</td>
                    <td className="px-6 py-4 text-earth-700">{formatStockKg(product.total_sold ?? 0)}</td>
                    <td className="px-6 py-4">
                      <span className={`status-pill ${recipeLines > 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                        {recipeLines > 0 ? `${recipeLines} lines` : 'Missing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-sm text-spice-700 hover:text-spice-900 font-bold mr-4" onClick={() => onEdit(product.id)}>
                        Edit
                      </button>
                      <button className="text-sm text-earth-800 hover:text-earth-950 font-bold mr-4" onClick={() => onRecipe(product.id)}>
                        Recipe
                      </button>
                      <button
                        className="text-sm text-red-600 hover:text-red-800 font-bold"
                        onClick={async () => {
                          if (!confirm('Delete product?')) return
                          await deleteProduct(product.id)
                          refetch()
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
        </div>
      )}
    </div>
  )
}
