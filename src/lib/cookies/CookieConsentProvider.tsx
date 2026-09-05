import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'avernic_cookie_consent_v1'
/** Bump this if the categories on offer ever change, to force everyone to re-decide. */
const CONSENT_VERSION = 1

export interface CookieCategories {
  /** Always true — required for the basket, checkout and sign-in to work, so this cannot be switched off. */
  necessary: true
  /** Off until explicitly switched on — Avernic UK does not currently run analytics, but the toggle is ready for when it does. */
  analytics: boolean
}

interface StoredConsent {
  version: number
  categories: CookieCategories
  decidedAt: string
}

interface CookieConsentContextValue {
  /** True once the visitor has made an explicit choice (accept all / reject non-essential / save preferences). */
  hasDecided: boolean
  categories: CookieCategories
  /** Whether the bottom banner should currently be shown (no decision recorded yet). */
  showBanner: boolean
  /** Whether the "manage preferences" panel is currently open. */
  showPreferences: boolean
  acceptAll: () => void
  rejectNonEssential: () => void
  savePreferences: (categories: Omit<CookieCategories, 'necessary'>) => void
  openPreferences: () => void
  closePreferences: () => void
}

const DEFAULT_CATEGORIES: CookieCategories = { necessary: true, analytics: false }

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined)

function load(): StoredConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredConsent
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function save(categories: CookieCategories) {
  try {
    const record: StoredConsent = { version: CONSENT_VERSION, categories, decidedAt: new Date().toISOString() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // If storage is unavailable, the banner will simply reappear next visit — never blocks the site.
  }
}

/**
 * UK GDPR / PECR cookie consent.
 *
 * Avernic UK doesn't set any cookie beyond strictly-necessary ones today
 * (basket contents and shipping choice in localStorage; Supabase's auth
 * session cookie for signed-in customers) — none of which PECR requires
 * consent for. This provider exists so that's still true in the way PECR
 * actually cares about going forward: nothing non-essential (e.g. analytics)
 * is ever loaded until a visitor has explicitly opted in, consent is exactly
 * as easy to withdraw as it was to give (Footer → "Cookie preferences", or
 * the Cookie policy page, reopen this same panel at any time), and no
 * consent choice is ever pre-ticked on the visitor's behalf.
 */
export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredConsent | null>(() => load())
  const [showPreferences, setShowPreferences] = useState(false)

  useEffect(() => {
    if (stored) save(stored.categories)
  }, [stored])

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      hasDecided: stored !== null,
      categories: stored?.categories ?? DEFAULT_CATEGORIES,
      showBanner: stored === null,
      showPreferences,
      acceptAll() {
        setStored({ version: CONSENT_VERSION, categories: { necessary: true, analytics: true }, decidedAt: new Date().toISOString() })
        setShowPreferences(false)
      },
      rejectNonEssential() {
        setStored({ version: CONSENT_VERSION, categories: { necessary: true, analytics: false }, decidedAt: new Date().toISOString() })
        setShowPreferences(false)
      },
      savePreferences(categories) {
        setStored({ version: CONSENT_VERSION, categories: { necessary: true, ...categories }, decidedAt: new Date().toISOString() })
        setShowPreferences(false)
      },
      openPreferences() {
        setShowPreferences(true)
      },
      closePreferences() {
        setShowPreferences(false)
      },
    }),
    [stored, showPreferences],
  )

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider')
  return ctx
}
