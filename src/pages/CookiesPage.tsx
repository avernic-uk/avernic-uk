import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { useCookieConsent } from '@/lib/cookies/CookieConsentProvider'
import { Button } from '@/components/ui/Button'

export default function CookiesPage() {
  const { hasDecided, categories, openPreferences } = useCookieConsent()

  return (
    <InfoPageLayout title="Cookie policy" description="How Avernic UK uses cookies and similar technologies." lastUpdated="[date]">
      <p>
        This site uses a small number of cookies and similar local storage technologies, all of them strictly
        necessary to run the shop. We use no advertising or tracking cookies whatsoever, and we don't share your
        data with any third-party analytics service. In line with UK GDPR and the Privacy and Electronic
        Communications Regulations (PECR), we would ask your permission before using anything beyond what's
        strictly necessary — and you can change your mind at any time.
      </p>

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

      <h2 className="text-lg font-semibold text-ink-900">Strictly necessary</h2>
      <p>
        Used to keep you signed in, remember the contents of your basket and your chosen delivery method, and keep
        checkout secure. These cannot be switched off, as the site cannot function correctly without them. As they
        are strictly necessary, PECR does not require your consent for these.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Usage measurement (no cookies)</h2>
      <p>
        We measure how the site is used — how many people visit, which pages and products they look at, what they
        search for, and which sites they arrived from. This is how we decide what to stock, what to fix, and what to
        write about.
      </p>
      <p>
        We do this ourselves rather than using Google Analytics or any other third-party service, and it works
        without cookies. Nothing is stored on your device for this purpose, nothing is shared with anyone else, and
        we cannot use it to identify you or to follow you around other websites.
      </p>
      <p>
        To count visitors without a cookie, our server converts your IP address and browser type into a scrambled
        code using a secret value that changes every day. Your IP address and browser details are used only for that
        split second and are never written down. Because the secret changes daily, the same person visiting on two
        different days produces two unrelated codes — so we can see that a visit happened, but not that it was you,
        and not that you had been here before.
      </p>
      <p>
        Detailed records are deleted after 90 days, leaving only day-by-day totals with no visitor information in
        them at all.
      </p>
      <p>
        Because nothing is stored on your device, this does not legally require your consent — but you can switch it
        off at any time using the button above, and we will stop counting your visits entirely. We also
        automatically respect your browser's &ldquo;Do Not Track&rdquo; and Global Privacy Control settings if you
        have either of those turned on.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Advertising and tracking</h2>
      <p>
        We don't use any. There are no advertising cookies, no third-party trackers, no social media pixels and no
        cross-site profiling on this website.
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
