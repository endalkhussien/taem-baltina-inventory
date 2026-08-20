'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AdminNav from '../../../components/AdminNav'
import { formatEtb } from '../../../lib/formatCurrency'
import { useToast } from '../../../components/ToastProvider'

type Shop = {
  id: number
  shop_name: string
  owner_name: string
  phone: string
  city: string
  status: string
}

type WholesaleOrder = {
  id: number
  order_code: string
  status: string
  total_amount: number
  shop_name: string
  phone: string
  city: string
  created_at: string
  items: { product_name: string; quantity_kg: number; line_total: number }[]
}

export default function BranchesPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)

  const { data: shops = [] } = useQuery<Shop[]>({
    queryKey: ['partner-shops'],
    queryFn: async () => {
      const res = await fetch('/api/partner-shops')
      if (!res.ok) throw new Error('shops')
      return res.json()
    }
  })

  const { data: orders = [] } = useQuery<WholesaleOrder[]>({
    queryKey: ['wholesale-orders'],
    queryFn: async () => {
      const res = await fetch('/api/wholesale-orders')
      if (!res.ok) throw new Error('orders')
      return res.json()
    }
  })

  const setShopStatus = async (id: number, status: 'active' | 'suspended') => {
    setBusy(`shop-${id}`)
    try {
      const res = await fetch(`/api/partner-shops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.error || 'Could not update shop.')
        return
      }
      toast.success(`${body.shop_name} is ${status}.`)
      qc.invalidateQueries({ queryKey: ['partner-shops'] })
    } finally {
      setBusy(null)
    }
  }

  const setOrderStatus = async (id: number, status: 'fulfilled' | 'cancelled') => {
    setBusy(`order-${id}`)
    try {
      const res = await fetch(`/api/wholesale-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.error || 'Could not update order.')
        return
      }
      toast.success(status === 'fulfilled' ? 'Packed. Warehouse stock moved to the shop.' : 'Order cancelled.')
      qc.invalidateQueries({ queryKey: ['wholesale-orders'] })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero">
            <div className="eyebrow">Wholesale</div>
            <h1 className="mt-3 font-display text-4xl font-bold text-earth-950">Branch shops</h1>
            <p className="mt-3 max-w-2xl text-sm text-earth-500">
              Independent shops register themselves, buy prepared goods from you, and sell from their own stock. Fulfill their orders here to deduct warehouse kilos.
            </p>
          </div>

          <h2 className="mb-3 font-display text-2xl font-bold">Wholesale orders</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-lg font-bold">{order.order_code}</div>
                    <div className="text-sm text-earth-500">
                      {order.shop_name} · {order.phone} · {order.city}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{formatEtb(order.total_amount)}</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-800">
                    {order.status}
                  </span>
                </div>
                <ul className="mt-3 text-sm">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.product_name} · {item.quantity_kg} kg · {formatEtb(item.line_total)}
                    </li>
                  ))}
                </ul>
                {order.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={busy === `order-${order.id}`}
                      className="btn-primary"
                      onClick={() => setOrderStatus(order.id, 'fulfilled')}
                    >
                      Fulfill
                    </button>
                    <button
                      type="button"
                      disabled={busy === `order-${order.id}`}
                      className="btn-secondary"
                      onClick={() => setOrderStatus(order.id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-earth-500">No wholesale orders yet.</p>}
          </div>

          <h2 className="mb-3 mt-10 font-display text-2xl font-bold">Registered shops</h2>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-earth-500">
                <tr>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id} className="border-t border-outline-variant/20">
                    <td className="px-4 py-3 font-semibold">{shop.shop_name}</td>
                    <td className="px-4 py-3">{shop.owner_name}</td>
                    <td className="px-4 py-3">{shop.phone}</td>
                    <td className="px-4 py-3">{shop.city}</td>
                    <td className="px-4 py-3">{shop.status}</td>
                    <td className="px-4 py-3">
                      {shop.status === 'active' ? (
                        <button
                          type="button"
                          className="text-xs font-bold uppercase text-red-700"
                          disabled={busy === `shop-${shop.id}`}
                          onClick={() => setShopStatus(shop.id, 'suspended')}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs font-bold uppercase text-primary"
                          disabled={busy === `shop-${shop.id}`}
                          onClick={() => setShopStatus(shop.id, 'active')}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
