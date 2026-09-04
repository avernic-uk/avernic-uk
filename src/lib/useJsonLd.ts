import { useEffect } from 'react'

/** Injects a JSON-LD <script> tag into <head> for the lifetime of the calling component. */
export function useJsonLd(data: Record<string, unknown> | null) {
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
