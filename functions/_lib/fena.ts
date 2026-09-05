import type { Env } from './types'

// ============================================================================
// Fena (UK Open Banking payment provider) — payment adapter.
//
// NAMING NOTE: earlier drafts of this codebase called this provider "Fano" —
// that was simply a mishearing of the name early in the project; the
// provider is Fena (fena.co). Everything below — env vars, DB columns, file
// names — has been renamed to match.
//
// SOURCE OF TRUTH FOR THIS FILE: Fena publishes a PHP SDK
// (https://github.com/fena-co/toolkit-php-sdk, src/Payment.php) which is
// what their own official WooCommerce/Shopify/OpenCart payment plugins use
// in production. The base URL, endpoint paths, request fields, and response
// shape below are taken directly from that SDK's source, not guessed.
//
// WHAT IS CONFIRMED (from the SDK source):
//   - Base URL: https://epos.api.prod-gcp.fena.co
//   - Create + redirect a customer to their bank:
//       POST /open/payments/single/create-and-process
//       headers: integration-id, secret-key, Content-Type: application/json
//       body: { reference, amount, bankAccount, customerEmail, customerName, items, customRedirectUrl? }
//       response: { created: boolean, result: { id, reference, amount, status, bankAccount, createdAt, currency, link } }
//     `result.link` is the URL to send the customer to. The SDK extracts a
//     "hashed id" from it (the substring after the last "=") and uses that,
//     not `result.id`, to check status later.
//   - Check status (PUBLIC, unauthenticated, keyed by the opaque hashed id
//     from the link above — not a guessable sequential id):
//       GET /public/payment-flow/payment/{hashedId}
//       response: { data: { id, status, amount, reference, customerName, customerEmail, completedAt, dueDate } }
//   - `reference` must be 1-12 characters, matching /^[a-z0-9-]+$/i — this is
//     SHORTER than Avernic UK's own order numbers (e.g. "AV-20260904-7K2Q9"),
//     so a separate short reference is generated per payment attempt below
//     rather than reusing the order number.
//   - `amount` is a decimal string with exactly two places, e.g. "18.92" —
//     NOT minor units.
//   - `bankAccount` is Avernic UK's OWN receiving bank account id as
//     registered in the Fena dashboard (Settings) — not anything about the
//     customer's bank. It has to be copied in as FENA_BANK_ACCOUNT_ID.
//   - Terminal ID / Terminal Secret (shown when generating an API key in the
//     Fena dashboard: Settings -> API keys -> Generate API Key) are the same
//     credential pair as `integration-id` / `secret-key` above.
//
// WHAT IS NOT PUBLICLY CONFIRMED:
//   - The exact JSON shape and signature scheme Fena posts to a merchant's
//     configured "payment notification" (webhook) URL. Fena's own SDK ships
//     a `NotificationHandler` class that reads $token['orderID'],
//     ['requestAmount'], ['netAmount'], ['id'], ['terminal'] — implying
//     those are the top-level JSON keys — but there is no public signature
//     verification code to copy, and inventing one for a payments webhook
//     would be worse than not trusting it.
//   - The exact set of status strings this single-payment flow can return
//     (Fena's docs list a longer status vocabulary — Draft/Sent/Overdue/etc
//     — that reads like their separate invoicing product, not this one).
//
// HOW THIS IS HANDLED: this integration NEVER treats the webhook body as a
// trusted source of truth. The webhook (functions/api/payments/fena/webhook.ts)
// is used only as a "something changed, go check" trigger; the actual
// status is always fetched fresh, straight from Fena's own public status
// endpoint, by this server, using the hashedId this server itself stored at
// payment-creation time. Any Fena status string this file doesn't
// recognise maps to 'unknown', which callers must treat as "no change" —
// never as a failure — so a real but unanticipated status can never be
// misread as a failed or paid payment.
// ============================================================================

const DEFAULT_BASE_URL = 'https://epos.api.prod-gcp.fena.co'

export class FenaNotConfiguredError extends Error {
  constructor() {
    super(
      'Fena Open Banking is not yet configured for this environment. Set FENA_INTEGRATION_ID, ' +
        'FENA_SECRET_KEY and FENA_BANK_ACCOUNT_ID from the Fena dashboard (Settings -> API keys).',
    )
  }
}

function isFenaConfigured(env: Env): boolean {
  return Boolean(env.FENA_INTEGRATION_ID && env.FENA_SECRET_KEY && env.FENA_BANK_ACCOUNT_ID)
}

