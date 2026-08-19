"use client"

import Link from 'next/link'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

type LoginFormValues = {
  username: string
  password: string
}

const isDevelopment = process.env.NODE_ENV === 'development'

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFormValues>()
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        const body = await res.json().catch(() => null)
        setError(body?.error || 'Invalid username or password.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=60')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(158,61,0,0.04),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-xl border border-outline-variant/30 bg-white p-8 shadow-card md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 19h16M7 19V9l5-4 5 4v10M9 13h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-display text-4xl font-bold text-primary md:text-5xl">Taem Baltina</h1>
            <p className="mt-2 text-sm text-earth-500">Staff portal — not the public shop</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-earth-900">Username</label>
              <input
                className="input-field"
                placeholder="Enter your username"
                autoComplete="username"
                {...register('username', { required: true })}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-earth-900">Password</label>
                <Link href="/admin/forgot-password" className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary-container">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: true })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-xs font-bold uppercase tracking-wide text-earth-500 hover:text-primary"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {isDevelopment && (
            <p className="mt-6 text-center text-xs text-earth-400">
              Local default: <span className="font-medium text-earth-600">admin</span> / <span className="font-medium text-earth-600">password</span>
            </p>
          )}

          <div className="mt-8 border-t border-outline-variant/20 pt-6 text-center text-sm text-earth-500/80">
            © {new Date().getFullYear()} Taem Baltina. Internal Systems.
          </div>
        </div>
      </div>
    </div>
  )
}
