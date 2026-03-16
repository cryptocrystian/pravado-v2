'use client';

/**
 * Reports — /app/analytics/reports
 * Stub page with report builder + template previews.
 */

export const dynamic = 'force-dynamic';

import { FileText } from '@phosphor-icons/react';
import { mockReportTemplates } from '@/components/analytics/analytics-mock-data';

export default function ReportsPage() {
  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto">
        {/* Report Builder Stub */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-8 text-center mb-6">
          <FileText size={48} className="text-cc-cyan mx-auto" weight="regular" />
          <h2 className="text-xl font-bold text-white mt-4">Report Builder</h2>
          <p className="text-sm text-white/70 mt-2 mb-6 max-w-md mx-auto leading-relaxed">
            Create shareable reports for leadership, clients, or boards. Export
            as PDF or shareable link.
          </p>
          <button
            type="button"
            className="bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
          >
            Build a Report
          </button>
          <p className="text-xs text-white/45 mt-3">Coming in next sprint</p>
        </div>

        {/* Pre-built Templates */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Report Templates (Preview)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {mockReportTemplates.map((tpl) => (
            <div
              key={tpl.title}
              className="bg-cc-surface border border-white/8 rounded-xl p-4 opacity-60"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">
                  {tpl.title}
                </h4>
                <span className="bg-white/5 text-white/45 text-xs px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-white/45 leading-relaxed">
                {tpl.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
