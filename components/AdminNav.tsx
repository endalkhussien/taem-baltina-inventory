"use client"

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/ingredients', label: 'Ingredients' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/expenses', label: 'Expenses' }
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
    <nav className="bg-earth-950 text-white sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-spice-600 flex items-center justify-center text-sm group-hover:bg-spice-500 transition-colors">
            🌶
          </div>
          <span className="font-display text-lg font-semibold tracking-wide">Taem Baltina</span>
        </Link>

        <div className="hidden md:flex gap-1 items-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'nav-link-active' : 'nav-link'}
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
      <div className="md:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
              pathname === link.href
                ? 'bg-spice-600 text-white'
                : 'bg-white/10 text-earth-200 hover:bg-white/15'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
