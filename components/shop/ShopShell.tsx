'use client'

import { CartProvider } from './CartProvider'
import { ShopLangProvider } from './ShopLang'
import ShopHeader from './ShopHeader'
import ShopFooter from './ShopFooter'
import ShopBottomNav from './ShopBottomNav'

export default function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <ShopLangProvider>
      <CartProvider>
        <div className="shop-shell flex min-h-screen flex-col bg-[#fdf6ee] text-[#2a170f] pb-20 md:pb-0">
          <ShopHeader />
          <main className="flex-1">{children}</main>
          <ShopFooter />
          <ShopBottomNav />
        </div>
      </CartProvider>
    </ShopLangProvider>
  )
}
