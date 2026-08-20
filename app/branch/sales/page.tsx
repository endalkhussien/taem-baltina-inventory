'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PartnerShell from '../../../components/partner/PartnerShell'
import { formatEtb } from '../../../lib/formatCurrency'
import { useToast } from '../../../components/ToastProvider'

type StockRow = {
  product_id: number
  product_name: string
  quantity_kg: number
  suggested_price: number
}

type SaleRow = {
  id: number
  sale_code: string
  product_name: string
  quantity_kg: number
  unit_price: number
  total_amount: number
  amount_paid: number
  customer_name: string | null
  sale_date: string
}

export default function BranchSalesPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [productId, setProductId] = useState(0)
  const [kg, setKg] = useState('1')
  const [price, setPrice] = useState('')
  const [paid, setPaid] = useState('')
  const [customer, setCustomer] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: stock = [] } = useQuery<StockRow[]>({
    queryKey: ['partner-stock'],
    queryFn: async () => {
      const res = await fetch('/api/partner/stock')
      if (!res.ok) throw new Error('stock')
      return res.json()
    }
  })

  const { data: sales = [] } = useQuery<SaleRow[]>({
    queryKey: ['partner-sales'],
    queryFn: async () => {
      const res = await fetch('/api/partner/sales')
      if (!res.ok) throw new Error('sales')
      return res.json()
    }
  })

  const selected = stock.find((row) => row.product_id === productId)
  const qty = Number(kg) || 0
  const unit = Number(price) || selected?.suggested_price || 0
  const total = qty * unit

  const sellable = useMemo(() => stock.filter((row) => row.quantity_kg > 0), [stock])

  const sell = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const amountPaid = paid === '' ? total : Number(paid)
      const res = await fetch('/api/partner/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity_kg: qty,
          unit_price: unit,
          amount_paid: amountPaid,
          customer_name: customer || null
        })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.error || 'Could not record sale.')
        return
      }
      toast.success('Sale recorded.')
      setKg('1')
      setPaid('')
      setCustomer('')
      qc.invalidateQueries({ queryKey: ['partner-sales'] })
      qc.invalidateQueries({ queryKey: ['partner-stock'] })
      qc.invalidateQueries({ queryKey: ['partner-finance'] })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PartnerShell>
      <h1 className="font-display text-3xl font-bold">Sell</h1>
      <p className="mt-2 text-sm text-[#7a4a32]">Sell from your shop stock at your own price. This does not touch factory inventory.</p>

      <form onSubmit={sell} className="mt-6 space-y-3 rounded-2xl border border-[#e8c9a8] bg-white p-4">
        <select
          className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2"
          value={productId}
          onChange={(e) => {
            const id = Number(e.target.value)
            setProductId(id)
            const hit = stock.find((row) => row.product_id === id)
            if (hit) setPrice(String(hit.suggested_price))
          }}
          required
        >
          <option value={0}>Choose stock</option>
          {sellable.map((row) => (
            <option key={row.product_id} value={row.product_id}>
              {row.product_name} · {row.quantity_kg} kg
            </option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="rounded-xl border border-[#e8c9a8] px-3 py-2" type="number" min="0.001" step="0.001" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="kg" required />
          <input className="rounded-xl border border-[#e8c9a8] px-3 py-2" type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="price / kg" required />
          <input className="rounded-xl border border-[#e8c9a8] px-3 py-2" type="number" min="0" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder={`paid (default ${total.toFixed(2)})`} />
        </div>
        <input className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name (optional)" />
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-bold">{formatEtb(total)}</span>
          <button type="submit" disabled={busy} className="rounded-full bg-[#9e3d00] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
            {busy ? 'Saving…' : 'Record sale'}
          </button>
        </div>
      </form>

      <h2 className="mt-10 font-display text-2xl font-bold">Recent sales</h2>
      <div className="mt-3 space-y-2">
        {sales.map((sale) => (
          <div key={sale.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8c9a8] bg-white px-4 py-3 text-sm">
            <div>
              <div className="font-semibold">{sale.product_name}</div>
              <div className="text-[#7a4a32]">
                {sale.sale_code} · {sale.quantity_kg} kg {sale.customer_name ? `· ${sale.customer_name}` : ''}
              </div>
            </div>
            <div className="font-bold text-[#9e3d00]">{formatEtb(sale.total_amount)}</div>
          </div>
        ))}
        {sales.length === 0 && <p className="text-sm text-[#7a4a32]">No sales yet.</p>}
      </div>
    </PartnerShell>
  )
}
