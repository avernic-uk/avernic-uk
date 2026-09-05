import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { AgeNotice } from './AgeNotice'
import { useJsonLd } from '@/lib/useJsonLd'
import { useMemo } from 'react'
import { absoluteUrl, siteUrl, SITE_NAME } from '@/lib/seo'

export function Layout({ children }: { children: ReactNode }) {
  // Site-wide entities: the store itself and the site's search box. Memoised
  // so the JSON-LD <script> isn't torn down and re-added on every render.
  const siteGraph = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': ['Organization', 'OnlineStore'],
          '@id': `${siteUrl()}/#organization`,
          name: SITE_NAME,
          url: siteUrl(),
          logo: absoluteUrl('/logo-lockup.png'),
          areaServed: 'GB',
          currenciesAccepted: 'GBP',
          paymentAccepted: 'Open Banking',
          priceRange: '££',
        },
        {
          '@type': 'WebSite',
          '@id': `${siteUrl()}/#website`,
          name: SITE_NAME,
          url: siteUrl(),
          inLanguage: 'en-GB',
          publisher: { '@id': `${siteUrl()}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl()}/shop?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    }),
    [],
  )
  useJsonLd(siteGraph)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AgeNotice />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
