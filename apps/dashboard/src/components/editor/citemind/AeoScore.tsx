'use client';

import type { AeoScoreData } from '../editor-mock-data';

function scoreBarColor(score: number): string {
  if (score >= 85) return 'bg-cc-cyan';
  if (score >= 70) return 'bg-semantic-success';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreTextColor(score: number): string {
  if (score >= 85) return 'text-cc-cyan';
  if (score >= 70) return 'text-semantic-success';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

interface AeoScoreProps {
  data: AeoScoreData;
}

export function AeoScore({ data }: AeoScoreProps) {
  return (
    <div className="p-4">
      {/* Overall score */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-white/45 block mb-1">AEO Score</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold ${scoreTextColor(data.overall)}`}>
              {data.overall}
            </span>
            <span className="text-sm text-white/45">/100</span>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-xs ${
              data.trend === 'up'
                ? 'text-semantic-success'
                : data.trend === 'down'
                  ? 'text-red-500'
                  : 'text-white/45'
            }`}
          >
            {data.trend === 'up' && '\u2191 Improving'}
            {data.trend === 'down' && '\u2193 Declining'}
            {data.trend === 'stable' && '\u2192 Stable'}
          </span>
          <span className="text-xs text-white/30 block mt-0.5">
            Updated {data.lastUpdated}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 bg-white/5 rounded-full mb-5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(data.overall)}`}
          style={{ width: `${data.overall}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {data.breakdown.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/70">{item.category}</span>
              <span className={`text-xs font-medium ${scoreTextColor(item.score)}`}>
                {item.score}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(item.score)}`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
