import type { SupabaseClient } from '@supabase/supabase-js'
import type { BasketLine, DeliveryMethod, PricedBasket, PricedLine } from './types'
import { getSiteSettings } from './settings'

/**
 * Delivery pricing. The actual values are admin-editable (see
 * functions/api/admin/settings.ts) and read from site_settings at request
 * time — the constants below are only the fallback used if that row can't
 * be read, and the default value tests in pricing.test.ts pin against.
 * Kept in one place so it's applied identically by /api/basket/price and
 * /api/checkout/create-order (the two places a total is ever calculated).
 *
 * Two Royal Mail shipping methods are offered at checkout:
 *   - 'standard' — Royal Mail 48hr Tracked. Free once the basket subtotal
 *     reaches the admin-configured free delivery threshold.
 *   - 'express'  — Royal Mail 24hr Tracked & Signed. Always charged in full;
 *     it's a premium/expedited option and is never included in the free
 *     delivery threshold.
 */
const STANDARD_DELIVERY_MINOR = 525 // £5.25 — Royal Mail 48hr Tracked
const EXPRESS_DELIVERY_MINOR = 870 // £8.70 — Royal Mail 24hr Tracked & Signed
const FREE_DELIVERY_THRESHOLD_MINOR = 4000 // Free standard delivery over £40

export const SHIPPING_METHOD_LABELS: Record<DeliveryMethod, string> = {
  standard: 'Royal Mail 48hr Tracked',
  express: 'Royal Mail 24hr Tracked & Signed',
}

export function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return value === 'standard' || value === 'express'
}

export function calculateDeliveryMinor(
  subtotalMinor: number,
  method: DeliveryMethod = 'standard',
  standardMinor: number = STANDARD_DELIVERY_MINOR,
  expressMinor: number = EXPRESS_DELIVERY_MINOR,
  freeThresholdMinor: number = FREE_DELIVERY_THRESHOLD_MINOR,
): number {
  if (subtotalMinor <= 0) return 0
  if (method === 'express') return expressMinor
  return subtotalMinor >= freeThresholdMinor ? 0 : standardMinor
}

interface ProductRow {
  id: string
  sku: string
  name: string
  price_minor: number
  stock_quantity: number
  image_url: string
  is_active: boolean
}

/**
 * THE single source of truth for basket pricing. Always reads current
 * price + stock from the database — a basket line's price is NEVER taken
 * from the request body. Used by both /api/basket/price (browsing) and
 * /api/checkout/create-order (immediately before an order is created), so
 * the two can never disagree.
 */
export async function priceBasket(
  supabase: SupabaseClient,
  lines: BasketLine[],
  shippingMethod: DeliveryMethod = 'standard',
): Promise<PricedBasket> {
  // Merge duplicate product ids defensively (the client should never send
  // duplicates, but never trust it).
  const merged = new Map<string, number>()
  for (const line of lines) {
    if (!line.productId || !Number.isFinite(line.quantity) || line.quantity <= 0) continue
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + Math.min(line.quantity, 99))
  }

  const productIds = [...merged.keys()]
  if (productIds.length === 0) {
    return {
      lines: [],
      subtotalMinor: 0,
      deliveryMinor: 0,
      totalMinor: 0,
      currency: 'GBP',
      hasIssues: false,
      deliveryMethod: shippingMethod,
      deliveryMethodLabel: SHIPPING_METHOD_LABELS[shippingMethod],
    }
  }

  const [{ data, error }, settings] = await Promise.all([
    supabase.from('products').select('id, sku, name, price_minor, stock_quantity, image_url, is_active').in('id', productIds),
    getSiteSettings(supabase),
  ])

  if (error) throw new Error('Could not load product data to price the basket.')

  const productsById = new Map<string, ProductRow>((data as ProductRow[]).map((p) => [p.id, p]))

  let hasIssues = false
  const pricedLines: PricedLine[] = []

  for (const [productId, requestedQuantity] of merged) {
    const product = productsById.get(productId)
    if (!product || !product.is_active) {
      hasIssues = true
      pricedLines.push({
        productId,
        quantity: requestedQuantity,
        sku: '',
        name: 'This product is no longer available',
        imageUrl: '',
        unitPriceMinor: 0,
        lineTotalMinor: 0,
        available: false,
        maxAvailableQuantity: 0,
      })
      continue
    }

    const maxAvailableQuantity = Math.max(0, product.stock_quantity)
    const available = maxAvailableQuantity > 0
    const quantity = Math.min(requestedQuantity, maxAvailableQuantity)
    if (!available || quantity < requestedQuantity) hasIssues = true

    pricedLines.push({
      productId,
      quantity: requestedQuantity,
      sku: product.sku,
      name: product.name,
      imageUrl: product.image_url,
      unitPriceMinor: product.price_minor,
      lineTotalMinor: product.price_minor * quantity,
      available,
      maxAvailableQuantity,
    })
  }

  const subtotalMinor = pricedLines
    .filter((l) => l.available)
    .reduce((sum, l) => sum + l.unitPriceMinor * Math.min(l.quantity, l.maxAvailableQuantity), 0)
  const deliveryMinor = calculateDeliveryMinor(
    subtotalMinor,
    shippingMethod,
    settings.deliveryStandardMinor,
    settings.deliveryExpressMinor,
    settings.deliveryFreeThresholdMinor,
  )

  return {
    lines: pricedLines,
    subtotalMinor,
    deliveryMinor,
    totalMinor: subtotalMinor + deliveryMinor,
    currency: 'GBP',
    hasIssues,
    deliveryMethod: shippingMethod,
    deliveryMethodLabel: SHIPPING_METHOD_LABELS[shippingMethod],
  }
}
