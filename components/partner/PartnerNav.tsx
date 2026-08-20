'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/branch', label: 'Home' },
  { href: '/branch/buy', label: 'Buy' },
  { href: '/branch/stock', label: 'Stock' },
  { href: '/branch/sales', label: 'Sell' },
  { href: '/branch/finance', label: 'Money' }
]

export default function PartnerNav({ shopName }: { shopName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/partner/auth/logout', { method: 'POST' })
    router.refresh()
    router.push('/branch/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8c9a8]/70 bg-[#fdf6ee]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/branch" className="min-w-0">
          <div className="truncate font-display text-xl font-bold text-[#9e3d00]">
            {shopName || 'My shop'}
          </div>
          <div className="text-[11px] text-[#7a4a32]">Independent shop · no production</div>
        </Link>
        <button type="button" onClick={logout} className="text-xs font-bold uppercase tracking-wide text-[#9e3d00]">
          Sign out
        </button>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3">
        {links.map((link) => {
          const active = link.href === '/branch' ? pathname === '/branch' : pathname?.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                active ? 'bg-[#9e3d00] text-white' : 'border border-[#e8c9a8] bg-white text-[#5c3a28]'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
