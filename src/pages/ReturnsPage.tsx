import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { ContentBlock, useLastUpdated } from '@/lib/content/ContentBlocks'

/** Copy lives in Admin → Content ("Returns & refunds"). */
export default function ReturnsPage() {
  return (
    <InfoPageLayout
      title="Returns & refunds"
      description="How to return an item and how refunds are processed at Avernic UK."
      lastUpdated={useLastUpdated('returns.last_updated')}
    >
      <ContentBlock blockKey="returns.body" />
    </InfoPageLayout>
  )
}
