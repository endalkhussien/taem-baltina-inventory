'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from './CartProvider'

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/#story', label: 'Our Story' },
  { href: '/checkout', label: 'Order' }
]

export default function ShopHeader() {
  const pathname = usePathname()
  const { items } = useCart()
  const count = items.length

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e0c0b2]/40 bg-[#fff1e7]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3 md:px-16">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[#9e3d00]">
          Taem Baltina
        </Link>

        <nav className="hidden items-center gap-8 text-base text-[#594238] md:flex">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-[#9e3d00] ${
                  active ? 'border-b-2 border-[#9e3d00] pb-0.5 font-semibold text-[#9e3d00]' : ''
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/cart"
          className="relative rounded-md px-3 py-2 text-sm font-semibold text-[#9e3d00] transition hover:bg-white/70"
          aria-label="Cart"
        >
          Cart
          {count > 0 && (
            <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#9e3d00] px-1.5 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
