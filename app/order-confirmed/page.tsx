import Link from 'next/link'
import ShopShell from '../../components/shop/ShopShell'
import { formatEtb } from '../../lib/formatCurrency'

export const metadata = {
  title: 'Order confirmed — Taem Baltina'
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
      <div className="mx-auto max-w-[640px] px-5 py-20 text-center md:px-16">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">Thank you</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-[#2c1600]">Order received</h1>
        <p className="mt-4 text-lg text-[#594238]">
          We logged your request in the kitchen queue. Our team will confirm and fulfill when stock is packed.
        </p>
        <div className="mt-8 rounded-xl bg-[#fff1e7] p-6">
          <div className="text-sm text-[#594238]">Order code</div>
          <div className="font-display text-2xl font-bold text-[#2c1600]">{code}</div>
          {total > 0 && <div className="mt-2 text-[#9e3d00]">{formatEtb(total)}</div>}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="rounded bg-[#9e3d00] px-6 py-3 font-bold text-white">
            Continue shopping
          </Link>
          <Link href="/" className="rounded border border-[#8c7166]/40 px-6 py-3 font-semibold text-[#594238]">
            Home
          </Link>
        </div>
      </div>
    </ShopShell>
  )
}
