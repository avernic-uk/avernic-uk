import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import { formatGBP } from '@/lib/format'
import type { DeliveryMethod } from '@/types'

interface Option {
  method: DeliveryMethod
  label: string
  description: string
}

const OPTIONS: Option[] = [
  { method: 'standard', label: 'Royal Mail 48hr Tracked', description: 'Tracked delivery, usually within 2 working days.' },
  { method: 'express', label: 'Royal Mail 24hr Tracked & Signed', description: 'Next-day tracked delivery, signed for on arrival.' },
]

/**
 * Lets the customer choose a Royal Mail shipping option at checkout. Prices
 * shown here mirror exactly what functions/_lib/pricing.ts#calculateDeliveryMinor
 * charges server-side (standard is free over the admin-set threshold; express
 * is always charged in full) — this component is display-only, the actual
 * total is always re-derived on the server via /api/basket/price once
 * `onChange` updates the selected method.
 */
export function ShippingMethodPicker({
  value,
  onChange,
  subtotalMinor,
}: {
  value: DeliveryMethod
  onChange: (method: DeliveryMethod) => void
  subtotalMinor: number
}) {
  const { settings } = useSiteSettings()
  const standardFree = subtotalMinor > 0 && subtotalMinor >= settings.deliveryFreeThresholdMinor
  const priceFor = (method: DeliveryMethod) =>
    method === 'express' ? settings.deliveryExpressMinor : standardFree ? 0 : settings.deliveryStandardMinor

  return (
    <div role="radiogroup" aria-label="Delivery method" className="space-y-3">
      {OPTIONS.map((option) => {
        const price = priceFor(option.method)
        const selected = value === option.method
        return (
          <label
            key={option.method}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              selected ? 'border-accent-500 bg-accent-50 dark:bg-accent-50/60' : 'border-ink-200 hover:border-ink-400'
            }`}
          >
            <input
              type="radio"
              name="shippingMethod"
              value={option.method}
              checked={selected}
              onChange={() => onChange(option.method)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-accent-500 focus-visible:outline-2 focus-visible:outline-accent-500"
            />
            <span className="flex flex-1 items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-medium text-ink-900">{option.label}</span>
                <span className="mt-0.5 block text-xs text-ink-500">{option.description}</span>
              </span>
              <span className="whitespace-nowrap text-sm font-semibold text-ink-950">
                {price === 0 ? 'Free' : formatGBP(price)}
              </span>
            </span>
          </label>
        )
      })}
      {!standardFree && settings.deliveryFreeThresholdMinor > 0 && (
        <p className="text-xs text-ink-500">
          Spend {formatGBP(Math.max(0, settings.deliveryFreeThresholdMinor - subtotalMinor))} more to get free Royal Mail 48hr Tracked delivery.
        </p>
      )}
    </div>
  )
}
