"use client"

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  short: string
  icon: React.ReactNode
}

const iconProps = {
  className: 'h-5 w-5',
  strokeWidth: 1.7,
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

const items: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Overview',
    short: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    )
  },
  {
    href: '/admin/products',
    label: 'Inventory',
    short: 'Stock',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    )
  },
  {
    href: '/admin/ingredients',
    label: 'Raw materials',
    short: 'Raw',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M12 3c3 4 5 7 5 10a5 5 0 1 1-10 0c0-3 2-6 5-10Z" />
      </svg>
    )
  },
  {
    href: '/admin/production',
    label: 'Production',
    short: 'Make',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M3 10h4l2-4h6l2 4h4v9H3v-9Z" />
        <path d="M9 14h6" />
      </svg>
    )
  },
  {
    href: '/admin/orders',
    label: 'Web orders',
    short: 'Orders',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h10" />
      </svg>
    )
  },
  {
    href: '/admin/sales',
    label: 'Sales',
    short: 'Sales',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M7 7h10l-1 10H8L7 7Z" />
        <path d="M9 7V5h6v2" />
      </svg>
    )
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    short: 'Credit',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M16 11a4 4 0 1 0-8 0" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </svg>
    )
  },
  {
    href: '/admin/finance',
    label: 'Finance',
    short: 'Money',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 12h.01M12 12h5" />
      </svg>
    )
  },
  {
    href: '/admin/expenses',
    label: 'Expenses',
    short: 'Costs',
    icon: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M12 3v18" />
        <path d="M7 8h6a3 3 0 1 1 0 6H9" />
      </svg>
    )
  }
]

function isActive(pathname: string | null, href: string) {
  if (href === '/admin/dashboard') return pathname === '/admin' || pathname === '/admin/dashboard'
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`))
}

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
      <nav className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md xl:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container font-display text-sm font-bold text-primary">
              TB
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold text-primary">Taem Baltina</div>
              <div className="truncate text-xs text-earth-500">Internal ops</div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/admin/account" className="text-xs font-bold uppercase tracking-wide text-earth-500">
              Account
            </Link>
            <button type="button" onClick={logout} className="text-xs font-bold uppercase tracking-wide text-red-700">
              Sign out
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {items.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  active ? 'bg-primary text-white' : 'border border-outline-variant/50 bg-white text-earth-500'
                }`}
              >
                {link.short}
              </Link>
            )
          })}
        </div>
      </nav>

      <aside className="admin-sidebar hidden py-6 xl:flex">
        <div className="flex h-full flex-col">
          <Link href="/admin/dashboard" className="mb-8 flex items-center gap-4 px-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container font-display text-lg font-bold text-primary">
              TB
            </div>
            <div>
              <div className="font-display text-xl font-bold leading-tight text-primary">Taem Baltina</div>
              <div className="text-sm text-earth-500">Internal ops</div>
            </div>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4">
            {items.map((link) => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                    active
                      ? 'border-r-4 border-primary bg-secondary-container/20 text-primary'
                      : 'text-earth-500 hover:bg-secondary-container/10 hover:text-earth-900'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="space-y-2 px-4 pt-4">
            <Link href="/admin/sales" className="btn-primary w-full">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Record sale
            </Link>
            <Link href="/admin/account" className="btn-secondary w-full">
              Account
            </Link>
            <button type="button" onClick={logout} className="w-full rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-50">
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
