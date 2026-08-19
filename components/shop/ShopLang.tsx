'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ShopLang } from './shopCopy'

const ShopLangContext = createContext<{
  lang: ShopLang
  setLang: (lang: ShopLang) => void
} | null>(null)

export function ShopLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<ShopLang>('am')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('taem_shop_lang')
    if (saved === 'en' || saved === 'am') setLangState(saved)
    setReady(true)
  }, [])

  const setLang = (next: ShopLang) => {
    setLangState(next)
    window.localStorage.setItem('taem_shop_lang', next)
  }

  return <ShopLangContext.Provider value={{ lang: ready ? lang : 'am', setLang }}>{children}</ShopLangContext.Provider>
}

export function useShopLang() {
  const ctx = useContext(ShopLangContext)
  if (!ctx) throw new Error('useShopLang must be used within ShopLangProvider')
  return ctx
}
