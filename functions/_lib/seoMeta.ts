import { getSupabaseAdmin } from './supabaseAdmin'
import type { Env } from './types'

// ============================================================================
// Server-side page metadata for crawlers and link previews.
//
// The storefront is a client-rendered React app, so the raw HTML Cloudflare
// serves is the same empty shell for every URL. Googlebot renders JavaScript
// (eventually), but social link previews (WhatsApp, iMessage, X, Slack…) and
// many other crawlers do not — they would see the homepage title on every
// product link. functions/_middleware.ts uses this module to fill in the
// real <title>, description, canonical, Open Graph tags and JSON-LD *before*
// the HTML leaves the edge. The browser-side hook (src/lib/useDocumentMeta.ts)
// then sets exactly the same values on navigation, so both paths agree.
//
// Keep STATIC_PAGES in step with the titles/descriptions in src/pages.
// ============================================================================

export const SITE_NAME = 'Avernic UK'
const DEFAULT_TITLE = 'Avernic UK — Peptide skincare, made simpler.'
const DEFAULT_DESCRIPTION =
  'Avernic UK: cosmetic peptide skincare — serums, moisturisers and treatments — delivered across the UK with secure Open Banking payment. Skincare only; not medicines. 18+.'
const DEFAULT_IMAGE_PATH = '/logo-lockup.png'

export interface PageMeta {
  /** Full <title> text (site name already appended where appropriate). */
  title: string
  description: string
  /** Canonical path, e.g. "/product/foo". */
  path: string
  /** Absolute share image URL. */
  image: string
  type: 'website' | 'product'
  noindex: boolean
  /** HTTP status to serve the shell with — 404 for products/categories that don't exist. */
  status: 200 | 404
  jsonLd?: Record<string, unknown>
}

interface StaticPage {
  title: string
  description: string
  noindex?: boolean
}

const STATIC_PAGES: Record<string, StaticPage> = {
  '/': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  '/shop': {
    title: 'Shop',
    description: 'Browse the full Avernic UK range of cosmetic peptide skincare.',
  },
  '/shop/categories': { title: 'Categories', description: 'Browse the Avernic UK range by category.' },
  '/about': {
    title: 'About Avernic UK',
    description: 'Learn about Avernic UK, a UK-based online retailer of cosmetic peptide skincare.',
  },
  '/faq': {
    title: 'Frequently asked questions',
    description: 'Answers to common questions about ordering, payment, delivery and returns at Avernic UK.',
  },
  '/contact': { title: 'Contact us', description: 'Get in touch with Avernic UK.' },
  '/delivery': {
    title: 'Delivery information',
    description: 'UK delivery options, pricing and timescales for Avernic UK orders.',
  },
  '/returns': {
    title: 'Returns & refunds',
    description: 'How to return an item and how refunds are processed at Avernic UK.',
  },
  '/terms': {
    title: 'Terms & conditions',
    description: 'The terms and conditions governing use of the Avernic UK website and orders.',
  },
  '/privacy': { title: 'Privacy policy', description: 'How Avernic UK collects, uses and protects your personal data.' },
  '/cookies': { title: 'Cookie policy', description: 'How Avernic UK uses cookies and similar technologies.' },
  '/basket': { title: 'Your basket', description: DEFAULT_DESCRIPTION, noindex: true },
  '/checkout': { title: 'Checkout', description: DEFAULT_DESCRIPTION, noindex: true },
  '/login': { title: 'Log in', description: DEFAULT_DESCRIPTION, noindex: true },
  '/register': { title: 'Create an account', description: DEFAULT_DESCRIPTION, noindex: true },
  '/forgot-password': { title: 'Reset your password', description: DEFAULT_DESCRIPTION, noindex: true },
}

/** Private/app areas: always noindex, never 404 (their sub-routes are dynamic). */
const PRIVATE_PREFIXES = ['/account', '/admin', '/order-confirmation']

function siteUrl(env: Env, requestOrigin: string): string {
  return (env.SITE_URL || requestOrigin).replace(/\/+$/, '')
}

