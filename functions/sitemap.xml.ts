import { getSupabaseAdmin } from './_lib/supabaseAdmin'
import type { Env } from './_lib/types'

const STATIC_PATHS = [
  '/',
  '/shop',
  '/shop/categories',
  '/about',
  '/faq',
  '/contact',
  '/delivery',
  '/returns',
  '/terms',
  '/privacy',
  '/cookies',
]

/**
 * GET /sitemap.xml — generated dynamically from the live, active catalogue
 * (a static file would drift out of date as products are added/retired).
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const siteUrl = context.env.SITE_URL || 'https://www.avernic.co.uk'
  let productUrls: string[] = []
  let categoryUrls: string[] = []

  try {
    const supabase = getSupabaseAdmin(context.env)
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug').eq('is_active', true),
      supabase.from('product_categories').select('slug'),
    ])
    productUrls = (products ?? []).map((p) => `/product/${p.slug}`)
    categoryUrls = (categories ?? []).map((c) => `/shop/${c.slug}`)
  } catch {
    // If Supabase isn't configured yet, still serve the static paths rather than a 500.
  }

  const urls = [...STATIC_PATHS, ...categoryUrls, ...productUrls]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n')}
</urlset>`

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
