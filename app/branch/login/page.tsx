'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BranchLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/partner/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error || 'Could not sign in.')
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
      <div className="w-full max-w-md rounded-2xl border border-[#e8c9a8] bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">Shop portal</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#9e3d00]">Sign in to your shop</h1>
        <p className="mt-2 text-sm text-[#7a4a32]">
          Buy prepared spices from Taem Baltina, sell them, and keep your own stock and money. This is not the factory ops desk.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Phone</span>
            <input
              className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Password</span>
            <input
              type="password"
              className="w-full rounded-xl border border-[#e8c9a8] px-3 py-2.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#9e3d00] py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#7a4a32]">
          New shop?{' '}
          <Link href="/branch/register" className="font-semibold text-[#9e3d00]">
            Register
          </Link>
        </p>
        <p className="mt-3 text-center text-sm">
          <Link href="/" className="text-[#7a4a32] underline">
            Back to the public market
          </Link>
        </p>
      </div>
    </div>
  )
}
