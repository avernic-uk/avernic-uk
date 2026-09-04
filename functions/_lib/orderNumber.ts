/** Generates a human-friendly, sufficiently-unique order number, e.g. "AV-20260904-7K2Q9". */
export function generateOrderNumber(): string {
  const date = new Date()
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const random = crypto.randomUUID().split('-')[0].slice(0, 5).toUpperCase()
  return `AV-${y}${m}${d}-${random}`
}
