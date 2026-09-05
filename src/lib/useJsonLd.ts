import { useEffect } from 'react'

/**
 * Injects a JSON-LD <script> tag into <head> for the lifetime of the calling
 * component. Also removes any JSON-LD the edge middleware
 * (functions/_middleware.ts) baked into the initial HTML for crawlers, so a
 * JavaScript-enabled crawler never sees the same entity described twice.
 */
export function useJsonLd(data: Record<string, unknown> | null) {
  useEffect(() => {
    document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((el) => el.remove())
  }, [])

  useEffect(() => {
    if (!data) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [data])
}
