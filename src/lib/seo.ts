export const SITE_NAME = 'Avernic UK'
export const DEFAULT_TITLE = 'Avernic UK — Peptide skincare, made simpler.'
export const DEFAULT_DESCRIPTION =
  'Cosmetic peptide skincare from Avernic UK — serums, moisturisers, eye care and treatments, HPLC-tested for purity. UK delivery, Open Banking checkout. 18+.'
export const DEFAULT_OG_IMAGE_PATH = '/logo-lockup.png'

/**
 * Public origin of the site, without a trailing slash. Prefers VITE_SITE_URL
 * (the canonical domain) and falls back to wherever the app is running, so
 * canonical/og:url tags never point at a domain that isn't live yet.
 */
export function siteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  const base = configured || (typeof window !== 'undefined' ? window.location.origin : 'https://www.avernic.uk')
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

/** Splits the admin-editable, newline-separated socialLinks setting into a clean array of URLs (schema.org `sameAs`). */
export function parseSocialLinks(socialLinks: string): string[] {
  return socialLinks
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
}
