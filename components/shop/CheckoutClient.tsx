'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'
import { formatEtb } from '../../lib/formatCurrency'

export default function CheckoutClient() {
  const { items, subtotal, clear } = useCart()
  const toast = useToast()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    city: 'Addis Ababa',
    notes: '',
    paymentMethod: 'cod' as 'cod' | 'transfer'
  })

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-16 text-center md:px-16">
        <p className="text-[#594238]">Add blends before checkout.</p>
        <Link href="/shop" className="mt-4 inline-block font-bold text-[#9e3d00]">
          Shop collection
        </Link>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({
            productId: item.productId,
            quantityKg: item.quantityKg
          }))
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      clear()
      router.push(`/order-confirmed?code=${encodeURIComponent(data.order_code)}&total=${data.total_amount}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not place order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#594238]">Secure checkout</p>
          <h1 className="font-display text-3xl font-bold text-[#2c1600]">Delivery details</h1>
        </div>
        <Link href="/cart" className="text-sm font-semibold text-[#9e3d00]">
          ← Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form onSubmit={submit} className="space-y-6 rounded-xl bg-white p-6 shadow-[0_4px_20px_rgba(211,84,0,0.04)] lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(
              [
                ['customerName', 'Full name', 'text', true],
                ['customerPhone', 'Phone', 'tel', true],
                ['customerEmail', 'Email (optional)', 'email', false],
                ['city', 'City', 'text', true]
              ] as const
            ).map(([key, label, type, required]) => (
              <label key={key} className="block text-xs font-bold uppercase tracking-widest text-[#594238]">
                {label}
                <input
                  required={required}
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-2 w-full rounded bg-[#fff1e7] px-3 py-3 text-base text-[#2c1600] outline-none focus:ring-2 focus:ring-[#9e3d00]/30"
                />
              </label>
            ))}
            <label className="block text-xs font-bold uppercase tracking-widest text-[#594238] md:col-span-2">
              Delivery address
              <textarea
                required
                rows={3}
                value={form.deliveryAddress}
                onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                className="mt-2 w-full rounded bg-[#fff1e7] px-3 py-3 text-base text-[#2c1600] outline-none focus:ring-2 focus:ring-[#9e3d00]/30"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#594238] md:col-span-2">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-2 w-full rounded bg-[#fff1e7] px-3 py-3 text-base"
                placeholder="Gate code, preferred time…"
              />
            </label>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-widest text-[#594238]">Payment</legend>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e0c0b2]/40 p-4">
              <input
                type="radio"
                name="pay"
                checked={form.paymentMethod === 'cod'}
                onChange={() => setForm((f) => ({ ...f, paymentMethod: 'cod' }))}
              />
              <span>
                <span className="font-semibold text-[#2c1600]">Cash on delivery</span>
                <span className="block text-sm text-[#594238]">Pay when your order arrives.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e0c0b2]/40 p-4">
              <input
                type="radio"
                name="pay"
                checked={form.paymentMethod === 'transfer'}
                onChange={() => setForm((f) => ({ ...f, paymentMethod: 'transfer' }))}
              />
              <span>
                <span className="font-semibold text-[#2c1600]">Bank transfer</span>
                <span className="block text-sm text-[#594238]">Staff will confirm payment before dispatch.</span>
              </span>
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-[#9e3d00] py-4 text-base font-bold text-white transition hover:bg-[#c64f00] disabled:opacity-60"
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </form>

        <aside className="h-fit rounded-xl bg-white p-6 shadow-[0_4px_20px_rgba(211,84,0,0.04)] lg:col-span-5">
          <h2 className="border-b border-[#e0c0b2]/30 pb-4 font-display text-2xl font-semibold">Order summary</h2>
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-16 w-16 rounded object-cover" />
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-[#594238]">
                    {item.quantityKg} kg × {formatEtb(item.unitPrice)}
                  </div>
                </div>
                <div className="font-medium text-[#9e3d00]">{formatEtb(item.unitPrice * item.quantityKg)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between border-t border-[#e0c0b2]/30 pt-4 text-lg font-semibold">
            <span>Total</span>
            <span className="text-[#9e3d00]">{formatEtb(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
