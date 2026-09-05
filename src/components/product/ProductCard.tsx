import { Link } from 'react-router-dom'
import type { Product } from '@/types'
import { formatGBP } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { useBasket } from '@/lib/basket/BasketProvider'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import { useState } from 'react'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useBasket()
  const { settings } = useSiteSettings()
  const [justAdded, setJustAdded] = useState(false)
  const [imageBroken, setImageBroken] = useState(false)
  const outOfStock = product.stockQuantity <= 0

  function handleAdd() {
    addItem(product.id, 1)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent-500/40 hover:shadow-card-hover dark:bg-ink-50 dark:hover:shadow-glow-sm">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-ink-100/70">
        {product.imageUrl && !imageBroken ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImageBroken(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          // No photo yet (or the URL is broken): a quiet brand placeholder instead of a broken-image icon
          <span className="flex h-full w-full items-center justify-center">
            <img src={settings.logoUrl || '/logo-icon.png'} alt="" className="h-1/3 w-auto opacity-30 grayscale" />
          </span>
        )}
        {/* Soft vignette so light product photography sits comfortably on a dark card */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-ink-50/60 dark:opacity-60"
        />
        {product.compareAtPriceMinor && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">Save {formatGBP(product.compareAtPriceMinor - product.priceMinor)}</Badge>
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to={`/product/${product.slug}`}
          className="text-sm font-semibold leading-snug text-ink-950 transition-colors hover:text-accent-600"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-ink-600">{product.shortDescription}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2 tabular-nums">
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
          className={`mt-2 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none ${
            justAdded
              ? 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/40'
              : 'bg-ink-900 text-white shadow-card hover:bg-ink-800 hover:shadow-card-hover'
          }`}
        >
          {outOfStock ? 'Out of stock' : justAdded ? 'Added to basket ✓' : 'Add to basket'}
        </button>
      </div>
    </article>
  )
}
