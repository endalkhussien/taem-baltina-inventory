'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ProductCard, type ShopProduct } from './ProductCard'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'

export default function HomeClient() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const toast = useToast()

  useEffect(() => {
    fetch('/api/public/products')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load products')
        return res.json()
      })
      .then((data: ShopProduct[]) => setProducts(data))
      .catch(() => toast.error('Could not load the pantry. Try again shortly.'))
      .finally(() => setLoading(false))
  }, [toast])

  const featured = products[0]
  const side = products.slice(1, 3)

  const handleAdd = (product: ShopProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.selling_price,
      image: product.image,
      quantityKg: 1
    })
    toast.success(`${product.name} added to your pantry bag.`)
  }

  return (
    <>
      <section className="relative flex min-h-[80vh] w-full items-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1800&q=80"
            alt=""
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-5 py-20 md:grid-cols-12 md:px-16">
          <div className="flex flex-col justify-center space-y-6 md:col-span-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9e3d00]">The essence of Ethiopia</span>
            <h1 className="max-w-lg font-display text-4xl font-bold leading-tight tracking-tight text-[#2c1600] md:text-5xl">
              Artisanal Blends for the Modern Pantry.
            </h1>
            <p className="max-w-md text-lg text-[#594238]">
              Ethically sourced from the highlands, crafted with heritage. Elevate everyday cooking with authentic Taem
              Baltina flavor.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded bg-[#9e3d00] px-8 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#c64f00]"
              >
                Shop Our Blends
              </Link>
              <a
                href="#story"
                className="inline-flex items-center justify-center rounded border border-[#4e6073] px-8 py-4 text-base font-bold text-[#4e6073] transition hover:border-transparent hover:bg-[#cfe2f9]"
              >
                Discover Our Heritage
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-[1280px] px-5 py-16 md:px-16 md:py-24">
        <div className="mb-12 space-y-2 text-center">
          <h2 className="font-display text-3xl font-semibold text-[#2c1600]">Curated Essentials</h2>
          <p className="mx-auto max-w-2xl text-lg text-[#594238]">
            Small-batch Ethiopian blends, ready to order for your kitchen.
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg bg-[#fff1e7] p-12 text-center text-[#594238]">Loading the pantry…</div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-[#e0c0b2]/40 bg-[#fff1e7] p-12 text-center text-[#594238]">
            No blends are listed right now. Please check back soon.
          </div>
        ) : (
          <div className="grid auto-rows-[minmax(300px,auto)] grid-cols-1 gap-6 md:grid-cols-12">
            {featured && (
              <div className="md:col-span-8">
                <ProductCard product={featured} featured onAdd={() => handleAdd(featured)} />
              </div>
            )}
            {side.map((product) => (
              <div key={product.id} className="md:col-span-4">
                <ProductCard product={product} onAdd={() => handleAdd(product)} />
              </div>
            ))}
            {products.length > 3 && (
              <div className="flex flex-col items-start justify-center rounded border border-[#e0c0b2]/30 bg-[#fff1e7] p-8 transition hover:border-[#9e3d00]/30 md:col-span-8 md:p-12">
                <h3 className="mb-4 font-display text-2xl font-semibold text-[#2c1600]">See the full collection</h3>
                <p className="mb-8 max-w-xl text-lg text-[#594238]">
                  Browse every blend we currently offer — stories, heat, and heritage in one pantry.
                </p>
                <Link href="/shop" className="inline-flex items-center gap-2 font-bold text-[#9e3d00] hover:text-[#c64f00]">
                  Browse all blends →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      <section id="story" className="bg-[#fff1e7] px-5 py-16 md:px-16 md:py-32">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 md:grid-cols-12">
          <div className="relative h-[420px] w-full md:col-span-6 md:h-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=900&q=80"
              alt="Hands sorting spices"
              className="absolute right-0 top-0 z-10 h-4/5 w-4/5 rounded object-cover shadow-[0_10px_40px_rgba(211,84,0,0.08)]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=700&q=80"
              alt="Ground spice"
              className="absolute bottom-0 left-0 z-20 h-3/5 w-3/5 rounded border-8 border-[#fff1e7] object-cover shadow-[0_10px_40px_rgba(44,22,0,0.05)]"
            />
          </div>
          <div className="space-y-6 md:col-span-5 md:col-start-8">
            <span className="block text-xs font-bold uppercase tracking-widest text-[#9e3d00]">Our heritage</span>
            <h2 className="font-display text-3xl font-semibold text-[#2c1600]">Rooted in Tradition, Crafted for Today.</h2>
            <div className="space-y-4 text-lg text-[#594238]">
              <p>
                Taem Baltina is a connection to Ethiopian kitchen soul — partnering with growers, preserving technique,
                and milling in small batches so volatile oils stay vivid.
              </p>
              <p>No shortcuts. Pure depth of chili, legumes, and aromatic roots for everyday tables and celebrated feasts.</p>
            </div>
            <ul className="space-y-3 border-t border-[#e0c0b2]/30 pt-4">
              {[
                'Single-origin, carefully sourced ingredients.',
                'Traditional drying and milling methods.',
                'Stock synced to our production floor.'
              ].map((line) => (
                <li key={line} className="flex items-center gap-3 text-[#2c1600]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd] text-sm font-bold text-[#9e3d00]">
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
