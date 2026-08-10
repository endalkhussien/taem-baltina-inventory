'use client'

import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AdminNav from '../../../components/AdminNav'
import { formatEtb } from '../../../lib/formatCurrency'
import { useToast } from '../../../components/ToastProvider'

type OrderItem = {
  id: number
  product_name: string
  quantity_kg: number
  unit_price: number
  line_total: number
}

type MarketOrder = {
  id: number
  order_code: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string
  city: string
  notes: string | null
  payment_method: string
  status: string
  total_amount: number
  created_at: string
  items: OrderItem[]
}

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  fulfilled: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700'
}

export default function OrdersPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'>('all')
  const [busyId, setBusyId] = useState<number | null>(null)

  const { data: orders = [], isLoading } = useQuery<MarketOrder[]>({
    queryKey: ['market-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load orders')
      return data
    }
  })

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  )

  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length

  const updateStatus = async (id: number, status: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      toast.success(`Order marked ${status}.`)
      await qc.invalidateQueries({ queryKey: ['market-orders'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update order')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="app-page">
      <AdminNav />
      <div className="app-container">
        <div className="page-hero-subtle">
          <p className="eyebrow">Marketplace</p>
          <h1 className="font-display text-3xl font-bold text-earth-950">Web orders</h1>
          <p className="mt-2 max-w-2xl text-earth-600">
            Orders from the public shop. Fulfill when packed — stock is deducted and sales are recorded automatically.
          </p>
          <p className="mt-3 text-sm font-semibold text-spice-700">{pendingCount} open order(s)</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'confirmed', 'fulfilled', 'cancelled'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                filter === key ? 'bg-spice-700 text-white' : 'border border-earth-300 bg-white text-earth-700'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="card space-y-4">
          {isLoading ? (
            <p className="text-earth-500">Loading orders…</p>
          ) : visible.length === 0 ? (
            <p className="text-earth-500">No marketplace orders yet.</p>
          ) : (
            visible.map((order) => (
              <div key={order.id} className="rounded-2xl border border-earth-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-bold text-earth-950">{order.order_code}</span>
                      <span className={`status-pill ${statusStyle[order.status] || 'bg-earth-100 text-earth-700'}`}>
                        {order.status}
                      </span>
                      <span className="status-pill bg-earth-100 text-earth-700">
                        {order.payment_method === 'cod' ? 'Cash on delivery' : 'Bank transfer'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-earth-600">
                      {order.customer_name} · {order.customer_phone}
                      {order.customer_email ? ` · ${order.customer_email}` : ''}
                    </p>
                    <p className="text-sm text-earth-500">
                      {order.delivery_address}, {order.city}
                    </p>
                    {order.notes && <p className="mt-1 text-sm text-earth-500">Note: {order.notes}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-spice-700">{formatEtb(Number(order.total_amount))}</div>
                    <div className="text-xs text-earth-500">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <ul className="mt-3 space-y-1 border-t border-earth-100 pt-3 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-earth-700">
                      <span>
                        {item.product_name} · {Number(item.quantity_kg)} kg
                      </span>
                      <span>{formatEtb(Number(item.line_total))}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        className="btn-secondary text-xs"
                        onClick={() => updateStatus(order.id, 'confirmed')}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        className="btn-primary text-xs"
                        onClick={() => updateStatus(order.id, 'fulfilled')}
                      >
                        Fulfill (deduct stock)
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700"
                        onClick={() => updateStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        className="btn-primary text-xs"
                        onClick={() => updateStatus(order.id, 'fulfilled')}
                      >
                        Fulfill (deduct stock)
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700"
                        onClick={() => updateStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
