'use client';

/**
 * Content Analytics — /app/analytics/content
 * Content performance table, citation velocity, gap analysis.
 */

export const dynamic = 'force-dynamic';

import { ContentTable } from '@/components/analytics/ContentTable';

export default function ContentAnalyticsPage() {
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

        <ContentTable />
      </div>
    </div>
  );
}
