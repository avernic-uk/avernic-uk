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
    question: 'Where do you deliver?',
    answer: 'Avernic UK delivers to addresses within the United Kingdom only. We do not currently offer international shipping.',
  },
  {
    question: 'How do I pay?',
    answer: 'Checkout is completed securely via Open Banking, powered by Fano. You authorise payment directly from your own bank — we never see or store your banking details.',
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
  { title: 'Pay securely with Open Banking', description: 'Authorise payment directly from your bank via Fano — no card details to enter.' },
  { title: 'We process your order', description: 'You will receive an order confirmation email, and we get your order ready to send.' },
]

export default function HomePage() {
  useDocumentMeta({
    title: 'Healthcare, made simpler',
    description:
      'Shop everyday healthcare and wellbeing essentials online at Avernic UK. UK delivery, secure Open Banking payment.',
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
      <section className="border-b border-ink-200 bg-gradient-to-b from-ink-50 to-white">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="animate-slide-up">
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-950 sm:text-5xl">
              Healthcare, made simpler.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg">
              Everyday healthcare and wellbeing essentials, chosen with care and delivered across
              the United Kingdom — with a straightforward checkout and secure Open Banking payment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/shop" variant="accent" size="lg">
                Shop now
              </ButtonLink>
              <ButtonLink to="/about" variant="outline" size="lg">
                Learn more
              </ButtonLink>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 -z-10 rounded-full bg-accent-100/60 blur-3xl" aria-hidden="true" />
            <img
              src="/logo-icon.png"
              alt=""
              className="h-64 w-auto drop-shadow-xl sm:h-80"
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
            <h2 className="text-2xl font-semibold text-ink-950">Featured products</h2>
            <p className="mt-1.5 text-sm text-ink-600">A selection of our most popular everyday essentials.</p>
          </div>
          <ButtonLink to="/shop" variant="ghost" size="sm" className="hidden sm:inline-flex">
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
      <section className="border-y border-ink-200 bg-ink-50/60">
        <div className="container-page py-16 sm:py-20">
          <h2 className="text-2xl font-semibold text-ink-950">Shop by category</h2>
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
        <h2 className="text-2xl font-semibold text-ink-950">How it works</h2>
        <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink-950">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-200 bg-ink-50/60">
        <div className="container-page max-w-3xl py-16 sm:py-20">
          <h2 className="text-2xl font-semibold text-ink-950">Frequently asked questions</h2>
          <div className="mt-8">
            <Accordion items={homeFaqs} />
          </div>
          <p className="mt-6 text-sm text-ink-600">
            Have another question?{' '}
            <a href="/contact" className="font-medium text-ink-900 underline underline-offset-2">
              Contact us
            </a>
            .
          </p>
        </div>
      </section>
    </>
  )
}
