import ShopShell from '../../components/shop/ShopShell'
import ShopCatalogClient from '../../components/shop/ShopCatalogClient'

export const metadata = {
  title: 'ገበያ · Taem Baltina',
  description: 'Buy Ethiopian spices — berbere, shiro, mitmita. Order in ETB with Telebirr or cash on delivery.'
}

export default function ShopPage() {
  return (
    <ShopShell>
      <ShopCatalogClient />
    </ShopShell>
  )
}
