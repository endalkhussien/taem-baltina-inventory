'use client'

import { useQuery } from '@tanstack/react-query'
import PartnerNav from './PartnerNav'

export default function PartnerShell({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ['partner-me'],
    queryFn: async () => {
      const res = await fetch('/api/partner/me')
      if (!res.ok) return null
      return res.json() as Promise<{ shop_name: string }>
    }
  })

  return (
    <div className="min-h-screen bg-[#fdf6ee] text-[#3a160c]">
      <PartnerNav shopName={data?.shop_name} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">{children}</main>
    </div>
  )
}
