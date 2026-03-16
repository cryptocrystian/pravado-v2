'use client';

/**
 * PlacementsTable — PR placements table.
 * Sprint 1: Replaced bg-cc-surface → bg-panel, border-white/8 → border-border-subtle,
 *           rounded-2xl → rounded-xl, text-emerald-500 → text-semantic-success.
 */

import { mockPlacements, mockPRSummary } from './analytics-mock-data';

export function PlacementsTable() {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-panel border border-border-subtle rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
            Earned Placements
          </p>
          <p className="text-2xl font-bold text-white/95 tabular-nums">
            {mockPRSummary.placements}
          </p>
        </div>
        <div className="bg-panel border border-border-subtle rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
            Reach
          </p>
          <p className="text-2xl font-bold text-white/95 tabular-nums">
            {mockPRSummary.reach}
          </p>
        </div>
        <div className="bg-panel border border-border-subtle rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
            EVI from PR
          </p>
          <p className="text-2xl font-bold text-semantic-success tabular-nums">
            {mockPRSummary.eviFromPR}
          </p>
        </div>
      </div>

      {/* Placements Table */}
      <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Publication
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Headline
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Date
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Reach
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                EVI Lift
              </th>
            </tr>
          </thead>
          <tbody>
            {mockPlacements.map((row) => (
              <tr
                key={row.headline}
                className="border-b border-border-subtle/50 last:border-0 hover:bg-slate-3/50 transition-colors"
              >
                <td className="px-4 py-3 text-white/90 font-medium">
                  {row.publication}
                </td>
                <td className="px-4 py-3 text-white/70">{row.headline}</td>
                <td className="px-4 py-3 text-white/50">{row.date}</td>
                <td className="px-4 py-3 text-right text-white/70 tabular-nums">
                  {row.reach}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium tabular-nums ${
                    row.pending
                      ? 'text-white/40 italic'
                      : 'text-semantic-success'
                  }`}
                >
                  {row.eviLift}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