function baseUrl(env: Env): string {
  return env.FENA_API_BASE_URL || DEFAULT_BASE_URL
}

/**
 * Fena's `reference` field must be 1-12 chars, /^[a-z0-9-]+$/i — Avernic
 * UK's own order numbers are longer and carry no meaning to Fena, so each
 * payment attempt gets its own short, unique, Fena-safe reference instead.
 * This is what's stored in payments.provider_reference and is expected to
 * come back as the webhook's `orderID` field.
 */
export function generateFenaReference(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

function toFenaAmount(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2)
}

export interface CreateFenaPaymentRequest {
  /** A Fena-safe reference from generateFenaReference() — NOT the order number. */
  reference: string
  amountMinor: number
  customerEmail?: string
  customerName?: string
  /** Where Fena redirects the customer after they complete (or abandon) payment at their bank. */
  customRedirectUrl: string
}

export interface CreateFenaPaymentResult {
  /** Fena's own payment id (result.id) — kept for reference/support purposes. */
  paymentId: string
  /** Opaque id extracted from the payment link — the only thing needed to poll status. */
  hashedId: string
  /** URL to send the customer to, to authorise payment with their bank. */
  redirectUrl: string
  raw: unknown
}

/** Creates a Fena Open Banking payment and returns the URL to redirect the customer to. */
export async function createFenaPayment(env: Env, req: CreateFenaPaymentRequest): Promise<CreateFenaPaymentResult> {
  if (!isFenaConfigured(env)) throw new FenaNotConfiguredError()

  const res = await fetch(`${baseUrl(env)}/open/payments/single/create-and-process`, {
    method: 'POST',
    headers: {
      'integration-id': env.FENA_INTEGRATION_ID,
      'secret-key': env.FENA_SECRET_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference: req.reference,
      amount: toFenaAmount(req.amountMinor),
      bankAccount: env.FENA_BANK_ACCOUNT_ID,
      customerEmail: req.customerEmail ?? '',
      customerName: req.customerName ?? '',
      items: [],
      customRedirectUrl: req.customRedirectUrl,
    }),
  })

  const raw: unknown = await res.json().catch(() => null)
  const createdOk = Boolean(raw && typeof raw === 'object' && (raw as { created?: boolean }).created)
  if (!res.ok || !createdOk) {
    throw new Error(`Fena payment creation failed (${res.status}): ${JSON.stringify(raw)}`)
  }

  const result = (raw as { result?: Record<string, unknown> }).result
  const link = result?.link as string | undefined
  const paymentId = result?.id as string | undefined
  if (!link || !paymentId) {
    throw new Error(`Fena payment creation returned an unexpected shape: ${JSON.stringify(raw)}`)
  }

  const hashedId = link.slice(link.lastIndexOf('=') + 1)
  if (!hashedId) throw new Error(`Could not extract a hashed id from Fena's payment link: ${link}`)

  return { paymentId, hashedId, redirectUrl: link, raw }
}

export type NormalisedFenaStatus = 'processing' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'unknown'

function normaliseFenaStatus(status: unknown): NormalisedFenaStatus {
  switch (String(status ?? '').toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'success':
      return 'paid'
    case 'pending':
    case 'processing':
    case 'sent':
      return 'processing'
    case 'failed':
    case 'rejected':
    case 'declined':
      return 'failed'
    case 'cancelled':
    case 'canceled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    default:
      // Deliberately not treated as failure — see file header.
      return 'unknown'
  }
}

export interface FenaPaymentStatusResult {
  status: NormalisedFenaStatus
  raw: unknown
}

/**
 * Fetches the CURRENT status of a payment straight from Fena's own public
 * status endpoint. This is the ONLY source of truth this integration
 * trusts — called both when the customer is redirected back to Avernic UK,
 * and whenever the webhook fires (as a trigger to re-check, never as a
 * trusted report of what happened).
 */
export async function checkFenaPaymentStatus(env: Env, hashedId: string): Promise<FenaPaymentStatusResult> {
  const res = await fetch(`${baseUrl(env)}/public/payment-flow/payment/${encodeURIComponent(hashedId)}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  const raw: unknown = await res.json().catch(() => null)
  if (!res.ok || !raw) {
    throw new Error(`Fena payment status check failed (${res.status}): ${JSON.stringify(raw)}`)
  }
  const data = (raw as { data?: Record<string, unknown> }).data
  return { status: normaliseFenaStatus(data?.status), raw }
}
