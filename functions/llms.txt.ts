import { buildLlmsText, cachedText } from './_lib/llmsText'
import type { Env } from './_lib/types'

/**
 * GET /llms.txt — the index form of the site summary for AI assistants and
 * answer-engine crawlers. See functions/_lib/llmsText.ts for what it contains
 * and why. The full-detail companion document is at /llms-full.txt.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const site = (context.env.SITE_URL || 'https://www.avernic.uk').replace(/\/+$/, '')
  const body = await cachedText('/llms.txt', 600, () => buildLlmsText(context.env, site, false))
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
