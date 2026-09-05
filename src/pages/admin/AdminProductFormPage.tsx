import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { getCategories } from '@/lib/api/products'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input, Select, Checkbox } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { ProductCategory } from '@/types'

interface GalleryImage {
  url: string
  alt: string
}

interface FormState {
  slug: string
  sku: string
  name: string
  shortDescription: string
  fullDescription: string
  sizeLabel: string
  keyIngredients: string
  howToUse: string
  suitability: string
  ingredientsInci: string
  price: string // pounds, as typed
  compareAtPrice: string
  categoryId: string
  stockQuantity: string
  imageUrl: string
  additionalImages: GalleryImage[]
  isActive: boolean
  isFeatured: boolean
}

interface AdminProductRow {
  slug: string
  sku: string
  name: string
  short_description: string | null
  full_description: string | null
  size_label: string | null
  key_ingredients: string | null
  how_to_use: string | null
  suitability: string | null
  ingredients_inci: string | null
  price_minor: number
  compare_at_price_minor: number | null
  category_id: string
  stock_quantity: number
  image_url: string | null
  additional_images: GalleryImage[] | null
  is_active: boolean
  is_featured: boolean
}

const empty: FormState = {
  slug: '',
  sku: '',
  name: '',
  shortDescription: '',
  fullDescription: '',
  sizeLabel: '',
  keyIngredients: '',
  howToUse: '',
  suitability: '',
  ingredientsInci: '',
  price: '',
  compareAtPrice: '',
  categoryId: '',
  stockQuantity: '0',
  imageUrl: '',
  additionalImages: [],
  isActive: true,
  isFeatured: false,
}

/** Labelled textarea matching the Input component's look, with an optional hint below. */
function Textarea({
  id,
  label,
  rows,
  value,
  onChange,
  hint,
}: {
  id: string
  label: string
  rows: number
  value: string
  onChange: (value: string) => void
  hint?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        aria-describedby={hintId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-300 bg-white p-3 text-sm text-ink-900 focus-visible:outline-2 focus-visible:outline-accent-500 dark:bg-ink-50"
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      )}
    </div>
  )
}

