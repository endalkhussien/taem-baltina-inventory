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
    <>
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-earth-950/95 text-white shadow-xl shadow-earth-950/10 backdrop-blur-xl xl:hidden">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-spice-600 flex items-center justify-center text-sm font-black group-hover:bg-spice-500 transition-colors shadow-spice">
            TB
          </div>
          <div>
            <span className="font-display text-lg font-semibold tracking-wide leading-none">Taem Baltina</span>
            <div className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-earth-300">Operations console</div>
          </div>
        </Link>

        <button
          onClick={logout}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-earth-100 ring-1 ring-white/10 transition-colors hover:bg-red-600 hover:text-white"
        >
          Sign out
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
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
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-white/10 bg-earth-950 text-white shadow-2xl shadow-earth-950/20 xl:flex">
      <div className="flex h-full flex-col p-5">
        <Link href="/admin" className="group flex items-center gap-3 rounded-3xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-spice-600 text-sm font-black shadow-spice transition-colors group-hover:bg-spice-500">
            TB
          </div>
          <div>
            <div className="font-display text-xl font-bold leading-none">Taem Baltina</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-earth-300">Operations</div>
          </div>
        </Link>

        <div className="mt-8 space-y-2">
          {links.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(`${link.href}/`)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                  active
                    ? 'bg-white text-earth-950 shadow-spice'
                    : 'text-earth-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-spice-100 text-spice-800' : 'bg-white/10 text-earth-300'}`}>{link.short}</span>
              </Link>
            )
          })}
        </div>

        <div className="mt-auto rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-spice-200">Session</div>
          <p className="mt-2 text-sm text-earth-200">Secure internal inventory access.</p>
          <button
            onClick={logout}
            className="mt-4 w-full rounded-2xl bg-red-600/90 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
    </>
  )
}
