'use client';

/**
 * Content Analytics — /app/analytics/content
 * Performance table, citation velocity, CiteMind distribution.
 *
 * Phase 0 Track 0B: full ComingSoonGate behind ANALYTICS_CONTENT_WIRED.
 * Mock content rows + narrative removed; CSV export will return in Phase 1
 * against real data.
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function ContentAnalyticsPage() {
  const wired = useFeatureFlag('ANALYTICS_CONTENT_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Analytics" subsurface="Content" />;
  }
  // Phase 1 restores the AINarrativeHeader / ContentTable / charts render.
  return null;
}
