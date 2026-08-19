'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'
import { formatEtb } from '../../lib/formatCurrency'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

const CITIES = ['Addis Ababa', 'Adama', 'Bahir Dar', 'Hawassa', 'Dire Dawa', 'Mekelle']

type PayMethod = 'cod' | 'telebirr' | 'cbe'

export default function CheckoutClient() {
  const { items, subtotal, clear } = useCart()
  const toast = useToast()
  const router = useRouter()
  const { lang } = useShopLang()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    city: 'Addis Ababa',
    notes: '',
    paymentMethod: 'cod' as PayMethod
  })

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 text-center">
        <p className="text-[#5c3a28]">{t(lang, 'cartEmpty')}</p>
        <Link href="/shop" className="mt-4 inline-block font-bold text-[#9e3d00]">
          {t(lang, 'browse')}
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
      toast.error(err instanceof Error ? err.message : t(lang, 'empty'))
    } finally {
      setSubmitting(false)
    }
  }

  const payments: { id: PayMethod; title: string; hint: string }[] = [
    { id: 'cod', title: t(lang, 'payCod'), hint: t(lang, 'payCodHint') },
    { id: 'telebirr', title: t(lang, 'payTelebirr'), hint: t(lang, 'payTelebirrHint') },
    { id: 'cbe', title: t(lang, 'payCbe'), hint: t(lang, 'payCbeHint') }
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#7a4a32]">{t(lang, 'checkoutKicker')}</p>
          <h1 className="font-display text-3xl font-bold text-[#2a170f]">{t(lang, 'checkoutTitle')}</h1>
        </div>
        <Link href="/cart" className="text-sm font-semibold text-[#9e3d00]">
          ← {t(lang, 'navCart')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#ead3bc] bg-white p-5 sm:p-6 lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c3a28]">
              {t(lang, 'name')}
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                className="mt-2 h-12 w-full rounded-xl border border-[#ead3bc] bg-[#fffaf5] px-3 text-base outline-none focus:border-[#9e3d00]"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c3a28]">
              {t(lang, 'phone')}
              <input
                required
                type="tel"
                inputMode="tel"
                placeholder="09..."
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                className="mt-2 h-12 w-full rounded-xl border border-[#ead3bc] bg-[#fffaf5] px-3 text-base outline-none focus:border-[#9e3d00]"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c3a28] md:col-span-2">
              {t(lang, 'email')}
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                className="mt-2 h-12 w-full rounded-xl border border-[#ead3bc] bg-[#fffaf5] px-3 text-base outline-none focus:border-[#9e3d00]"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c3a28]">
              {t(lang, 'city')}
              <select
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-2 h-12 w-full rounded-xl border border-[#ead3bc] bg-[#fffaf5] px-3 text-base outline-none focus:border-[#9e3d00]"
              >
                {CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c3a28] md:col-span-2">
              {t(lang, 'address')}
              <textarea
                required
                rows={3}
                value={form.deliveryAddress}
                onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-[#ead3bc] bg-[#fffaf5] px-3 py-3 text-base outline-none focus:border-[#9e3d00]"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c3a28] md:col-span-2">
              {t(lang, 'notes')}
              <input
                value={form.notes}
                placeholder={t(lang, 'notesPh')}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-2 h-12 w-full rounded-xl border border-[#ead3bc] bg-[#fffaf5] px-3 text-base"
              />
            </label>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-widest text-[#5c3a28]">{t(lang, 'pay')}</legend>
            {payments.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ead3bc] p-4">
                <input
                  type="radio"
                  name="pay"
                  className="mt-1"
                  checked={form.paymentMethod === option.id}
                  onChange={() => setForm((f) => ({ ...f, paymentMethod: option.id }))}
                />
                <span>
                  <span className="font-semibold text-[#2a170f]">{option.title}</span>
                  <span className="block text-sm text-[#5c3a28]">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-full bg-[#9e3d00] py-3 text-base font-bold text-white hover:bg-[#c64f00] disabled:opacity-60"
          >
            {submitting ? t(lang, 'placing') : t(lang, 'place')}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-[#ead3bc] bg-white p-6 lg:col-span-5">
          <h2 className="border-b border-[#ead3bc] pb-4 font-display text-2xl font-semibold">{t(lang, 'summary')}</h2>
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-[#5c3a28]">
                    {item.quantityKg} kg × {formatEtb(item.unitPrice)}
                  </div>
                </div>
                <div className="font-medium text-[#9e3d00]">{formatEtb(item.unitPrice * item.quantityKg)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between border-t border-[#ead3bc] pt-4 text-lg font-semibold">
            <span>{t(lang, 'total')}</span>
            <span className="text-[#9e3d00]">{formatEtb(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
