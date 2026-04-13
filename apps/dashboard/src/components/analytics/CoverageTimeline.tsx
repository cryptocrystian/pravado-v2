'use client';

/**
 * CoverageTimeline — EVI trend line with coverage event dots.
 * Dots sized by reach, colored by publication tier.
 */

import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mockEVITrend, mockPlacements } from './analytics-mock-data';

// Merge EVI trend with placement events
const timelineData = mockEVITrend.map((point) => {
  const placement = mockPlacements.find((p) => p.date === point.date);
  return {
    ...point,
    eventEvi: placement ? point.evi : undefined,
    publication: placement?.publication,
    headline: placement?.headline,
    reach: placement?.reach,
    eviLift: placement?.eviLift,
  };
});

function TimelineTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof timelineData[0] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-2 border border-white/10 rounded-lg p-2.5 text-xs shadow-lg max-w-[220px]">
      <p className="text-white/45 mb-1">{d.date}</p>
      <p className="text-brand-cyan font-medium">EVI: {d.evi}</p>
      {d.publication && (
        <div className="mt-1.5 pt-1.5 border-t border-white/10">
          <p className="text-white/90 font-semibold">{d.publication}</p>
          <p className="text-white/60 mt-0.5">{d.headline}</p>
          <p className="text-semantic-success mt-0.5">{d.eviLift} &middot; {d.reach} reach</p>
        </div>
      )}
    </div>
  );
}

export function CoverageTimeline() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Coverage Timeline
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={timelineData}>
          <CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
          <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<TimelineTooltip />} />
          <Line type="monotone" dataKey="evi" stroke="#00D9FF" strokeWidth={2} dot={false} />
          <Scatter dataKey="eventEvi" fill="#E879F9" shape="circle" />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-brand-cyan inline-block rounded" /> EVI trend</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-magenta inline-block" /> Media placement</span>
      </div>
    </div>
  );
}
