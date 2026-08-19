'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ProductCard, type ShopProduct } from './ProductCard'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

export default function HomeClient() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const toast = useToast()
  const { lang } = useShopLang()

  useEffect(() => {
    fetch('/api/public/products')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load products')
        return res.json()
      })
      .then((data: ShopProduct[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error(t(lang, 'empty')))
      .finally(() => setLoading(false))
  }, [lang, toast])

  const handleAdd = (product: ShopProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.selling_price,
      image: product.image,
      quantityKg: 1
    })
    toast.success(`${product.name} — ${t(lang, 'added')}`)
  }

  const steps = [
    t(lang, 'how1'),
    t(lang, 'how2'),
    t(lang, 'how3'),
    t(lang, 'how4')
  ]

  return (
    <>
      <section className="relative overflow-hidden bg-[#3a160c]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=70"
            alt=""
            className="h-full w-full object-cover opacity-35"
          />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold text-[#ffb595]">{t(lang, 'heroKicker')}</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            {t(lang, 'heroTitle')}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#ffdbcd] sm:text-lg">{t(lang, 'heroBody')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#c64f00] px-8 py-3 text-base font-bold text-white hover:bg-[#9e3d00]"
            >
              {t(lang, 'shopCta')}
            </Link>
            <a
              href="#story"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-8 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              {t(lang, 'navStory')}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-[#2a170f] sm:text-3xl">{t(lang, 'howTitle')}</h2>
        <ol className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="rounded-2xl border border-[#ead3bc] bg-white p-4">
              <div className="text-sm font-bold text-[#c64f00]">0{index + 1}</div>
              <div className="mt-2 text-sm font-semibold text-[#2a170f] sm:text-base">{step}</div>
            </li>
          ))}
        </ol>
      </section>

      <section id="shop" className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-semibold text-[#2a170f]">{t(lang, 'featured')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-[#5c3a28]">{t(lang, 'featuredBody')}</p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-[#fff1e0] p-12 text-center text-[#5c3a28]">{t(lang, 'loading')}</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#ead3bc] bg-white p-12 text-center text-[#5c3a28]">{t(lang, 'empty')}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} lang={lang} onAdd={() => handleAdd(product)} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/shop" className="inline-flex min-h-12 items-center rounded-full bg-[#9e3d00] px-8 py-3 font-bold text-white">
                {t(lang, 'seeAll')}
              </Link>
            </div>
          </>
        )}
      </section>

      <section id="story" className="bg-[#fff1e0] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1100&q=70"
              alt=""
              className="h-[280px] w-full object-cover sm:h-[420px]"
            />
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">{t(lang, 'storyKicker')}</span>
            <h2 className="font-display text-3xl font-semibold text-[#2a170f]">{t(lang, 'storyTitle')}</h2>
            <p className="text-base leading-7 text-[#5c3a28]">{t(lang, 'story1')}</p>
            <p className="text-base leading-7 text-[#5c3a28]">{t(lang, 'story2')}</p>
            <ul className="space-y-2 pt-2">
              {[t(lang, 'trust1'), t(lang, 'trust2'), t(lang, 'trust3')].map((line) => (
                <li key={line} className="flex items-center gap-3 text-[#2a170f]">
                  <span className="h-2 w-2 rounded-full bg-[#c64f00]" />
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
