'use client';

/**
 * CompetitiveSnapshot — You vs. Top Competitor comparison card.
 */

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { mockEVITrend, mockCompetitorTrend } from './analytics-mock-data';

const sparkData = mockEVITrend.map((p, i) => ({
  you: p.evi,
  them: mockCompetitorTrend[i]?.evi ?? 0,
}));

const yourEvi = mockEVITrend[mockEVITrend.length - 1]?.evi ?? 0;
const theirEvi = mockCompetitorTrend[mockCompetitorTrend.length - 1]?.evi ?? 0;
const gap = yourEvi - theirEvi;

export function CompetitiveSnapshot() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Competitive Position
      </h3>

      <div className="flex items-center gap-6">
        {/* Scores */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-brand-cyan font-medium mb-1">You</p>
              <p className="text-3xl font-bold text-white tabular-nums">{yourEvi.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 font-medium mb-1">Top Competitor</p>
              <p className="text-3xl font-bold text-white/60 tabular-nums">{theirEvi.toFixed(1)}</p>
            </div>
          </div>

          <div className={`text-sm font-semibold ${gap >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
            {gap >= 0 ? '+' : ''}{gap.toFixed(1)} pts gap
            <span className="text-white/40 font-normal ml-2">
              {gap >= -3 ? 'You are closing the gap' : 'Gap is widening — action needed'}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="w-36 h-16 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="you" stroke="#00D9FF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="them" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
