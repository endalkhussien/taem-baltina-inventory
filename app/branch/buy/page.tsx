'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PartnerShell from '../../../components/partner/PartnerShell'
import { formatEtb } from '../../../lib/formatCurrency'
import { useToast } from '../../../components/ToastProvider'

type CatalogItem = {
  id: number
  name: string
  wholesale_price: number
  available: boolean
  image?: string
}

type BuyOrder = {
  id: number
  order_code: string
  status: string
  total_amount: number
  created_at: string
  items: { product_name: string; quantity_kg: number; line_total: number }[]
}

export default function BranchBuyPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [qty, setQty] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)

  const { data: catalog = [] } = useQuery<CatalogItem[]>({
    queryKey: ['partner-catalog'],
    queryFn: async () => {
      const res = await fetch('/api/partner/catalog')
      if (!res.ok) throw new Error('catalog')
      return res.json()
    }
  })

  const { data: orders = [] } = useQuery<BuyOrder[]>({
    queryKey: ['partner-purchases'],
    queryFn: async () => {
      const res = await fetch('/api/partner/purchases')
      if (!res.ok) throw new Error('purchases')
      return res.json()
    }
  })

  const basket = useMemo(
    () =>
      catalog
        .map((item) => ({ item, kg: Number(qty[item.id] || 0) }))
        .filter((row) => row.kg > 0),
    [catalog, qty]
  )
  const basketTotal = basket.reduce((sum, row) => sum + row.kg * row.item.wholesale_price, 0)

  const placeOrder = async () => {
    if (basket.length === 0) {
      toast.error('Add kilograms first.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/partner/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: basket.map((row) => ({ product_id: row.item.id, quantity_kg: row.kg }))
        })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.error || 'Could not place order.')
        return
      }
      toast.success(`Order ${body.order_code} sent to Taem Baltina.`)
      setQty({})
      qc.invalidateQueries({ queryKey: ['partner-purchases'] })
      qc.invalidateQueries({ queryKey: ['partner-finance'] })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PartnerShell>
      <h1 className="font-display text-3xl font-bold">Buy prepared goods</h1>
      <p className="mt-2 text-sm text-[#7a4a32]">
        Wholesale prices are Taem Baltina selling prices. Stock arrives in your shop after they fulfill the order.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {catalog.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#e8c9a8] bg-white p-4">
            <div className="font-display text-lg font-bold">{item.name}</div>
            <div className="mt-1 text-sm text-[#9e3d00]">{formatEtb(item.wholesale_price)} / kg</div>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="kg"
              className="mt-3 w-full rounded-xl border border-[#e8c9a8] px-3 py-2"
              value={qty[item.id] ?? ''}
              onChange={(e) => setQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
            />
          </div>
        ))}
        {catalog.length === 0 && <p className="text-sm text-[#7a4a32]">No wholesale items available right now.</p>}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-[#7a4a32]">This order</div>
          <div className="font-display text-2xl font-bold">{formatEtb(basketTotal)}</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={placeOrder}
          className="rounded-full bg-[#9e3d00] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send wholesale order'}
        </button>
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold">Your orders</h2>
      <div className="mt-3 space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-[#e8c9a8] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold">{order.order_code}</div>
              <span className="rounded-full bg-[#fff3e6] px-3 py-1 text-xs font-bold uppercase text-[#9e3d00]">
                {order.status}
              </span>
            </div>
            <div className="mt-1 text-sm text-[#7a4a32]">{formatEtb(order.total_amount)}</div>
            <ul className="mt-2 text-sm">
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.product_name} · {item.quantity_kg} kg · {formatEtb(item.line_total)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PartnerShell>
  )
}
