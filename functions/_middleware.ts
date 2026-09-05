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

class SetText {
  constructor(private text: string) {}
  element(el: Element) {
    el.setInnerContent(this.text)
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
  const robots = meta.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'

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
  if (meta.status === response.status) return transformed

  const headers = new Headers(transformed.headers)
  return new Response(transformed.body, { status: meta.status, headers })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context
  const url = new URL(request.url)

  if (!isPageRequest(request, url)) return next()

  const response = await next()
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return response

  try {
    const meta = await resolvePageMeta(env, url)
    const site = (env.SITE_URL || url.origin).replace(/\/+$/, '')
    return rewrite(response, meta, site)
  } catch {
    // Never let SEO decoration take the site down.
    return response
  }
}
