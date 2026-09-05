import { useMemo } from 'react'
import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { Accordion } from '@/components/ui/Accordion'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import { useFaqJsonLd } from '@/lib/useFaqJsonLd'

export default function FaqPage() {
  const { faqs } = useSiteSettings()

  // Grouped by the optional category on each entry, preserving the order the
  // admin panel sorts them into. Uncategorised entries lead, under a general
  // heading — so adding a question without picking a category still puts it
  // somewhere sensible rather than nowhere.
  const groups = useMemo(() => {
    const byCategory = new Map<string, typeof faqs>()
    for (const faq of faqs) {
      const key = faq.category ?? ''
      const existing = byCategory.get(key)
      if (existing) existing.push(faq)
      else byCategory.set(key, [faq])
    }
    return [...byCategory.entries()]
      .sort((a, b) => (a[0] === '' ? -1 : b[0] === '' ? 1 : 0))
      .map(([heading, items]) => ({ heading: heading || 'General questions', items }))
  }, [faqs])

  useFaqJsonLd(faqs, '/faq')
  return (
    <InfoPageLayout title="Frequently asked questions" description="Answers to common questions about ordering, payment, delivery and returns at Avernic UK.">
      <div className="space-y-10">
        {groups.length === 0 && <p className="text-sm text-ink-500">No questions have been published yet.</p>}
        {groups.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-ink-900">{section.heading}</h2>
            <div className="mt-4">
              <Accordion items={section.items} />
            </div>
          </section>
        ))}
      </div>
    </InfoPageLayout>
  )
}
