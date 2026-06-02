'use client';

/**
 * PR Analytics — /app/analytics/pr
 * Earned placements, pitch funnel, EVI contribution.
 *
 * Phase 0 Track 0B: full ComingSoonGate behind ANALYTICS_PR_WIRED.
 * Mock placements + narrative removed; CSV export will return in Phase 1
 * against real data.
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function PRAnalyticsPage() {
  const wired = useFeatureFlag('ANALYTICS_PR_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Analytics" subsurface="PR" />;
  }
  // Phase 1 restores the PlacementsTable / CoverageTimeline / funnels render.
  return null;
}
