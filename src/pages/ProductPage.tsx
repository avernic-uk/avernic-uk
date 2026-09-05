import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatGBP } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { useJsonLd } from '@/lib/useJsonLd'
import { absoluteUrl, SITE_NAME } from '@/lib/seo'
import { getProductBySlug, getRelatedProducts } from '@/lib/api/products'
import { parseKeyIngredients, parseLines } from '@/lib/productDetail'
import { getProductReviews } from '@/lib/api/reviews'
import { useBasket } from '@/lib/basket/BasketProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductReviews } from '@/components/product/ProductReviews'
import { Alert } from '@/components/ui/Alert'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import type { Product, ProductReview, ReviewSummary } from '@/types'

/**
 * Returns terms, as stated on /returns: the 14-day cancellation window the UK
 * Consumer Contracts Regulations require of a distance seller. Constant rather
 * than admin-editable, because changing it here without changing the policy
 * page would put two different promises in front of the same customer.
 */
const RETURN_POLICY_JSONLD = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'GB',
  returnPolicyCountry: 'GB',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
}

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { settings } = useSiteSettings()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [related, setRelated] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({ average: 0, count: 0 })
  const { addItem } = useBasket()

  useDocumentMeta({
    title: product ? product.name : 'Product',
    description: product?.shortDescription,
    image: product?.imageUrl,
    type: 'product',
  })

  // Delivery and returns terms as structured data. Google treats shipping cost
  // and a return window as merchant-listing signals — without them a product
  // can be dropped from the richer shopping treatments entirely. Both are read
  // from live data rather than hardcoded: the rates come from Admin → Settings
  // (so schema can't drift from what checkout actually charges) and 14 days is
  // the window stated on /returns, which is the UK Consumer Contracts
  // Regulations minimum for distance selling.
  const shippingDetailsJsonLd = useMemo(
    () => [
      {
        '@type': 'OfferShippingDetails',
        name: 'Royal Mail 48hr Tracked',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: (settings.deliveryStandardMinor / 100).toFixed(2),
          currency: 'GBP',
        },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GB' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
        },
      },
      {
        '@type': 'OfferShippingDetails',
        name: 'Royal Mail 24hr Tracked & Signed',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: (settings.deliveryExpressMinor / 100).toFixed(2),
          currency: 'GBP',
        },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GB' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1, unitCode: 'DAY' },
        },
      },
    ],
    [settings.deliveryStandardMinor, settings.deliveryExpressMinor],
  )

  // The detail fields, restated as machine-readable properties. This is mostly
  // for AI answer engines: asked "how do I use X" or "what's in X", they can
  // lift a definitive answer from here rather than guessing from prose.
  const productProperties = useMemo(() => {
    if (!product) return []
    const props: Array<Record<string, string>> = []
    if (product.sizeLabel) props.push({ '@type': 'PropertyValue', name: 'Size', value: product.sizeLabel })
    if (product.keyIngredients) {
      props.push({
        '@type': 'PropertyValue',
        name: 'Key ingredients',
        value: parseKeyIngredients(product.keyIngredients)
          .map((i) => (i.role ? `${i.name}: ${i.role}` : i.name))
          .join(' '),
      })
    }
    if (product.howToUse) {
      props.push({ '@type': 'PropertyValue', name: 'How to use', value: parseLines(product.howToUse).join(' ') })
    }
    if (product.suitability) {
      props.push({ '@type': 'PropertyValue', name: 'Suitable for', value: product.suitability })
    }
    if (product.ingredientsInci) {
      props.push({ '@type': 'PropertyValue', name: 'Ingredients (INCI)', value: product.ingredientsInci })
    }
    return props
  }, [product])

  // Product structured data — describes only what's actually on the page
  // (name, price, availability). No clinical/medical claims are asserted.
  // Bundled with a BreadcrumbList so search results can show the category
  // trail. The edge middleware emits the same shape for crawlers.
  const productJsonLd = useMemo(
    () =>
      product
        ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              '@id': absoluteUrl(`/product/${product.slug}`) + '#product',
              name: product.name,
              description: product.shortDescription,
              sku: product.sku,
              image: [product.imageUrl, ...product.additionalImages.map((i) => i.url)].filter(Boolean),
              url: absoluteUrl(`/product/${product.slug}`),
              brand: { '@type': 'Brand', name: SITE_NAME },
              ...(product.sizeLabel ? { size: product.sizeLabel } : {}),
              ...(productProperties.length > 0 ? { additionalProperty: productProperties } : {}),
              offers: {
                '@type': 'Offer',
                url: absoluteUrl(`/product/${product.slug}`),
                priceCurrency: 'GBP',
                price: (product.priceMinor / 100).toFixed(2),
                availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition',
                areaServed: 'GB',
                seller: { '@type': 'Organization', name: SITE_NAME },
                shippingDetails: shippingDetailsJsonLd,
                hasMerchantReturnPolicy: RETURN_POLICY_JSONLD,
              },
              ...(reviewSummary.count > 0
                ? {
                    aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: reviewSummary.average.toFixed(1),
                      reviewCount: reviewSummary.count,
                      bestRating: 5,
                      worstRating: 1,
                    },
                    review: reviews.slice(0, 5).map((r) => ({
                      '@type': 'Review',
                      author: { '@type': 'Person', name: r.customerName },
                      datePublished: r.createdAt,
                      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                      ...(r.title ? { name: r.title } : {}),
                      reviewBody: r.comment,
                    })),
                  }
                : {}),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Shop', item: absoluteUrl('/shop') },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: product.categorySlug,
                  item: absoluteUrl(`/shop/${product.categorySlug}`),
                },
                { '@type': 'ListItem', position: 3, name: product.name },
              ],
            },
          ],
        }
        : null,
    [product, reviewSummary, reviews, productProperties, shippingDetailsJsonLd],
  )
  useJsonLd(productJsonLd)

  useEffect(() => {
    let cancelled = false
    setProduct(undefined)
    setActiveImage(0)
    setQuantity(1)
    setReviews([])
    setReviewSummary({ average: 0, count: 0 })
    getProductBySlug(slug)
      .then((p) => {
        if (cancelled) return
        setProduct(p)
        if (p) {
          getProductReviews(p.id)
            .then(({ reviews: r, summary }) => {
              if (!cancelled) {
                setReviews(r)
                setReviewSummary(summary)
              }
            })
            .catch(() => {
              // Reviews are a supplementary section — a failed fetch shouldn't block the product page.
            })
          return getRelatedProducts(p.categoryId, p.id)
        }
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
  const keyIngredients = parseKeyIngredients(product.keyIngredients)
  const howToUseSteps = parseLines(product.howToUse)

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
            <img src={images[activeImage]?.url} alt={images[activeImage]?.alt || product.name} className="h-full w-full object-cover" />
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
          <p className="mt-2 text-sm text-ink-500">
            {product.sizeLabel && <span className="text-ink-700">{product.sizeLabel}</span>}
            {product.sizeLabel && <span className="mx-2 text-ink-300">·</span>}
            SKU: {product.sku}
          </p>

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

          <p className="mt-5 flex items-center gap-2 text-xs text-ink-500">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-accent-500">
              <path
                d="M9 3h6M10 3v5.2a3 3 0 0 1-.5 1.66L5.9 15.7A2 2 0 0 0 7.6 19h8.8a2 2 0 0 0 1.7-3.3l-3.6-5.85A3 3 0 0 1 14 8.2V3M7.5 14.5h9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            HPLC-tested for ingredient purity before sale
          </p>

          <p className="mt-6 border-t border-ink-200 pt-5 text-xs leading-relaxed text-ink-500">
            Royal Mail delivery to UK addresses only — 48hr Tracked, or 24hr Tracked &amp; Signed at checkout. See{' '}
            <Link to="/delivery" className="underline underline-offset-2 hover:text-accent-600">
              delivery information
            </Link>{' '}
            for current pricing and timescales.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Full product detail. Deliberately below the buy box and full-width:
          this is the part a customer reads once they're already interested,
          and it's the bulk of what a search engine or AI answer engine has
          to work with for this product. Every section is omitted entirely
          when its field is empty, so a half-filled product still reads well.
      ------------------------------------------------------------------- */}
      <section className="mt-14 border-t border-ink-200 pt-10">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div className="space-y-10">
            {product.fullDescription && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-950">About this product</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-700">
                  {product.fullDescription
                    .split(/\n\s*\n/)
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className="whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                </div>
              </div>
            )}

            {howToUseSteps.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-950">How to use</h2>
                <ol className="mt-5 space-y-4">
                  {howToUseSteps.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-gradient font-display text-xs font-semibold text-literal-ink shadow-glow-sm">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-ink-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {keyIngredients.length > 0 && (
              <div className="panel p-6 dark:bg-ink-50">
                <h2 className="text-sm font-semibold text-ink-900">Key ingredients</h2>
                <dl className="mt-4 space-y-4">
                  {keyIngredients.map((item, i) => (
                    <div key={i}>
                      <dt className="text-sm font-medium text-ink-900">{item.name}</dt>
                      {item.role && <dd className="mt-1 text-sm leading-relaxed text-ink-600">{item.role}</dd>}
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.suitability && (
              <div className="panel p-6 dark:bg-ink-50">
                <h2 className="text-sm font-semibold text-ink-900">Who it&rsquo;s for</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">{product.suitability}</p>
              </div>
            )}

            {product.ingredientsInci && (
              <details className="panel p-6 dark:bg-ink-50">
                <summary className="cursor-pointer text-sm font-semibold text-ink-900 marker:text-accent-500">
                  Full ingredients (INCI)
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-ink-600">{product.ingredientsInci}</p>
              </details>
            )}

            <p className="text-xs leading-relaxed text-ink-500">
              Cosmetic skincare for topical use only. Not a medicine, and not for injection or internal use. For adults
              aged 18 and over. Patch test before first use, and discontinue use if irritation occurs.
            </p>
          </aside>
        </div>
      </section>

      <ProductReviews productId={product.id} productName={product.name} />

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
