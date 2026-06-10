"use client"

import React from 'react'
import { useProducts } from '../hooks/useProducts'

export default function ProductList({ onEdit }: { onEdit: (id: number) => void }) {
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
        <h2 className="font-display text-lg font-semibold text-earth-900">All Products</h2>
        <p className="text-sm text-earth-500">{productList.length} item{productList.length !== 1 ? 's' : ''}</p>
      </div>

      {productList.length === 0 ? (
        <div className="px-6 py-12 text-center text-earth-400 text-sm">No products yet. Create one to get started.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-earth-500 bg-earth-50">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Price (ETB)</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((p: any) => (
                <tr key={p.id} className="border-t border-earth-100 hover:bg-spice-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-earth-900">{p.name}</td>
                  <td className="px-6 py-3 text-earth-700">{Number(p.selling_price).toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.stock_quantity <= p.alert_threshold
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button className="text-sm text-spice-600 hover:text-spice-700 font-medium mr-4" onClick={() => onEdit(p.id)}>
                      Edit
                    </button>
                    <button
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
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
