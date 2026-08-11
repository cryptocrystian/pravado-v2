'use client';

/**
 * SeoCompetitiveMovement — REAL position movement over time (Analytics-SEO panel 3).
 * Movers come from seo_snapshots.position across captured_at — the ONLY source
 * that can show movement (seo_serp_results is point-in-time and cannot). A keyword
 * needs >= 2 position-bearing snapshots before it can move, so this panel is
 * EMPTY-UNTIL-HISTORY: a single SERP refresh produces no delta and shows the honest
 * empty note. Delta sign: negative = moved UP (improved rank).
 */

import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react';

import type { CompetitiveMovementPanel } from '@/hooks/useAnalyticsSeo';

export function SeoCompetitiveMovement({
  movement,
}: {
  movement: CompetitiveMovementPanel;
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Competitive Movement
      </h3>

      {!movement.hasData ? (
        <div className="py-10 flex flex-col items-center justify-center text-center px-6">
          <p className="text-sm text-white/70">No movement yet.</p>
          <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed max-w-md">
            Movement appears after repeated SERP snapshots. A single refresh
            gives one position with no delta&nbsp;— once a keyword has two or
            more captures, its change over time shows here.
            {movement.totalSnapshots > 0 &&
              ` (${movement.totalSnapshots} snapshot${movement.totalSnapshots === 1 ? '' : 's'} so far.)`}
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 pb-2 mb-1 border-b border-white/5 text-[11px] uppercase tracking-wide text-white/35">
            <span>Keyword</span>
            <span className="text-right w-14">From</span>
            <span className="text-right w-14">To</span>
            <span className="text-right w-20">Change</span>
          </div>
          {movement.movers.map((m) => {
            // Negative delta = position number decreased = moved UP (improved).
            const improved = m.delta < 0;
            const worsened = m.delta > 0;
            const Icon = improved ? ArrowUp : worsened ? ArrowDown : Minus;
            const color = improved
              ? 'text-semantic-success'
              : worsened
                ? 'text-semantic-danger'
                : 'text-white/45';
            return (
              <div
                key={m.keyword}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2.5 border-b border-white/5 text-sm items-center"
              >
                <span className="text-white/80 truncate" title={m.keyword}>
                  {m.keyword}
                </span>
                <span className="text-right w-14 tabular-nums text-white/50">
                  {m.earliestPosition}
                </span>
                <span className="text-right w-14 tabular-nums text-white/70">
                  {m.latestPosition}
                </span>
                <span
                  className={`text-right w-20 tabular-nums font-semibold flex items-center justify-end gap-1 ${color}`}
                >
                  <Icon size={13} weight="bold" />
                  {Math.abs(m.delta)}
                </span>
              </div>
            );
          })}
          <p className="text-[11px] text-white/35 mt-3">
            Change is the difference between the earliest and latest captured
            position. Up = improved rank.
          </p>
        </div>
      )}
    </div>
  );
}
