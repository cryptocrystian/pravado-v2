'use client';

/**
 * Competitive Intelligence — /app/seo/competitors
 * Share of voice, head-to-head, topic comparison, content gaps.
 *
 * Phase 0 Track 0B: gated behind SEO_COMPETITORS_WIRED until real data lands.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { CompetitorComparison } from '@/components/seo/CompetitorComparison';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function CompetitorsPage() {
  const wired = useFeatureFlag('SEO_COMPETITORS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="SEO" subsurface="Competitors" />;
  }
  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        <CompetitorComparison />
      </div>
    </div>
  );
}
