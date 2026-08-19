'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ShopProduct } from './ProductCard'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'
import { formatEtb } from '../../lib/formatCurrency'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

export default function ProductDetailClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const toast = useToast()
  const { lang } = useShopLang()

  useEffect(() => {
    fetch(`/api/public/products/${productId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('missing')
        return res.json()
      })
      .then((data: ShopProduct) => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) {
    return <div className="mx-auto max-w-[1200px] px-4 py-16 text-[#5c3a28]">{t(lang, 'loading')}</div>
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-16">
        <p className="text-[#5c3a28]">{t(lang, 'missing')}</p>
        <Link href="/shop" className="font-bold text-[#9e3d00]">
          {t(lang, 'back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 md:py-14">
      <div className="overflow-hidden rounded-3xl bg-[#ffeada]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-full min-h-[280px] w-full object-cover sm:min-h-[420px]" />
      </div>
      <div className="flex flex-col justify-center space-y-5">
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-[#fff1e0] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#7c2e00]">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="font-display text-4xl font-bold text-[#2a170f]">{product.name}</h1>
        <p className="text-lg leading-7 text-[#5c3a28]">{product.blurb}</p>
        <p className="text-2xl font-bold text-[#9e3d00]">
          {formatEtb(product.selling_price)} <span className="text-base font-medium text-[#7a4a32]">{t(lang, 'perKg')}</span>
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#5c3a28]">
            {t(lang, 'qty')}
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-2 block h-12 w-32 rounded-xl border border-[#ead3bc] bg-white px-3 text-base outline-none focus:border-[#9e3d00]"
            />
          </label>
          <button
            type="button"
            className="min-h-12 rounded-full bg-[#9e3d00] px-8 py-3 font-bold text-white hover:bg-[#c64f00]"
            onClick={() => {
              if (qty <= 0) return
              addItem({
                productId: product.id,
                name: product.name,
                unitPrice: product.selling_price,
                image: product.image,
                quantityKg: qty
              })
              toast.success(t(lang, 'added'))
            }}
          >
            {t(lang, 'addCart')}
          </button>
        </div>

        <Link href="/cart" className="text-sm font-semibold text-[#9e3d00]">
          {t(lang, 'viewCart')} →
        </Link>
      </div>
    </div>
  )
}
