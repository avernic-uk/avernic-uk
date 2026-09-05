import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from './track'

/**
 * Records one page view per route change.
 *
 * A single-page app never reloads, so the browser's own `document.referrer`
 * stays frozen at whatever sent the visitor to the site in the first place.
 * That is exactly what's wanted for the *first* view of a visit — it is how the
 * acquisition channel gets attributed — but for every subsequent view it would
 * re-attribute the same visit to Google over and over, badly inflating the
 * channel numbers. So the first view of a session reports the real referrer,
 * and later views report the previous in-site URL, which the collector
 * recognises as internal navigation and does not re-attribute.
 *
 * Mounted once, in Layout, so it covers every customer-facing route. The
 * collector separately refuses admin, account and checkout paths, so those are
 * excluded even if this hook is ever mounted somewhere unexpected.
 */
export function usePageViewTracking(): void {
  const { pathname } = useLocation()
  const previousPath = useRef<string | null>(null)

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoking effects in development,
    // which would otherwise double-count every view locally.
    if (previousPath.current === pathname) return

    const referrer =
      previousPath.current === null
        ? document.referrer
        : `${window.location.origin}${previousPath.current}`

    previousPath.current = pathname
    trackPageView(pathname, referrer)
  }, [pathname])
}
