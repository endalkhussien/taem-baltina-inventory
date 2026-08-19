import ShopShell from '../components/shop/ShopShell'
import HomeClient from '../components/shop/HomeClient'

export const metadata = {
  title: 'Taem Baltina — Artisanal Ethiopian Pantry',
  description: 'Shop authentic Ethiopian spice blends. Order online for delivery.'
}

export default function HomePage() {
  return (
    <ShopShell>
      <HomeClient />
    </ShopShell>
  )
}
