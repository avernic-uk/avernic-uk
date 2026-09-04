// Server-side copy of src/lib/validation/postcode.ts — see that file for notes.
// Functions are compiled independently of the Vite app, so this is
// intentionally duplicated rather than imported across that boundary.

const UK_POSTCODE_REGEX =
  /^(GIR ?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW]) ?[0-9][ABD-HJLNP-UW-Z]{2})$/i

export function isValidUKPostcode(raw: string): boolean {
  const value = raw.trim().toUpperCase()
  if (value.length < 5 || value.length > 8) return false
  return UK_POSTCODE_REGEX.test(value)
}

export function normaliseUKPostcode(raw: string): string {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (compact.length < 5) return raw.trim().toUpperCase()
  const inward = compact.slice(-3)
  const outward = compact.slice(0, -3)
  return `${outward} ${inward}`
}
