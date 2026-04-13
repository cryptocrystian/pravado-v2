'use client';

/**
 * Content Analytics — /app/analytics/content
 * Content performance table, citation velocity, gap analysis.
 */

import { useCallback } from 'react';
import { ContentTable } from '@/components/analytics/ContentTable';
import { CitationVelocityChart } from '@/components/analytics/CitationVelocityChart';
import { CiteMindDistribution } from '@/components/analytics/CiteMindDistribution';
import { mockContentRows } from '@/components/analytics/analytics-mock-data';
import { arrayToCsv, downloadCsv } from '@/lib/csv-export';

export default function ContentAnalyticsPage() {
  const handleExport = useCallback(() => {
    const csv = arrayToCsv(
      ['Title', 'Type', 'CiteMind Score', 'Citations', 'EVI Lift', 'Trend'],
      mockContentRows.map(r => [r.title, r.type, r.citeMind, r.citations, r.eviLift, r.trend])
    );
    downloadCsv('pravado-analytics-content.csv', csv);
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

        <ContentTable />
        <CitationVelocityChart />
        <CiteMindDistribution />
      </div>
    </div>
  );
}
