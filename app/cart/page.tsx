import ShopShell from '../../components/shop/ShopShell'
import CartClient from '../../components/shop/CartClient'

export const metadata = {
  title: 'Cart — Taem Baltina'
}

export default function CartPage() {
  return (
    <ShopShell>
      <CartClient />
    </ShopShell>
  )
}