function withSiteName(title: string): string {
  return title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`
}

function normalisePath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '')
  return clean || '/'
}

function base(env: Env, origin: string, path: string, page: StaticPage, status: 200 | 404 = 200): PageMeta {
  return {
    title: withSiteName(page.title),
    description: page.description,
    path,
    image: `${siteUrl(env, origin)}${DEFAULT_IMAGE_PATH}`,
    type: 'website',
    noindex: Boolean(page.noindex),
    status,
    jsonLd: undefined,
  }
}

interface ProductRow {
  slug: string
  sku: string
  name: string
  short_description: string
  price_minor: number
  stock_quantity: number
  image_url: string
  additional_images: Array<{ url?: string }> | null
  product_categories: { slug: string; name: string } | { slug: string; name: string }[] | null
}

/**
 * Small edge cache in front of Supabase so a burst of crawler hits on the
 * same product doesn't turn into a burst of database queries. Uses the
 * Cache API with a synthetic key; 120s is short enough that price/stock
 * changes show up promptly.
 */
async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const cache = (caches as unknown as { default: Cache }).default
  const cacheKey = new Request(`https://seo-meta.internal${key}`)
  try {
    const hit = await cache.match(cacheKey)
    if (hit) return (await hit.json()) as T
  } catch {
    // cache unavailable (local dev) — fall through to a live load
  }
  const value = await load()
  try {
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${ttlSeconds}` },
      }),
    )
  } catch {
    // ignore
  }
  return value
}

async function loadProduct(env: Env, slug: string): Promise<ProductRow | null> {
  const supabase = getSupabaseAdmin(env)
  const { data } = await supabase
    .from('products')
    .select(
      'slug, sku, name, short_description, price_minor, stock_quantity, image_url, additional_images, product_categories ( slug, name )',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return (data as ProductRow | null) ?? null
}

async function loadCategory(env: Env, slug: string): Promise<{ slug: string; name: string; description: string | null } | null> {
  const supabase = getSupabaseAdmin(env)
  const { data } = await supabase.from('product_categories').select('slug, name, description').eq('slug', slug).maybeSingle()
  return data ?? null
}

function absolutise(site: string, url: string): string {
  if (!url) return `${site}${DEFAULT_IMAGE_PATH}`
  return /^https?:\/\//i.test(url) ? url : `${site}${url.startsWith('/') ? '' : '/'}${url}`
}

/** Resolves everything the middleware needs to describe `pathname` to a crawler. Never throws. */
export async function resolvePageMeta(env: Env, requestUrl: URL): Promise<PageMeta> {
  const origin = requestUrl.origin
  const site = siteUrl(env, origin)
  const path = normalisePath(requestUrl.pathname)

  const staticPage = STATIC_PAGES[path]
  if (staticPage) return base(env, origin, path, staticPage)

  if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return base(env, origin, path, { title: 'Your account', description: DEFAULT_DESCRIPTION, noindex: true })
  }

  const productMatch = path.match(/^\/product\/([a-z0-9-]+)$/i)
  if (productMatch) {
    const slug = productMatch[1].toLowerCase()
    try {
      const product = await cached(`/product/${slug}`, 120, () => loadProduct(env, slug))
      if (!product) return base(env, origin, path, { title: 'Product not found', description: DEFAULT_DESCRIPTION, noindex: true }, 404)

      const category = Array.isArray(product.product_categories) ? product.product_categories[0] : product.product_categories
      const productUrl = `${site}/product/${product.slug}`
      const images = [product.image_url, ...(product.additional_images ?? []).map((i) => i.url ?? '')]
        .filter(Boolean)
        .map((u) => absolutise(site, u))
      const description = product.short_description || `${product.name} — available from ${SITE_NAME} with UK delivery.`

      return {
        title: withSiteName(product.name),
        description,
        path: `/product/${product.slug}`,
        image: images[0] ?? `${site}${DEFAULT_IMAGE_PATH}`,
        type: 'product',
        noindex: false,
        status: 200,
        jsonLd: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              '@id': `${productUrl}#product`,
              name: product.name,
              description,
              sku: product.sku,
              image: images,
              url: productUrl,
              brand: { '@type': 'Brand', name: SITE_NAME },
              offers: {
                '@type': 'Offer',
                url: productUrl,
                priceCurrency: 'GBP',
                price: (product.price_minor / 100).toFixed(2),
                availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition',
                areaServed: 'GB',
                seller: { '@type': 'Organization', name: SITE_NAME },
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Shop', item: `${site}/shop` },
                ...(category
                  ? [{ '@type': 'ListItem', position: 2, name: category.name, item: `${site}/shop/${category.slug}` }]
                  : []),
                { '@type': 'ListItem', position: category ? 3 : 2, name: product.name },
              ],
            },
          ],
        },
      }
    } catch {
      // Supabase not configured / transient failure: serve generic tags rather than an error page.
      return base(env, origin, path, { title: 'Product', description: DEFAULT_DESCRIPTION })
    }
  }

  const categoryMatch = path.match(/^\/shop\/([a-z0-9-]+)$/i)
  if (categoryMatch) {
    const slug = categoryMatch[1].toLowerCase()
    try {
      const category = await cached(`/category/${slug}`, 300, () => loadCategory(env, slug))
      if (!category) return base(env, origin, path, { title: 'Category not found', description: DEFAULT_DESCRIPTION, noindex: true }, 404)
      const meta = base(env, origin, `/shop/${category.slug}`, {
        title: category.name,
        description: category.description || `Shop ${category.name.toLowerCase()} at ${SITE_NAME} — UK delivery and secure Open Banking payment.`,
      })
      meta.jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Shop', item: `${site}/shop` },
          { '@type': 'ListItem', position: 2, name: category.name },
        ],
      }
      return meta
    } catch {
      return base(env, origin, path, { title: 'Category', description: DEFAULT_DESCRIPTION })
    }
  }

  // Anything else isn't a page this site has: serve the shell (so the React
  // 404 page still renders) but with a real 404 status so crawlers don't
  // index junk URLs as soft-404s.
  return base(env, origin, path, { title: 'Page not found', description: DEFAULT_DESCRIPTION, noindex: true }, 404)
}
