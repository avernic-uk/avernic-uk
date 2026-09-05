// ============================================================================
// Client side of the first-party analytics beacon.
//
// Three rules govern everything here:
//   1. It stores nothing on the visitor's device. No cookie, no localStorage,
//      no identifier of any kind — the server derives a rotating, unreversible
//      visitor hash instead (functions/api/track.ts).
//   2. It never blocks or slows a page. Every send is fire-and-forget via
//      sendBeacon, and any failure is swallowed.
//   3. It respects an explicit "no" — the site's own opt-out, and the
//      browser's Do Not Track / Global Privacy Control signals.
// ============================================================================

const ENDPOINT = '/api/track'

/**
 * Set by CookieConsentProvider whenever the stored preference changes.
 *
 * Held in a module-level variable rather than read from storage on every send,
 * so a page view costs no synchronous storage access. It starts as `true`
 * because measurement is cookieless and needs no consent; a visitor who has
 * explicitly opted out flips it to `false` as soon as the provider mounts,
 * which happens before any route change can fire a page view.
 */
let enabled = true

export function setAnalyticsEnabled(next: boolean): void {
  enabled = next
}

/** True when the browser is signalling that the visitor does not want to be measured. */
function browserOptOut(): boolean {
  if (typeof navigator === 'undefined') return true
  const nav = navigator as Navigator & { doNotTrack?: string; globalPrivacyControl?: boolean; msDoNotTrack?: string }
  const dnt = nav.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack ?? nav.msDoNotTrack
  return dnt === '1' || dnt === 'yes' || nav.globalPrivacyControl === true
}

interface TrackPayload {
  type: 'page_view' | 'search'
  path: string
  referrer: string
  searchTerm?: string
  searchResultCount?: number
}

function send(payload: TrackPayload): void {
  if (!enabled || browserOptOut()) return
  try {
    const body = JSON.stringify(payload)
    // sendBeacon survives the page being navigated away from, which a fetch
    // may not — it's the difference between recording the last page of a
    // visit and losing it.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch(ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(
      () => undefined,
    )
  } catch {
    // Analytics is never allowed to surface an error to a customer.
  }
}

export function trackPageView(path: string, referrer: string): void {
  send({ type: 'page_view', path, referrer })
}

/**
 * Records what someone typed into the site search, and how many products came
 * back. The zero-result searches are the valuable half: they are a direct list
 * of what customers expected to find and didn't.
 */
export function trackSearch(term: string, resultCount: number, path: string): void {
  const trimmed = term.trim()
  if (!trimmed) return
  send({ type: 'search', path, referrer: '', searchTerm: trimmed, searchResultCount: resultCount })
}
