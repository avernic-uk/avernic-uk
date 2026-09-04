import { useEffect } from 'react'

interface DocumentMeta {
  title: string
  description?: string
}

/** Lightweight per-page <title>/meta description setter — avoids pulling in a Helmet-style dependency. */
export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | Avernic UK`

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content') ?? null

    if (description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }

    return () => {
      document.title = previousTitle
      if (meta && previousDescription !== null) meta.setAttribute('content', previousDescription)
    }
  }, [title, description])
}
