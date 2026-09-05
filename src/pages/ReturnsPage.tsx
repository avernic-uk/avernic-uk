import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'

export default function ReturnsPage() {
  return (
    <InfoPageLayout title="Returns & refunds" description="How to return an item and how refunds are processed at Avernic UK." lastUpdated="[date]">
      <h2 className="text-lg font-semibold text-ink-900">Your right to cancel</h2>
      <p>
        Under the Consumer Contracts Regulations, you generally have the right to cancel an order
        within 14 days of receiving it, without giving a reason.{' '}
        <Placeholder>Confirm exact policy — some skincare products may be exempt from return
        once opened for hygiene/safety reasons; confirm and list any exceptions here.</Placeholder>
      </p>

      <h2 className="text-lg font-semibold text-ink-900">How to start a return</h2>
      <p><Placeholder>Confirm the return process — e.g. contact us with your order number, we'll provide a returns address and instructions.</Placeholder></p>

      <h2 className="text-lg font-semibold text-ink-900">Condition of returned items</h2>
      <p><Placeholder>Confirm condition requirements (unopened, unused, original packaging, etc.)</Placeholder></p>

      <h2 className="text-lg font-semibold text-ink-900">Refunds</h2>
      <p>
        <Placeholder>Confirm refund method and timescale, e.g. "refunds are issued to your original payment
        method within 14 days of us receiving the returned item"</Placeholder>.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">Faulty or incorrect items</h2>
      <p>
        If an item arrives faulty, damaged, or different from what you ordered, please{' '}
        <a href="/contact" className="underline">contact us</a> as soon as possible.
      </p>
    </InfoPageLayout>
  )
}
