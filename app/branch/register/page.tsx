'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BranchRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    password: '',
    city: 'Addis Ababa',
    address: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/partner/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error || 'Could not register.')
        return
      }
      router.refresh()
      router.push('/branch')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-[#e8c9a8] bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">Open a shop</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#9e3d00]">Register as a reseller</h1>
        <p className="mt-2 text-sm text-[#7a4a32]">
          You buy finished products from Taem Baltina and sell them from your own shop. No milling or production.
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Shop name</span>
            <input className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5" value={form.shop_name} onChange={set('shop_name')} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Owner name</span>
            <input className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5" value={form.owner_name} onChange={set('owner_name')} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Phone (this is your login)</span>
            <input className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5" value={form.phone} onChange={set('phone')} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Password</span>
            <input type="password" className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5" value={form.password} onChange={set('password')} minLength={6} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">City</span>
            <input className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5" value={form.city} onChange={set('city')} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Address</span>
            <textarea className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5" rows={2} value={form.address} onChange={set('address')} />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-full bg-[#9e3d00] py-3 text-sm font-bold text-white disabled:opacity-60">
            {loading ? 'Creating shop…' : 'Create shop'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#7a4a32]">
          Already registered?{' '}
          <Link href="/branch/login" className="font-semibold text-[#9e3d00]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
