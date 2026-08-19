import ShopShell from '../components/shop/ShopShell'
import HomeClient from '../components/shop/HomeClient'

export const metadata = {
  title: 'ጣዕም ባልቲና · Ethiopian spice market',
  description: 'Order berbere, shiro and mitmita. Addis delivery. Telebirr or cash on delivery.'
}

export default function HomePage() {
  return (
    <ShopShell>
      <HomeClient />
    </ShopShell>
  )
}
