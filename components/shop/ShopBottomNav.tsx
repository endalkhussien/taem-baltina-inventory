'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from './CartProvider'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

export default function ShopBottomNav() {
  const pathname = usePathname()
  const { items } = useCart()
  const { lang } = useShopLang()
  const count = items.length

  const tabs = [
    { href: '/', label: t(lang, 'navHome') },
    { href: '/shop', label: t(lang, 'navShop') },
    { href: '/cart', label: t(lang, 'navCart') }
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8c9a8] bg-[#fdf6ee]/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {tabs.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative rounded-xl px-2 py-2 text-center text-xs font-semibold ${
                active ? 'bg-[#9e3d00] text-white' : 'text-[#5c3a28]'
              }`}
            >
              {tab.label}
              {tab.href === '/cart' && count > 0 && (
                <span className="absolute right-3 top-1 rounded-full bg-[#c64f00] px-1.5 text-[10px] text-white">
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
