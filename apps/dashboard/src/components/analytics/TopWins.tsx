'use client';

/**
 * TopWins — Top wins this period.
 * Shows empty state until SAGE tracks visibility improvements.
 */

import { Trophy } from '@phosphor-icons/react';

export function TopWins() {
  // No real win data available yet — show guidance message
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/60 mb-3">
        Top Wins This Period
      </h3>
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Trophy
          size={24}
          className="text-white/20 mb-3"
          weight="fill"
        />
        <p className="text-sm text-white/50 leading-relaxed max-w-xs">
          Your top wins will appear here as SAGE tracks your visibility improvements over time.
        </p>
      </div>
    </div>
  );
}
