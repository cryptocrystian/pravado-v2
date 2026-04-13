'use client';

/**
 * EviWaterfall — Waterfall chart showing each placement's EVI contribution.
 * Uses invisible base bars + visible delta bars to create the waterfall effect.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockPlacements } from './analytics-mock-data';

// Parse "+4.1 pts" → 4.1, "Pending" → 0
function parseLift(lift: string): number {
  const match = lift.match(/[+-]?[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// Build waterfall data: starting EVI + each placement's contribution
const START_EVI = 70.0;
const waterfallData = (() => {
  const items: { name: string; base: number; delta: number; total: number; isTotal?: boolean }[] = [];
  let running = START_EVI;

  // Add starting bar
  items.push({ name: 'Start', base: 0, delta: running, total: running, isTotal: true });

  // Add each placement
  for (const p of mockPlacements) {
    const lift = parseLift(p.eviLift);
    if (lift === 0) continue;
    items.push({ name: p.publication, base: running, delta: lift, total: running + lift });
    running += lift;
  }

  // Add total bar
  items.push({ name: 'Current', base: 0, delta: running, total: running, isTotal: true });

  return items;
})();

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof waterfallData[0] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-2 border border-white/10 rounded-lg p-2 text-xs shadow-lg">
      <p className="text-white/90 font-semibold">{d.name}</p>
      {d.isTotal ? (
        <p className="text-brand-cyan">EVI: {d.total.toFixed(1)}</p>
      ) : (
        <p className="text-semantic-success">+{d.delta.toFixed(1)} pts</p>
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

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={waterfallData} barSize={32}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[65, 'dataMax + 2']} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<WaterfallTooltip />} cursor={false} />
          {/* Invisible base bar */}
          <Bar dataKey="base" stackId="waterfall" fill="transparent" />
          {/* Visible delta bar */}
          <Bar dataKey="delta" stackId="waterfall" radius={[4, 4, 0, 0]}>
            {waterfallData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isTotal ? '#00D9FF' : entry.delta >= 0 ? '#22C55E' : '#EF4444'}
                opacity={entry.isTotal ? 0.7 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
