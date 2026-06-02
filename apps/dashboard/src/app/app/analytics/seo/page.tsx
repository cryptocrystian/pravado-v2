'use client';

/**
 * SEO Analytics — /app/analytics/seo
 * Topic cluster performance, engine breakdown, competitive movement.
 *
 * Phase 0 Track 0B: full ComingSoonGate behind ANALYTICS_SEO_WIRED.
 * Mock SEO summary + topic performance + engine trend removed; CSV export
 * will return in Phase 1 against real data.
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function SEOAnalyticsPage() {
  const wired = useFeatureFlag('ANALYTICS_SEO_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Analytics" subsurface="SEO" />;
  }
  // Phase 1 restores the summary stats / engine breakdown / matrix render.
  return null;
}
