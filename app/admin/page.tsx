import Link from 'next/link'
import AdminNav from '../../components/AdminNav'

const modules = [
  { href: '/admin/dashboard', label: 'Dashboard', desc: 'Today sales, credit, stock alerts', icon: '📊', color: 'from-blue-500 to-blue-700' },
  { href: '/admin/production', label: 'Production', desc: 'Convert raw materials to products', icon: '🏭', color: 'from-amber-500 to-amber-700' },
  { href: '/admin/products', label: 'Products', desc: 'Finished goods, recipes, margins', icon: '📦', color: 'from-spice-500 to-spice-700' },
  { href: '/admin/ingredients', label: 'Raw Materials', desc: 'Stock, cost, restock history', icon: '🌿', color: 'from-green-500 to-green-700' },
  { href: '/admin/sales', label: 'Sales & Credit', desc: 'Daily sales and partial payments', icon: '💰', color: 'from-purple-500 to-purple-700' },
  { href: '/admin/customers', label: 'Customers', desc: 'Credit customers and balances', icon: '🤝', color: 'from-cyan-500 to-cyan-700' },
  { href: '/admin/expenses', label: 'Expenses', desc: 'Track business costs', icon: '🧾', color: 'from-red-500 to-red-700' }
]

export default function AdminRootPage() {
  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="font-display text-3xl font-bold text-earth-900">Admin Portal</h1>
            <p className="text-earth-500 mt-2">Select a module to get started</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="card group hover:shadow-spice-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {m.icon}
                </div>
                <h2 className="font-semibold text-earth-900 text-lg">{m.label}</h2>
                <p className="text-sm text-earth-500 mt-1">{m.desc}</p>
                <span className="inline-block mt-4 text-sm font-medium text-spice-600 group-hover:text-spice-700">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
