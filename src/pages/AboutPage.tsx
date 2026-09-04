import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'

export default function AboutPage() {
  return (
    <InfoPageLayout title="About Avernic UK" description="Learn about Avernic UK, a UK-based online retailer of everyday healthcare and wellbeing essentials.">
      <p>
        Avernic UK is a UK-based online retailer offering a straightforward way to shop everyday
        healthcare and wellbeing essentials, with delivery across the United Kingdom.
      </p>
      <p>
        We built Avernic UK around three things: a clear, honest shopping experience; a secure
        checkout powered by Open Banking; and a range chosen for everyday usefulness rather than
        volume.
      </p>
      <h2 className="text-lg font-semibold text-ink-900">Our business</h2>
      <p>
        Avernic UK is operated by <Placeholder>legal company name</Placeholder>, a company
        registered in England and Wales under company number{' '}
        <Placeholder>company registration number</Placeholder>. Our registered office is at{' '}
        <Placeholder>registered business address</Placeholder>.
      </p>
      <p>
        Avernic UK is not a registered pharmacy. Where any product on this site requires
        professional approval, prescription, or age/eligibility verification, that requirement is
        applied at the relevant stage of ordering and is not bypassed by this website.
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
