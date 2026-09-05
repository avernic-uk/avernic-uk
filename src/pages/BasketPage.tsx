import { useBasket } from '@/lib/basket/BasketProvider'
import { formatGBP } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Button, ButtonLink } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps'
import { SecureCheckoutBadges } from '@/components/checkout/SecureCheckoutBadges'

export default function BasketPage() {
  useDocumentMeta({ title: 'Your basket', noindex: true })
  const { priced, pricing, pricingError, updateQuantity, removeItem, itemCount } = useBasket()

  if (itemCount === 0 && !pricing) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink-950">Your basket is empty</h1>
        <p className="mt-2 text-sm text-ink-600">Browse our range and add something you need.</p>
        <div className="mt-8">
          <ButtonLink to="/shop" variant="primary">
            Continue shopping
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <CheckoutSteps current="basket" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold text-ink-950">Your basket</h1>

      {pricingError && (
        <div className="mt-6">
          <Alert tone="danger">{pricingError}</Alert>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {priced?.hasIssues && (
            <div className="mb-6">
              <Alert tone="warning" title="Your basket has changed">
                Some items were unavailable or had limited stock, so we've updated your basket to
                what's currently available.
              </Alert>
            </div>
          )}

          <ul className="divide-y divide-ink-200 rounded-2xl border border-ink-200">
            {(priced?.lines ?? []).map((line) => (
              <li key={line.productId} className="flex gap-4 p-4 sm:p-5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {line.imageUrl && <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-950">{line.name}</p>
                    {!line.available ? (
                      <Badge tone="danger">No longer available</Badge>
                    ) : line.quantity > line.maxAvailableQuantity ? (
                      <Badge tone="warning">Only {line.maxAvailableQuantity} in stock</Badge>
                    ) : (
                      <p className="mt-1 text-sm text-ink-500">{formatGBP(line.unitPriceMinor)} each</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <QuantityStepper
                      quantity={line.quantity}
                      max={Math.max(1, line.maxAvailableQuantity)}
                      onChange={(q) => updateQuantity(line.productId, q)}
                      label={`quantity of ${line.name}`}
                    />
                    <span className="w-20 text-right text-sm font-semibold text-ink-950">
                      {formatGBP(line.lineTotalMinor)}
                    </span>
                    <button
                      onClick={() => removeItem(line.productId)}
                      aria-label={`Remove ${line.name} from basket`}
                      className="text-ink-400 hover:text-danger-600"
                    >
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                        <path d="M4 6h12M8 6V4h4v2m-6 0 .6 10.2A2 2 0 0 0 8.6 18h2.8a2 2 0 0 0 2-1.8L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-2xl border border-ink-200 bg-ink-50/60 p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-ink-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="text-ink-900">{formatGBP(priced?.subtotalMinor ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="text-ink-900">
                {(priced?.deliveryMinor ?? 0) === 0 ? 'Free' : formatGBP(priced?.deliveryMinor ?? 0)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-semibold">
              <dt className="text-ink-950">Total</dt>
              <dd className="text-ink-950">{formatGBP(priced?.totalMinor ?? 0)}</dd>
            </div>
          </dl>

          {pricing || !priced || priced.hasIssues || priced.lines.length === 0 ? (
            <Button variant="accent" size="lg" fullWidth className="mt-6" disabled>
              Checkout
            </Button>
          ) : (
            <ButtonLink to="/checkout" variant="accent" size="lg" fullWidth className="mt-6">
              Checkout
            </ButtonLink>
          )}
          <p className="mt-3 text-center text-xs text-ink-500">UK delivery only. Prices in GBP, inclusive of VAT where applicable.</p>
          <div className="mt-5 border-t border-ink-200 pt-4">
            <SecureCheckoutBadges />
          </div>
        </aside>
      </div>
    </div>
  )
}
