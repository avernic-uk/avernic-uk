import { describe, expect, it } from 'vitest'
import { calculateDeliveryMinor } from '../pricing'

describe('calculateDeliveryMinor', () => {
  it('is free for an empty/zero basket', () => {
    expect(calculateDeliveryMinor(0)).toBe(0)
    expect(calculateDeliveryMinor(0, 'express')).toBe(0)
  })

  it('charges standard delivery (Royal Mail 48hr Tracked) below the free threshold', () => {
    expect(calculateDeliveryMinor(1000)).toBe(525)
    expect(calculateDeliveryMinor(3999)).toBe(525)
  })

  it('is free at and above the threshold for standard delivery', () => {
    expect(calculateDeliveryMinor(4000)).toBe(0)
    expect(calculateDeliveryMinor(10000)).toBe(0)
  })

  it('charges express delivery (Royal Mail 24hr Tracked & Signed) regardless of subtotal', () => {
    expect(calculateDeliveryMinor(1000, 'express')).toBe(870)
    expect(calculateDeliveryMinor(3999, 'express')).toBe(870)
    // Express is a premium option — it is never covered by the free-delivery threshold.
    expect(calculateDeliveryMinor(4000, 'express')).toBe(870)
    expect(calculateDeliveryMinor(10000, 'express')).toBe(870)
  })

  it('honours custom admin-configured prices and threshold', () => {
    expect(calculateDeliveryMinor(1000, 'standard', 300, 900, 5000)).toBe(300)
    expect(calculateDeliveryMinor(5000, 'standard', 300, 900, 5000)).toBe(0)
    expect(calculateDeliveryMinor(5000, 'express', 300, 900, 5000)).toBe(900)
  })
})
