import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BasketLine, PricedBasket } from '@/types'

const STORAGE_KEY = 'avernic_basket_v1'

interface BasketContextValue {
  lines: BasketLine[]
  itemCount: number
  addItem: (productId: string, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  /** The last server-verified price/stock snapshot for the current basket, if fetched. */
  priced: PricedBasket | null
  pricing: boolean
  pricingError: string | null
  refreshPricing: () => Promise<void>
}

const BasketContext = createContext<BasketContextValue | undefined>(undefined)

function loadFromStorage(): BasketLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l): l is BasketLine =>
        typeof l?.productId === 'string' && typeof l?.quantity === 'number' && l.quantity > 0,
    )
  } catch {
    return []
  }
}

export function BasketProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>(() => loadFromStorage())
  const [priced, setPriced] = useState<PricedBasket | null>(null)
  const [pricing, setPricing] = useState(false)
  const [pricingError, setPricingError] = useState<string | null>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  async function refreshPricing() {
    if (lines.length === 0) {
      setPriced({ lines: [], subtotalMinor: 0, deliveryMinor: 0, totalMinor: 0, currency: 'GBP', hasIssues: false })
      return
    }
    setPricing(true)
    setPricingError(null)
    try {
      const res = await fetch('/api/basket/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      })
      if (!res.ok) throw new Error('Could not price your basket. Please try again.')
      const data = (await res.json()) as PricedBasket
      setPriced(data)

      // Reconcile local basket with server-confirmed availability so the
      // browser's copy never drifts from what's actually purchasable — this
      // runs whenever anything changed (an item removed OR a quantity
      // clamped down to available stock), not just on full removal, so the
      // displayed quantity always matches what the shown line total charges
      // for.
      const corrected = data.lines
        .filter((l) => l.available)
        .map((l) => ({ productId: l.productId, quantity: Math.min(l.quantity, l.maxAvailableQuantity) }))
      if (data.hasIssues) {
        setLines(corrected)
      }
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : 'Something went wrong pricing your basket.')
    } finally {
      setPricing(false)
    }
  }

  // Re-price whenever the basket's contents change.
  useEffect(() => {
    refreshPricing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lines)])

  const value = useMemo<BasketContextValue>(
    () => ({
      lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      addItem(productId, quantity = 1) {
        setLines((prev) => {
          const existing = prev.find((l) => l.productId === productId)
          if (existing) {
            return prev.map((l) =>
              l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
            )
          }
          return [...prev, { productId, quantity }]
        })
      },
      updateQuantity(productId, quantity) {
        setLines((prev) => {
          if (quantity <= 0) return prev.filter((l) => l.productId !== productId)
          return prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
        })
      },
      removeItem(productId) {
        setLines((prev) => prev.filter((l) => l.productId !== productId))
      },
      clear() {
        setLines([])
        setPriced(null)
      },
      priced,
      pricing,
      pricingError,
      refreshPricing,
    }),
    [lines, priced, pricing, pricingError],
  )

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
}

export function useBasket(): BasketContextValue {
  const ctx = useContext(BasketContext)
  if (!ctx) throw new Error('useBasket must be used within BasketProvider')
  return ctx
}
