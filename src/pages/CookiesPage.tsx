import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { useCookieConsent } from '@/lib/cookies/CookieConsentProvider'
import { Button } from '@/components/ui/Button'

export default function CookiesPage() {
  const { hasDecided, categories, openPreferences } = useCookieConsent()

  return (
    <InfoPageLayout title="Cookie policy" description="How Avernic UK uses cookies and similar technologies." lastUpdated="[date]">
      <p>
        This site uses a small number of cookies and similar local storage technologies. In line with UK GDPR and
        the Privacy and Electronic Communications Regulations (PECR), we ask for your permission before using
        anything beyond what's strictly necessary to run the site, and you can change your mind at any time.
      </p>

      <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-5">
        <p className="text-sm text-ink-700">
          {hasDecided
            ? `Your current choice: analytics cookies are ${categories.analytics ? 'switched on' : 'switched off'}.`
            : "You haven't made a cookie choice on this device yet."}
        </p>
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={openPreferences}>
            Manage cookie preferences
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-ink-900">Strictly necessary</h2>
      <p>
        Used to keep you signed in, remember the contents of your basket and your chosen delivery method, and keep
        checkout secure. These cannot be switched off, as the site cannot function correctly without them. As they
        are strictly necessary, PECR does not require your consent for these.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Analytics</h2>
      <p>
        Would help us understand how the site is used, so we can improve it. These are switched off by default and
        only ever used if you explicitly turn them on in the cookie preferences panel above.
        [If Avernic UK adds a specific analytics provider in future, it will be named here along with how to opt out.]
      </p>

      <h2 className="text-lg font-semibold text-ink-900">How your choice is stored</h2>
      <p>
        Your cookie preference itself is remembered in your browser's local storage on this device — it is not sent
        to us or shared with anyone. If you use a different device or browser, or clear your browsing data, you'll
        be asked again.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Managing cookies in your browser</h2>
      <p>
        You can also control and delete cookies through your browser settings. Blocking strictly necessary cookies
        may prevent parts of this site, such as checkout, from working correctly.
      </p>
    </InfoPageLayout>
  )
}
