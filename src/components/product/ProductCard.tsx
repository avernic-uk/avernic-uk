import { Link } from 'react-router-dom'
import type { Product } from '@/types'
import { formatGBP } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { useBasket } from '@/lib/basket/BasketProvider'
import { useState } from 'react'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useBasket()
  const [justAdded, setJustAdded] = useState(false)
  const outOfStock = product.stockQuantity <= 0

  function handleAdd() {
    addItem(product.id, 1)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-ink-50">
        <img
          src={product.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {product.compareAtPriceMinor && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">Save {formatGBP(product.compareAtPriceMinor - product.priceMinor)}</Badge>
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to={`/product/${product.slug}`} className="text-sm font-semibold text-ink-950 hover:underline">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-ink-600">{product.shortDescription}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-ink-950">{formatGBP(product.priceMinor)}</span>
            {product.compareAtPriceMinor && (
              <span className="text-xs text-ink-400 line-through">{formatGBP(product.compareAtPriceMinor)}</span>
            )}
          </div>
          {outOfStock ? (
            <Badge tone="danger">Out of stock</Badge>
          ) : product.stockQuantity <= 5 ? (
            <Badge tone="warning">Low stock</Badge>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full bg-ink-900 text-sm font-medium text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
        >
          {outOfStock ? 'Out of stock' : justAdded ? 'Added ✓' : 'Add to basket'}
        </button>
      </div>
    </div>
  )
}
