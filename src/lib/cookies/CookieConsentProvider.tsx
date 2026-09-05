import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setAnalyticsEnabled } from '@/lib/analytics/track'

const STORAGE_KEY = 'avernic_cookie_consent_v1'
/**
 * Bump this if what's on offer ever changes, to force everyone to re-decide.
 *
 * v2: analytics moved from "an off-by-default cookie you opt into" to
 * cookieless first-party measurement that runs by default with an opt-out. The
 * v1 banner promised analytics stayed off unless you said yes, so anyone still
 * holding a v1 record made their choice against a description that no longer
 * matches what the site does. Re-asking once is the honest way to correct that.
 */
const CONSENT_VERSION = 2

export interface CookieCategories {
  /** Always true — required for the basket, checkout and sign-in to work, so this cannot be switched off. */
  necessary: true
  /**
   * Whether cookieless first-party analytics may count this visit.
   *
   * On by default, which is the opposite of a normal consent category and is
   * deliberate: the measurement stores nothing on the device, so PECR's consent
   * requirement doesn't apply to it. Turning this off is an opt-out the beacon
   * genuinely honours — it is not a decorative toggle.
   */
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

// Applies before any choice is recorded. Analytics defaults on because it is
// cookieless (see the field comment above); everything that would need consent
// stays off and there is currently nothing in that group.
const DEFAULT_CATEGORIES: CookieCategories = { necessary: true, analytics: true }

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
 * The only things Avernic UK stores on a visitor's device are strictly
 * necessary: basket contents and the chosen delivery method in localStorage,
 * this consent record itself, and Supabase's auth session for signed-in
 * customers. PECR does not require consent for any of those.
 *
 * Analytics is deliberately built so it doesn't need consent either: it is
 * first-party and cookieless (functions/api/track.ts), storing nothing on the
 * device and deriving a daily-rotating, unreversible visitor hash server-side
 * instead. That means it measures everyone rather than only the minority who
 * accept a banner — but it also means the honest thing is to disclose it
 * plainly and offer a real opt-out rather than to stay quiet because no law
 * compels a prompt. Switching analytics off here stops the beacon at the
 * source; the site also honours browser-level Do Not Track and Global Privacy
 * Control signals without anyone having to touch this panel.
 *
 * Consent stays exactly as easy to withdraw as it was to give — Footer →
 * "Cookie preferences", or the Cookie policy page, reopen this same panel at
 * any time — and nothing that would require consent is ever pre-ticked.
 */
export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredConsent | null>(() => load())
  const [showPreferences, setShowPreferences] = useState(false)

  useEffect(() => {
    if (stored) save(stored.categories)
  }, [stored])

  // Keep the analytics beacon in step with the stored preference. Runs on mount
  // too, so a visitor who opted out on a previous visit is never measured on
  // this one — the effect fires before any route change can send a page view.
  const analyticsAllowed = stored?.categories.analytics ?? DEFAULT_CATEGORIES.analytics
  useEffect(() => {
    setAnalyticsEnabled(analyticsAllowed)
  }, [analyticsAllowed])

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
