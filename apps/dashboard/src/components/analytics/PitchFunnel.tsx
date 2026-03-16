'use client';

/**
 * PitchFunnel — Visual funnel: Sent → Replies → Placements.
 */

import { mockPitchFunnel } from './analytics-mock-data';

export function PitchFunnel() {
  const f = mockPitchFunnel;
  const replyRate = Math.round((f.replies / f.sent) * 100);
  const placementRate = Math.round((f.placements / f.replies) * 100);

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Pitch Activity
      </h3>

      {/* Funnel stats row */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-lg font-bold text-white">{f.sent} Sent</span>
        <span className="text-white/30">&rarr;</span>
        <span className="text-lg font-bold text-white">
          {f.replies} Replies{' '}
          <span className="text-sm font-normal text-white/45">
            ({replyRate}%)
          </span>
        </span>
        <span className="text-white/30">&rarr;</span>
        <span className="text-lg font-bold text-white">
          {f.placements} Placements{' '}
          <span className="text-sm font-normal text-white/45">
            ({placementRate}%)
          </span>
        </span>
      </div>

      {/* Visual funnel bar */}
      <div className="flex items-center gap-1 h-10">
        <div
          className="h-full bg-cc-cyan/20 rounded-l-xl flex items-center justify-center"
          style={{ width: '100%' }}
        >
          <span className="text-xs font-medium text-cc-cyan">
            Sent {f.sent}
          </span>
        </div>
        <div
          className="h-full bg-cc-cyan/40 flex items-center justify-center"
          style={{ width: `${(f.replies / f.sent) * 100}%` }}
        >
          <span className="text-xs font-medium text-cc-cyan">
            Replied {f.replies}
          </span>
        </div>
        <div
          className="h-full bg-cc-cyan rounded-r-xl flex items-center justify-center"
          style={{ width: `${(f.placements / f.sent) * 100}%` }}
        >
          <span className="text-xs font-medium text-cc-page">
            Coverage {f.placements}
          </span>
        </div>
      </div>

      <p className="text-xs text-white/45 mt-3">
        Industry benchmark: 5&ndash;8% pitch &rarr; placement rate. Your rate:{' '}
        {Math.round((f.placements / f.sent) * 100)}% &mdash; excellent.
      </p>
    </div>
  );
}
