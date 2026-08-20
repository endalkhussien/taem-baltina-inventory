'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import PartnerShell from '../../components/partner/PartnerShell'
import { formatEtb } from '../../lib/formatCurrency'

type Finance = {
  stockValue: number
  revenue: number
  cashIn: number
  expenses: number
  purchaseCost: number
  pendingBuys: number
  profit: number
}

export default function BranchHomePage() {
  const { data: finance, isLoading } = useQuery<Finance>({
    queryKey: ['partner-finance'],
    queryFn: async () => {
      const res = await fetch('/api/partner/finance')
      if (!res.ok) throw new Error('finance')
      return res.json()
    }
  })

  const cards = [
    { label: 'Stock value', value: finance?.stockValue ?? 0, href: '/branch/stock' },
    { label: 'Sales (all time)', value: finance?.revenue ?? 0, href: '/branch/sales' },
    { label: 'Cash in', value: finance?.cashIn ?? 0, href: '/branch/finance' },
    { label: 'Wholesale buys', value: finance?.purchaseCost ?? 0, href: '/branch/buy' },
    { label: 'Expenses', value: finance?.expenses ?? 0, href: '/branch/finance' },
    { label: 'Cash profit', value: finance?.profit ?? 0, href: '/branch/finance' }
  ]

  return (
    <PartnerShell>
      <p className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">Your shop</p>
      <h1 className="mt-1 font-display text-3xl font-bold">Buy, sell, keep the books</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a4a32]">
        Order prepared items from Taem Baltina. When they fulfill, stock lands here. Sell at your own price. No recipes, no milling.
      </p>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#7a4a32]">Loading…</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="rounded-2xl border border-[#e8c9a8] bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#7a4a32]">{card.label}</div>
              <div className="mt-2 font-display text-2xl font-bold text-[#9e3d00]">{formatEtb(card.value)}</div>
            </Link>
          ))}
        </div>
      )}

      {finance && finance.pendingBuys > 0 && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {formatEtb(finance.pendingBuys)} in wholesale orders is still waiting for Taem Baltina to pack.
        </p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link href="/branch/buy" className="rounded-full bg-[#9e3d00] px-4 py-3 text-center text-sm font-bold text-white">
          Buy from wholesaler
        </Link>
        <Link href="/branch/sales" className="rounded-full border border-[#9e3d00] px-4 py-3 text-center text-sm font-bold text-[#9e3d00]">
          Record a sale
        </Link>
        <Link href="/branch/stock" className="rounded-full border border-[#e8c9a8] bg-white px-4 py-3 text-center text-sm font-bold">
          Register stock
        </Link>
      </div>
    </PartnerShell>
  )
}
