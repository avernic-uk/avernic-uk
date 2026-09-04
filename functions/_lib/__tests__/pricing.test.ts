import { describe, expect, it } from 'vitest'
import { calculateDeliveryMinor } from '../pricing'

describe('calculateDeliveryMinor', () => {
  it('is free for an empty/zero basket', () => {
    expect(calculateDeliveryMinor(0)).toBe(0)
  })

  it('charges standard delivery below the free threshold', () => {
    expect(calculateDeliveryMinor(1000)).toBe(295)
    expect(calculateDeliveryMinor(3999)).toBe(295)
  })

  it('is free at and above the threshold', () => {
    expect(calculateDeliveryMinor(4000)).toBe(0)
    expect(calculateDeliveryMinor(10000)).toBe(0)
  })
})
