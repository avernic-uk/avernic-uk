import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'

export default function AboutPage() {
  const { settings } = useSiteSettings()
  return (
    <InfoPageLayout title="About Avernic UK" description="Learn about Avernic UK, a UK-based online retailer of cosmetic peptide skincare.">
      <p>
        Avernic UK is a UK-based online retailer offering a straightforward way to shop cosmetic
        peptide skincare — serums, moisturisers, eye care, cleansers and treatments — with delivery
        across the United Kingdom.
      </p>
      <p>
        We built Avernic UK around three things: a clear, honest shopping experience; a secure
        checkout powered by Open Banking; and a range chosen for everyday usefulness rather than
        volume.
      </p>
      <h2 className="text-lg font-semibold text-ink-900">Our products</h2>
      <p>
        Everything sold on Avernic UK is a cosmetic skincare product intended for topical use only.
        We do not sell medicines, supplements intended to treat or prevent disease, or any product
        intended for injection or internal use. Our products are intended for adults aged 18 and
        over — see the notice on every page.
      </p>
      <h2 className="text-lg font-semibold text-ink-900">Quality and testing</h2>
      <p>
        Every skincare formulation we sell is tested using HPLC (High-Performance Liquid
        Chromatography) — a laboratory technique used to verify the purity and concentration of
        active ingredients — before a batch is approved for sale. This checks formulation quality
        for cosmetic use; it doesn't change what the product is, and our products remain cosmetic
        skincare rather than medicines.
      </p>
      <h2 className="text-lg font-semibold text-ink-900">Our business</h2>
      <p>
        Avernic UK is operated by{' '}
        {settings.companyName || <Placeholder>legal company name</Placeholder>}, a company
        registered in England and Wales under company number{' '}
        {settings.companyNumber || <Placeholder>company registration number</Placeholder>}. Our
        registered office is at {settings.registeredAddress || <Placeholder>registered business address</Placeholder>}.
      </p>
      <h2 className="text-lg font-semibold text-ink-900">Get in touch</h2>
      <p>
        If you have any questions about Avernic UK or an order, please visit our{' '}
        <a href="/contact" className="underline">
          Contact
        </a>{' '}
        page.
      </p>
    </InfoPageLayout>
  )
}
