'use client';

/**
 * PR Analytics — /app/analytics/pr
 * Earned media placements, pitch funnel, EVI contribution.
 */

import { useCallback } from 'react';
import { PlacementsTable } from '@/components/analytics/PlacementsTable';
import { CoverageTimeline } from '@/components/analytics/CoverageTimeline';
import { PitchFunnel } from '@/components/analytics/PitchFunnel';
import { EviWaterfall } from '@/components/analytics/EviWaterfall';
import { EviContributionCard } from '@/components/analytics/EviContributionCard';
import { mockPlacements } from '@/components/analytics/analytics-mock-data';
import { arrayToCsv, downloadCsv } from '@/lib/csv-export';

export default function PRAnalyticsPage() {
  const handleExport = useCallback(() => {
    const csv = arrayToCsv(
      ['Publication', 'Headline', 'Date', 'Reach', 'EVI Lift'],
      mockPlacements.map(p => [p.publication, p.headline, p.date, p.reach, p.eviLift])
    );
    downloadCsv('pravado-analytics-pr.csv', csv);
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

        <PlacementsTable />
        <CoverageTimeline />
        <PitchFunnel />
        <EviWaterfall />
        <EviContributionCard />
      </div>
    </div>
  );
}
