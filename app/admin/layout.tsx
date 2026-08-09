import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const LowStockAlertBanner = dynamic(() => import('../../components/LowStockAlertBanner'), {
  ssr: false
})

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <LowStockAlertBanner />
      </Suspense>
    </>
  )
}
