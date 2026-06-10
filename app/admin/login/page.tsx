"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

type LoginFormValues = {
  username: string
  password: string
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFormValues>()
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: LoginFormValues) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        router.refresh()
        router.push('/admin/dashboard')
      } else {
        setError('Invalid username or password. Try admin / password.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-spice-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-spice-radial" />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-spice-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-spice-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                🌶
              </div>
              <span className="font-display text-xl font-semibold tracking-wide">Taem Baltina Operations</span>
            </div>

            <h1 className="font-display text-5xl font-bold leading-tight mb-6">
              Spice Inventory<br />
              <span className="text-spice-200">Control Room</span>
            </h1>
            <p className="text-spice-100/80 text-lg max-w-md leading-relaxed">
              Track raw materials, production batches, finished goods, customer credit, repayments, and operating costs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Goods', value: 'Stock' },
              { label: 'Credit', value: 'Repayments' },
              { label: 'Batches', value: 'Production' }
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
                <div className="text-spice-200 text-xs font-medium uppercase tracking-wider">{item.label}</div>
                <div className="text-white font-semibold mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-spice-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 rounded-xl bg-spice-600 flex items-center justify-center text-sm font-black text-white">
                TB
            </div>
            <span className="font-display text-2xl font-bold text-earth-900">Taem Baltina Ops</span>
          </div>

          <div className="card">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-black text-earth-950">Open Operations Console</h2>
              <p className="text-earth-500 text-sm mt-2">Sign in to manage stock, batches, sales, and credit accounts.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Username</label>
                <input
                  className="input-field"
                  placeholder="Enter your username"
                  autoComplete="username"
                  {...register('username', { required: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password', { required: true })}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-earth-400 mt-6">
              Default credentials: <span className="font-medium text-earth-600">admin</span> / <span className="font-medium text-earth-600">password</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
