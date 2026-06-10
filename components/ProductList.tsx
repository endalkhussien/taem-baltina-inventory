"use client"

import React from 'react'
import { useProducts } from '../hooks/useProducts'

export default function ProductList({ onEdit, onRecipe }: { onEdit: (id: number) => void; onRecipe: (id: number) => void }) {
  const { data: products, isLoading, refetch, deleteProduct } = useProducts()

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-spice-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const productList = Array.isArray(products) ? products : []

  return (
    <div className="card overflow-hidden !p-0">
      <div className="px-6 py-4 border-b border-earth-100">
        <h2 className="font-display text-xl font-black text-earth-950">Finished Goods Inventory</h2>
        <p className="text-sm text-earth-500">{productList.length} product{productList.length !== 1 ? 's' : ''} ready for pricing, recipes, and stock control.</p>
      </div>

      {productList.length === 0 ? (
        <div className="px-6 py-12 text-center text-earth-400 text-sm">No products yet. Create one to get started.</div>
      ) : (
        <div className="table-shell rounded-none border-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="px-6 py-3">Finished Good</th>
                <th className="px-6 py-3">Selling Price</th>
                <th className="px-6 py-3">Available Stock</th>
                <th className="px-6 py-3">Workflow</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="px-6 py-4 font-bold text-earth-950">{p.name}</td>
                  <td className="px-6 py-4 text-earth-700">{Number(p.selling_price).toFixed(2)} ETB</td>
                  <td className="px-6 py-3">
                    <span className={`status-pill ${
                      p.stock_quantity <= p.alert_threshold
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {p.stock_quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-sm text-spice-700 hover:text-spice-900 font-bold mr-4" onClick={() => onEdit(p.id)}>
                      Edit
                    </button>
                    <button className="text-sm text-earth-800 hover:text-earth-950 font-bold mr-4" onClick={() => onRecipe(p.id)}>
                      Recipe
                    </button>
                    <button
                      className="text-sm text-red-600 hover:text-red-800 font-bold"
                      onClick={async () => {
                        if (!confirm('Delete product?')) return
                        await deleteProduct(p.id)
                        refetch()
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
