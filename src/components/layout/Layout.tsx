import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { AgeNotice } from './AgeNotice'
import { CookieConsentBanner } from '@/components/cookies/CookieConsentBanner'
import { usePageViewTracking } from '@/lib/analytics/usePageViewTracking'
import { useJsonLd } from '@/lib/useJsonLd'
import { useMemo } from 'react'
import { absoluteUrl, siteUrl, parseSocialLinks, SITE_NAME } from '@/lib/seo'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'

export function Layout({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings()
  usePageViewTracking()

  // Site-wide entities: the store itself and the site's search box, enriched
  // with the admin-editable business details (Admin → Settings) so this
  // matches exactly what the edge middleware (functions/_lib/seoMeta.ts)
  // serves to crawlers that don't run JavaScript. Memoised so the JSON-LD
  // <script> isn't torn down and re-added on every render.
  const siteGraph = useMemo(() => {
    const orgId = `${siteUrl()}/#organization`
    const contactPoint =
      settings.contactEmail || settings.contactPhone
        ? {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
            ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
            areaServed: 'GB',
          }
        : undefined
    const sameAs = parseSocialLinks(settings.socialLinks)

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': ['Organization', 'OnlineStore'],
          '@id': orgId,
          name: SITE_NAME,
          url: siteUrl(),
          logo: absoluteUrl(settings.logoUrl || '/logo-lockup.png'),
          areaServed: 'GB',
          currenciesAccepted: 'GBP',
          paymentAccepted: 'Open Banking',
          priceRange: '££',
          ...(settings.companyName ? { legalName: settings.companyName } : {}),
          ...(settings.registeredAddress ? { address: settings.registeredAddress } : {}),
          ...(contactPoint ? { contactPoint } : {}),
          ...(sameAs.length > 0 ? { sameAs } : {}),
        },
        {
          '@type': 'WebSite',
          '@id': `${siteUrl()}/#website`,
          name: SITE_NAME,
          url: siteUrl(),
          inLanguage: 'en-GB',
          publisher: { '@id': orgId },
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl()}/shop?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    }
  }, [settings])
  useJsonLd(siteGraph)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AgeNotice />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  )
}
