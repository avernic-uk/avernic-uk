import { resolvePageMeta, type PageMeta } from './_lib/seoMeta'
import type { Env } from './_lib/types'

// ============================================================================
// Edge SEO middleware.
//
// Runs in front of every request. For HTML page loads it lets Cloudflare
// Pages serve the SPA shell as normal, then rewrites the <head> on the way
// out so the title, description, canonical, Open Graph / Twitter tags and
// JSON-LD describe the page actually being requested — which is what search
// engines and link-preview bots see, since they don't wait for React.
//
// Everything else (the /api/* functions, sitemap.xml, static assets, any
// non-HTML response) passes straight through untouched.
//
// The elements it edits are marked with data-seo="…" in index.html; the
// browser-side hook src/lib/useDocumentMeta.ts edits the same elements once
// the app boots, so the two never disagree.
// ============================================================================

/**
 * The site answers on more than one hostname: the canonical custom domain
 * (SITE_URL), its `www.` form, and the Cloudflare Pages project domain
 * `avernic-uk.pages.dev`. Left alone, a crawler can index the same catalogue
 * three times over and split its ranking signals across them. The canonical
 * <link> tag below already names one winner, but a 301 is a far stronger
 * signal and stops the duplicates being fetched at all.
 *
 * Deliberately narrow about which hosts it redirects:
 *   - `www.<canonical>`            → canonical
 *   - `<project>.pages.dev`        → canonical  (exactly three labels)
 *   - `<hash>.<project>.pages.dev` → left alone, so preview deployments of a
 *                                    branch stay testable on their own URL
 * and it does nothing at all unless SITE_URL is a real custom domain, so
 * local dev and pages.dev-only deployments can't redirect-loop.
 */
function canonicalRedirect(request: Request, url: URL, siteUrl: string | undefined): Response | null {
  if (!siteUrl) return null
  // Only ever redirect reads. A 301 on an inbound POST would break any API
  // caller configured against another hostname — most importantly the Fena
  // payment webhook, which does not follow redirects.
  if (request.method !== 'GET' && request.method !== 'HEAD') return null
  if (url.pathname.startsWith('/api/')) return null
  let canonical: URL
  try {
    canonical = new URL(siteUrl)
  } catch {
    return null
  }
  const canonicalHost = canonical.host
  if (!canonicalHost || canonicalHost === url.host) return null
  // Don't redirect towards a host that is itself a staging/dev origin.
  if (canonicalHost.endsWith('.pages.dev') || canonicalHost.startsWith('localhost') || canonicalHost.startsWith('127.')) return null

  const host = url.host
  const isWwwOfCanonical = host === `www.${canonicalHost}`
  const isProjectPagesDev = host.endsWith('.pages.dev') && host.split('.').length === 3
  if (!isWwwOfCanonical && !isProjectPagesDev) return null

  const target = new URL(url.pathname + url.search, canonical.origin)
  return Response.redirect(target.toString(), 301)
}

function isPageRequest(request: Request, url: URL): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (url.pathname.startsWith('/api/')) return false
  if (url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt') return false
  // Anything with a file extension is a static asset (/assets/index-abc.js, /logo-icon.png …)
  if (/\.[a-z0-9]{1,8}$/i.test(url.pathname)) return false
  return true
}

/** JSON safe to embed in a <script> — a "</script>" inside a product name must not end the tag early. */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

// NOTE: the constructor param must NOT be named `text` — HTMLRewriter's
// runtime checks every handler object for a `text` property and, if one
// exists, requires it to be a function (its own text-node handler slot). A
// plain string field named `text` collides with that and throws:
// "Incorrect type for the 'text' field on 'ElementContentHandlers'".
class SetText {
  constructor(private value: string) {}
  element(el: Element) {
    el.setInnerContent(this.value)
  }
}

class SetAttr {
  constructor(private attr: string, private value: string) {}
  element(el: Element) {
    el.setAttribute(this.attr, this.value)
  }
}

class AppendJsonLd {
  constructor(private json: string) {}
  element(el: Element) {
    el.append(`<script type="application/ld+json" data-seo="jsonld">${this.json}</script>`, { html: true })
  }
}

function rewrite(response: Response, meta: PageMeta, site: string): Response {
  const canonical = `${site}${meta.path === '/' ? '/' : meta.path}`
  const robots = meta.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'

  let rewriter = new HTMLRewriter()
    .on('title[data-seo="title"]', new SetText(meta.title))
    .on('meta[data-seo="description"]', new SetAttr('content', meta.description))
    .on('meta[data-seo="robots"]', new SetAttr('content', robots))
    .on('link[data-seo="canonical"]', new SetAttr('href', canonical))
    .on('meta[data-seo="og:type"]', new SetAttr('content', meta.type))
    .on('meta[data-seo="og:title"]', new SetAttr('content', meta.title))
    .on('meta[data-seo="og:description"]', new SetAttr('content', meta.description))
    .on('meta[data-seo="og:url"]', new SetAttr('content', canonical))
    .on('meta[data-seo="og:image"]', new SetAttr('content', meta.image))
    .on('meta[data-seo="twitter:title"]', new SetAttr('content', meta.title))
    .on('meta[data-seo="twitter:description"]', new SetAttr('content', meta.description))
    .on('meta[data-seo="twitter:image"]', new SetAttr('content', meta.image))

  if (meta.jsonLd) rewriter = rewriter.on('head', new AppendJsonLd(jsonForScript(meta.jsonLd)))

  const transformed = rewriter.transform(response)
  // Re-wrap so headers are mutable and the status can be overridden (404 for unknown slugs).
  return new Response(transformed.body, {
    status: meta.status,
    statusText: meta.status === 404 ? 'Not Found' : transformed.statusText,
    headers: new Headers(transformed.headers),
  })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context
  const url = new URL(request.url)

  // Collapse duplicate hostnames onto the canonical domain before anything
  // else — including for /sitemap.xml, /robots.txt and /llms.txt, so those
  // never get fetched (or cited) under a staging hostname either.
  const redirect = canonicalRedirect(request, url, env.SITE_URL)
  if (redirect) return redirect

  if (!isPageRequest(request, url)) return next()

  const response = await next()
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return response

  try {
    const meta = await resolvePageMeta(env, url)
    const site = (env.SITE_URL || url.origin).replace(/\/+$/, '')
    const out = rewrite(response, meta, site)
    // Diagnostic header (harmless to leave in): confirms the edge rewrite ran for this URL.
    out.headers.set('x-seo-meta', `edge;status=${meta.status};noindex=${meta.noindex}`)
    return out
  } catch (err) {
    // Never let SEO decoration take the site down — but say why it was skipped,
    // in the logs and in a response header, so it can't fail silently.
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error('[seo middleware]', url.pathname, message)
    const fallback = new Response(response.body, response)
    fallback.headers.set('x-seo-meta', `skipped;${message.slice(0, 200).replace(/[\r\n]+/g, ' ')}`)
    return fallback
  }
}
