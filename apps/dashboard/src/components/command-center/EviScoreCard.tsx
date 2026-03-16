'use client';

import { useEVICurrent } from '@/lib/useEVI';

function EviSkeleton() {
  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-20 bg-white/8 rounded mb-4" />
      <div className="h-10 w-16 bg-white/8 rounded mb-3" />
      <div className="h-1.5 w-full bg-white/8 rounded-full mb-2" />
      <div className="h-3 w-32 bg-white/8 rounded mb-4" />
      <div className="border-t border-white/8 my-4" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/8 rounded" />
        <div className="h-3 w-full bg-white/8 rounded" />
        <div className="h-3 w-full bg-white/8 rounded" />
      </div>
    </div>
  );
}

export function EviScoreCard() {
  const { data, isLoading, isStale } = useEVICurrent();

  if (isLoading) return <EviSkeleton />;

  const value = data?.evi_score ?? 0;
  const delta = data?.delta ?? 0;
  const direction = data?.direction ?? 'flat';

  // Color based on score: 70+ green, 40-69 amber, <40 red
  const scoreColor = value >= 70 ? 'text-semantic-success' : value >= 40 ? 'text-amber-400' : 'text-semantic-danger';
  const barColor = value >= 70 ? 'bg-semantic-success' : value >= 40 ? 'bg-amber-400' : 'bg-semantic-danger';
  const deltaColor = direction === 'up' ? 'text-semantic-success' : direction === 'down' ? 'text-semantic-danger' : 'text-white/45';
  const deltaArrow = direction === 'up' ? '\u2191' : direction === 'down' ? '\u2193' : '';

  const statusLabel = value >= 70 ? 'Good Standing' : value >= 40 ? 'Needs Attention' : 'Critical';

  // Sub-scores for the breakdown section
  const subScores = [
    { name: 'Visibility', score: data?.visibility_score ?? 0 },
    { name: 'Authority', score: data?.authority_score ?? 0 },
    { name: 'Momentum', score: data?.momentum_score ?? 0 },
  ];

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
          AI Visibility
        </span>
        {isStale && (
          <span className="text-[10px] text-amber-400/70 uppercase tracking-wider">
            Stale
          </span>
        )}
      </div>

      {/* EVI Score block */}
      <div className="mt-4">
        <span className="text-xs text-white/45 block mb-1">EVI</span>
        <span className={`text-4xl font-bold ${scoreColor}`}>{value.toFixed(1)}</span>

        {/* Score bar */}
        <div className="w-full h-1.5 rounded-full bg-white/8 mt-3">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>

        {/* Status + delta */}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${scoreColor}`}>{statusLabel}</span>
          <span className={`text-xs ${deltaColor}`}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)} pts this month {deltaArrow}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/8 my-4" />

      {/* By Sub-score */}
      <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60 block mb-3">
        Sub-scores
      </span>

      <div className="space-y-0">
        {subScores.map((sub) => {
          const subColor = sub.score >= 60 ? 'text-semantic-success' : sub.score >= 30 ? 'text-amber-400' : 'text-semantic-danger';

          return (
            <div
              key={sub.name}
              className="flex items-center justify-between py-1.5 px-1.5 rounded"
            >
              <span className="text-sm text-white/70">{sub.name}</span>
              <span className={`text-sm font-medium ${subColor}`}>
                {sub.score.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <button className="text-xs text-cc-cyan cursor-pointer mt-4 block hover:text-cc-cyan/80 transition-colors">
        Full Analysis &rarr;
      </button>
    </div>
  );
}
