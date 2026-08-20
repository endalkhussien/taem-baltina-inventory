'use client'

import Link from 'next/link'
import { useShopLang } from './ShopLang'
import { t } from './shopCopy'

export default function ShopFooter() {
  const { lang } = useShopLang()

  return (
    <footer className="mt-12 w-full bg-[#3a160c] text-[#ffdbcd]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="font-display text-2xl font-semibold text-[#fff8f5]">{t(lang, 'brand')}</div>
          <p className="max-w-xs text-sm leading-6">{t(lang, 'footerAbout')}</p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">{t(lang, 'explore')}</h4>
          <Link href="/shop" className="w-fit hover:text-white">
            {t(lang, 'navShop')}
          </Link>
          <Link href="/#story" className="w-fit hover:text-white">
            {t(lang, 'navStory')}
          </Link>
          <Link href="/branch/register" className="w-fit hover:text-white">
            {t(lang, 'openShop')}
          </Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">{t(lang, 'support')}</h4>
          <p>{t(lang, 'announce')}</p>
          <p>Addis Ababa · ETB</p>
        </div>
      </div>
    </footer>
  )
}
