import ShopShell from '../../components/shop/ShopShell'
import ShopCatalogClient from '../../components/shop/ShopCatalogClient'

export const metadata = {
  title: 'Shop — Taem Baltina',
  description: 'Browse Ethiopian spice blends with live stock and prices.'
}

export default function ShopPage() {
  return (
    <ShopShell>
      <ShopCatalogClient />
    </ShopShell>
  )
}
