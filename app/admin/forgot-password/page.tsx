"use client"

import Link from 'next/link'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

type ResetFormValues = {
  username: string
  recoverySecret: string
  newPassword: string
  confirmPassword: string
}

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm<ResetFormValues>()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ResetFormValues) => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const body = await res.json().catch(() => null)

      if (!res.ok) {
        setError(body?.error || 'Could not reset password.')
        return
      }

      setSuccess(body?.message || 'Password reset successfully.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-black text-earth-950">Reset Password</h2>
            <p className="text-earth-500 text-sm mt-2">
              Use your recovery secret to set a new password. If no admin account exists yet, this will create one.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Username</label>
              <input className="input-field" autoComplete="username" {...register('username', { required: true })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Recovery secret</label>
              <input
                type="password"
                className="input-field"
                autoComplete="off"
                placeholder="Your PASSWORD_RESET_SECRET value"
                {...register('recoverySecret', { required: true })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">New password</label>
              <input
                type="password"
                className="input-field"
                autoComplete="new-password"
                {...register('newPassword', { required: true, minLength: 8 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Confirm new password</label>
              <input
                type="password"
                className="input-field"
                autoComplete="new-password"
                {...register('confirmPassword', { required: true })}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
              {loading ? 'Saving new password...' : 'Reset password'}
            </button>
          </form>

          <p className="text-center text-sm text-earth-500 mt-6">
            <Link href="/admin/login" className="font-semibold text-spice-700 hover:text-spice-900">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
