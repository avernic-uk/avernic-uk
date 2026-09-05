import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { ContentBlock, useLastUpdated } from '@/lib/content/ContentBlocks'
import { useCookieConsent } from '@/lib/cookies/CookieConsentProvider'
import { Button } from '@/components/ui/Button'

/**
 * Copy lives in Admin → Content ("Cookie policy"), wrapped around the one part
 * that can't be text: the live view of this visitor's own choice, and the
 * button that reopens the preferences panel. Consent has to be as easy to
 * withdraw as it was to give, so that control stays in code rather than
 * depending on someone remembering to write it into the page.
 */
export default function CookiesPage() {
  const { hasDecided, categories, openPreferences } = useCookieConsent()

  return (
    <InfoPageLayout
      title="Cookie policy"
      description="How Avernic UK uses cookies and similar technologies."
      lastUpdated={useLastUpdated('cookies.last_updated')}
    >
      <ContentBlock blockKey="cookies.intro" />

      <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-5">
        <p className="text-sm text-ink-700">
          {hasDecided
            ? `Your current choice: usage measurement is ${categories.analytics ? 'switched on' : 'switched off'}.`
            : 'You have not set a preference on this device yet, so usage measurement is on. You can switch it off below.'}
        </p>
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={openPreferences}>
            Manage cookie preferences
          </Button>
        </div>
      </div>

      <ContentBlock blockKey="cookies.body" />
    </InfoPageLayout>
  )
}
