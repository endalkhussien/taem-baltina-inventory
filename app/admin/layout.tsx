import LowStockAlertModal from '../../components/LowStockAlertModal'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <LowStockAlertModal />
    </>
  )
}
