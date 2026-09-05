import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { priceBasket } from '../../_lib/pricing'
import { isValidUKPostcode, normaliseUKPostcode } from '../../_lib/postcode'
import { generateOrderNumber } from '../../_lib/orderNumber'
import { createFenaPayment, generateFenaReference, FenaNotConfiguredError } from '../../_lib/fena'
import { getAuthedUserId } from '../../_lib/auth'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env, BasketLine, Address } from '../../_lib/types'

interface CreateOrderBody {
  customer: {
    fullName: string
    email: string
    telephone: string
  }
  address: {
    line1: string
    line2?: string
    townCity: string
    county?: string
    postcode: string
  }
  lines: BasketLine[]
  consent: {
    termsAccepted: boolean
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// UK landline/mobile, loosely: optional +44/0 prefix, 9-11 digits, spaces allowed.
const UK_PHONE_REGEX = /^(?:\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$|^(?:\+44\s?\d{2,4}|\(?0\d{2,4}\)?)\s?\d{3,4}\s?\d{3,4}$/

function validate(body: CreateOrderBody): string[] {
  const errors: string[] = []
  if (!body.customer?.fullName?.trim()) errors.push('Full name is required.')
  if (!body.customer?.email || !EMAIL_REGEX.test(body.customer.email)) errors.push('A valid email address is required.')
  if (!body.customer?.telephone || !UK_PHONE_REGEX.test(body.customer.telephone.replace(/\s+/g, ' ').trim())) {
    errors.push('A valid UK telephone number is required.')
  }
  if (!body.address?.line1?.trim()) errors.push('Address line 1 is required.')
  if (!body.address?.townCity?.trim()) errors.push('Town or city is required.')
  if (!body.address?.postcode || !isValidUKPostcode(body.address.postcode)) {
    errors.push('A valid UK postcode is required. Avernic UK only delivers within the United Kingdom.')
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0) errors.push('Your basket is empty.')
  if (!body.consent?.termsAccepted) errors.push('You must accept the Terms & Conditions to place an order.')
  return errors
}

/**
 * POST /api/checkout/create-order
 *
 * Flow (per the required architecture):
 *   1. Validate customer details + UK-only delivery address + consent.
 *   2. Re-price the basket server-side (never trust client prices/totals).
 *   3. Reject if the basket has any availability/stock issues.
 *   4. Create a pending_payment order + order_items (frozen unit prices).
 *   5. Attempt to create a Fena Open Banking payment for the order total.
 *   6. Return the order + (if available) the Fena redirect URL.
 *
 * Payment success is NEVER assumed here — the order is created as
 * pending_payment/pending and is only ever moved to paid once this server
 * itself confirms it directly against Fena's API (see
 * functions/_lib/paymentReconciliation.ts) — never from a client redirect
 * or webhook body alone.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json().catch(() => null)) as CreateOrderBody | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const validationErrors = validate(body)
    if (validationErrors.length > 0) {
      throw new ApiError(422, validationErrors.join(' '))
    }

    const supabase = getSupabaseAdmin(context.env)

    // Re-price server-side — this is the only price/total the order will ever use.
    const priced = await priceBasket(supabase, body.lines)
    if (priced.hasIssues || priced.lines.length === 0) {
      return json(
        {
          error:
            'Some items in your basket are no longer available in the quantity requested. Please review your basket and try again.',
          priced,
        },
        { status: 409 },
      )
    }

    const address: Address = {
      fullName: body.customer.fullName.trim(),
      line1: body.address.line1.trim(),
      line2: body.address.line2?.trim() || null,
      townCity: body.address.townCity.trim(),
      county: body.address.county?.trim() || null,
      postcode: normaliseUKPostcode(body.address.postcode),
      country: 'United Kingdom',
    }

    const customerId = await getAuthedUserId(context.request, context.env)
    const orderNumber = generateOrderNumber()

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        email: body.customer.email.trim().toLowerCase(),
        telephone: body.customer.telephone.trim(),
        delivery_address: address,
        subtotal_minor: priced.subtotalMinor,
        delivery_minor: priced.deliveryMinor,
        total_minor: priced.totalMinor,
        currency: 'GBP',
        payment_status: 'pending',
        order_status: 'pending_payment',
      })
      .select('id, order_number')
      .single()

    if (orderError || !orderRow) {
      throw new ApiError(500, 'Could not create your order. Please try again.')
    }

    const orderItems = priced.lines.map((line) => ({
      order_id: orderRow.id,
      product_id: line.productId,
      sku: line.sku,
      name: line.name,
      quantity: line.quantity,
      unit_price_minor: line.unitPriceMinor,
      line_total_minor: line.lineTotalMinor,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      // Best-effort cleanup so we don't leave an order with no items.
      await supabase.from('orders').delete().eq('id', orderRow.id)
      throw new ApiError(500, 'Could not create your order. Please try again.')
    }

    // Attempt to create the Fena payment. If Fena isn't configured yet, the
    // order still exists (pending_payment) — we tell the customer payment
    // isn't available rather than pretending it succeeded. Fena's
    // `reference` field is capped at 12 chars, shorter than our own order
    // numbers, so a separate short reference is generated per attempt.
    const fenaReference = generateFenaReference()
    try {
      const payment = await createFenaPayment(context.env, {
        reference: fenaReference,
        amountMinor: priced.totalMinor,
        customerEmail: body.customer.email.trim().toLowerCase(),
        customerName: body.customer.fullName.trim(),
        customRedirectUrl: `${context.env.SITE_URL}/order-confirmation/${orderRow.order_number}`,
      })

      await supabase.from('payments').insert({
        order_id: orderRow.id,
        provider: 'fena',
        provider_reference: fenaReference,
        fena_hashed_id: payment.hashedId,
        status: 'pending',
        amount_minor: priced.totalMinor,
        currency: 'GBP',
        raw_response: payment.raw as object,
      })

      await supabase.from('orders').update({ fena_payment_reference: fenaReference }).eq('id', orderRow.id)

      return json({
        orderNumber: orderRow.order_number,
        totalMinor: priced.totalMinor,
        payment: { redirectUrl: payment.redirectUrl },
      })
    } catch (fenaError) {
      const notConfigured = fenaError instanceof FenaNotConfiguredError
      return json(
        {
          orderNumber: orderRow.order_number,
          totalMinor: priced.totalMinor,
          payment: null,
          error: notConfigured
            ? 'Open Banking payment is not yet available on this environment. Your order has been saved as pending payment — please contact us to complete payment, or try again once payment is configured.'
            : 'We could not start your Open Banking payment. Your order has been saved — please try again.',
        },
        { status: 502 },
      )
    }
  } catch (error) {
    return errorResponse(error)
  }
}
