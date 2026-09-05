import { InfoPageLayout } from '@/components/layout/InfoPageLayout'
import { ContentBlock } from '@/lib/content/ContentBlocks'

/** Copy lives in Admin → Content ("About" → Page content). */
export default function AboutPage() {
  return (
    <InfoPageLayout
      title="About Avernic UK"
      description="Learn about Avernic UK, a UK-based online retailer of cosmetic peptide skincare."
    >
      <ContentBlock blockKey="about.body" />
    </InfoPageLayout>
  )
}
