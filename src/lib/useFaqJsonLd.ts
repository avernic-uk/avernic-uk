import { useMemo } from 'react'
import { useJsonLd } from './useJsonLd'
import { absoluteUrl } from './seo'

interface QandA {
  question: string
  answer: string
}

/**
 * Renders the given FAQ list as FAQPage structured data. On the homepage
 * this matches the equivalent edge-rendered version exactly
 * (functions/_lib/seoMeta.ts#loadFaqGraph), so JS-enabled and non-JS
 * crawlers see the same Q&A markup there. The FAQ page passes a larger,
 * page-only list (its hardcoded sections plus the admin-editable ones) for
 * maximum structured-data coverage of that page's actual content — this is
 * exactly the kind of clearly-labelled content answer engines (Google AI
 * Overviews, Perplexity, ChatGPT search) prefer to extract and cite directly.
 */
export function useFaqJsonLd(faqs: QandA[], path: string) {
  const jsonLd = useMemo(() => {
    if (faqs.length === 0) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${absoluteUrl(path)}#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    }
  }, [faqs, path])
  useJsonLd(jsonLd)
}
