import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { absoluteUrl, canonicalPath, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from './seo'

export interface DocumentMeta {
  /** Page title; " | Avernic UK" is appended automatically. */
  title: string
  description?: string
  /**
   * Canonical path for this page (e.g. "/product/foo"). Defaults to the
   * current pathname with query string and trailing slash removed — pass it
   * explicitly when several URLs show the same content (search/filter pages).
   */
  path?: string
  /** Absolute URL or site-relative path of the share image. Defaults to the brand lockup. */
  image?: string
  /** Open Graph type. Products use "product"; everything else "website". */
  type?: 'website' | 'product' | 'article'
  /** Keeps private/transactional pages (basket, checkout, account…) out of search results. */
  noindex?: boolean
}

/**
 * Per-page SEO head management without a Helmet-style dependency.
 *
 * Tags are located by their `data-seo` attribute (declared once in
 * index.html), so this hook and the edge middleware in
 * functions/_middleware.ts — which fills the same tags server-side for
 * crawlers and link previews that don't run JavaScript — always agree on
 * which element owns which value. Previous values are restored on unmount
 * so navigating away never leaves a stale product title behind.
 */
export function useDocumentMeta({ title, description, path, image, type = 'website', noindex = false }: DocumentMeta) {
  const location = useLocation()
  const pathname = location.pathname

  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`
    const url = absoluteUrl(path ? canonicalPath(path) : canonicalPath(pathname))
    const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE_PATH)

    const previous: Array<() => void> = []

    function set(selector: string, attr: 'content' | 'href', value: string | undefined) {
      if (value === undefined) return
      const el = document.head.querySelector<HTMLElement>(`[data-seo="${selector}"]`)
      if (!el) return
      const before = el.getAttribute(attr)
      el.setAttribute(attr, value)
      previous.push(() => {
        if (before === null) el.removeAttribute(attr)
        else el.setAttribute(attr, before)
      })
    }

    const previousTitle = document.title
    document.title = fullTitle
    previous.push(() => {
      document.title = previousTitle
    })

    set('description', 'content', description)
    set('robots', 'content', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    set('canonical', 'href', url)
    set('og:type', 'content', type)
    set('og:title', 'content', fullTitle)
    set('og:description', 'content', description)
    set('og:url', 'content', url)
    set('og:image', 'content', imageUrl)
    set('twitter:title', 'content', fullTitle)
    set('twitter:description', 'content', description)
    set('twitter:image', 'content', imageUrl)

    return () => {
      // Restore in reverse so nested/overlapping hooks unwind cleanly.
      for (let i = previous.length - 1; i >= 0; i--) previous[i]()
    }
  }, [title, description, path, image, type, noindex, pathname])
}
