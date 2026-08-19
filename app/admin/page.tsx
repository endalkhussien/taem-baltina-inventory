import Link from 'next/link'
import AdminNav from '../../components/AdminNav'

const modules = [
  { href: '/admin/dashboard', label: 'Overview', desc: 'Sales, cash, credit, production, and stock alerts.' },
  { href: '/admin/orders', label: 'Web orders', desc: 'Public marketplace orders waiting to pack and fulfill.' },
  { href: '/admin/products', label: 'Inventory', desc: 'Finished products, selling prices, recipes, and stock levels.' },
  { href: '/admin/ingredients', label: 'Raw materials', desc: 'Raw stock by category, restocks, costs, and reorder points.' },
  { href: '/admin/production', label: 'Production', desc: 'Use raw materials to produce finished products.' },
  { href: '/admin/sales', label: 'Sales', desc: 'Record daily sales and trace every partial customer payment.' },
  { href: '/admin/customers', label: 'Customers', desc: 'Monitor credit customers, balances, and cash repayments.' },
  { href: '/admin/finance', label: 'Finance', desc: 'Cash on hand, debts owed, customer credit, and net position.' },
  { href: '/admin/expenses', label: 'Expenses', desc: 'Track packaging, transport, rent, salaries, and utilities.' }
]

export default function AdminRootPage() {
  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero">
            <div className="max-w-3xl">
              <div className="eyebrow">Internal inventory system</div>
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-earth-950 sm:text-5xl">Operations console</h1>
              <p className="mt-3 text-sm leading-6 text-earth-500 sm:text-base">
                Choose where to manage raw materials, stock, production, sales, credit, and expenses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="card group transition-transform duration-200 hover:-translate-y-0.5"
              >
                <h2 className="font-display text-xl font-bold text-earth-950">{m.label}</h2>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-earth-500">{m.desc}</p>
                <span className="mt-5 inline-flex text-xs font-bold uppercase tracking-wider text-primary">
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
