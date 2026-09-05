import { getSupabaseAdmin } from './_lib/supabaseAdmin'
import { getSiteSettings } from './_lib/settings'
import type { Env } from './_lib/types'

// ============================================================================
// GET /llms.txt — a purpose-built summary of the site for AI assistants and
// answer-engine crawlers (ChatGPT, Claude, Perplexity, Gemini, and similar),
// following the emerging llms.txt convention (https://llmstxt.org/): a
// single markdown document an LLM can fetch to quickly understand what the
// site is, what it sells, and where to find authoritative detail — rather
// than having to reconstruct that from rendered HTML.
//
// Generated live from the same admin-editable content (Admin → Settings,
// Categories, FAQs, Products) the storefront itself renders, so it can never
// drift out of date the way a hand-written static file would.
// ============================================================================

interface ProductRow {
  slug: string
  name: string
  short_description: string | null
  price_minor: number
  is_active: boolean
  product_categories: { name: string } | { name: string }[] | null
}

interface CategoryRow {
  slug: string
  name: string
  description: string | null
}

interface FaqRow {
  question: string
  answer: string
}

function formatGBP(minor: number): string {
  return `£${(minor / 100).toFixed(2)}`
}

async function cached(env: Env, key: string, ttlSeconds: number, load: () => Promise<string>): Promise<string> {
  const cache = (caches as unknown as { default: Cache }).default
  const cacheKey = new Request(`https://llms-txt.internal${key}`)
  try {
    const hit = await cache.match(cacheKey)
    if (hit) return hit.text()
  } catch {
    // ignore — fall through to a live build
  }
  const value = await load()
  try {
    await cache.put(cacheKey, new Response(value, { headers: { 'Cache-Control': `max-age=${ttlSeconds}` } }))
  } catch {
    // ignore
  }
  return value
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const site = (context.env.SITE_URL || 'https://www.avernic.co.uk').replace(/\/+$/, '')

  const body = await cached(context.env, '/llms.txt', 600, async () => {
    const supabase = getSupabaseAdmin(context.env)
    const [settings, { data: categoryData }, { data: productData }, { data: faqData }] = await Promise.all([
      getSiteSettings(supabase),
      supabase.from('product_categories').select('slug, name, description').order('sort_order', { ascending: true }),
      supabase
        .from('products')
        .select('slug, name, short_description, price_minor, is_active, product_categories(name)')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase.from('faqs').select('question, answer').eq('is_active', true).order('sort_order', { ascending: true }),
    ])

    const categories = (categoryData ?? []) as CategoryRow[]
    const products = (productData ?? []) as ProductRow[]
    const faqs = (faqData ?? []) as FaqRow[]

    const lines: string[] = []
    lines.push('# Avernic UK')
    lines.push('')
    lines.push(
      `> Avernic UK is a UK-based online retailer of cosmetic peptide skincare — serums, moisturisers and treatments. ` +
        `Every formulation is HPLC-tested for ingredient purity before sale. Products are cosmetic skincare only: they ` +
        `are not medicines, are not injectable, and make no medical claims. Intended for adults aged 18 and over. ` +
        `UK delivery only; checkout is via Open Banking (Fena) — no card details are collected.`,
    )
    lines.push('')

    if (settings.companyName || settings.registeredAddress || settings.contactEmail) {
      lines.push('## Business details')
      lines.push('')
      if (settings.companyName) lines.push(`- Legal name: ${settings.companyName}${settings.companyNumber ? ` (company number ${settings.companyNumber})` : ''}`)
      if (settings.registeredAddress) lines.push(`- Registered address: ${settings.registeredAddress}`)
      if (settings.contactEmail) lines.push(`- Contact email: ${settings.contactEmail}`)
      if (settings.contactPhone) lines.push(`- Contact phone: ${settings.contactPhone}`)
      lines.push(
        `- Delivery: UK addresses only. Standard delivery ${formatGBP(settings.deliveryStandardMinor)}, free over ${formatGBP(settings.deliveryFreeThresholdMinor)}.`,
      )
      lines.push('')
    }

    lines.push('## Categories')
    lines.push('')
    for (const c of categories) {
      lines.push(`- [${c.name}](${site}/shop/${c.slug})${c.description ? `: ${c.description}` : ''}`)
    }
    lines.push('')

    lines.push('## Products')
    lines.push('')
    for (const p of products) {
      const category = Array.isArray(p.product_categories) ? p.product_categories[0] : p.product_categories
      const suffix = [category?.name, formatGBP(p.price_minor)].filter(Boolean).join(' · ')
      const desc = p.short_description ? ` — ${p.short_description}` : ''
      lines.push(`- [${p.name}](${site}/product/${p.slug}) (${suffix})${desc}`)
    }
    lines.push('')

    if (faqs.length > 0) {
      lines.push('## Frequently asked questions')
      lines.push('')
      for (const f of faqs) {
        lines.push(`**${f.question}**`)
        lines.push(f.answer)
        lines.push('')
      }
    }

    lines.push('## Policies')
    lines.push('')
    lines.push(`- [Delivery information](${site}/delivery)`)
    lines.push(`- [Returns & refunds](${site}/returns)`)
    lines.push(`- [Terms & conditions](${site}/terms)`)
    lines.push(`- [Privacy policy](${site}/privacy)`)
    lines.push(`- [About Avernic UK](${site}/about)`)
    lines.push('')
    lines.push('## Sitemap')
    lines.push('')
    lines.push(`- [XML sitemap](${site}/sitemap.xml)`)
    lines.push('')

    return lines.join('\n')
  })

  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
