import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'

export default function TermsPage() {
  const { settings } = useSiteSettings()
  return (
    <InfoPageLayout title="Terms & conditions" description="The terms and conditions governing use of the Avernic UK website and orders." lastUpdated="[date]">
      <p>
        These terms and conditions govern the use of the Avernic UK website (avernic.uk) and
        any order placed with Avernic UK. By using this website or placing an order, you agree to
        these terms.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">1. About us</h2>
      <p>
        Avernic UK is operated by{' '}
        {settings.companyName
          ? `${settings.companyName}${settings.companyNumber ? ` (company number ${settings.companyNumber})` : ''}`
          : <Placeholder>legal company name and registration number</Placeholder>}
        , registered office at {settings.registeredAddress || <Placeholder>registered address</Placeholder>}.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">2. Placing an order</h2>
      <p>
        Orders are placed by completing checkout on this website. All prices are shown in pounds
        sterling (GBP) and, where applicable, are inclusive of VAT. Delivery is available to UK
        addresses only. An order is confirmed once payment has been verified and you have received
        an order confirmation email.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">3. Payment</h2>
      <p>
        Payment is completed via Open Banking, powered by Fena. By placing an order you authorise
        Avernic UK to take payment for the total amount shown at checkout via this method.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">4. Pricing and availability</h2>
      <p>
        We take care to ensure prices and stock levels shown are accurate, but errors may
        occasionally occur. If a product's price or availability is incorrect, we will contact you
        before proceeding with your order.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">5. Delivery</h2>
      <p>
        See our <a href="/delivery" className="underline">Delivery information</a> page for delivery
        pricing and timescales.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">6. Returns and cancellation</h2>
      <p>
        See our <a href="/returns" className="underline">Returns &amp; refunds</a> page for your
        rights and how to return an item.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">7. Product information</h2>
      <p>
        All products sold on this website are cosmetic skincare products intended for topical use
        only. They are not medicines and are not intended to diagnose, treat, cure or prevent any
        disease. We do not make medical claims about our products beyond what is stated on the
        product's official packaging. Nothing on this website constitutes medical advice; if in
        doubt, consult a healthcare professional. Our products are intended for adults aged 18 and
        over.
      </p>

      <h2 className="text-lg font-semibold text-ink-900">8. Liability</h2>
      <p><Placeholder>Insert your business's liability terms, reviewed by a qualified professional.</Placeholder></p>

      <h2 className="text-lg font-semibold text-ink-900">9. Governing law</h2>
      <p>These terms are governed by the laws of England and Wales.</p>

      <h2 className="text-lg font-semibold text-ink-900">10. Contact</h2>
      <p>
        Questions about these terms can be sent via our{' '}
        <a href="/contact" className="underline">Contact</a> page.
      </p>
    </InfoPageLayout>
  )
}
