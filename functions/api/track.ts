import { getSupabaseAdmin } from '../_lib/supabaseAdmin'
import type { Env } from '../_lib/types'

// ============================================================================
// POST /api/track — first-party, cookieless analytics collection.
//
// Nothing is stored on the visitor's device, so PECR consent doesn't apply and
// measurement covers everyone rather than only those who accept a banner. The
// site still offers an explicit opt-out (Footer → Cookie preferences), which
// the client honours before it ever calls this endpoint.
//
// WHAT THIS DELIBERATELY NEVER STORES
//   * The raw IP address, or any reversible form of it
//   * The raw user-agent string
//   * The full referring URL (only its hostname)
//   * Any query string (stripped below, so a "?email=" style leak can't land
//     in the analytics table by accident)
//   * Anything at all from a signed-in customer's account
//
// The IP and user agent are used once, in memory, to derive `visitor_hash`,
// and are then discarded. See the salt notes on dailySalt() for why that hash
// cannot be worked backwards or followed across days.
// ============================================================================

/** Always answer the beacon quickly and identically — never leak whether a hit was recorded. */
const NO_CONTENT = () => new Response(null, { status: 204 })

interface TrackBody {
  type?: string
  path?: string
  referrer?: string
  searchTerm?: string
  searchResultCount?: number
}

/**
 * The per-day salt.
 *
 * A visitor hash is only anonymous if the salt is both secret and short-lived.
 * `ANALYTICS_SALT` is a server-side secret the visitor never sees; combining it
 * with the UTC date means the effective salt changes at midnight and yesterday's
 * is never reconstructed or stored. The consequence — deliberate, not a
 * limitation to work around — is that the same person visiting on Monday and
 * Tuesday counts as two visitors. Being unable to follow someone across days is
 * the property that keeps this data effectively anonymous.
 *
 * If ANALYTICS_SALT is unset the deployment falls back to a build-agnostic
 * constant. That still rotates daily, but set the secret in production: without
 * it, someone who knew the scheme could test whether a *specific* IP visited.
 */
function dailySalt(env: Env): string {
  const secret = env.ANALYTICS_SALT || 'avernic-analytics-fallback-salt'
  const day = new Date().toISOString().slice(0, 10)
  return `${secret}:${day}`
}

