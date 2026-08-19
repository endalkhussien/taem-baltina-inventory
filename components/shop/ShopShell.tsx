'use client'

import { CartProvider } from './CartProvider'
import ShopHeader from './ShopHeader'
import ShopFooter from './ShopFooter'

export default function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="shop-shell flex min-h-screen flex-col bg-[#fff8f5] text-[#2c1600]">
        <ShopHeader />
        <main className="flex-1">{children}</main>
        <ShopFooter />
      </div>
    </CartProvider>
  )
}
