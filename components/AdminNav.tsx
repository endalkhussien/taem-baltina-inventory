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

type NavSection = {
  title: string
  items: NavItem[]
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-earth-200/80 text-earth-700 transition-colors group-hover:bg-earth-300 group-hover:text-earth-900 [.nav-item-active_&]:bg-white/20 [.nav-item-active_&]:text-white">
      {children}
    </span>
  )
}

const iconProps = { className: 'h-[18px] w-[18px]', strokeWidth: 1.8, fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const sections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        href: '/admin/dashboard',
        label: 'Dashboard',
        short: 'Home',
        icon: (
          <svg viewBox="0 0 24 24" {...iconProps}>
            <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
          </svg>
        )
      }
    ]
  },
  {
    title: 'Inventory',
    items: [
      {
        href: '/admin/products',
        label: 'Stock',
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
        label: 'Raw Materials',
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
      }
    ]
  },
  {
    title: 'Sales',
    items: [
      {
        href: '/admin/orders',
        label: 'Web Orders',
        short: 'Orders',
        icon: (
          <svg viewBox="0 0 24 24" {...iconProps}>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h10" />
            <path d="M17 15l2 2 3-4" />
          </svg>
        )
      },
      {
        href: '/admin/sales',
        label: 'Sales & Credit',
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
      }
    ]
  },
  {
    title: 'Finance',
    items: [
      {
        href: '/admin/finance',
        label: 'Finance & Debts',
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
  }
]

const flatLinks = sections.flatMap((section) => section.items)

function isActive(pathname: string | null, href: string) {
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
      <nav className="sticky top-0 z-50 border-b border-earth-300 bg-earth-50 shadow-md xl:hidden">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-spice-600 text-sm font-black text-white shadow-sm">
              TB
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold text-earth-950">Taem Baltina</div>
              <div className="truncate text-[11px] font-medium text-earth-500">Business console</div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/admin/account" className="btn-secondary px-3 py-2 text-xs">
              Account
            </Link>
            <button type="button" onClick={logout} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              Sign out
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {flatLinks.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  active ? 'bg-spice-700 text-white shadow-sm' : 'border border-earth-300 bg-white text-earth-700 hover:bg-earth-100'
                }`}
              >
                {link.short}
              </Link>
            )
          })}
        </div>
      </nav>

      <aside className="admin-sidebar hidden xl:flex">
        <div className="flex h-full flex-col">
          <div className="border-b border-earth-300 bg-white px-5 py-5 shadow-sm">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-spice-600 text-sm font-black text-white shadow-sm">
                TB
              </div>
              <div>
                <div className="font-display text-lg font-bold leading-tight text-earth-950">Taem Baltina</div>
                <div className="text-xs font-medium text-earth-500">Ops console</div>
              </div>
            </Link>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-earth-500">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((link) => {
                    const active = isActive(pathname, link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`nav-item group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                          active
                            ? 'nav-item-active bg-spice-700 text-white shadow-md'
                            : 'text-earth-700 hover:bg-earth-200/70 hover:text-earth-950'
                        }`}
                      >
                        <NavIcon>{link.icon}</NavIcon>
                        <span className="truncate">{link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-earth-300 bg-earth-100/80 p-4">
            <Link
              href="/admin/account"
              className="mb-2 flex w-full items-center justify-center rounded-xl border border-earth-200 bg-white px-4 py-2.5 text-sm font-semibold text-earth-700 transition hover:border-spice-200 hover:bg-spice-50"
            >
              Account settings
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
