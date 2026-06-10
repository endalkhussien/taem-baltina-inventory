"use client"

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const links = [
  { href: '/admin/dashboard', label: 'Command Center', short: 'Home' },
  { href: '/admin/production', label: 'Batch Production', short: 'Batch' },
  { href: '/admin/products', label: 'Finished Goods', short: 'Goods' },
  { href: '/admin/ingredients', label: 'Raw Material Ledger', short: 'Raw' },
  { href: '/admin/sales', label: 'Sales & Credit Desk', short: 'Credit' },
  { href: '/admin/customers', label: 'Customer Accounts', short: 'Clients' },
  { href: '/admin/expenses', label: 'Operating Costs', short: 'Costs' }
]

export default function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
    router.push('/admin/login')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-earth-950/95 text-white shadow-xl shadow-earth-950/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-spice-600 flex items-center justify-center text-sm font-black group-hover:bg-spice-500 transition-colors shadow-spice">
            TB
          </div>
          <div>
            <span className="font-display text-lg font-semibold tracking-wide leading-none">Taem Baltina</span>
            <div className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-earth-300">Operations console</div>
          </div>
        </Link>

        <div className="hidden xl:flex gap-1 items-center rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href || pathname?.startsWith(`${link.href}/`) ? 'nav-link-active' : 'nav-link'}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          onClick={logout}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-earth-100 ring-1 ring-white/10 transition-colors hover:bg-red-600 hover:text-white"
        >
          Sign out
        </button>
      </div>

      {/* Mobile nav */}
      <div className="xl:hidden flex gap-2 px-4 pb-3 overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
              pathname === link.href || pathname?.startsWith(`${link.href}/`)
                ? 'bg-spice-600 text-white'
                : 'bg-white/10 text-earth-200 hover:bg-white/15'
            }`}
          >
            {link.short}
          </Link>
        ))}
      </div>
    </nav>
  )
}
