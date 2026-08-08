'use client';

/**
 * Analytics Overview — /app/analytics
 *
 * Wave-2 (real data light-up):
 * - HeadlineMetrics + TopWins are always rendered (real values / honest empty).
 * - ANALYTICS_OVERVIEW_TREND_WIRED is now TRUE: the EVI-over-time chart
 *   (EviGrowthChart, real /api/evi/history) and the EVI Driver Breakdown
 *   (real /api/evi/current component scores + honest data-coverage) render.
 * - ANALYTICS_OVERVIEW_NARRATIVE_WIRED stays FALSE: the AI narrative banner has
 *   no real generator wired — leaving it gated avoids fabricating prose.
 * - Competitive position stays absent (its only source is mock data).
 */

import { EVIDriverBreakdown } from '@/components/analytics/EVIDriverBreakdown';
import { EviGrowthChart } from '@/components/analytics/EviGrowthChart';
import { HeadlineMetrics } from '@/components/analytics/HeadlineMetrics';
import { TopWins } from '@/components/analytics/TopWins';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function AnalyticsOverviewPage() {
  const trendWired = useFeatureFlag('ANALYTICS_OVERVIEW_TREND_WIRED');

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Headline stat cards — real values / honest zeros */}
        <HeadlineMetrics />

        {/* EVI over time + driver breakdown — real data behind the trend flag */}
        {trendWired && (
          <>
            <EviGrowthChart />
            <EVIDriverBreakdown />
          </>
        )}

        {/* Top movers — real EVI history deltas / honest empty */}
        <TopWins />
      </div>
    </div>
  );
}
