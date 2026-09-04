import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'

export default function DeliveryPage() {
  return (
    <InfoPageLayout title="Delivery information" description="UK delivery options, pricing and timescales for Avernic UK orders." lastUpdated="[date]">
      <h2 className="text-lg font-semibold text-ink-900">Where we deliver</h2>
      <p>Avernic UK delivers to addresses within the United Kingdom only. We do not currently offer international shipping.</p>

      <h2 className="text-lg font-semibold text-ink-900">Delivery pricing</h2>
      <p>
        Standard UK delivery is currently <Placeholder>confirm delivery price, e.g. £2.95</Placeholder>, and free
        on orders over <Placeholder>confirm free delivery threshold, e.g. £40</Placeholder>. Delivery cost is shown at
        checkout before you pay.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Delivery timescales</h2>
      <p>
        <Placeholder>Confirm estimated delivery timescale, e.g. "orders are typically dispatched within 1–2 working days and
        delivered within 3–5 working days"</Placeholder>. Timescales are estimates and not guaranteed delivery dates.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Delivery courier</h2>
      <p><Placeholder>Confirm courier(s) used</Placeholder>.</p>

      <h2 className="text-lg font-semibold text-ink-900">Problems with delivery</h2>
      <p>
        If your order hasn't arrived within the expected timescale, or arrives damaged, please{' '}
        <a href="/contact" className="underline">contact us</a> with your order number.
      </p>
    </InfoPageLayout>
  )
}
