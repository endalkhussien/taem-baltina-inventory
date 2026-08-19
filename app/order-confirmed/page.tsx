import ShopShell from '../../components/shop/ShopShell'
import OrderConfirmedClient from '../../components/shop/OrderConfirmedClient'

export const metadata = {
  title: 'ትዕዛዝ ተረጋገጠ · Taem Baltina'
}

export default function OrderConfirmedPage({
  searchParams
}: {
  searchParams: { code?: string; total?: string }
}) {
  const code = searchParams.code ?? '—'
  const total = Number(searchParams.total || 0)

  return (
    <ShopShell>
      <OrderConfirmedClient code={code} total={total} />
    </ShopShell>
  )
}
