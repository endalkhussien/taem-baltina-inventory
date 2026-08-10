import ShopShell from '../../components/shop/ShopShell'
import CheckoutClient from '../../components/shop/CheckoutClient'

export const metadata = {
  title: 'Checkout — Taem Baltina'
}

export default function CheckoutPage() {
  return (
    <ShopShell>
      <CheckoutClient />
    </ShopShell>
  )
}
