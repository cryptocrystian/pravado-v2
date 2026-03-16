'use client';

/**
 * PR Analytics — /app/analytics/pr
 * Earned media placements, pitch funnel, EVI contribution.
 */

export const dynamic = 'force-dynamic';

import { PlacementsTable } from '@/components/analytics/PlacementsTable';
import { PitchFunnel } from '@/components/analytics/PitchFunnel';
import { EviContributionCard } from '@/components/analytics/EviContributionCard';

export default function PRAnalyticsPage() {
  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Export control — date range lives in chrome bar */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            Export ↓
          </button>
        </div>

        <PlacementsTable />
        <PitchFunnel />
        <EviContributionCard />
      </div>
    </div>
  );
}
