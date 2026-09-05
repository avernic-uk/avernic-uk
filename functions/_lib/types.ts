// ============================================================================
// Server-side (Cloudflare Pages Functions) domain types.
//
// Pages Functions are compiled/bundled independently of the Vite app (by
// Wrangler), so this file intentionally duplicates the subset of src/types.ts
// that the API needs rather than importing across the Vite/Functions
// boundary. Keep the two in sync when the schema changes.
// ============================================================================

export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  ADMIN_NOTIFICATION_EMAIL: string
  FENA_API_BASE_URL: string
  FENA_INTEGRATION_ID: string
  FENA_SECRET_KEY: string
  /** Optional — only needed if more than one bank account is ever connected; Fena defaults to one automatically otherwise. */
  FENA_BANK_ACCOUNT_ID?: string
  FENA_WEBHOOK_SHARED_SECRET: string
  SITE_URL: string
}

export type PagesFunctionContext = {
  request: Request
  env: Env
  params: Record<string, string>
}

export type UUID = string

export interface BasketLine {
  productId: UUID
  quantity: number
}

/** Royal Mail shipping option chosen at checkout — see functions/_lib/pricing.ts. */
export type DeliveryMethod = 'standard' | 'express'

export interface PricedLine {
  productId: UUID
  quantity: number
  sku: string
  name: string
  imageUrl: string
  unitPriceMinor: number
  lineTotalMinor: number
  available: boolean
  maxAvailableQuantity: number
}

export interface PricedBasket {
  lines: PricedLine[]
  subtotalMinor: number
  deliveryMinor: number
  totalMinor: number
  currency: 'GBP'
  hasIssues: boolean
  deliveryMethod: DeliveryMethod
  deliveryMethodLabel: string
}

export interface Address {
  fullName: string
  line1: string
  line2: string | null
  townCity: string
  county: string | null
  postcode: string
  country: 'United Kingdom'
}

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'dispatched'
  | 'completed'
  | 'cancelled'
  | 'refunded'
