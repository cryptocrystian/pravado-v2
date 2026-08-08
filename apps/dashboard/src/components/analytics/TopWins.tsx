'use client';

/**
 * TopWins — Top movers this period, derived from REAL EVI history.
 *
 * HONEST DATA: compares the earliest vs latest EVI snapshot in the selected
 * window and surfaces the components (Visibility / Authority / Momentum) that
 * improved, ranked by real delta. When there are fewer than two snapshots, or
 * no component improved, it shows an honest empty state instead of inventing
 * wins. No fabricated numbers.
 */

import { Trophy, TrendUp } from '@phosphor-icons/react';

import { useEVIHistory } from '@/lib/useEVI';

import { useAnalyticsDate } from './AnalyticsDateContext';

const COMPONENTS = [
  { key: 'visibility_score', label: 'Visibility' },
  { key: 'authority_score', label: 'Authority' },
  { key: 'momentum_score', label: 'Momentum' },
  { key: 'evi_score', label: 'Overall EVI' },
] as const;

export function TopWins() {
  const { days } = useAnalyticsDate();
  const { data: history, isLoading } = useEVIHistory(days);

  const wins = (() => {
    if (history.length < 2) return [];
    const first = history[0];
    const last = history[history.length - 1];
    return COMPONENTS.map((c) => ({
      label: c.label,
      delta: Number(last[c.key]) - Number(first[c.key]),
    }))
      .filter((w) => w.delta > 0.05)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3);
  })();

  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/60 mb-3">
        Top Wins This Period
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 w-full bg-white/5 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : wins.length > 0 ? (
        <ul className="space-y-2">
          {wins.map((w) => (
            <li
              key={w.label}
              className="flex items-center justify-between bg-slate-3/30 border border-border-subtle rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <TrendUp
                  size={16}
                  className="text-semantic-success"
                  weight="bold"
                />
                <span className="text-sm text-white/80">
                  {w.label} improved
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-semantic-success">
                +{w.delta.toFixed(1)} pts
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Trophy size={24} className="text-white/20 mb-3" weight="fill" />
          <p className="text-sm text-white/50 leading-relaxed max-w-xs">
            Your top wins will appear here as EVI improves over the selected
            period. Not enough history yet to show movement.
          </p>
        </div>
      )}
    </div>
  );
}
