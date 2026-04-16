'use client';

/**
 * EviWaterfall — Waterfall chart showing each placement's EVI contribution.
 *
 * Pattern: two stacked bars per data point.
 *   Bar 1 (invisible): height = base (pushes visible bar to correct Y)
 *   Bar 2 (visible):   height = value (the delta)
 *
 * Data example:
 *   { name: 'Start',      base: 0,    value: 70.0 }  ← full column
 *   { name: 'TechCrunch', base: 70.0, value: 4.1 }   ← floats at Y=70
 *   { name: 'Current',    base: 0,    value: 76.6 }  ← full column
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockPlacements } from './analytics-mock-data';
import { InfoTooltip } from '@/components/shared/InfoTooltip';

function parseLift(lift: string): number {
  const match = lift.match(/[+-]?[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

interface WaterfallItem {
  name: string;
  base: number;
  value: number;
  total: number;
  isTotal: boolean;
}

const START_EVI = 70.0;

const waterfallData: WaterfallItem[] = (() => {
  const items: WaterfallItem[] = [];
  let running = START_EVI;

  // Start: full column from 0 to START_EVI
  items.push({ name: 'Start', base: 0, value: running, total: running, isTotal: true });

  // Each placement: floating segment at running total
  for (const p of mockPlacements) {
    const lift = parseLift(p.eviLift);
    if (lift === 0) continue;
    items.push({ name: p.publication, base: running, value: lift, total: running + lift, isTotal: false });
    running += lift;
  }

  // Current: full column from 0 to final total
  items.push({ name: 'Current', base: 0, value: running, total: running, isTotal: true });

  return items;
})();

// Zoom into the range of movement so delta bars are visually thick
const totalDelta = waterfallData[waterfallData.length - 1].total - START_EVI;
const yMin = Math.floor(START_EVI * 0.97);
const yMax = Math.ceil((START_EVI + totalDelta) * 1.02);

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WaterfallItem }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-2 border border-white/10 rounded-lg p-2.5 text-xs shadow-lg">
      <p className="text-white/90 font-semibold">{d.name}</p>
      {d.isTotal ? (
        <p className="text-brand-cyan">EVI: {d.total.toFixed(1)}</p>
      ) : (
        <p className={d.value >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}>
          {d.value >= 0 ? '+' : ''}{d.value.toFixed(1)} pts
        </p>
      )}
    </div>
  );
}

export function EviWaterfall() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        EVI Attribution by Placement <InfoTooltip content="Shows how each individual PR placement contributed to your overall EVI score. Taller bars mean that placement drove more AI visibility for your brand." size={11} />
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

          {/* Invisible spacer — pushes the visible bar to the correct Y position */}
          <Bar
            dataKey="base"
            stackId="a"
            fillOpacity={0}
            strokeOpacity={0}
            isAnimationActive={false}
          />

          {/* Visible delta bar */}
          <Bar
            dataKey="value"
            stackId="a"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {waterfallData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isTotal ? '#00D9FF' : entry.value >= 0 ? '#22C55E' : '#EF4444'}
                fillOpacity={entry.isTotal ? 0.6 : 0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-[#00D9FF]/60 inline-block" /> Total EVI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-[#22C55E] inline-block" /> Positive lift
        </span>
      </div>
    </div>
  );
}
