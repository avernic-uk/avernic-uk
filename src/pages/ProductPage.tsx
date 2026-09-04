import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatGBP } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { useJsonLd } from '@/lib/useJsonLd'
import { getProductBySlug, getRelatedProducts } from '@/lib/api/products'
import { useBasket } from '@/lib/basket/BasketProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { ProductCard } from '@/components/product/ProductCard'
import { Alert } from '@/components/ui/Alert'
import type { Product } from '@/types'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [related, setRelated] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useBasket()

  useDocumentMeta({
    title: product ? product.name : 'Product',
    description: product?.shortDescription,
  })

  // Product structured data — describes only what's actually on the page
  // (name, price, availability). No clinical/medical claims are asserted.
  useJsonLd(
    product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.shortDescription,
          sku: product.sku,
          image: product.imageUrl,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'GBP',
            price: (product.priceMinor / 100).toFixed(2),
            availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            areaServed: 'GB',
          },
        }
      : null,
  )

  useEffect(() => {
    let cancelled = false
    setProduct(undefined)
    setActiveImage(0)
    setQuantity(1)
    getProductBySlug(slug)
      .then((p) => {
        if (cancelled) return
        setProduct(p)
        if (p) return getRelatedProducts(p.categoryId, p.id)
        return []
      })
      .then((rel) => {
        if (!cancelled) setRelated(rel ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (product === null) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink-950">Product not found</h1>
        <p className="mt-2 text-sm text-ink-600">
          <Link to="/shop" className="underline">
            Back to shop
          </Link>
        </p>
      </div>
    )
  }

  if (product === undefined) {
    return (
      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-ink-100" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-ink-100" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-ink-100" />
            <div className="h-24 w-full animate-pulse rounded bg-ink-100" />
          </div>
        </div>
      </div>
    )
  }

  const images = [{ url: product.imageUrl, alt: product.name }, ...product.additionalImages]
  const outOfStock = product.stockQuantity <= 0

  function handleAdd() {
    if (!product) return
    addItem(product.id, quantity)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink-500">
        <Link to="/shop" className="hover:text-ink-800">
          Shop
        </Link>
        {' / '}
        <Link to={`/shop/${product.categorySlug}`} className="hover:text-ink-800">
          {product.categorySlug}
        </Link>
        {' / '}
        <span className="text-ink-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-ink-50">
            <img src={images[activeImage]?.url} alt="" className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, index) => (
                <button
                  key={img.url + index}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1} of ${images.length}`}
                  aria-current={activeImage === index}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    activeImage === index ? 'border-accent-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950 sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-ink-500">SKU: {product.sku}</p>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-ink-950">{formatGBP(product.priceMinor)}</span>
            {product.compareAtPriceMinor && (
              <span className="text-base text-ink-400 line-through">{formatGBP(product.compareAtPriceMinor)}</span>
            )}
          </div>

          <div className="mt-3">
            {outOfStock ? (
              <Badge tone="danger">Out of stock</Badge>
            ) : product.stockQuantity <= 5 ? (
              <Badge tone="warning">Only {product.stockQuantity} left</Badge>
            ) : (
              <Badge tone="success">In stock</Badge>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink-700">{product.shortDescription}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantityStepper
              quantity={quantity}
              onChange={setQuantity}
              max={Math.max(1, product.stockQuantity)}
            />
            <Button size="lg" variant="accent" disabled={outOfStock} onClick={handleAdd} className="flex-1 sm:flex-none">
              {outOfStock ? 'Out of stock' : added ? 'Added to basket ✓' : 'Add to basket'}
            </Button>
          </div>

          {added && (
            <div className="mt-4">
              <Alert tone="success">
                Added to your basket.{' '}
                <Link to="/basket" className="font-medium underline">
                  View basket
                </Link>
              </Alert>
            </div>
          )}

          <div className="mt-10 space-y-6 border-t border-ink-200 pt-8">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Product information</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">{product.fullDescription}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Delivery</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Delivered to UK addresses only. See our{' '}
                <Link to="/delivery" className="underline">
                  delivery information
                </Link>{' '}
                for options and estimated timescales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink-200 pt-10">
          <h2 className="text-xl font-semibold text-ink-950">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
