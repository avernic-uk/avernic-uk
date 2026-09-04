import { Link } from 'react-router-dom'

const columns = [
  {
    heading: 'Shop',
    links: [
      { to: '/shop', label: 'All products' },
      { to: '/shop/categories', label: 'Categories' },
      { to: '/about', label: 'About Avernic UK' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { to: '/faq', label: 'FAQ' },
      { to: '/contact', label: 'Contact us' },
      { to: '/delivery', label: 'Delivery information' },
      { to: '/returns', label: 'Returns & refunds' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { to: '/terms', label: 'Terms & conditions' },
      { to: '/privacy', label: 'Privacy policy' },
      { to: '/cookies', label: 'Cookie policy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:py-16">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="" className="h-7 w-auto" />
            <span className="font-display text-base font-semibold text-ink-950">
              Avernic <span className="text-accent-600">UK</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
            Everyday healthcare and wellbeing essentials, delivered across the United Kingdom.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="text-sm font-semibold text-ink-900">{col.heading}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-ink-600 hover:text-ink-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-200">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Avernic UK. All rights reserved.</p>
          <p className="max-w-2xl">
            Avernic UK is a UK-based online retailer. [Company name and registration number to be
            supplied]. Registered office: [registered address to be supplied]. Avernic UK is not a
            registered pharmacy; where a product page states otherwise, that is the accurate,
            supplied status for that product only. Prices shown in pounds sterling (GBP), inclusive
            of VAT where applicable. Delivery to UK addresses only.
          </p>
        </div>
      </div>
    </footer>
  )
}
