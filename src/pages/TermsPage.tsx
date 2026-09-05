import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { ContentBlock, useLastUpdated } from '@/lib/content/ContentBlocks'

/** Copy lives in Admin → Content ("Terms & conditions"). */
export default function TermsPage() {
  return (
    <InfoPageLayout
      title="Terms & conditions"
      description="The terms and conditions governing use of the Avernic UK website and orders."
      lastUpdated={useLastUpdated('terms.last_updated')}
    >
      <ContentBlock blockKey="terms.body" />
    </InfoPageLayout>
  )
}
