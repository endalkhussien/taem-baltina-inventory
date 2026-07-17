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

export default function LowStockAlertBanner() {
  const pathname = usePathname()
  const { data: products } = useProducts()
  const { data: ingredients } = useIngredients()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
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
        unit: 'kg',
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
    <div className="low-stock-banner" role="status" aria-live="polite">
      <div className="low-stock-banner-card">
        <div className="flex items-start gap-3">
          <div className="low-stock-banner-icon">!</div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-earth-950">
              {lowStockRows.length} item{lowStockRows.length === 1 ? '' : 's'} below alert stock
            </div>
            <p className="mt-1 text-sm text-earth-600">
              You can keep working. Review low stock when ready.
            </p>
            {expanded && (
              <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
                {finishedRows.map((row) => (
                  <li key={`f-${row.id}`} className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
                    {row.name}: {row.stock} {row.unit} left
                  </li>
                ))}
                {rawRows.map((row) => (
                  <li key={`r-${row.id}`} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                    {row.name}: {row.stock.toFixed(3)} {row.unit} left
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="text-xs font-bold text-earth-700 underline" onClick={() => setExpanded((value) => !value)}>
                {expanded ? 'Hide list' : 'Show list'}
              </button>
              <Link href="/admin/products?filter=low" className="text-xs font-bold text-spice-700" onClick={dismiss}>
                Products
              </Link>
              <Link href="/admin/ingredients?filter=low" className="text-xs font-bold text-spice-700" onClick={dismiss}>
                Raw materials
              </Link>
            </div>
          </div>
          <button type="button" className="toast-close" onClick={dismiss} aria-label="Dismiss low stock alert">
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
