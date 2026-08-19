'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  productId: number
  name: string
  unitPrice: number
  quantityKg: number
  image: string
  stock: number
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantityKg'> & { quantityKg?: number }) => void
  setQuantity: (productId: number, quantityKg: number) => void
  removeItem: (productId: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'taem_pantry_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = (item) => {
      const qty = item.quantityKg ?? 1
      setItems((prev) => {
        const existing = prev.find((row) => row.productId === item.productId)
        if (existing) {
          const nextQty = Math.min(item.stock, Number((existing.quantityKg + qty).toFixed(3)))
          return prev.map((row) =>
            row.productId === item.productId ? { ...row, quantityKg: nextQty, stock: item.stock, unitPrice: item.unitPrice } : row
          )
        }
        return [
          ...prev,
          {
            productId: item.productId,
            name: item.name,
            unitPrice: item.unitPrice,
            quantityKg: Math.min(item.stock, qty),
            image: item.image,
            stock: item.stock
          }
        ]
      })
    }

    return {
      items,
      itemCount: items.reduce((sum, row) => sum + row.quantityKg, 0),
      subtotal: Number(items.reduce((sum, row) => sum + row.unitPrice * row.quantityKg, 0).toFixed(2)),
      addItem,
      setQuantity: (productId, quantityKg) => {
        setItems((prev) =>
          prev
            .map((row) => {
              if (row.productId !== productId) return row
              const next = Math.min(row.stock, Math.max(0, Number(quantityKg.toFixed(3))))
              return { ...row, quantityKg: next }
            })
            .filter((row) => row.quantityKg > 0)
        )
      },
      removeItem: (productId) => setItems((prev) => prev.filter((row) => row.productId !== productId)),
      clear: () => setItems([])
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
