import { useEffect, useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { CategoryCard } from '@/components/product/CategoryCard'
import { Accordion } from '@/components/ui/Accordion'
import { Alert } from '@/components/ui/Alert'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { getFeaturedProducts, getCategories } from '@/lib/api/products'
import type { Product, ProductCategory } from '@/types'

const homeFaqs = [
  {
    question: 'Are these medical products?',
    answer: 'No — everything we sell is a cosmetic skincare product applied topically. Nothing on Avernic UK is a medicine and nothing is intended for injection or internal use.',
  },
  {
    question: 'Where do you deliver?',
    answer: 'Avernic UK delivers to addresses within the United Kingdom only. We do not currently offer international shipping.',
  },
  {
    question: 'How do I pay?',
    answer: 'Checkout is completed securely via Open Banking, powered by Fena. You authorise payment directly from your own bank — we never see or store your banking details.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'See our Delivery information page for current delivery options and estimated timescales.',
  },
  {
    question: 'Can I return an item?',
    answer: 'Yes — see our Returns & refunds page for eligibility and how to start a return.',
  },
]

const steps = [
  { title: 'Choose your products', description: 'Browse our range and add what you need to your basket.' },
  { title: 'Complete checkout', description: 'Enter your UK delivery address and contact details.' },
  { title: 'Pay securely with Open Banking', description: 'Authorise payment directly from your bank via Fena — no card details to enter.' },
  { title: 'We process your order', description: 'You will receive an order confirmation email, and we get your order ready to send.' },
]

export default function HomePage() {
  useDocumentMeta({
    title: 'Peptide skincare, made simpler',
    description:
      'Shop peptide serums, moisturisers and treatments online at Avernic UK. Cosmetic skincare only, UK delivery, secure Open Banking payment. 18+.',
  })

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
              Peptide skincare, made <span className="text-brass animate-shimmer">simpler</span>.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-600 sm:text-lg">
              Cosmetic peptide serums, moisturisers and treatments, chosen with care and delivered
              across the United Kingdom — with a straightforward checkout and secure Open Banking
              payment.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/shop" variant="accent" size="lg">
                Shop now
              </ButtonLink>
              <ButtonLink to="/about" variant="outline" size="lg">
                Learn more
              </ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-500">
              {['Cosmetic skincare only — 18+', 'Delivered across the UK', 'Secure bank-to-bank payment'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-accent-500">
                    <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center justify-center py-8 lg:py-0">
            <div aria-hidden="true" className="absolute h-72 w-72 rounded-full bg-accent-500/20 blur-3xl sm:h-96 sm:w-96" />
            <div aria-hidden="true" className="absolute h-[22rem] w-[22rem] rounded-full border border-accent-500/15 sm:h-[28rem] sm:w-[28rem]" />
            <div aria-hidden="true" className="absolute h-[16rem] w-[16rem] rounded-full border border-accent-500/25 sm:h-[20rem] sm:w-[20rem]" />
            <img
              src="/logo-icon.png"
              alt=""
              className="relative h-64 w-auto animate-float drop-shadow-[0_24px_40px_rgb(var(--accent-500)/0.35)] sm:h-80"
            />
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
            <h2 className="mt-3 text-2xl font-semibold text-ink-950 sm:text-3xl">Best-selling peptides</h2>
            <p className="mt-1.5 text-sm text-ink-600">A selection of our most popular peptide skincare products.</p>
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
            <Accordion items={homeFaqs} />
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
