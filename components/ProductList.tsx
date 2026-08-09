"use client"

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProducts } from '../hooks/useProducts'
import { useProduction } from '../hooks/useModules'
import { formatEtb } from '../lib/formatCurrency'
import { formatStockKg } from '../lib/productStock'
import { isLowStock } from '../lib/stock'
import {
  buildProductCostMap,
  productCostValue,
  productRetailValue,
  sumProductCostValue,
  sumProductRetailValue
} from '../lib/stockValue'

export default function ProductList({ onEdit, onRecipe }: { onEdit: (id: number) => void; onRecipe: (id: number) => void }) {
  const searchParams = useSearchParams()
  const lowOnly = searchParams.get('filter') === 'low'
  const { data: products, isLoading, refetch, deleteProduct } = useProducts()
  const { data: production } = useProduction()

  const productList = Array.isArray(products) ? products : []
  const productionList = Array.isArray(production) ? production : []
  const avgCostByProduct = useMemo(() => buildProductCostMap(productionList), [productionList])

  const filteredList = useMemo(
    () => productList.filter((product) => (lowOnly ? isLowStock(product) : true)),
    [lowOnly, productList]
  )

  const totalRetailValue = sumProductRetailValue(filteredList)
  const totalCostValue = sumProductCostValue(filteredList, avgCostByProduct)
  const totalKg = filteredList.reduce((sum, product) => sum + Number(product.stock_quantity), 0)

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-spice-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="card overflow-hidden !p-0">
      <div className="flex flex-col gap-3 border-b border-earth-200 px-6 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-xl font-black text-earth-950">Finished Goods Inventory</h2>
          <p className="text-sm text-earth-500">
            {lowOnly ? 'Showing low-stock products.' : `${productList.length} product${productList.length !== 1 ? 's' : ''} in stock.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl bg-spice-50 px-4 py-2 text-sm text-spice-800">
            On hand: <span className="font-black">{formatStockKg(totalKg)}</span>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            Retail value: <span className="font-black">{formatEtb(totalRetailValue)}</span>
          </div>
          {totalCostValue > 0 && (
            <div className="rounded-2xl bg-earth-100 px-4 py-2 text-sm text-earth-800">
              Cost value: <span className="font-black">{formatEtb(totalCostValue)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-earth-100 px-6 py-3">
        <a href="/admin/products" className={`rounded-full px-3 py-1 text-xs font-bold ${!lowOnly ? 'bg-spice-700 text-white' : 'bg-earth-100 text-earth-700'}`}>
          All
        </a>
        <a href="/admin/products?filter=low" className={`rounded-full px-3 py-1 text-xs font-bold ${lowOnly ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
          Low stock
        </a>
      </div>

      {filteredList.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-earth-500">No products match this view.</div>
      ) : (
        <div className="table-shell rounded-none border-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="px-6 py-3 text-left">Finished Good</th>
                <th className="px-6 py-3 text-left">Selling Price</th>
                <th className="px-6 py-3 text-left">On Hand</th>
                <th className="px-6 py-3 text-left">Stock Value</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((product) => {
                const low = isLowStock(product)
                const retailValue = productRetailValue(product)
                const costValue = productCostValue(product, avgCostByProduct[product.id] ?? 0)

                return (
                  <tr key={product.id} className={`table-row ${low ? 'bg-amber-50/80' : ''}`}>
                    <td className="px-6 py-4 font-bold text-earth-950">
                      {product.name}
                      {low && <span className="ml-2 text-xs font-bold text-red-600">LOW</span>}
                    </td>
                    <td className="px-6 py-4 text-earth-700">{formatEtb(Number(product.selling_price))}</td>
                    <td className="px-6 py-4">
                      <span className={`status-pill ${low ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {formatStockKg(Number(product.stock_quantity))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-earth-950">{formatEtb(retailValue)}</div>
                      {costValue > 0 && (
                        <div className="text-xs text-earth-500">Cost {formatEtb(costValue)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="mr-4 text-sm font-bold text-spice-700 hover:text-spice-900" onClick={() => onEdit(product.id)}>
                        Edit
                      </button>
                      <button className="mr-4 text-sm font-bold text-earth-800 hover:text-earth-950" onClick={() => onRecipe(product.id)}>
                        Recipe
                      </button>
                      <button
                        className="text-sm font-bold text-red-600 hover:text-red-800"
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
            <tfoot>
              <tr className="border-t-2 border-earth-200 bg-earth-50 font-bold">
                <td className="px-6 py-3" colSpan={2}>
                  Total ({filteredList.length} product{filteredList.length === 1 ? '' : 's'})
                </td>
                <td className="px-6 py-3 text-green-700">{formatStockKg(totalKg)}</td>
                <td className="px-6 py-3">
                  <div>{formatEtb(totalRetailValue)}</div>
                  {totalCostValue > 0 && <div className="text-xs font-semibold text-earth-500">Cost {formatEtb(totalCostValue)}</div>}
                </td>
                <td className="px-6 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
