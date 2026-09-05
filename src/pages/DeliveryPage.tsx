import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'

function formatPounds(minor: number): string {
  return `£${(minor / 100).toFixed(2)}`
}

export default function DeliveryPage() {
  const { settings } = useSiteSettings()
  return (
    <InfoPageLayout title="Delivery information" description="UK delivery options, pricing and timescales for Avernic UK orders." lastUpdated="[date]">
      <h2 className="text-lg font-semibold text-ink-900">Where we deliver</h2>
      <p>Avernic UK delivers to addresses within the United Kingdom only. We do not currently offer international shipping.</p>

      <h2 className="text-lg font-semibold text-ink-900">Delivery options and pricing</h2>
      <p>You can choose between two Royal Mail tracked delivery options at checkout:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-semibold text-ink-900">Royal Mail 48hr Tracked</strong> — {formatPounds(settings.deliveryStandardMinor)}, free on orders
          over {formatPounds(settings.deliveryFreeThresholdMinor)}.
        </li>
        <li>
          <strong className="font-semibold text-ink-900">Royal Mail 24hr Tracked &amp; Signed</strong> — {formatPounds(settings.deliveryExpressMinor)}. This
          express option requires a signature on delivery and is not included in free delivery offers.
        </li>
      </ul>
      <p>The exact delivery cost for your basket is shown at checkout before you pay.</p>

      <h2 className="text-lg font-semibold text-ink-900">Delivery timescales</h2>
      <p>
        Royal Mail 48hr Tracked parcels are typically delivered within 2 working days of dispatch, and Royal Mail
        24hr Tracked &amp; Signed parcels within 1 working day. <Placeholder>Confirm typical dispatch time, e.g.
        "orders are typically dispatched within 1–2 working days"</Placeholder>. Timescales are estimates and not
        guaranteed delivery dates.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Delivery courier</h2>
      <p>All orders are sent via Royal Mail using a tracked service.</p>

      <h2 className="text-lg font-semibold text-ink-900">Problems with delivery</h2>
      <p>
        If your order hasn't arrived within the expected timescale, or arrives damaged, please{' '}
        <a href="/contact" className="underline">contact us</a> with your order number.
      </p>
    </InfoPageLayout>
  )
}
