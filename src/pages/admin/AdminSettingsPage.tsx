import { useEffect, useState, type FormEvent } from 'react'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface SettingsRow {
  company_name: string
  company_number: string
  registered_address: string
  contact_email: string
  contact_phone: string
  delivery_standard_minor: number
  delivery_express_minor: number
  delivery_free_threshold_minor: number
  hero_heading: string
  hero_subheading: string
  age_notice_text: string
  logo_url: string
  social_links: string
}

interface FormState {
  companyName: string
  companyNumber: string
  registeredAddress: string
  contactEmail: string
  contactPhone: string
  deliveryStandard: string // pounds, as typed — Royal Mail 48hr Tracked
  deliveryExpress: string // pounds, as typed — Royal Mail 24hr Tracked & Signed
  deliveryFreeThreshold: string
  heroHeading: string
  heroSubheading: string
  ageNoticeText: string
  logoUrl: string
  socialLinks: string
}

function rowToForm(row: SettingsRow): FormState {
  return {
    companyName: row.company_name,
    companyNumber: row.company_number,
    registeredAddress: row.registered_address,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    deliveryStandard: (row.delivery_standard_minor / 100).toString(),
    deliveryExpress: (row.delivery_express_minor / 100).toString(),
    deliveryFreeThreshold: (row.delivery_free_threshold_minor / 100).toString(),
    heroHeading: row.hero_heading,
    heroSubheading: row.hero_subheading,
    ageNoticeText: row.age_notice_text,
    logoUrl: row.logo_url,
    socialLinks: row.social_links,
  }
}

function poundsToMinor(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export default function AdminSettingsPage() {
  useDocumentMeta({ title: 'Settings — Admin', noindex: true })
  const { refresh } = useSiteSettings()

  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    adminFetchJson<{ settings: SettingsRow }>('/api/admin/settings')
      .then(({ settings }) => setForm(rowToForm(settings)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await adminFetchJson('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          companyNumber: form.companyNumber.trim(),
          registeredAddress: form.registeredAddress.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          deliveryStandardMinor: poundsToMinor(form.deliveryStandard),
          deliveryExpressMinor: poundsToMinor(form.deliveryExpress),
          deliveryFreeThresholdMinor: poundsToMinor(form.deliveryFreeThreshold),
          heroHeading: form.heroHeading,
          heroSubheading: form.heroSubheading,
          ageNoticeText: form.ageNoticeText,
          logoUrl: form.logoUrl.trim(),
          socialLinks: form.socialLinks,
        }),
      })
      refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) return <p className="text-sm text-ink-500">Loading…</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink-950">Site settings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Changes here update the live site immediately — no code changes or redeploy needed.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-8">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Branding</h2>
          <p className="mt-1 text-xs text-ink-400">
            Used for the header, footer and homepage logo. Paste a URL to an image with a transparent
            background if the current one looks boxed-in — leave blank to use the site's default logo.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="Logo image URL"
              value={form.logoUrl}
              onChange={(e) => set('logoUrl', e.target.value)}
              hint="PNG or SVG with a transparent background works best."
            />
          </div>
          <div className="mt-4 flex gap-3">
            <div className="flex h-20 flex-1 items-center justify-center rounded-xl border border-ink-200 bg-white">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo preview on light background" className="h-10 w-auto max-w-[80%] object-contain" />
              ) : (
                <span className="text-xs text-ink-400">Default logo</span>
              )}
            </div>
            <div className="flex h-20 flex-1 items-center justify-center rounded-xl border border-ink-800 bg-ink-950">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo preview on dark background" className="h-10 w-auto max-w-[80%] object-contain" />
              ) : (
                <span className="text-xs text-ink-400">Default logo</span>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-400">Preview on both a light and a dark background — check neither shows an unwanted white box around the mark.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Business &amp; legal details</h2>
          <p className="mt-1 text-xs text-ink-400">Shown in the site footer, About page and Terms page.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Legal company name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
            <Input label="Company registration number" value={form.companyNumber} onChange={(e) => set('companyNumber', e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Registered address" value={form.registeredAddress} onChange={(e) => set('registeredAddress', e.target.value)} />
            </div>
            <Input label="Contact email" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            <Input label="Contact phone" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Delivery pricing</h2>
          <p className="mt-1 text-xs text-ink-400">
            Customers choose between these two Royal Mail options at checkout. Used to price every basket and
            order — see the Delivery information page.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Royal Mail 48hr Tracked (£)"
              type="number"
              min="0"
              step="0.01"
              value={form.deliveryStandard}
              onChange={(e) => set('deliveryStandard', e.target.value)}
              hint="Standard option. Free once the free-delivery threshold below is reached."
            />
            <Input
              label="Royal Mail 24hr Tracked & Signed (£)"
              type="number"
              min="0"
              step="0.01"
              value={form.deliveryExpress}
              onChange={(e) => set('deliveryExpress', e.target.value)}
              hint="Express option. Always charged — never included in the free-delivery threshold."
            />
            <Input
              label="Free delivery threshold (£)"
              type="number"
              min="0"
              step="0.01"
              value={form.deliveryFreeThreshold}
              onChange={(e) => set('deliveryFreeThreshold', e.target.value)}
              hint="Orders at or above this subtotal get free 48hr Tracked delivery."
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Homepage hero</h2>
          <div className="mt-4 space-y-4">
            <Input label="Heading" value={form.heroHeading} onChange={(e) => set('heroHeading', e.target.value)} />
            <div>
              <label htmlFor="heroSubheading" className="mb-1.5 block text-sm font-medium text-ink-800">
                Subheading
              </label>
              <textarea
                id="heroSubheading"
                rows={3}
                value={form.heroSubheading}
                onChange={(e) => set('heroSubheading', e.target.value)}
                className="w-full rounded-lg border border-ink-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-accent-500"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">18+ notice</h2>
          <p className="mt-1 text-xs text-ink-400">The caution banner shown at the top of every page.</p>
          <div className="mt-4">
            <Input label="Notice text" value={form.ageNoticeText} onChange={(e) => set('ageNoticeText', e.target.value)} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Search &amp; AI visibility</h2>
          <p className="mt-1 text-xs text-ink-400">
            Social profile links, used as structured-data <code>sameAs</code> references so search engines and AI answer
            engines (Google AI Overviews, ChatGPT, Perplexity) can connect this site to the same business elsewhere.
            One URL per line — Instagram, Facebook, TikTok, X, etc.
          </p>
          <div className="mt-4">
            <label htmlFor="socialLinks" className="mb-1.5 block text-sm font-medium text-ink-800">
              Social profile links
            </label>
            <textarea
              id="socialLinks"
              rows={3}
              placeholder={'https://instagram.com/avernicuk\nhttps://facebook.com/avernicuk'}
              value={form.socialLinks}
              onChange={(e) => set('socialLinks', e.target.value)}
              className="w-full rounded-lg border border-ink-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-accent-500"
            />
          </div>
          <p className="mt-2 text-xs text-ink-400">
            The full technical picture — sitemap, structured data and the AI-focused <code>/llms.txt</code> summary — is
            covered in the SEO overview; this field is the one thing here that only you can supply.
          </p>
        </section>

        {error && <Alert tone="danger">{error}</Alert>}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="accent" loading={saving}>
            Save changes
          </Button>
          {saved && <span className="text-sm text-success-600">Saved ✓</span>}
        </div>
      </form>
    </div>
  )
}
