import Link from 'next/link'
import { formatEtb } from '../../lib/formatCurrency'
import type { ShopLang } from './shopCopy'
import { t } from './shopCopy'

export type ShopProduct = {
  id: number
  name: string
  selling_price: number
  available: boolean
  image: string
  blurb: string
  tags: string[]
}

export function ProductCard({
  product,
  onAdd,
  lang
}: {
  product: ShopProduct
  onAdd?: () => void
  lang: ShopLang
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#ead3bc] bg-white shadow-[0_8px_24px_rgba(58,22,12,0.06)]">
      <Link href={`/shop/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#ffeada]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-[#fff1e0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7c2e00]">
              {tag}
            </span>
          ))}
        </div>
        <Link href={`/shop/${product.id}`}>
          <h3 className="font-display text-xl font-semibold text-[#2a170f] hover:text-[#9e3d00]">{product.name}</h3>
        </Link>
        <p className="line-clamp-2 flex-1 text-sm text-[#5c3a28]">{product.blurb}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-base font-bold text-[#9e3d00]">
            {formatEtb(product.selling_price)} <span className="text-xs font-medium text-[#7a4a32]">{t(lang, 'perKg')}</span>
          </span>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="min-h-11 rounded-full bg-[#9e3d00] px-4 py-2 text-sm font-bold text-white hover:bg-[#c64f00]"
            >
              {t(lang, 'add')}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
