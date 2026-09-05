import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/faqs', label: 'FAQs' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-60 shrink-0 border-r border-ink-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-ink-200 px-6">
          <Link to="/admin" className="font-display text-base font-semibold text-ink-950">
            Avernic <span className="text-accent-600">UK</span>
            <span className="ml-1.5 text-xs font-normal text-ink-400">Admin</span>
          </Link>
        </div>
        <nav aria-label="Admin" className="p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-ink-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-60 border-t border-ink-200 p-4">
          <p className="truncate text-xs text-ink-500">{user?.email}</p>
          <div className="mt-2 flex gap-3 text-xs">
            <Link to="/" className="text-ink-600 underline">
              View site
            </Link>
            <button onClick={() => signOut()} className="text-ink-600 underline">
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-ink-200 bg-white px-4 lg:hidden">
          <Link to="/admin" className="font-display text-base font-semibold text-ink-950">
            Avernic UK Admin
          </Link>
        </header>
        <nav aria-label="Admin mobile" className="flex gap-1 overflow-x-auto border-b border-ink-200 bg-white px-4 py-2 lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
