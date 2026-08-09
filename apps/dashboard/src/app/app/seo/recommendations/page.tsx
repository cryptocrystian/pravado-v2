'use client';

/**
 * SAGE Recommendations — /app/seo/recommendations
 * Prioritized action queue with urgency sections.
 *
 * Wired to real SAGE proposals (SEO pillar) via /api/seo/recommendations →
 * /api/v1/sage/action-stream?pillar=seo. Honest loading/empty/error states, no
 * fabricated recommendations. Gated behind SEO_RECOMMENDATIONS_WIRED.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { SeoRecommendationsQueue } from '@/components/seo/SeoRecommendationsQueue';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function RecommendationsPage() {
  const wired = useFeatureFlag('SEO_RECOMMENDATIONS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="SEO" subsurface="Recommendations" />;
  }
  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        <SeoRecommendationsQueue />
      </div>
    </div>
  );
}
