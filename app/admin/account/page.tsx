"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'

type ChangePasswordValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function AccountPage() {
  const { register, handleSubmit, reset } = useForm<ChangePasswordValues>()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ChangePasswordValues) => {
    setMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      })

      const body = await res.json().catch(() => null)

      if (!res.ok) {
        setMessage({ type: 'error', text: body?.error || 'Could not change password.' })
        return
      }

      reset()
      setMessage({ type: 'success', text: body?.message || 'Password updated successfully.' })
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container max-w-2xl">
          <div className="page-hero-subtle">
            <div className="eyebrow">Account</div>
            <h1 className="mt-2 font-display text-4xl font-black text-earth-950">Change Password</h1>
            <p className="mt-3 text-sm leading-6 text-earth-500">
              Update your sign-in password here. Passwords are stored securely in the database, so you do not need to change Vercel environment variables after updating.
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Current password</label>
                <input type="password" className="input-field" autoComplete="current-password" {...register('currentPassword', { required: true })} />
              </div>

              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">New password</label>
                <input type="password" className="input-field" autoComplete="new-password" {...register('newPassword', { required: true, minLength: 8 })} />
                <p className="mt-1 text-xs text-earth-500">Use at least 8 characters.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-earth-700 mb-1.5">Confirm new password</label>
                <input type="password" className="input-field" autoComplete="new-password" {...register('confirmPassword', { required: true })} />
              </div>

              {message && (
                <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
