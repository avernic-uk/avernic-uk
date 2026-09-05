import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { Accordion } from '@/components/ui/Accordion'

const faqSections: { heading: string; items: { question: string; answer: string }[] }[] = [
  {
    heading: 'Ordering',
    items: [
      { question: 'Do I need an account to order?', answer: 'No — you can check out as a guest. Creating an account lets you view your order history in one place.' },
      { question: 'Can I change or cancel my order after placing it?', answer: 'Contact us as soon as possible after placing your order. If it has not yet been dispatched, we will do our best to help.' },
    ],
  },
  {
    heading: 'Payment',
    items: [
      { question: 'How do I pay?', answer: 'Checkout is completed securely via Open Banking, powered by Fena. You authorise payment directly from your own bank account — no card details are entered on our site.' },
      { question: 'Is my payment information safe?', answer: 'We never see or store your banking details. Payment is handled entirely by Fena’s Open Banking service, and your bank’s own security is used to authorise payment.' },
    ],
  },
  {
    heading: 'Delivery',
    items: [
      { question: 'Where do you deliver?', answer: 'We deliver to addresses within the United Kingdom only. We do not offer international shipping.' },
      { question: 'How much does delivery cost?', answer: 'See our Delivery information page for current delivery pricing and free delivery thresholds.' },
    ],
  },
  {
    heading: 'Returns',
    items: [
      { question: 'Can I return a product?', answer: 'See our Returns & refunds page for eligibility, exceptions, and how to start a return.' },
    ],
  },
]

export default function FaqPage() {
  return (
    <InfoPageLayout title="Frequently asked questions" description="Answers to common questions about ordering, payment, delivery and returns at Avernic UK.">
      <div className="space-y-10">
        {faqSections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-ink-900">{section.heading}</h2>
            <div className="mt-4">
              <Accordion items={section.items} />
            </div>
          </section>
        ))}
      </div>
    </InfoPageLayout>
  )
}
