'use client';

/**
 * SAGE Recommendations — /app/seo/recommendations
 * Prioritized action queue with urgency sections.
 *
 * Phase 0 Track 0B: gated behind SEO_RECOMMENDATIONS_WIRED until SAGE wires
 * real recommendations. Mock recommendation arrays + hardcoded counts removed.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function RecommendationsPage() {
  const wired = useFeatureFlag('SEO_RECOMMENDATIONS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="SEO" subsurface="Recommendations" />;
  }
  // Phase 1 restores the real critical/high/medium pipeline render.
  return null;
}
