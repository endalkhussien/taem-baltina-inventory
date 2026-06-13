import Link from 'next/link'
import AdminNav from '../../components/AdminNav'

const modules = [
  { href: '/admin/dashboard', label: 'Dashboard', desc: 'Sales, cash, credit, production, and stock alerts.', code: '01', color: 'from-blue-500 to-blue-700' },
  { href: '/admin/products', label: 'Stock', desc: 'Finished products, selling prices, recipes, and stock levels.', code: '02', color: 'from-spice-500 to-spice-700' },
  { href: '/admin/ingredients', label: 'Raw Materials', desc: 'Raw stock by category, restocks, costs, and reorder points.', code: '03', color: 'from-green-500 to-green-700' },
  { href: '/admin/production', label: 'Production', desc: 'Use raw materials to produce finished products repeatedly.', code: '04', color: 'from-amber-500 to-amber-700' },
  { href: '/admin/sales', label: 'Sales', desc: 'Record daily sales and trace every partial customer payment.', code: '05', color: 'from-purple-500 to-purple-700' },
  { href: '/admin/customers', label: 'Credit', desc: 'Monitor credit customers, balances, and cash repayments.', code: '06', color: 'from-cyan-500 to-cyan-700' },
  { href: '/admin/finance', label: 'Finance', desc: 'Cash on hand, debts owed, customer credit, and net position.', code: '07', color: 'from-emerald-500 to-emerald-700' },
  { href: '/admin/expenses', label: 'Expenses', desc: 'Track packaging, transport, rent, salaries, and utilities.', code: '08', color: 'from-red-500 to-red-700' }
]

export default function AdminRootPage() {
  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero">
            <div className="relative z-10 max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-spice-200">Internal inventory system</div>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">Inventory System</h1>
              <p className="mt-3 text-sm leading-6 text-earth-100 sm:text-base">
                Choose where to manage raw materials, stock, production, sales, credit, and expenses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-spice-lg"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${m.color}`} />
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${m.color} text-sm font-black text-white shadow-spice transition-transform duration-300 group-hover:scale-110`}>
                  {m.code}
                </div>
                <h2 className="text-xl font-black text-earth-950">{m.label}</h2>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-earth-500">{m.desc}</p>
                <span className="mt-5 inline-flex items-center rounded-full bg-spice-50 px-3 py-1 text-sm font-bold text-spice-700 group-hover:bg-spice-100">
                  Open workspace
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
