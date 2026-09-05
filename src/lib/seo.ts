export const SITE_NAME = 'Avernic UK'
export const DEFAULT_TITLE = 'Avernic UK — Healthcare, made simpler.'
export const DEFAULT_DESCRIPTION =
  'Avernic UK: a modern, straightforward way to shop everyday healthcare and wellbeing essentials online, with UK delivery and secure Open Banking payment.'
export const DEFAULT_OG_IMAGE_PATH = '/logo-lockup.png'

/**
 * Public origin of the site, without a trailing slash. Prefers VITE_SITE_URL
 * (the canonical domain) and falls back to wherever the app is running, so
 * canonical/og:url tags never point at a domain that isn't live yet.
 */
export function siteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  const base = configured || (typeof window !== 'undefined' ? window.location.origin : 'https://www.avernic.co.uk')
  return base.replace(/\/+$/, '')
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${siteUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

/** Strips query/hash and trailing slashes so every URL has exactly one canonical form. */
export function canonicalPath(pathname: string): string {
  const clean = pathname.replace(/[?#].*$/, '').replace(/\/+$/, '')
  return clean || '/'
}
