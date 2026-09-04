/**
 * UK postcode validation.
 *
 * This is the official general UK postcode format (as published by
 * Royal Mail / gov.uk), NOT a simplified pattern — it correctly accepts
 * all standard formats (e.g. "SW1A 1AA", "M1 1AE", "B33 8TH", "CR2 6XH",
 * "DN55 1PT", "GIR 0AA") and rejects malformed input.
 */
const UK_POSTCODE_REGEX =
  /^(GIR ?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW]) ?[0-9][ABD-HJLNP-UW-Z]{2})$/i

export function isValidUKPostcode(raw: string): boolean {
  const value = raw.trim().toUpperCase()
  if (value.length < 5 || value.length > 8) return false
  return UK_POSTCODE_REGEX.test(value)
}

/** Normalises a UK postcode to the conventional "OUTWARD INWARD" spacing, e.g. "sw1a1aa" -> "SW1A 1AA". */
export function normaliseUKPostcode(raw: string): string {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (compact.length < 5) return raw.trim().toUpperCase()
  const inward = compact.slice(-3)
  const outward = compact.slice(0, -3)
  return `${outward} ${inward}`
}
