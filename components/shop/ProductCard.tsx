import Link from 'next/link'
import { formatEtb } from '../../lib/formatCurrency'

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
  featured = false
}: {
  product: ShopProduct
  onAdd?: () => void
  featured?: boolean
}) {
  return (
    <article
      className={`group relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded bg-[#ffeada] p-6 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(211,84,0,0.05)] ${
        featured ? 'md:min-h-[400px]' : ''
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image}
        alt={product.name}
        className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f5]/95 via-[#fff8f5]/40 to-transparent" />
      <div className="relative z-10 space-y-2">
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-[#ffdcbd] px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-[#2c1600]"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link href={`/shop/${product.id}`}>
          <h3 className="font-display text-2xl font-semibold text-[#2c1600] transition-colors group-hover:text-[#9e3d00]">
            {product.name}
          </h3>
        </Link>
        {featured && <p className="max-w-md text-base text-[#594238]">{product.blurb}</p>}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-medium text-[#2c1600]">{formatEtb(product.selling_price)} / kg</span>
          {onAdd ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onAdd()
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9e3d00] text-lg font-bold text-white transition hover:bg-[#c64f00]"
              aria-label={`Add ${product.name}`}
            >
              +
            </button>
          ) : (
            <Link href={`/shop/${product.id}`} className="text-sm font-medium text-[#9e3d00] transition hover:text-[#c64f00]">
              View
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
