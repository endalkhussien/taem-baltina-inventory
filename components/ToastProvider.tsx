"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  type: ToastType
  text: string
}

type ToastContextValue = {
  success: (text: string) => void
  error: (text: string) => void
  info: (text: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 5000

function toastStyles(type: ToastType) {
  if (type === 'success') return 'border-l-emerald-500 bg-white text-emerald-900'
  if (type === 'error') return 'border-l-red-500 bg-white text-red-900'
  return 'border-l-sky-500 bg-white text-sky-900'
}

function toastIcon(type: ToastType) {
  if (type === 'success') return '✓'
  if (type === 'error') return '!'
  return 'i'
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback((type: ToastType, text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { id, type, text }].slice(-4))
    return id
  }, [])

  const success = useCallback((text: string) => push('success', text), [push])
  const error = useCallback((text: string) => push('error', text), [push])
  const info = useCallback((text: string) => push('info', text), [push])

  const value = useMemo(() => ({ success, error, info, dismiss }), [success, error, info, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [onDismiss, toast.id])

  return (
    <div className={`toast-card border-l-4 ${toastStyles(toast.type)}`} role="status">
      <div className={`toast-icon ${toast.type}`}>{toastIcon(toast.type)}</div>
      <p className="toast-text">{toast.text}</p>
      <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
