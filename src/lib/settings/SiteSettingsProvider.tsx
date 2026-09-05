import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSiteSettings, getFaqs } from '@/lib/api/settings'
import type { SiteSettings, Faq } from '@/types'

/**
 * Defaults mirror exactly what was hardcoded across the site before this
 * became admin-editable (HomePage hero copy, AgeNotice text, delivery
 * pricing). Used until the real settings row has loaded, and as a fallback
 * if it can't be reached, so a Supabase hiccup never blanks out content.
 */
const DEFAULT_SETTINGS: SiteSettings = {
  companyName: '',
  companyNumber: '',
  registeredAddress: '',
  contactEmail: '',
  contactPhone: '',
  deliveryStandardMinor: 525,
  deliveryExpressMinor: 870,
  deliveryFreeThresholdMinor: 4000,
  heroHeading: 'Peptide skincare, made simpler.',
  heroSubheading:
    'Cosmetic peptide serums, moisturisers and treatments, chosen with care and delivered across the United Kingdom — with a straightforward checkout and secure Open Banking payment.',
  ageNoticeText: 'Our products are cosmetic skincare intended for adults aged 18 and over.',
  logoUrl: '',
  heroImageUrl: '',
  heroImageAlt: '',
  socialLinks: '',
}

const DEFAULT_FAQS: Faq[] = [
  {
    id: 'default-1',
    question: 'Are these medical products?',
    answer:
      'No — everything we sell is a cosmetic skincare product applied topically. Nothing on Avernic UK is a medicine and nothing is intended for injection or internal use.',
    category: '',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'default-2',
    question: 'Where do you deliver?',
    answer: 'Avernic UK delivers to addresses within the United Kingdom only. We do not currently offer international shipping.',
    category: '',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'default-3',
    question: 'How do I pay?',
    answer:
      'Checkout is completed securely via Open Banking, powered by Fena. You authorise payment directly from your own bank — we never see or store your banking details.',
    category: '',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'default-4',
    question: 'How long does delivery take?',
    answer: 'See our Delivery information page for current delivery options and estimated timescales.',
    category: '',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'default-5',
    question: 'Can I return an item?',
    answer: 'Yes — see our Returns & refunds page for eligibility and how to start a return.',
    category: '',
    sortOrder: 4,
    isActive: true,
  },
]

interface SiteSettingsContextValue {
  settings: SiteSettings
  faqs: Faq[]
  loaded: boolean
  refresh: () => void
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  faqs: DEFAULT_FAQS,
  loaded: false,
  refresh: () => {},
})

/**
 * Loads admin-editable site settings + FAQs once and makes them available
 * everywhere via useSiteSettings(). Starts from the same defaults the site
 * used to ship hardcoded, so there's no blank flash while this loads.
 */
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [faqs, setFaqs] = useState<Faq[]>(DEFAULT_FAQS)
  const [loaded, setLoaded] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([getSiteSettings(), getFaqs()])
      .then(([loadedSettings, loadedFaqs]) => {
        if (cancelled) return
        if (loadedSettings) setSettings(loadedSettings)
        if (loadedFaqs.length > 0) setFaqs(loadedFaqs)
        setLoaded(true)
      })
      .catch(() => {
        // Keep defaults — every consumer already renders sensible copy.
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return (
    <SiteSettingsContext.Provider value={{ settings, faqs, loaded, refresh: () => setReloadKey((k) => k + 1) }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings(): SiteSettingsContextValue {
  return useContext(SiteSettingsContext)
}
