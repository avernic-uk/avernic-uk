import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { ContentBlock, useLastUpdated } from '@/lib/content/ContentBlocks'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import { formatGBP } from '@/lib/format'

/**
 * Copy lives in Admin → Content ("Delivery information"), with one exception:
 * the pricing list in the middle is generated from Admin → Settings rather
 * than typed. Delivery prices appear here, in the basket, at checkout, in
 * llms.txt and in every product's structured data — letting someone re-type
 * them as prose is how a page ends up quoting a price the checkout doesn't
 * charge.
 */
export default function DeliveryPage() {
  const { settings } = useSiteSettings()
  return (
    <InfoPageLayout
      title="Delivery information"
      description="UK delivery options, pricing and timescales for Avernic UK orders."
      lastUpdated={useLastUpdated('delivery.last_updated')}
    >
      <h2 className="text-lg font-semibold text-ink-900">Where we deliver</h2>
      <ContentBlock blockKey="delivery.intro" />

      <h2 className="text-lg font-semibold text-ink-900">Delivery options and pricing</h2>
      <p>You can choose between two Royal Mail tracked delivery options at checkout:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-semibold text-ink-900">Royal Mail 48hr Tracked</strong> —{' '}
          {formatGBP(settings.deliveryStandardMinor)}, free on orders over{' '}
          {formatGBP(settings.deliveryFreeThresholdMinor)}.
        </li>
        <li>
          <strong className="font-semibold text-ink-900">Royal Mail 24hr Tracked &amp; Signed</strong> —{' '}
          {formatGBP(settings.deliveryExpressMinor)}. This express option requires a signature on delivery and is
          not included in free delivery offers.
        </li>
      </ul>
      <p>The exact delivery cost for your basket is shown at checkout before you pay.</p>

      <ContentBlock blockKey="delivery.outro" />
    </InfoPageLayout>
  )
}
