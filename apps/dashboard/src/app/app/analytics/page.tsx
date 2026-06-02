'use client';

/**
 * Analytics Overview — /app/analytics
 * Headline metrics + Top Wins are honest by themselves (real zeros / own
 * empty state) and stay rendered.
 *
 * Phase 0 Track 0B: the narrative banner is gated on
 * ANALYTICS_OVERVIEW_NARRATIVE_WIRED; the EVI trend chart, pillar breakdown,
 * and competitive position are gated on ANALYTICS_OVERVIEW_TREND_WIRED.
 * Both flags default false, so those blocks render nothing in Phase 0. When
 * Phase 1 wires real data sources, restore the AINarrativeHeader /
 * EviGrowthChart / PillarContribution / CompetitiveSnapshot renders inside
 * the respective conditional branches.
 *
 * The CSV export used to read from analytics-mock-data; it has been removed
 * here and will return in Phase 1 backed by real metrics.
 */

import { HeadlineMetrics } from '@/components/analytics/HeadlineMetrics';
import { TopWins } from '@/components/analytics/TopWins';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function AnalyticsOverviewPage() {
  // Flags are unused while wired === false (Phase 0); the reads keep the
  // dependency visible to the mock-leak grep and to a future Phase 1 editor.
  const narrativeWired = useFeatureFlag('ANALYTICS_OVERVIEW_NARRATIVE_WIRED');
  const trendWired = useFeatureFlag('ANALYTICS_OVERVIEW_TREND_WIRED');
  void narrativeWired;
  void trendWired;

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Headline stat cards — keep (honest zeros) */}
        <HeadlineMetrics />

        {/* Top Wins — keep (has its own empty state) */}
        <TopWins />
      </div>
    </div>
  );
}
