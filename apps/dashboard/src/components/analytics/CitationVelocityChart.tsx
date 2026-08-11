'use client';

/**
 * CitationVelocityChart — line of REAL total citation velocity over time.
 * Each point is a capture DATE; the value is the total brand-mentioned citations
 * across all AI engines on that date (sum of the per-engine series), derived from
 * citation_monitor_results (CiteMind). No mock data — an org whose monitor has not
 * run shows the honest empty note.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function VelocityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-panel border border-border-subtle rounded-lg p-2.5 text-xs shadow-lg">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-brand-cyan">Citations: {payload[0].value}</p>
    </div>
  );
}

export function CitationVelocityChart({
  data,
}: {
  data: Array<{ period: string; citations: number }>;
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Citation Velocity — Total
      </h3>

      {data.length === 0 ? (
        <div className="h-[220px] flex flex-col items-center justify-center text-center px-6">
          <p className="text-sm text-white/70">No citation activity yet.</p>
          <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">
            Total velocity appears once the CiteMind monitor records
            brand-mentioned citations.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<VelocityTooltip />} />
            <Line
              type="monotone"
              dataKey="citations"
              name="Citations"
              stroke="#00D9FF"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
