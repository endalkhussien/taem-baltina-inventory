"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import AdminNav from '../../../components/AdminNav'
import { useToast } from '../../../components/ToastProvider'

type ChangePasswordValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function AccountPage() {
  const toast = useToast()
  const { register, handleSubmit, reset } = useForm<ChangePasswordValues>()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ChangePasswordValues) => {
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
        toast.error(body?.error || 'Could not change password.')
        return
      }

      reset()
      toast.success(body?.message || 'Password updated successfully.')
    } catch {
      toast.error('Something went wrong. Please try again.')
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
