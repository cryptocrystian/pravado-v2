'use client';

/**
 * Analytics Overview — /app/analytics
 * Headline metrics, EVI growth chart, attribution, top wins.
 */

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { HeadlineMetrics } from '@/components/analytics/HeadlineMetrics';
import { AttributionBar } from '@/components/analytics/AttributionBar';
import { TopWins } from '@/components/analytics/TopWins';

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
  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Controls row — date range is in chrome bar; Export only here */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            Export &darr;
          </button>
        </div>

        {/* Headline Metrics */}
        <HeadlineMetrics />

        {/* EVI Growth Chart — dynamic import (no SSR) to avoid Recharts hydration issues */}
        <Suspense fallback={<ChartSkeleton />}>
          <EviGrowthChart />
        </Suspense>

        {/* Attribution */}
        <AttributionBar />

        {/* Top Wins */}
        <TopWins />
      </div>
    </div>
  );
}
