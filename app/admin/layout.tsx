import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const LowStockAlertModal = dynamic(() => import('../../components/LowStockAlertModal'), {
  ssr: false
})

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <LowStockAlertModal />
      </Suspense>
    </>
  )
}
