import { useEffect, useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { CategoryCard } from '@/components/product/CategoryCard'
import { Accordion } from '@/components/ui/Accordion'
import { Alert } from '@/components/ui/Alert'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { useFaqJsonLd } from '@/lib/useFaqJsonLd'
import { getFeaturedProducts, getCategories } from '@/lib/api/products'
import { formatGBP } from '@/lib/format'
import { ContentBlock } from '@/lib/content/ContentBlocks'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import type { Product, ProductCategory } from '@/types'

const steps = [
  { title: 'Choose your products', description: 'Browse our range and add what you need to your basket.' },
  { title: 'Complete checkout', description: 'Enter your UK delivery address and contact details.' },
  { title: 'Pay securely with Open Banking', description: 'Authorise payment directly from your bank via Fena — no card details to enter.' },
  { title: 'We process your order', description: 'You will receive an order confirmation email, and we get your order ready to send.' },
]

export default function HomePage() {
  // Title and description are deliberately left to fall through to the
  // sitewide defaults in src/lib/seo.ts. The edge middleware serves those same
  // defaults for "/" (functions/_lib/seoMeta.ts, STATIC_PAGES), so overriding
  // them here would mean a crawler and a browser saw two different homepage
  // descriptions for the same URL.
  useDocumentMeta({})

  const { settings, faqs } = useSiteSettings()
  useFaqJsonLd(faqs, '/')
  const [featured, setFeatured] = useState<Product[] | null>(null)
  const [categories, setCategories] = useState<ProductCategory[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getFeaturedProducts(8), getCategories()])
      .then(([products, cats]) => {
        if (cancelled) return
        setFeatured(products)
        setCategories(cats)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong loading the shop.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-200/60">
        {/* Atmosphere: brass glow + faint grid, both purely decorative */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[42rem] w-[60rem] -translate-x-1/2 -translate-y-1/3 bg-hero-glow opacity-70 dark:opacity-100" />
          <div
            className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--ink-300)/0.35)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--ink-300)/0.35)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
          />
        </div>

        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-28">
          <div className="animate-slide-up">
            <span className="eyebrow">UK delivery · Open Banking checkout</span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
              {settings.heroHeading}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-600 sm:text-lg">{settings.heroSubheading}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/shop" variant="accent" size="lg">
                Shop now
              </ButtonLink>
              <ButtonLink to="/about" variant="outline" size="lg">
                Learn more
              </ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-500">
              {['Laboratory research use only — 18+', 'Delivered across the UK', 'Secure bank-to-bank payment'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-accent-500">
                    <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ----------------------------------------------------------------
              Two different treatments, because a photograph and a logo mark
              need opposite things. The logo is a floating mark that earns the
              brass rings and the glow — without them it's a small icon adrift
              in white space. A photograph is already a solid object with its
              own edges, so the same rings crop awkwardly behind it and the
              heavy gold drop-shadow reads as a colour cast on the product.
              Set a hero image in Admin → Settings and it gets framed cleanly;
              leave it blank and the original logo treatment stands.
          ---------------------------------------------------------------- */}
          <div className="relative flex items-center justify-center py-8 lg:py-0">
            {settings.heroImageUrl ? (
              <>
                <div
                  aria-hidden="true"
                  className="absolute h-64 w-64 rounded-full bg-accent-500/10 blur-3xl sm:h-80 sm:w-80"
                />
                <img
                  src={settings.heroImageUrl}
                  alt={settings.heroImageAlt}
                  loading="eager"
                  // fetchPriority tells the browser this is the largest thing
                  // above the fold and worth fetching before anything else —
                  // it is what the page's Largest Contentful Paint is measured
                  // on, and therefore part of its Core Web Vitals score.
                  fetchPriority="high"
                  className="relative max-h-[26rem] w-full rounded-2xl border border-ink-200/70 object-cover shadow-card-hover sm:max-h-[30rem]"
                />
              </>
            ) : (
              <>
                <div aria-hidden="true" className="absolute h-72 w-72 rounded-full bg-accent-500/20 blur-3xl sm:h-96 sm:w-96" />
                <div aria-hidden="true" className="absolute h-[22rem] w-[22rem] rounded-full border border-accent-500/15 sm:h-[28rem] sm:w-[28rem]" />
                <div aria-hidden="true" className="absolute h-[16rem] w-[16rem] rounded-full border border-accent-500/25 sm:h-[20rem] sm:w-[20rem]" />
                <img
                  src={settings.logoUrl || '/logo-icon.png'}
                  alt=""
                  className="relative h-64 w-auto animate-float drop-shadow-[0_24px_40px_rgb(var(--accent-500)/0.35)] sm:h-80"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="container-page py-6">
          <Alert tone="danger" title="We couldn't load the shop">
            {error}
          </Alert>
        </div>
      )}

      {/* Featured products */}
      <section className="container-page py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Featured</span>
            <h2 className="mt-3 text-2xl font-semibold text-ink-950 sm:text-3xl">Where to start</h2>
            <p className="mt-1.5 text-sm text-ink-600">
              Our best sellers.
            </p>
          </div>
          <ButtonLink to="/shop" variant="outline" size="sm" className="hidden sm:inline-flex">
            View all
          </ButtonLink>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.length === 0
              ? <p className="col-span-full text-sm text-ink-500">No featured products yet — check back soon.</p>
              : featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* Quality & testing */}
      <section className="relative overflow-hidden bg-ink-950 dark:bg-ink-100">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
        </div>
        <div className="container-page relative py-16 sm:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow text-accent-400 dark:text-accent-600">Quality assurance</span>
              <h2 className="mt-3 max-w-xl font-display text-2xl font-semibold text-white dark:text-ink-950 sm:text-3xl">
                Every formulation is HPLC-tested before it reaches you.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-300 dark:text-ink-600">
              We use HPLC (High-Performance Liquid Chromatography) — a laboratory technique for
              verifying the purity and concentration of active ingredients — to check every
              peptide for purity, endotoxins and heavy metals.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: (
                  <path
                    d="M9 3h6M10 3v5.2a3 3 0 0 1-.5 1.66L5.9 15.7A2 2 0 0 0 7.6 19h8.8a2 2 0 0 0 1.7-3.3l-3.6-5.85A3 3 0 0 1 14 8.2V3M7.5 14.5h9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
                title: 'HPLC-verified purity',
                description: 'Active ingredient purity and concentration are checked by HPLC chromatography before a batch is approved for sale.',
              },
              {
                icon: (
                  <path
                    d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
                title: 'Research quality',
                description: 'Testing confirms formulation quality for laboratory use — our products are not medicines, and make no medical claims.',
              },
              {
                icon: (
                  <path
                    d="M4 17V7a1 1 0 0 1 1-1h9v11M4 17h1m0 0h9m0 0h2m0 0h1a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.29-.7L18.5 9.4a1 1 0 0 0-.7-.3H14M4 17a2 2 0 1 0 4 0m8 0a2 2 0 1 0 4 0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
                title: 'Delivered with confidence',
                description: 'Every order is dispatched only once its formulation has cleared our testing process — quality checked before it ships, not after.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm dark:border-ink-950/10 dark:bg-ink-950/[0.03]"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-accent-400 dark:text-accent-600">
                  {item.icon}
                </svg>
                <h3 className="mt-4 text-sm font-semibold text-white dark:text-ink-950">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-300 dark:text-ink-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Peptides, explained.

          This section exists for two audiences at once. Customers arriving
          from a search like "what are peptides in skincare" get a straight
          answer instead of a product grid, and AI answer engines get a clean,
          self-contained, quotable explanation attributed to this site — which
          is how a small retailer gets cited in an AI answer at all. The third
          question is the important one commercially and legally: it draws the
          line between what Avernic UK sells and the injectable research
          peptides people often mean when they search the word.
      ------------------------------------------------------------------- */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <span className="eyebrow">The basics</span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-ink-950 sm:text-3xl">
              Peptides, explained plainly
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              Peptide research is quickly becoming a hot topic in the news, online and from people you see day to day, we want to provide labs with the highest qulity peptides we can offer and guarantee peace of mind in your results.
            </p>
            <ButtonLink to="/faq" variant="outline" size="sm" className="mt-6">
              More questions
            </ButtonLink>
          </div>

          <div className="space-y-5">
            <ContentBlock blockKey="home.peptides" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Delivery, returns and payment reassurance. Reads live from Admin →
          Settings rather than hardcoded copy, so the prices quoted here can
          never drift from what the basket actually charges.
      ------------------------------------------------------------------- */}
      <section className="border-y border-ink-200/60 bg-ink-50/60 dark:bg-ink-50/40">
        <div className="container-page py-12 sm:py-14">
          <dl className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Royal Mail delivery',
                body: (
                  <>
                    {formatGBP(settings.deliveryStandardMinor)} 48hr Tracked, or{' '}
                    {formatGBP(settings.deliveryExpressMinor)} 24hr Tracked &amp; Signed. Free 48hr Tracked over{' '}
                    {formatGBP(settings.deliveryFreeThresholdMinor)}. UK addresses only.
                  </>
                ),
                icon: 'M4 17V7a1 1 0 0 1 1-1h9v11M4 17h1m0 0h9m0 0h2m0 0h1a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.29-.7L18.5 9.4a1 1 0 0 0-.7-.3H14M4 17a2 2 0 1 0 4 0m8 0a2 2 0 1 0 4 0',
              },
              {
                title: '14 days to change your mind',
                body: (
                  <>
                    Cancel within 14 days of delivery, without giving a reason — your statutory right as a UK online
                    customer. See our returns page for how to start one.
                  </>
                ),
                icon: 'M3 12a9 9 0 1 0 2.64-6.36M3 4v5h5',
              },
              {
                title: 'Paid straight from your bank',
                body: (
                  <>
                    Checkout is Open Banking, powered by Fena. You approve the payment in your own banking app — we
                    never see, handle or store card details.
                  </>
                ),
                icon: 'M12 3 4 6.5V11c0 4.6 3.2 8.5 8 10 4.8-1.5 8-5.4 8-10V6.5L12 3Zm-2.5 8.5 2 2 4-4',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="mt-0.5 h-6 w-6 shrink-0 text-accent-500">
                  <path d={item.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <dt className="text-sm font-semibold text-ink-950">{item.title}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-ink-200/60 bg-ink-50/60 dark:bg-ink-50/40">
        <div className="container-page py-16 sm:py-20">
          <span className="eyebrow">Browse</span>
          <h2 className="mt-3 text-2xl font-semibold text-ink-950 sm:text-3xl">Shop by category</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories === null
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink-100" />
                ))
              : categories.map((category) => <CategoryCard key={category.id} category={category} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 sm:py-20">
        <span className="eyebrow">Simple by design</span>
        <h2 className="mt-3 text-2xl font-semibold text-ink-950 sm:text-3xl">How it works</h2>
        <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card transition-colors hover:border-accent-500/40 dark:bg-ink-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gradient font-display text-sm font-semibold text-literal-ink shadow-glow-sm">
                {index + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink-950">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-200/60 bg-ink-50/60 dark:bg-ink-50/40">
        <div className="container-page max-w-3xl py-16 sm:py-20">
          <span className="eyebrow">Help</span>
          <h2 className="mt-3 text-2xl font-semibold text-ink-950 sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-8">
            <Accordion items={faqs} />
          </div>
          <p className="mt-6 text-sm text-ink-600">
            Have another question?{' '}
            <a href="/contact" className="font-medium text-accent-600 underline underline-offset-2 hover:text-accent-500">
              Contact us
            </a>
            .
          </p>
        </div>
      </section>
    </>
  )
}
