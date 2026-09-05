import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'

export default function PrivacyPage() {
  return (
    <InfoPageLayout title="Privacy policy" description="How Avernic UK collects, uses and protects your personal data." lastUpdated="[date]">
      <p>
        This policy explains how Avernic UK collects, uses, and protects your personal data when
        you use this website or place an order, in accordance with UK GDPR and the Data Protection
        Act 2018.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">1. Data controller</h2>
      <p>
        Avernic UK, <Placeholder>legal company name and registration number</Placeholder>, is the
        data controller for personal data collected via this website. Contact:{' '}
        <Placeholder>data protection contact email</Placeholder>.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">2. What we collect</h2>
      <p>
        When you place an order or create an account, we collect your name, email address,
        telephone number, and delivery address. We do not collect or store your banking or card
        details — payment is handled entirely by Fena's Open Banking service.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">3. How we use your data</h2>
      <p>
        We use your data to process and fulfil your order, send order confirmation and
        service-related emails, provide customer support, and meet our legal obligations (for
        example, tax and accounting records).
      </p>

      <h2 className="text-lg font-semibold text-ink-900">4. Who we share your data with</h2>
      <p>
        We share the minimum necessary data with: Supabase (our database and authentication
        provider), Fena (payment processing via Open Banking), Resend (transactional email
        delivery), and Cloudflare (website hosting). We do not sell your personal data.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">5. How long we keep your data</h2>
      <p><Placeholder>Confirm data retention periods, e.g. order records kept for 6 years for tax purposes.</Placeholder></p>

      <h2 className="text-lg font-semibold text-ink-900">6. Your rights</h2>
      <p>
        Under UK GDPR you have the right to access, correct, delete, or restrict the use of your
        personal data, and to data portability. To exercise these rights, contact us via our{' '}
        <a href="/contact" className="underline">Contact</a> page.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">7. Cookies</h2>
      <p>
        See our <a href="/cookies" className="underline">Cookie policy</a> for details of the
        cookies used on this website.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">8. Complaints</h2>
      <p>
        If you have concerns about how we handle your data, you can also contact the Information
        Commissioner's Office (ICO) at ico.org.uk.
      </p>
    </InfoPageLayout>
  )
}
