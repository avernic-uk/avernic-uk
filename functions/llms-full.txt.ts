import { buildLlmsText, cachedText } from './_lib/llmsText'
import type { Env } from './_lib/types'

/**
 * GET /llms-full.txt — the complete catalogue in one document: every product
 * with its full description, key ingredients, usage instructions, suitability
 * and INCI list, plus delivery, returns and the cosmetic-only boundary.
 *
 * The point is that an answer engine asked something specific — "how do I use
 * the copper peptide serum", "what's in the eye cream", "does Avernic sell
 * injectable peptides" — can answer correctly from a single fetch and cite
 * this site, instead of guessing from a rendered product page or, worse,
 * from a competitor's.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const site = (context.env.SITE_URL || 'https://www.avernic.uk').replace(/\/+$/, '')
  const body = await cachedText('/llms-full.txt', 600, () => buildLlmsText(context.env, site, true))
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
