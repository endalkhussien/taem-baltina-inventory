'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'
import { formatEtb } from '../../lib/formatCurrency'

export default function CartClient() {
  const { items, subtotal, setQuantity, removeItem } = useCart()

  return (
    <div className="mx-auto max-w-[960px] px-5 py-12 md:px-16">
      <h1 className="font-display text-4xl font-bold text-[#2c1600]">Your pantry bag</h1>
      <p className="mt-2 text-[#594238]">Adjust kilograms, then checkout for delivery.</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg bg-[#fff1e7] p-10 text-center">
          <p className="text-[#594238]">Your bag is empty.</p>
          <Link href="/shop" className="mt-4 inline-block font-bold text-[#9e3d00]">
            Browse blends
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-[0_4px_20px_rgba(211,84,0,0.04)] sm:flex-row sm:items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-24 w-24 rounded object-cover" />
              <div className="flex-1">
                <div className="font-semibold text-[#2c1600]">{item.name}</div>
                <div className="text-sm text-[#594238]">{formatEtb(item.unitPrice)} / kg</div>
              </div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#594238]">
                kg
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={item.quantityKg}
                  onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                  className="ml-2 w-24 rounded bg-[#fff1e7] px-2 py-2 text-sm"
                />
              </label>
              <div className="font-medium text-[#9e3d00]">{formatEtb(item.unitPrice * item.quantityKg)}</div>
              <button type="button" onClick={() => removeItem(item.productId)} className="text-sm text-red-700">
                Remove
              </button>
            </div>
          ))}

          <div className="flex flex-col items-end gap-4 border-t border-[#e0c0b2]/40 pt-6">
            <div className="text-xl font-semibold text-[#2c1600]">
              Subtotal <span className="text-[#9e3d00]">{formatEtb(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              className="rounded bg-[#9e3d00] px-8 py-3 font-bold text-white transition hover:bg-[#c64f00]"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
