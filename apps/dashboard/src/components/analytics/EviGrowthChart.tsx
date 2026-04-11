'use client';

/**
 * EviGrowthChart — Primary EVI trend chart.
 * Uses real EVI history data from the backend (Sprint S-INT-01).
 */

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEVIHistory } from '@/lib/useEVI';

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-cc-surface border border-white/8 rounded-lg p-2.5 text-xs shadow-lg">
      <p className="text-white/45 mb-1">{label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="text-cc-cyan font-medium"
        >
          Your EVI: {p.value}
        </p>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-6 animate-pulse">
      <div className="h-4 w-48 bg-white/8 rounded mb-4" />
      <div className="h-[240px] w-full bg-white/8 rounded" />
    </div>
  );
}

export function EviGrowthChart() {
  const [days] = useState(30);
  const { data: history, isLoading } = useEVIHistory(days);

  if (isLoading) return <ChartSkeleton />;

  // Deduplicate: keep only the last data point per calendar date
  const byDate = new Map<string, number>();
  for (const point of history) {
    const label = new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    byDate.set(label, Number(point.evi_score));
  }
  const chartData = Array.from(byDate, ([date, evi]) => ({ date, evi }));

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          EVI Growth Story (30 days)
        </h3>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData}>
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 3']}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="evi"
              stroke="#00E5CC"
              strokeWidth={2.5}
              dot={{ fill: '#00E5CC', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[240px] text-white/30 text-sm">
          No trend data yet. EVI history will appear after the first calculation.
        </div>
      )}
    </div>
  );
}
