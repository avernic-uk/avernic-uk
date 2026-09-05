import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Logo } from './Logo'
import { SearchBar } from './SearchBar'
import { useBasket } from '@/lib/basket/BasketProvider'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const primaryNav = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop/categories', label: 'Categories' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  // Active link carries a small brass underline; inactive ones reveal it on hover.
  return `relative py-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-accent-500 after:transition-transform after:duration-300 ${
    isActive
      ? 'text-ink-950 after:scale-x-100'
      : 'text-ink-600 after:scale-x-0 hover:text-ink-950 hover:after:scale-x-100'
  }`
}

function BasketIcon({ count }: { count: number }) {
  return (
    <Link
      to="/basket"
      aria-label={`Basket, ${count} ${count === 1 ? 'item' : 'items'}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 8V6a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-semibold text-literal-ink shadow-glow-sm"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { itemCount } = useBasket()
  const { user } = useAuth()

  return (
    <header className="glass sticky top-0 z-40 border-b border-ink-200/60">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {primaryNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === '/shop'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <SearchBar className="w-56 xl:w-72" />
          <ThemeToggle />
          <Link
            to={user ? '/account' : '/login'}
            aria-label={user ? 'Your account' : 'Log in'}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </Link>
          <BasketIcon count={itemCount} />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            aria-label="Search"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path
                d="M9 16a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm10 3-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <BasketIcon count={itemCount} />
          <button
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-ink-200/70 px-4 py-3 md:hidden">
          <SearchBar autoFocus />
        </div>
      )}

      {mobileOpen && (
        <nav aria-label="Mobile" className="border-t border-ink-200/70 lg:hidden">
          <ul className="container-page flex flex-col py-2">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-base font-medium text-ink-800"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-1 border-t border-ink-100 pt-2">
              <Link
                to={user ? '/account' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-base font-medium text-ink-800"
              >
                {user ? 'Your account' : 'Log in / Register'}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
