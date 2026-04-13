'use client';

/**
 * EviWaterfall — Waterfall chart showing each placement's EVI contribution.
 *
 * Recharts waterfall pattern:
 * - Two stacked <Bar>s: invisible base + visible delta
 * - The invisible bar has fillOpacity=0 and no stroke
 * - Domain is set manually to avoid stacked-sum distortion
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockPlacements } from './analytics-mock-data';

function parseLift(lift: string): number {
  const match = lift.match(/[+-]?[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

const START_EVI = 70.0;

interface WaterfallItem {
  name: string;
  base: number;
  delta: number;
  total: number;
  isTotal: boolean;
}

const waterfallData: WaterfallItem[] = (() => {
  const items: WaterfallItem[] = [];
  let running = START_EVI;

  // Start bar: base=0, delta=full EVI (renders from 0 to START_EVI)
  items.push({ name: 'Start', base: 0, delta: running, total: running, isTotal: true });

  for (const p of mockPlacements) {
    const lift = parseLift(p.eviLift);
    if (lift === 0) continue;
    // Intermediate: base = current running total, delta = the lift
    items.push({ name: p.publication, base: running, delta: lift, total: running + lift, isTotal: false });
    running += lift;
  }

  // Current bar: base=0, delta=full running total
  items.push({ name: 'Current', base: 0, delta: running, total: running, isTotal: true });

  return items;
})();

// Calculate domain manually — don't let Recharts auto-calculate from stacked sums
const allTotals = waterfallData.map(d => d.total);
const yMin = Math.floor(Math.min(...allTotals) * 0.95);
const yMax = Math.ceil(Math.max(...allTotals) * 1.03);

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WaterfallItem }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-2 border border-white/10 rounded-lg p-2.5 text-xs shadow-lg">
      <p className="text-white/90 font-semibold">{d.name}</p>
      {d.isTotal ? (
        <p className="text-brand-cyan">EVI: {d.total.toFixed(1)}</p>
      ) : (
        <p className={d.delta >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}>
          {d.delta >= 0 ? '+' : ''}{d.delta.toFixed(1)} pts
        </p>
      )}
    </div>
  );
}

export function EviWaterfall() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        EVI Attribution by Placement
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={waterfallData} barSize={36} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<WaterfallTooltip />} cursor={false} />

          {/* Invisible spacer bar — pushes the delta bar up to the correct position */}
          <Bar
            dataKey="base"
            stackId="waterfall"
            fill="transparent"
            fillOpacity={0}
            strokeOpacity={0}
            isAnimationActive={false}
          />

          {/* Visible delta bar — the actual waterfall segment */}
          <Bar
            dataKey="delta"
            stackId="waterfall"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {waterfallData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isTotal ? '#00D9FF' : entry.delta >= 0 ? '#22C55E' : '#EF4444'}
                fillOpacity={entry.isTotal ? 0.7 : 0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-[#00D9FF]/70 inline-block" /> Total EVI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-[#22C55E] inline-block" /> Positive lift
        </span>
      </div>
    </div>
  );
}
