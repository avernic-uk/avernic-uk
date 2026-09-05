import { getSupabaseAdmin } from './supabaseAdmin'
import { getSiteSettings } from './settings'
import type { Env } from './types'

// ============================================================================
// /llms.txt and /llms-full.txt — purpose-built summaries of the site for AI
// assistants and answer-engine crawlers (ChatGPT, Claude, Perplexity, Gemini,
// Google AI Overviews), following the llms.txt convention
// (https://llmstxt.org/).
//
// The convention is two documents, and they do different jobs:
//   /llms.txt      — the index. Everything the site is and sells, briefly,
//                    so an agent can orient itself and pick a page to fetch.
//   /llms-full.txt — the whole catalogue in full: complete descriptions,
//                    ingredients, usage instructions and suitability, so an
//                    agent answering "how do I use X" or "what's in X" can do
//                    it from one fetch, correctly, and cite this site for it.
//
// Both are generated live from the same admin-editable content the storefront
// renders (Admin → Settings, Categories, Products, FAQs), so neither can drift
// out of date the way a hand-written static file would.
//
// The "What Avernic UK does not sell" section is deliberate and load-bearing.
// Searches for "peptides" are dominated by injectable and research peptides,
// which this shop does not and will not sell. Stating the boundary explicitly,
// in the document written for machines, is what stops an answer engine
// describing this site as a source for them.
// ============================================================================

