import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { ContentBlock, useLastUpdated } from '@/lib/content/ContentBlocks'

/** Copy lives in Admin → Content ("Privacy policy"). */
export default function PrivacyPage() {
  return (
    <InfoPageLayout
      title="Privacy policy"
      description="How Avernic UK collects, uses and protects your personal data."
      lastUpdated={useLastUpdated('privacy.last_updated')}
    >
      <ContentBlock blockKey="privacy.body" />
    </InfoPageLayout>
  )
}
