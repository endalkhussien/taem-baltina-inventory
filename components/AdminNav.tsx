"use client"

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', short: 'Home' },
  { href: '/admin/production', label: 'Production', short: 'Make' },
  { href: '/admin/products', label: 'Products', short: 'Goods' },
  { href: '/admin/ingredients', label: 'Raw Materials', short: 'Raw' },
  { href: '/admin/sales', label: 'Sales & Credit', short: 'Sales' },
  { href: '/admin/customers', label: 'Customers', short: 'Clients' },
  { href: '/admin/expenses', label: 'Expenses', short: 'Costs' }
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
    <nav className="bg-earth-950 text-white sticky top-0 z-50 border-b border-white/10 shadow-xl shadow-earth-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-spice-600 flex items-center justify-center text-sm group-hover:bg-spice-500 transition-colors shadow-spice">
            TB
          </div>
          <div>
            <span className="font-display text-lg font-semibold tracking-wide leading-none">Taem Baltina</span>
            <div className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-earth-300">Inventory desk</div>
          </div>
        </Link>

        <div className="hidden lg:flex gap-1 items-center rounded-xl bg-white/5 p-1">
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
          className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Mobile nav */}
      <div className="lg:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
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
