'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ShopProduct } from './ProductCard'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'
import { formatEtb } from '../../lib/formatCurrency'

export default function ProductDetailClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const toast = useToast()

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
    return <div className="mx-auto max-w-[1280px] px-5 py-16 text-[#594238] md:px-16">Loading product…</div>
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-4 px-5 py-16 md:px-16">
        <p className="text-[#594238]">This blend is not available.</p>
        <Link href="/shop" className="font-bold text-[#9e3d00]">
          Back to shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-12 md:grid-cols-2 md:px-16 md:py-16">
      <div className="overflow-hidden rounded bg-[#ffeada]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-full min-h-[360px] w-full object-cover" />
      </div>
      <div className="flex flex-col justify-center space-y-6">
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span key={tag} className="rounded bg-[#ffdcbd] px-2 py-1 text-[11px] font-bold uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="font-display text-4xl font-bold text-[#2c1600]">{product.name}</h1>
        <p className="text-lg text-[#594238]">{product.blurb}</p>
        <p className="text-2xl font-medium text-[#9e3d00]">{formatEtb(product.selling_price)} / kg</p>

        <div className="flex flex-wrap items-end gap-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#594238]">
              Quantity (kg)
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="mt-2 block w-32 rounded border-b-2 border-transparent bg-[#fff1e7] px-3 py-2 text-base text-[#2c1600] outline-none focus:border-[#9e3d00]"
              />
            </label>
            <button
              type="button"
              className="rounded bg-[#9e3d00] px-8 py-3 font-bold text-white transition hover:bg-[#c64f00]"
              onClick={() => {
                if (qty <= 0) return toast.error('Enter a quantity.')
                addItem({
                  productId: product.id,
                  name: product.name,
                  unitPrice: product.selling_price,
                  image: product.image,
                  quantityKg: qty
                })
                toast.success('Added to cart.')
              }}
            >
              Add to pantry
            </button>
          </div>

        <Link href="/cart" className="text-sm font-semibold text-[#9e3d00] hover:underline">
          View cart →
        </Link>
      </div>
    </div>
  )
}
