'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from './CartProvider'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

export default function ShopHeader() {
  const pathname = usePathname()
  const { items } = useCart()
  const { lang, setLang } = useShopLang()
  const count = items.length

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e8c9a8]/50 bg-[#fdf6ee]/95 backdrop-blur-md">
      <div className="bg-[#7c2e00] px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-[#fff3e6] sm:text-xs">
        {t(lang, 'announce')}
      </div>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <div className="truncate font-display text-xl font-bold leading-tight text-[#9e3d00] sm:text-2xl">
            {t(lang, 'brand')}
          </div>
          <div className="truncate text-[11px] text-[#7a4a32]">{t(lang, 'tagline')}</div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[#5c3a28] md:flex">
          {[
            { href: '/shop', label: t(lang, 'navShop') },
            { href: '/#story', label: t(lang, 'navStory') }
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-[#9e3d00] ${
                pathname === link.href || (link.href === '/shop' && pathname?.startsWith('/shop'))
                  ? 'font-semibold text-[#9e3d00]'
                  : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-[#e8c9a8] bg-white text-[11px] font-bold">
            <button
              type="button"
              className={`px-2.5 py-1.5 ${lang === 'am' ? 'bg-[#9e3d00] text-white' : 'text-[#5c3a28]'}`}
              onClick={() => setLang('am')}
            >
              አማ
            </button>
            <button
              type="button"
              className={`px-2.5 py-1.5 ${lang === 'en' ? 'bg-[#9e3d00] text-white' : 'text-[#5c3a28]'}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
          <Link
            href="/cart"
            className="relative hidden rounded-full bg-[#9e3d00] px-4 py-2 text-sm font-semibold text-white md:inline-flex"
          >
            {t(lang, 'navCart')}
            {count > 0 && (
              <span className="ml-1.5 inline-flex min-w-[1.15rem] justify-center rounded-full bg-white px-1 text-[11px] text-[#9e3d00]">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