async function visitorHash(env: Env, ip: string, userAgent: string): Promise<string> {
  const data = new TextEncoder().encode(`${dailySalt(env)}|${ip}|${userAgent}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

/**
 * Known crawlers, previewers and monitors. These inflate every number they
 * touch — and since the AIO work explicitly invites AI crawlers to read the
 * catalogue, they would otherwise show up as a large fake audience.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|slackbot|discord|embedly|quora|pinterest|redditbot|applebot|petalbot|yandex|baidu|semrush|ahrefs|mj12|dotbot|dataprovider|headless|phantomjs|puppeteer|playwright|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python-requests|axios|go-http|java\/|okhttp|postman|gptbot|chatgpt|oai-search|claudebot|claude-web|anthropic|perplexity|cohere|amazonbot|ccbot|diffbot|bytespider|google-extended/i

/** Hostname patterns for engines that send traffic from an AI answer, rather than a classic results page. */
const AI_ASSISTANT_HOSTS =
  /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|claude\.ai|anthropic\.com|copilot\.microsoft\.com|gemini\.google\.com|bard\.google\.com|you\.com|phind\.com|poe\.com)$/i

const SEARCH_ENGINE_HOSTS =
  /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com|yahoo\.[a-z.]+|ecosia\.org|startpage\.com|brave\.com|qwant\.com|baidu\.com|yandex\.[a-z.]+|search\.marcaria\.com)$/i

const SOCIAL_HOSTS =
  /(^|\.)(facebook\.com|m\.facebook\.com|instagram\.com|t\.co|x\.com|twitter\.com|tiktok\.com|pinterest\.[a-z.]+|reddit\.com|linkedin\.com|youtube\.com|threads\.net|snapchat\.com|whatsapp\.com)$/i

const EMAIL_HOSTS = /(^|\.)(mail\.google\.com|outlook\.[a-z.]+|mail\.yahoo\.com|superhuman\.com)$/i

export type Channel = 'direct' | 'organic_search' | 'ai_assistant' | 'social' | 'referral' | 'email' | 'internal'

/**
 * Classifies where a visit came from, from the referrer hostname alone.
 *
 * `ai_assistant` is broken out from `organic_search` on purpose: the site
 * publishes /llms.txt and /llms-full.txt specifically to be cited by answer
 * engines, and lumping that traffic in with Google would make it impossible to
 * tell whether any of that work is paying off.
 */
export function classifyReferrer(referrerHost: string, siteHost: string): Channel {
  if (!referrerHost) return 'direct'
  if (referrerHost === siteHost || referrerHost === `www.${siteHost}`) return 'internal'
  if (AI_ASSISTANT_HOSTS.test(referrerHost)) return 'ai_assistant'
  if (SEARCH_ENGINE_HOSTS.test(referrerHost)) return 'organic_search'
  if (SOCIAL_HOSTS.test(referrerHost)) return 'social'
  if (EMAIL_HOSTS.test(referrerHost)) return 'email'
  return 'referral'
}

function deviceClass(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent)) return 'tablet'
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

/** Strips the query string and any fragment, and caps length. Keeps a leading slash. */
function cleanPath(raw: string): string {
  const path = raw.split('?')[0].split('#')[0].trim()
  if (!path.startsWith('/')) return '/'
  return path.slice(0, 300)
}

/** Paths that are never recorded: the admin panel, a customer's own account, and checkout. */
function isExcludedPath(path: string): boolean {
  return /^\/(admin|account|order-confirmation|login|register|forgot-password|checkout|basket)(\/|$)/.test(path)
}

function hostOf(url: string): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Analytics must never be able to break the site or slow a page down, and a
  // failure here is not something a visitor should ever see. Every path below
  // returns 204, whether the hit was recorded, ignored as a bot, or errored.
  try {
    const { request, env } = context
    const userAgent = request.headers.get('user-agent') ?? ''
    if (!userAgent || BOT_PATTERN.test(userAgent)) return NO_CONTENT()

    // Honour a browser-level Do Not Track signal even though the client checks
    // it too — this endpoint is public, so it shouldn't rely on the caller.
    if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return NO_CONTENT()

    const body = (await request.json().catch(() => null)) as TrackBody | null
    if (!body) return NO_CONTENT()

    const type = body.type === 'search' ? 'search' : 'page_view'
    const path = cleanPath(body.path ?? '/')
    if (isExcludedPath(path)) return NO_CONTENT()

    const siteHost = hostOf(env.SITE_URL || request.url)
    const referrerHost = hostOf(body.referrer ?? '')
    const channel = classifyReferrer(referrerHost, siteHost)

    const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? ''
    const hash = await visitorHash(env, ip, userAgent)

    const searchTerm =
      type === 'search' ? (body.searchTerm ?? '').trim().toLowerCase().slice(0, 120) : ''
    // A "search" with nothing typed is not a search anyone can act on.
    if (type === 'search' && !searchTerm) return NO_CONTENT()

    const supabase = getSupabaseAdmin(env)
    await supabase.from('analytics_events').insert({
      event_type: type,
      path,
      visitor_hash: hash,
      // An internal referrer means in-site navigation; the visit's own channel
      // was already recorded on the landing page, so don't overwrite it.
      channel,
      referrer_host: channel === 'internal' ? '' : referrerHost,
      search_term: searchTerm,
      search_result_count:
        type === 'search' && typeof body.searchResultCount === 'number'
          ? Math.max(0, Math.min(100000, Math.round(body.searchResultCount)))
          : null,
      device: deviceClass(userAgent),
      country: (request.headers.get('cf-ipcountry') ?? '').slice(0, 2).toUpperCase(),
    })

    return NO_CONTENT()
  } catch {
    return NO_CONTENT()
  }
}
