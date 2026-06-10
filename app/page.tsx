import Link from 'next/link'

const features = [
  {
    icon: '📦',
    title: 'Product Inventory',
    desc: 'Track finished spice goods, stock levels, and low-stock alerts.'
  },
  {
    icon: '🌿',
    title: 'Raw Ingredients',
    desc: 'Manage berbere, shiro, mitmita and all raw material quantities.'
  },
  {
    icon: '💰',
    title: 'B2B Sales & Credit',
    desc: 'Record sales, track partial payments, and manage outstanding credit.'
  },
  {
    icon: '📊',
    title: 'Financial Dashboard',
    desc: 'Revenue, expenses, profit margins, and visual charts at a glance.'
  }
]

export default function Page() {
  return (
    <div className="min-h-screen bg-spice-50">
      {/* Hero */}
      <header className="bg-spice-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-spice-radial" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-spice-400/10 blur-3xl" />

        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">🌶</div>
            <span className="font-display text-lg font-semibold">Taem Baltina</span>
          </div>
          <Link href="/admin/login" className="btn-secondary !text-earth-800 !bg-white/90 hover:!bg-white text-sm">
            Admin Login
          </Link>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-white/15 border border-white/20 px-4 py-1 text-sm text-spice-100 mb-6">
              Ethiopian Spice Production Management
            </span>
            <h1 className="font-display text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Spice-Tracker for<br />
              <span className="text-spice-200">Taem Baltina</span>
            </h1>
            <p className="text-spice-100/80 text-lg leading-relaxed mb-10 max-w-xl">
              A purpose-built admin dashboard for Ethiopian spice producers — manage inventory, B2B sales, credit tracking, and expenses in one beautiful place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/login" className="btn-primary !bg-white !text-spice-800 hover:!bg-spice-50 !shadow-none px-8 py-3 text-base">
                Get Started →
              </Link>
              <Link href="/admin" className="inline-flex items-center rounded-lg border border-white/30 px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl font-bold text-earth-900 mb-3">Everything you need</h2>
          <p className="text-earth-500 max-w-lg mx-auto">
            Built specifically for Habesha spice businesses — from raw ingredients to finished product sales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:shadow-spice-lg transition-shadow duration-300 group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                {f.icon}
              </div>
              <h3 className="font-semibold text-earth-900 mb-2">{f.title}</h3>
              <p className="text-sm text-earth-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-spice-gradient p-10 lg:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-spice-radial" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to manage your spice business?</h2>
            <p className="text-spice-100/80 mb-8 max-w-md mx-auto">
              Sign in to the admin portal and start tracking your production today.
            </p>
            <Link href="/admin/login" className="btn-primary !bg-white !text-spice-800 hover:!bg-spice-50 !shadow-none px-8 py-3">
              Sign in to Admin →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-earth-100 py-8 text-center text-sm text-earth-400">
        © {new Date().getFullYear()} Taem Baltina — Spice Tracker
      </footer>
    </div>
  )
}
