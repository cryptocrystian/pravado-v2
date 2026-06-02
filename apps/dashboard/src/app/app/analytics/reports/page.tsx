'use client';

/**
 * Reports — /app/analytics/reports
 *
 * Phase 0 Track 0B: the Reports tab is removed from the Analytics nav (see
 * AnalyticsChromeBar.tsx and AnalyticsTabBar.tsx). The route file persists
 * here behind ANALYTICS_REPORTS_WIRED so any saved deep link renders the
 * gate instead of 404, but the surface is not discoverable in product.
 *
 * Phase 1 Workstream 5 decides if/when Reports returns — Recommendation:
 * not until a data-confidence threshold (e.g., 60 days of real EVI data
 * + 5+ real placements) is defined.
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function ReportsPage() {
  const wired = useFeatureFlag('ANALYTICS_REPORTS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Analytics" subsurface="Reports" />;
  }
  // Phase 1 restores the report builder + PDF render targets here.
  return null;
}
