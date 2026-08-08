'use client';

/**
 * PR Analytics — /app/analytics/pr
 * Earned placements + coverage timeline from REAL media-monitoring data.
 *
 * Wave-2: ANALYTICS_PR_WIRED is now TRUE. The PR pillar has real earned-media
 * rows (earned_mentions / media_monitoring_articles), so this tab renders
 * EarnedMediaAnalytics — real stats + coverage timeline with honest empty
 * states when an org has no monitored sources yet.
 */

import { EarnedMediaAnalytics } from '@/components/analytics/EarnedMediaAnalytics';
import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function PRAnalyticsPage() {
  const wired = useFeatureFlag('ANALYTICS_PR_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Analytics" subsurface="PR" />;
  }
  return <EarnedMediaAnalytics />;
}
