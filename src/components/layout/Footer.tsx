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
    <footer className="relative border-t border-ink-200/70 bg-ink-50">
      {/* Brass hairline along the top edge */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/60 to-transparent" />
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:py-16">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="" className="h-7 w-auto" />
            <span className="font-display text-base font-semibold text-ink-950">
              Avernic <span className="text-accent-600">UK</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
            Cosmetic peptide skincare, delivered across the United Kingdom. For adults 18+.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">{col.heading}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-ink-600 transition-colors hover:text-accent-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-200/70">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Avernic UK. All rights reserved.</p>
          <p className="max-w-2xl">
            Avernic UK is a UK-based online retailer. [Company name and registration number to be
            supplied]. Registered office: [registered address to be supplied]. All products sold on
            Avernic UK are cosmetic skincare products intended for topical use only and are not
            medicines. Our products are intended for adults aged 18 and over. Prices shown in
            pounds sterling (GBP), inclusive of VAT where applicable. Delivery to UK addresses
            only.
          </p>
        </div>
      </div>
    </footer>
  )
}
