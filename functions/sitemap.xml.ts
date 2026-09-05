import { getSupabaseAdmin } from './_lib/supabaseAdmin'
import type { Env } from './_lib/types'

/** path, changefreq, priority — priority follows how often a page's content actually changes and how central it is to a purchase decision. */
const STATIC_PATHS: Array<[string, string, string]> = [
  ['/', 'daily', '1.0'],
  ['/shop', 'daily', '0.9'],
  ['/shop/categories', 'weekly', '0.6'],
  ['/about', 'monthly', '0.5'],
  ['/faq', 'monthly', '0.6'],
  ['/contact', 'monthly', '0.4'],
  ['/delivery', 'monthly', '0.4'],
  ['/returns', 'monthly', '0.4'],
  ['/terms', 'yearly', '0.2'],
  ['/privacy', 'yearly', '0.2'],
  ['/cookies', 'yearly', '0.2'],
]

interface ProductRow {
  slug: string
  image_url: string | null
  name: string
  updated_at: string
}

interface CategoryRow {
  slug: string
  updated_at: string
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function urlEntry(opts: { loc: string; lastmod?: string; changefreq?: string; priority?: string; imageLoc?: string; imageTitle?: string }): string {
  const parts = [`    <loc>${xmlEscape(opts.loc)}</loc>`]
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`)
  if (opts.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`)
  if (opts.priority) parts.push(`    <priority>${opts.priority}</priority>`)
  if (opts.imageLoc) {
    parts.push(
      `    <image:image><image:loc>${xmlEscape(opts.imageLoc)}</image:loc>${
        opts.imageTitle ? `<image:title>${xmlEscape(opts.imageTitle)}</image:title>` : ''
      }</image:image>`,
    )
  }
  return `  <url>\n${parts.join('\n')}\n  </url>`
}

function absolutise(site: string, url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${site}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * GET /sitemap.xml — generated dynamically from the live, active catalogue
 * (a static file would drift out of date as products are added/retired).
 * Includes lastmod/changefreq/priority hints and an <image:image> extension
 * on product URLs so product photography can also surface in image search.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const siteUrl = (context.env.SITE_URL || 'https://avernic.uk').replace(/\/+$/, '')
  let products: ProductRow[] = []
  let categories: CategoryRow[] = []

  try {
    const supabase = getSupabaseAdmin(context.env)
    const [{ data: productData }, { data: categoryData }] = await Promise.all([
      supabase.from('products').select('slug, image_url, name, updated_at').eq('is_active', true),
      supabase.from('product_categories').select('slug, updated_at'),
    ])
    products = productData ?? []
    categories = categoryData ?? []
  } catch {
    // If Supabase isn't configured yet, still serve the static paths rather than a 500.
  }

  const entries = [
    ...STATIC_PATHS.map(([path, changefreq, priority]) => urlEntry({ loc: `${siteUrl}${path}`, changefreq, priority })),
    ...categories.map((c) =>
      urlEntry({
        loc: `${siteUrl}/shop/${c.slug}`,
        lastmod: c.updated_at?.slice(0, 10),
        changefreq: 'weekly',
        priority: '0.7',
      }),
    ),
    ...products.map((p) =>
      urlEntry({
        loc: `${siteUrl}/product/${p.slug}`,
        lastmod: p.updated_at?.slice(0, 10),
        changefreq: 'weekly',
        priority: '0.8',
        imageLoc: p.image_url ? absolutise(siteUrl, p.image_url) : undefined,
        imageTitle: p.image_url ? p.name : undefined,
      }),
    ),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
