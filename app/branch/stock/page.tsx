'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PartnerShell from '../../../components/partner/PartnerShell'
import { formatEtb } from '../../../lib/formatCurrency'
import { useToast } from '../../../components/ToastProvider'

type StockRow = {
  id: number
  product_id: number
  product_name: string
  quantity_kg: number
  avg_cost: number
  suggested_price: number
  value: number
}

type ProductOption = { id: number; name: string; wholesale_price: number }

export default function BranchStockPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [productId, setProductId] = useState(0)
  const [kg, setKg] = useState('')
  const [cost, setCost] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: stock = [], isLoading } = useQuery<StockRow[]>({
    queryKey: ['partner-stock'],
    queryFn: async () => {
      const res = await fetch('/api/partner/stock')
      if (!res.ok) throw new Error('stock')
      return res.json()
    }
  })

  const { data: products = [] } = useQuery<ProductOption[]>({
    queryKey: ['partner-products'],
    queryFn: async () => {
      const res = await fetch('/api/partner/products')
      if (!res.ok) throw new Error('products')
      return res.json()
    }
  })

  const register = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/partner/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity_kg: Number(kg),
          unit_cost: Number(cost)
        })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.error || 'Could not register stock.')
        return
      }
      toast.success(`${body.product_name} added to your stock.`)
      setKg('')
      setCost('')
      qc.invalidateQueries({ queryKey: ['partner-stock'] })
      qc.invalidateQueries({ queryKey: ['partner-finance'] })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PartnerShell>
      <h1 className="font-display text-3xl font-bold">Shop stock</h1>
      <p className="mt-2 text-sm text-[#7a4a32]">
        Record prepared items you already have, or wait for a wholesale order to be fulfilled. This stock is yours, not the factory warehouse.
      </p>

      <form onSubmit={register} className="mt-6 grid gap-3 rounded-2xl border border-[#e8c9a8] bg-white p-4 sm:grid-cols-4">
        <select
          className="rounded-xl border border-[#e8c9a8] px-3 py-2 sm:col-span-2"
          value={productId}
          onChange={(e) => setProductId(Number(e.target.value))}
          required
        >
          <option value={0}>Choose product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0.001"
          step="0.001"
          placeholder="kg"
          className="rounded-xl border border-[#e8c9a8] px-3 py-2"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="cost / kg"
          className="rounded-xl border border-[#e8c9a8] px-3 py-2"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#9e3d00] py-2 text-sm font-bold text-white sm:col-span-4 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Register prepared stock'}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#e8c9a8] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fff3e6] text-xs uppercase tracking-wide text-[#7a4a32]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">kg</th>
              <th className="px-4 py-3">Avg cost</th>
              <th className="px-4 py-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-4" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}
            {stock.map((row) => (
              <tr key={row.id} className="border-t border-[#f3e0cc]">
                <td className="px-4 py-3 font-semibold">{row.product_name}</td>
                <td className="px-4 py-3">{row.quantity_kg}</td>
                <td className="px-4 py-3">{formatEtb(row.avg_cost)}</td>
                <td className="px-4 py-3">{formatEtb(row.value)}</td>
              </tr>
            ))}
            {!isLoading && stock.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-[#7a4a32]" colSpan={4}>
                  No shop stock yet. Buy from the wholesaler or register what you already hold.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PartnerShell>
  )
}
