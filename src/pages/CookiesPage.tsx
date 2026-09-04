import { InfoPageLayout } from '@/components/layout/InfoPageLayout'

export default function CookiesPage() {
  return (
    <InfoPageLayout title="Cookie policy" description="How Avernic UK uses cookies and similar technologies." lastUpdated="[date]">
      <p>This site uses a small number of cookies and similar local storage technologies.</p>

      <h2 className="text-lg font-semibold text-ink-900">Strictly necessary</h2>
      <p>
        Used to keep you signed in, remember the contents of your basket, and keep checkout
        secure. These cannot be switched off, as the site cannot function correctly without them.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Analytics</h2>
      <p>
        [If Avernic UK adds analytics in future, they will be listed here along with how to opt
        out.]
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Managing cookies</h2>
      <p>
        You can control and delete cookies through your browser settings. Blocking strictly
        necessary cookies may prevent parts of this site, such as checkout, from working correctly.
      </p>
    </InfoPageLayout>
  )
}