function poundsToMinor(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export default function AdminProductFormPage({ mode }: { mode: 'create' | 'edit' }) {
  useDocumentMeta({ title: mode === 'create' ? 'New product — Admin' : 'Edit product — Admin', noindex: true })
  const navigate = useNavigate()
  const { id } = useParams()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [form, setForm] = useState<FormState>(empty)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !id) return
    adminFetchJson<{ product: AdminProductRow }>(`/api/admin/products/${id}`)
      .then(({ product }) => {
        setForm({
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          shortDescription: product.short_description ?? '',
          fullDescription: product.full_description ?? '',
          sizeLabel: product.size_label ?? '',
          keyIngredients: product.key_ingredients ?? '',
          howToUse: product.how_to_use ?? '',
          suitability: product.suitability ?? '',
          ingredientsInci: product.ingredients_inci ?? '',
          price: (product.price_minor / 100).toString(),
          compareAtPrice: product.compare_at_price_minor ? (product.compare_at_price_minor / 100).toString() : '',
          categoryId: product.category_id,
          stockQuantity: String(product.stock_quantity),
          imageUrl: product.image_url ?? '',
          additionalImages: product.additional_images ?? [],
          isActive: product.is_active,
          isFeatured: product.is_featured,
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [mode, id])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      name: form.name.trim(),
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      sizeLabel: form.sizeLabel,
      keyIngredients: form.keyIngredients,
      howToUse: form.howToUse,
      suitability: form.suitability,
      ingredientsInci: form.ingredientsInci,
      priceMinor: poundsToMinor(form.price),
      compareAtPriceMinor: form.compareAtPrice ? poundsToMinor(form.compareAtPrice) : null,
      categoryId: form.categoryId,
      stockQuantity: Number(form.stockQuantity) || 0,
      imageUrl: form.imageUrl,
      additionalImages: form.additionalImages.filter((img) => img.url.trim()),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    }
    try {
      if (mode === 'create') {
        const { product } = await adminFetchJson<{ product: { id: string } }>('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        navigate(`/admin/products/${product.id}`)
      } else {
        await adminFetchJson(`/api/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        navigate('/admin/products')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this product.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-ink-500">Loading…</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink-950">{mode === 'create' ? 'New product' : 'Edit product'}</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Slug" required value={form.slug} onChange={(e) => set('slug', e.target.value)} hint="Used in the product URL." />
          <Input label="SKU" required value={form.sku} onChange={(e) => set('sku', e.target.value)} />
          <Select label="Category" required value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="Price (£)" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => set('price', e.target.value)} />
          <Input
            label="Compare-at price (£, optional)"
            type="number"
            min="0"
            step="0.01"
            value={form.compareAtPrice}
            onChange={(e) => set('compareAtPrice', e.target.value)}
          />
          <Input label="Stock quantity" type="number" min="0" required value={form.stockQuantity} onChange={(e) => set('stockQuantity', e.target.value)} />
          <Input label="Main image URL" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="block text-sm font-medium text-ink-800">Gallery images (optional)</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => set('additionalImages', [...form.additionalImages, { url: '', alt: '' }])}
            >
              Add image
            </Button>
          </div>
          <div className="space-y-2">
            {form.additionalImages.map((img, index) => (
              <div key={index} className="flex gap-2">
                <input
                  placeholder="Image URL"
                  value={img.url}
                  onChange={(e) => {
                    const next = [...form.additionalImages]
                    next[index] = { ...next[index], url: e.target.value }
                    set('additionalImages', next)
                  }}
                  className="h-11 flex-1 rounded-xl border border-ink-300 bg-white px-3.5 text-sm text-ink-900 shadow-card focus-visible:outline-2 focus-visible:outline-accent-500 dark:bg-ink-50"
                />
                <input
                  placeholder="Alt text"
                  value={img.alt}
                  onChange={(e) => {
                    const next = [...form.additionalImages]
                    next[index] = { ...next[index], alt: e.target.value }
                    set('additionalImages', next)
                  }}
                  className="h-11 w-40 rounded-xl border border-ink-300 bg-white px-3.5 text-sm text-ink-900 shadow-card focus-visible:outline-2 focus-visible:outline-accent-500 dark:bg-ink-50"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => set('additionalImages', form.additionalImages.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
            {form.additionalImages.length === 0 && <p className="text-xs text-ink-400">No gallery images yet.</p>}
          </div>
        </div>

        <Textarea
          id="shortDescription"
          label="Short description"
          rows={2}
          value={form.shortDescription}
          onChange={(v) => set('shortDescription', v)}
          hint="One sentence. Used on product cards, and as the meta description search engines show in results — aim for under 160 characters."
        />
        <Textarea
          id="fullDescription"
          label="Full description"
          rows={8}
          value={form.fullDescription}
          onChange={(v) => set('fullDescription', v)}
          hint="The main body copy on the product page, and the largest single source of indexable content a search engine or AI answer engine has for this product. Blank lines separate paragraphs."
        />

        {/* ------------------------------------------------------------------
            Product detail. These four fields are what turn a product page from
            a price and a photo into something a customer can actually decide
            from — and what gets surfaced as structured data to search engines.
            All are optional: each section is simply omitted from the product
            page when its field is left empty.
        ------------------------------------------------------------------- */}
        <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-5">
          <h2 className="text-sm font-semibold text-ink-900">Product detail</h2>
          <p className="mt-1 text-xs text-ink-500">
            Shown as separate sections on the product page. Leave any of them blank to hide that section.
          </p>

          <div className="mt-4 space-y-4">
            <Input
              label="Size / pack"
              value={form.sizeLabel}
              onChange={(e) => set('sizeLabel', e.target.value)}
              hint='As the customer should read it, e.g. "50ml" or "Box of 5 masks".'
            />

            <Textarea
              id="keyIngredients"
              label="Key ingredients"
              rows={4}
              value={form.keyIngredients}
              onChange={(v) => set('keyIngredients', v)}
              hint="One per line, written as “Name — what it does”. The part before the dash is shown as the ingredient name."
            />

            <Textarea
              id="howToUse"
              label="How to use"
              rows={5}
              value={form.howToUse}
              onChange={(v) => set('howToUse', v)}
              hint="One step per line. The page numbers them automatically, so don't number them here."
            />

            <Textarea
              id="suitability"
              label="Who it's for"
              rows={3}
              value={form.suitability}
              onChange={(v) => set('suitability', v)}
              hint="Skin types and any usage caveats. Keep to cosmetic suitability — not medical advice."
            />

            <Textarea
              id="ingredientsInci"
              label="Full ingredients (INCI)"
              rows={4}
              value={form.ingredientsInci}
              onChange={(v) => set('ingredientsInci', v)}
              hint="The full INCI declaration, copied exactly from the supplier's product specification. This is what a customer with an allergy relies on, so it must match the actual formulation — never write it from memory."
            />
          </div>
        </div>

        <div className="flex gap-8">
          <Checkbox label="Active (visible in shop)" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          <Checkbox label="Featured on homepage" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" variant="accent" loading={saving}>
          {mode === 'create' ? 'Create product' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}
