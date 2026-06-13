"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useIngredients } from '../hooks/useModules'
import { useProducts } from '../hooks/useProducts'
import { isLowStock } from '../lib/stock'

const DISMISS_KEY = 'tb_low_stock_alert_dismissed'

type LowStockRow = {
  id: number
  name: string
  stock: number
  threshold: number
  unit: string
  kind: 'finished' | 'raw'
}

function buildSignature(rows: LowStockRow[]) {
  return rows.map((row) => `${row.kind}:${row.id}:${row.stock}`).join('|')
}

export default function LowStockAlertModal() {
  const pathname = usePathname()
  const { data: products } = useProducts()
  const { data: ingredients } = useIngredients()
  const [open, setOpen] = useState(false)
  const [signature, setSignature] = useState('')

  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const ingredientList = useMemo(() => (Array.isArray(ingredients) ? ingredients : []), [ingredients])

  const lowStockRows = useMemo<LowStockRow[]>(() => {
    const finished = productList
      .filter((product) => isLowStock(product))
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: Number(product.stock_quantity),
        threshold: Number(product.alert_threshold),
        unit: 'units',
        kind: 'finished' as const
      }))

    const raw = ingredientList
      .filter((ingredient) => isLowStock(ingredient))
      .map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        stock: Number(ingredient.quantity),
        threshold: Number(ingredient.alert_threshold),
        unit: ingredient.unit,
        kind: 'raw' as const
      }))

    return [...finished, ...raw]
  }, [productList, ingredientList])

  useEffect(() => {
    if (!pathname?.startsWith('/admin') || pathname === '/admin/login' || pathname === '/admin/forgot-password') {
      setOpen(false)
      return
    }

    if (lowStockRows.length === 0) {
      setOpen(false)
      return
    }

    const nextSignature = buildSignature(lowStockRows)
    const dismissedSignature = sessionStorage.getItem(DISMISS_KEY)

    if (dismissedSignature !== nextSignature) {
      setSignature(nextSignature)
      setOpen(true)
    }
  }, [lowStockRows, pathname])

  if (!open || lowStockRows.length === 0) return null

  const finishedRows = lowStockRows.filter((row) => row.kind === 'finished')
  const rawRows = lowStockRows.filter((row) => row.kind === 'raw')

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, signature)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Dismiss low stock alert"
        className="absolute inset-0 bg-earth-950/75 backdrop-blur-sm"
        onClick={dismiss}
      />

      <div
        role="alertdialog"
        aria-labelledby="low-stock-title"
        aria-describedby="low-stock-description"
        className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border-4 border-red-500 bg-white shadow-2xl shadow-red-900/30"
      >
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-black text-red-600 shadow-lg">
              !
            </div>
            <div className="text-white">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-100">Urgent attention</p>
              <h2 id="low-stock-title" className="mt-1 font-display text-3xl font-black leading-tight sm:text-4xl">
                Low stock warning
              </h2>
              <p id="low-stock-description" className="mt-2 text-sm leading-6 text-red-50 sm:text-base">
                {lowStockRows.length} item{lowStockRows.length === 1 ? '' : 's'} need restocking before production or sales are affected.
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-6">
          {finishedRows.length > 0 && (
            <section>
              <h3 className="text-sm font-black uppercase tracking-wide text-red-700">Finished goods</h3>
              <ul className="mt-3 space-y-2">
                {finishedRows.map((row) => (
                  <li key={`f-${row.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <div>
                      <div className="font-bold text-earth-950">{row.name}</div>
                      <div className="text-sm text-red-700">Reorder at {row.threshold} {row.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-red-700">{row.stock}</div>
                      <div className="text-xs uppercase tracking-wide text-red-600">{row.unit} left</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rawRows.length > 0 && (
            <section>
              <h3 className="text-sm font-black uppercase tracking-wide text-amber-700">Raw materials</h3>
              <ul className="mt-3 space-y-2">
                {rawRows.map((row) => (
                  <li key={`r-${row.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div>
                      <div className="font-bold text-earth-950">{row.name}</div>
                      <div className="text-sm text-amber-800">Reorder at {row.threshold} {row.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-amber-800">{row.stock.toFixed(3)}</div>
                      <div className="text-xs uppercase tracking-wide text-amber-700">{row.unit} left</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-earth-100 bg-earth-50 px-6 py-5 sm:flex-row sm:px-8">
          <Link href="/admin/products?filter=low" className="btn-primary flex-1 text-center" onClick={dismiss}>
            Review finished goods
          </Link>
          <Link href="/admin/ingredients?filter=low" className="btn-secondary flex-1 text-center" onClick={dismiss}>
            Review raw materials
          </Link>
          <button type="button" className="btn-secondary flex-1" onClick={dismiss}>
            Remind me later
          </button>
        </div>
      </div>
    </div>
  )
}