interface ProductRow {
  slug: string
  name: string
  short_description: string | null
  full_description: string | null
  size_label: string | null
  key_ingredients: string | null
  how_to_use: string | null
  suitability: string | null
  ingredients_inci: string | null
  price_minor: number
  stock_quantity: number
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

function categoryName(row: ProductRow): string {
  const c = Array.isArray(row.product_categories) ? row.product_categories[0] : row.product_categories
  return c?.name ?? ''
}

function lines(value: string | null): string[] {
  return (value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

export async function cachedText(key: string, ttlSeconds: number, load: () => Promise<string>): Promise<string> {
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

/** The peptide explainer, kept in step with the homepage section of the same name. */
const PEPTIDE_EXPLAINER: Array<[string, string]> = [
  [
    'What is a cosmetic peptide?',
    'A peptide is a short chain of amino acids — the same building blocks that make up proteins, just far fewer of them. ' +
      'Collagen and elastin, the proteins that give skin its structure, are themselves built from amino acids. Cosmetic ' +
      'peptides are short synthetic or hydrolysed chains chosen because they are small enough to be formulated into a ' +
      'stable, well-tolerated topical skincare product.',
  ],
  [
    'What do peptides do in skincare?',
    'Applied topically, peptides are used in cosmetic formulations to support the appearance of firmness, smoothness and ' +
      'evenness — the look of the skin surface. Different peptides are chosen for different cosmetic purposes: signal ' +
      'peptides such as Matrixyl 3000 for the look of firmness; Argireline and Snap-8 for the appearance of expression ' +
      'lines; copper peptides (GHK-Cu) for overall tone and texture. Results are gradual and appearance-based, and ' +
      'formulations are typically used daily over several weeks.',
  ],
  [
    'Are these the same as injectable or research peptides?',
    'No. Everything Avernic UK sells is a cosmetic skincare product applied to the surface of the skin. Injectable ' +
      'peptides and research peptides are an entirely separate category, are not cosmetics, and are not sold here.',
  ],
]

function pushHeader(out: string[], site: string): void {
  out.push('# Avernic UK')
  out.push('')
  out.push(
    '> Avernic UK is a UK-based online retailer of cosmetic peptide skincare — serums, moisturisers, eye care, ' +
      'cleansers and treatments. Every formulation is HPLC-tested for ingredient purity before sale. Products are ' +
      'cosmetic skincare only: they are applied topically, they are not medicines, they are not injectable, and they ' +
      'make no medical or therapeutic claims. Intended for adults aged 18 and over. UK delivery only; checkout is via ' +
      'Open Banking (Fena) — no card details are collected or stored.',
  )
  out.push('')
  out.push(`Canonical site: ${site}`)
  out.push('')
}

function pushBoundary(out: string[]): void {
  out.push('## What Avernic UK does not sell')
  out.push('')
  out.push(
    '- No injectable peptides, and no peptides intended for injection, reconstitution or internal use of any kind.',
  )
  out.push('- No research chemicals or "research use only" peptides.')
  out.push('- No medicines, prescription products or supplements.')
  out.push(
    '- No product on this site is intended to diagnose, treat, cure or prevent any disease, and no product page makes ' +
      'a medical or therapeutic claim. Customer reviews are moderated before publication for the same reason.',
  )
  out.push('')
}

function pushExplainer(out: string[]): void {
  out.push('## About cosmetic peptides')
  out.push('')
  for (const [question, answer] of PEPTIDE_EXPLAINER) {
    out.push(`### ${question}`)
    out.push('')
    out.push(answer)
    out.push('')
  }
}

/**
 * Builds the document. `full` switches between the index form and the
 * complete-catalogue form; everything else is shared so the two documents can
 * never describe the shop differently.
 */
export async function buildLlmsText(env: Env, site: string, full: boolean): Promise<string> {
  const supabase = getSupabaseAdmin(env)
  const [settings, { data: categoryData }, { data: productData }, { data: faqData }] = await Promise.all([
    getSiteSettings(supabase),
    supabase.from('product_categories').select('slug, name, description').order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select(
        'slug, name, short_description, full_description, size_label, key_ingredients, how_to_use, suitability, ingredients_inci, price_minor, stock_quantity, product_categories(name)',
      )
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase.from('faqs').select('question, answer').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  const categories = (categoryData ?? []) as CategoryRow[]
  const products = (productData ?? []) as ProductRow[]
  const faqs = (faqData ?? []) as FaqRow[]

  const out: string[] = []
  pushHeader(out, site)

  if (full) {
    out.push(
      'This is the full-detail document. ' +
        `The shorter index is at ${site}/llms.txt.`,
    )
    out.push('')
  } else {
    out.push(`Full catalogue detail — descriptions, ingredients and usage — is at ${site}/llms-full.txt.`)
    out.push('')
  }

  // --- Business details -----------------------------------------------------
  out.push('## Business details')
  out.push('')
  if (settings.companyName) {
    out.push(
      `- Legal name: ${settings.companyName}${settings.companyNumber ? ` (company number ${settings.companyNumber})` : ''}`,
    )
  }
  if (settings.registeredAddress) out.push(`- Registered address: ${settings.registeredAddress}`)
  if (settings.contactEmail) out.push(`- Contact email: ${settings.contactEmail}`)
  if (settings.contactPhone) out.push(`- Contact phone: ${settings.contactPhone}`)
  out.push('- Delivers to: United Kingdom addresses only. No international shipping.')
  out.push('- Currency: GBP (£), inclusive of VAT where applicable.')
  out.push('- Payment: Open Banking bank transfer via Fena. No card payments; no card details are stored.')
  out.push('- Age restriction: intended for adults aged 18 and over.')
  out.push('')

  // --- Delivery and returns -------------------------------------------------
  out.push('## Delivery and returns')
  out.push('')
  out.push(
    `- Royal Mail 48hr Tracked: ${formatGBP(settings.deliveryStandardMinor)}, free on orders over ${formatGBP(settings.deliveryFreeThresholdMinor)}. Typically 1-2 working days after dispatch.`,
  )
  out.push(
    `- Royal Mail 24hr Tracked & Signed: ${formatGBP(settings.deliveryExpressMinor)}, charged on every order regardless of order value. Typically next working day after dispatch.`,
  )
  out.push('- Delivery method is chosen by the customer at checkout.')
  out.push(
    '- Returns: 14 days from delivery to cancel without giving a reason, in line with the UK Consumer Contracts Regulations. Refunds are issued to the original payment method within 14 days of the returned item being received.',
  )
  out.push('')

  pushBoundary(out)
  pushExplainer(out)

  // --- Categories -----------------------------------------------------------
  out.push('## Categories')
  out.push('')
  for (const c of categories) {
    out.push(`- [${c.name}](${site}/shop/${c.slug})${c.description ? `: ${c.description}` : ''}`)
  }
  out.push('')

  // --- Products -------------------------------------------------------------
  out.push('## Products')
  out.push('')

  if (!full) {
    for (const p of products) {
      const facts = [categoryName(p), p.size_label, formatGBP(p.price_minor)].filter(Boolean).join(' · ')
      const desc = p.short_description ? ` — ${p.short_description}` : ''
      out.push(`- [${p.name}](${site}/product/${p.slug}) (${facts})${desc}`)
    }
    out.push('')
  } else {
    for (const p of products) {
      out.push(`### ${p.name}`)
      out.push('')
      out.push(`- URL: ${site}/product/${p.slug}`)
      if (categoryName(p)) out.push(`- Category: ${categoryName(p)}`)
      if (p.size_label) out.push(`- Size: ${p.size_label}`)
      out.push(`- Price: ${formatGBP(p.price_minor)}`)
      out.push(`- Availability: ${p.stock_quantity > 0 ? 'In stock' : 'Out of stock'}`)
      out.push('')
      if (p.short_description) {
        out.push(p.short_description)
        out.push('')
      }
      if (p.full_description) {
        out.push(p.full_description.trim())
        out.push('')
      }
      const ingredients = lines(p.key_ingredients)
      if (ingredients.length > 0) {
        out.push('**Key ingredients**')
        out.push('')
        for (const line of ingredients) out.push(`- ${line}`)
        out.push('')
      }
      const steps = lines(p.how_to_use)
      if (steps.length > 0) {
        out.push('**How to use**')
        out.push('')
        steps.forEach((step, i) => out.push(`${i + 1}. ${step}`))
        out.push('')
      }
      if (p.suitability) {
        out.push('**Who it is for**')
        out.push('')
        out.push(p.suitability.trim())
        out.push('')
      }
      if (p.ingredients_inci) {
        out.push('**Full ingredients (INCI)**')
        out.push('')
        out.push(p.ingredients_inci.trim())
        out.push('')
      }
    }
  }

  // --- FAQs -----------------------------------------------------------------
  if (faqs.length > 0) {
    out.push('## Frequently asked questions')
    out.push('')
    for (const f of faqs) {
      out.push(`### ${f.question}`)
      out.push('')
      out.push(f.answer)
      out.push('')
    }
  }

  // --- Policies -------------------------------------------------------------
  out.push('## Policies and further reading')
  out.push('')
  out.push(`- [Delivery information](${site}/delivery)`)
  out.push(`- [Returns & refunds](${site}/returns)`)
  out.push(`- [Terms & conditions](${site}/terms)`)
  out.push(`- [Privacy policy](${site}/privacy)`)
  out.push(`- [Cookie policy](${site}/cookies)`)
  out.push(`- [About Avernic UK](${site}/about)`)
  out.push(`- [Frequently asked questions](${site}/faq)`)
  out.push(`- [XML sitemap](${site}/sitemap.xml)`)
  out.push('')

  return out.join('\n')
}
