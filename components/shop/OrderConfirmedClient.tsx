'use client'

import Link from 'next/link'
import { formatEtb } from '../../lib/formatCurrency'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

export default function OrderConfirmedClient({ code, total }: { code: string; total: number }) {
  const { lang } = useShopLang()

  return (
    <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">{t(lang, 'thanks')}</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-[#2a170f]">{t(lang, 'received')}</h1>
      <p className="mt-4 text-lg leading-7 text-[#5c3a28]">{t(lang, 'receivedBody')}</p>
      <div className="mt-8 rounded-2xl bg-[#fff1e0] p-6">
        <div className="text-sm text-[#5c3a28]">{t(lang, 'orderCode')}</div>
        <div className="font-display text-2xl font-bold text-[#2a170f]">{code}</div>
        {total > 0 && <div className="mt-2 text-[#9e3d00]">{formatEtb(total)}</div>}
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/shop" className="rounded-full bg-[#9e3d00] px-6 py-3 font-bold text-white">
          {t(lang, 'continue')}
        </Link>
        <Link href="/" className="rounded-full border border-[#ead3bc] px-6 py-3 font-semibold text-[#5c3a28]">
          {t(lang, 'home')}
        </Link>
      </div>
    </div>
  )
}
