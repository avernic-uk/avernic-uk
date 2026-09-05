// ============================================================================
// Domain types shared across the frontend. These mirror the Supabase schema
// in supabase/migrations/0001_init.sql — keep them in sync when the schema
// changes. Cloudflare Pages Functions in functions/ maintain their own copy
// in functions/_lib/types.ts (functions are compiled independently by
// Wrangler, outside the Vite/TS project), so update both places together.
// ============================================================================

export type UUID = string

export interface ProductCategory {
  id: UUID
  slug: string
  name: string
  description: string | null
  sortOrder: number
}

export interface ProductImage {
  url: string
  alt: string
}

export interface Product {
  id: UUID
  slug: string
  sku: string
  name: string
  shortDescription: string
  fullDescription: string
  /** Price in pence (integer, GBP). Never store money as a float. */
  priceMinor: number
  /** Optional "was" price in pence, for showing a strike-through comparison. */
  compareAtPriceMinor: number | null
  categoryId: UUID
  categorySlug: string
  stockQuantity: number
  imageUrl: string
  additionalImages: ProductImage[]
  isActive: boolean
  isFeatured: boolean
  metadata: Record<string, string> | null
  createdAt: string
  updatedAt: string
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'dispatched'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export interface Address {
  fullName: string
  line1: string
  line2: string | null
  townCity: string
  county: string | null
  postcode: string
  /** Always "United Kingdom" — Avernic UK ships within the UK only. */
  country: 'United Kingdom'
}

export interface OrderItem {
  productId: UUID
  sku: string
  name: string
  quantity: number
  /** Unit price in pence AT THE TIME OF PURCHASE — never re-derived from the live product. */
  unitPriceMinor: number
  lineTotalMinor: number
}

export interface Order {
  id: UUID
  orderNumber: string
  customerId: UUID | null
  email: string
  telephone: string
  deliveryAddress: Address
  items: OrderItem[]
  subtotalMinor: number
  deliveryMinor: number
  totalMinor: number
  currency: 'GBP'
  fenaPaymentReference: string | null
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface BasketLine {
  productId: UUID
  quantity: number
}

/**
 * Cart contents kept client-side are ALWAYS re-priced server-side before
 * checkout. This shape matches exactly what POST /api/basket/price returns
 * (see functions/_lib/types.ts#PricedLine) — it is a flat snapshot, not the
 * full Product record, since availability/name/image can differ from what
 * the browser last knew.
 */
export interface BasketPricedLine extends BasketLine {
  sku: string
  name: string
  imageUrl: string
  unitPriceMinor: number
  lineTotalMinor: number
  available: boolean
  maxAvailableQuantity: number
}

export interface PricedBasket {
  lines: BasketPricedLine[]
  subtotalMinor: number
  deliveryMinor: number
  totalMinor: number
  currency: 'GBP'
  hasIssues: boolean
}

/** Admin-editable site content — see supabase/migrations/0003_admin_content.sql. */
export interface SiteSettings {
  companyName: string
  companyNumber: string
  registeredAddress: string
  contactEmail: string
  contactPhone: string
  deliveryStandardMinor: number
  deliveryFreeThresholdMinor: number
  heroHeading: string
  heroSubheading: string
  ageNoticeText: string
}

export interface Faq {
  id: UUID
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
}
