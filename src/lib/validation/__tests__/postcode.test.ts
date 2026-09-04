import { describe, expect, it } from 'vitest'
import { isValidUKPostcode, normaliseUKPostcode } from '../postcode'

describe('isValidUKPostcode', () => {
  it.each(['SW1A 1AA', 'M1 1AE', 'B33 8TH', 'CR2 6XH', 'DN55 1PT', 'GIR 0AA', 'EC1A 1BB', 'W1A 0AX', 'sw1a1aa'])(
    'accepts valid UK postcode %s',
    (postcode) => {
      expect(isValidUKPostcode(postcode)).toBe(true)
    },
  )

  it.each(['12345', 'ABCDE', '90210', 'SW1A', '', 'AAAA AAA', '1234 567', 'ZZ99 9ZZ'.slice(0, 2)])(
    'rejects invalid / non-UK postcode %s',
    (postcode) => {
      expect(isValidUKPostcode(postcode)).toBe(false)
    },
  )

  it('rejects a US zip code', () => {
    expect(isValidUKPostcode('90210')).toBe(false)
  })
})

describe('normaliseUKPostcode', () => {
  it('adds standard spacing', () => {
    expect(normaliseUKPostcode('sw1a1aa')).toBe('SW1A 1AA')
  })

  it('is idempotent on already-normalised input', () => {
    expect(normaliseUKPostcode('SW1A 1AA')).toBe('SW1A 1AA')
  })
})
