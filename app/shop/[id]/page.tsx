import ShopShell from '../../../components/shop/ShopShell'
import ProductDetailClient from '../../../components/shop/ProductDetailClient'

export const metadata = {
  title: 'Product — Taem Baltina'
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <ShopShell>
      <ProductDetailClient productId={params.id} />
    </ShopShell>
  )
}
