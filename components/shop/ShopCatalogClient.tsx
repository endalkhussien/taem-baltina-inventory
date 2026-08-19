'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProductCard, type ShopProduct } from './ProductCard'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

const FILTERS = [
  { id: 'all', match: null as RegExp | null },
  { id: 'berbere', match: /berbere|በርበሬ/i },
  { id: 'shiro', match: /shiro|ሽሮ/i },
  { id: 'mitmita', match: /mitmita|ሚጥሚጣ/i }
]

export default function ShopCatalogClient() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const { addItem } = useCart()
  const toast = useToast()
  const { lang } = useShopLang()

  useEffect(() => {
    fetch('/api/public/products')
      .then((r) => r.json())
      .then((data: ShopProduct[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error(t(lang, 'empty')))
      .finally(() => setLoading(false))
  }, [lang, toast])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rule = FILTERS.find((item) => item.id === filter)
    return products.filter((product) => {
      const matchesQuery = !q || product.name.toLowerCase().includes(q) || product.blurb.toLowerCase().includes(q)
      const matchesFilter = !rule?.match || rule.match.test(product.name)
      return matchesQuery && matchesFilter
    })
  }, [products, query, filter])

  const chips = [
    { id: 'all', label: t(lang, 'all') },
    { id: 'berbere', label: lang === 'am' ? 'በርበሬ' : 'Berbere' },
    { id: 'shiro', label: lang === 'am' ? 'ሽሮ' : 'Shiro' },
    { id: 'mitmita', label: lang === 'am' ? 'ሚጥሚጣ' : 'Mitmita' }
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">{t(lang, 'catalogKicker')}</span>
        <h1 className="mt-2 font-display text-4xl font-bold text-[#2a170f]">{t(lang, 'catalogTitle')}</h1>
        <p className="mt-3 text-lg text-[#5c3a28]">{t(lang, 'catalogBody')}</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(lang, 'search')}
          className="min-h-12 w-full rounded-full border border-[#ead3bc] bg-white px-5 text-base outline-none focus:border-[#9e3d00] sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === chip.id ? 'bg-[#9e3d00] text-white' : 'border border-[#ead3bc] bg-white text-[#5c3a28]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-[#5c3a28]">{t(lang, 'loading')}</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl bg-[#fff1e0] p-10 text-[#5c3a28]">{t(lang, 'empty')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lang={lang}
              onAdd={() => {
                addItem({
                  productId: product.id,
                  name: product.name,
                  unitPrice: product.selling_price,
                  image: product.image,
                  quantityKg: 1
                })
                toast.success(`${product.name} — ${t(lang, 'added')}`)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
