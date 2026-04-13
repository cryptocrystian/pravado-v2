'use client';

/**
 * Analytics Overview — /app/analytics
 * Headline metrics, EVI growth chart, attribution, top wins.
 */

import { Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { HeadlineMetrics } from '@/components/analytics/HeadlineMetrics';
import { PillarContribution } from '@/components/analytics/PillarContribution';
import { CompetitiveSnapshot } from '@/components/analytics/CompetitiveSnapshot';
import { TopWins } from '@/components/analytics/TopWins';
import { mockHeadlineMetrics, mockAttribution, mockTopWins, mockNarratives } from '@/components/analytics/analytics-mock-data';
import { AINarrativeHeader } from '@/components/analytics/AINarrativeHeader';
import { arrayToCsv, downloadCsv } from '@/lib/csv-export';

const EviGrowthChart = dynamic(
  () =>
    import('@/components/analytics/EviGrowthChart').then(
      (mod) => mod.EviGrowthChart,
    ),
  { ssr: false },
);

function ChartSkeleton() {
  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-6 animate-pulse">
      <div className="h-4 w-48 bg-white/5 rounded mb-4" />
      <div className="h-[240px] bg-white/5 rounded" />
    </div>
  );
}

export default function AnalyticsOverviewPage() {
  const handleExport = useCallback(() => {
    const csv = arrayToCsv(
      ['Metric', 'Value', 'Detail'],
      [
        ['EVI Change', mockHeadlineMetrics.eviChange.value, `${mockHeadlineMetrics.eviChange.from} → ${mockHeadlineMetrics.eviChange.to}`],
        ['Content Published', String(mockHeadlineMetrics.contentPublished.value), `Goal: ${mockHeadlineMetrics.contentPublished.goal}`],
        ['Earned Placements', String(mockHeadlineMetrics.earnedPlacements.value), `Goal: ${mockHeadlineMetrics.earnedPlacements.goal}`],
        ['AI Citations', String(mockHeadlineMetrics.totalCitations.value), `+${mockHeadlineMetrics.totalCitations.deltaPercent}%`],
        ...mockAttribution.map(a => ['Attribution: ' + a.label, a.percent + '%', '']),
        ...mockTopWins.map((w, i) => [`Top Win #${i + 1}`, w, '']),
      ]
    );
    downloadCsv('pravado-analytics-overview.csv', csv);
  }, []);

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleExport}
            className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            Export &darr;
          </button>
        </div>

        <AINarrativeHeader narrative={mockNarratives.overview} />

        {/* Headline Metrics */}
        <HeadlineMetrics />

        {/* EVI Growth Chart — dynamic import (no SSR) to avoid Recharts hydration issues */}
        <Suspense fallback={<ChartSkeleton />}>
          <EviGrowthChart />
        </Suspense>

        {/* Pillar Contribution (replaces stub AttributionBar) */}
        <PillarContribution />

        {/* Top Wins */}
        <TopWins />

        {/* Competitive Position */}
        <CompetitiveSnapshot />
      </div>
    </div>
  );
}
