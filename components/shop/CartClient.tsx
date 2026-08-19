'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'
import { formatEtb } from '../../lib/formatCurrency'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

export default function CartClient() {
  const { items, subtotal, setQuantity, removeItem } = useCart()
  const { lang } = useShopLang()

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-[#2a170f]">{t(lang, 'cartTitle')}</h1>
      <p className="mt-2 text-[#5c3a28]">{t(lang, 'cartBody')}</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-[#fff1e0] p-10 text-center">
          <p className="text-[#5c3a28]">{t(lang, 'cartEmpty')}</p>
          <Link href="/shop" className="mt-4 inline-block font-bold text-[#9e3d00]">
            {t(lang, 'browse')}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-col gap-4 rounded-2xl border border-[#ead3bc] bg-white p-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-24 w-full rounded-xl object-cover sm:h-24 sm:w-24" />
              <div className="flex-1">
                <div className="font-semibold text-[#2a170f]">{item.name}</div>
                <div className="text-sm text-[#5c3a28]">
                  {formatEtb(item.unitPrice)} {t(lang, 'perKg')}
                </div>
              </div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5c3a28]">
                {t(lang, 'qty')}
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={item.quantityKg}
                  onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                  className="ml-2 h-11 w-24 rounded-xl border border-[#ead3bc] px-2 text-sm"
                />
              </label>
              <div className="font-bold text-[#9e3d00]">{formatEtb(item.unitPrice * item.quantityKg)}</div>
              <button type="button" onClick={() => removeItem(item.productId)} className="text-sm text-red-700">
                {t(lang, 'remove')}
              </button>
            </div>
          ))}

          <div className="flex flex-col items-stretch gap-4 border-t border-[#ead3bc] pt-6 sm:items-end">
            <div className="text-xl font-semibold text-[#2a170f]">
              {t(lang, 'subtotal')} <span className="text-[#9e3d00]">{formatEtb(subtotal)}</span>
            </div>
            <Link href="/checkout" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#9e3d00] px-8 py-3 font-bold text-white">
              {t(lang, 'checkout')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
