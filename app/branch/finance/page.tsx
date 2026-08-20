'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PartnerShell from '../../../components/partner/PartnerShell'
import { formatEtb } from '../../../lib/formatCurrency'
import { useToast } from '../../../components/ToastProvider'

type Finance = {
  stockValue: number
  revenue: number
  cashIn: number
  expenses: number
  purchaseCost: number
  pendingBuys: number
  profit: number
  expenseRows: { id: number; title: string; category: string; amount: number; expense_date: string }[]
}

export default function BranchFinancePage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('rent')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const { data } = useQuery<Finance>({
    queryKey: ['partner-finance'],
    queryFn: async () => {
      const res = await fetch('/api/partner/finance')
      if (!res.ok) throw new Error('finance')
      return res.json()
    }
  })

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/partner/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, amount: Number(amount) })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(body?.error || 'Could not save expense.')
        return
      }
      toast.success('Expense saved.')
      setTitle('')
      setAmount('')
      qc.invalidateQueries({ queryKey: ['partner-finance'] })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PartnerShell>
      <h1 className="font-display text-3xl font-bold">Shop money</h1>
      <p className="mt-2 text-sm text-[#7a4a32]">
        Cash profit is money collected from sales, minus shop expenses and fulfilled wholesale buys. Factory accounts stay separate.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Stock value', data?.stockValue],
          ['Sales', data?.revenue],
          ['Cash collected', data?.cashIn],
          ['Wholesale paid', data?.purchaseCost],
          ['Expenses', data?.expenses],
          ['Cash profit', data?.profit]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[#e8c9a8] bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-[#7a4a32]">{label}</div>
            <div className="mt-1 font-display text-2xl font-bold text-[#9e3d00]">{formatEtb(Number(value || 0))}</div>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="mt-8 space-y-3 rounded-2xl border border-[#e8c9a8] bg-white p-4">
        <h2 className="font-display text-xl font-bold">Add expense</h2>
        <input className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2" placeholder="Rent, transport…" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <select className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="rent">Rent</option>
          <option value="transport">Transport</option>
          <option value="packaging">Packaging</option>
          <option value="salary">Salary</option>
          <option value="other">Other</option>
        </select>
        <input className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2" type="number" min="0.01" step="0.01" placeholder="Amount (ETB)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <button type="submit" disabled={busy} className="rounded-full bg-[#9e3d00] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Save expense'}
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(data?.expenseRows ?? []).map((row) => (
          <div key={row.id} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm">
            <span>
              {row.title} <span className="text-[#7a4a32]">· {row.category}</span>
            </span>
            <span className="font-semibold">{formatEtb(row.amount)}</span>
          </div>
        ))}
      </div>
    </PartnerShell>
  )
}
