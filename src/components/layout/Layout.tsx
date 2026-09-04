import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { useJsonLd } from '@/lib/useJsonLd'

export function Layout({ children }: { children: ReactNode }) {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Avernic UK',
    url: import.meta.env.VITE_SITE_URL || 'https://www.avernic.co.uk',
    areaServed: 'GB',
    priceRange: '££',
  })

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
