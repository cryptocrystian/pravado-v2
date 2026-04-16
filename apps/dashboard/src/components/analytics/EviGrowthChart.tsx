'use client';

/**
 * EviGrowthChart — Primary EVI trend chart.
 * Uses real EVI history data from the backend.
 * Supports period comparison (dashed prior-period line).
 */

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
import { useAnalyticsDate } from './AnalyticsDateContext';
import { InfoTooltip } from '@/components/shared/InfoTooltip';

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
          className={p.dataKey === 'prior' ? 'text-white/40' : 'text-cc-cyan font-medium'}
        >
          {p.dataKey === 'prior' ? 'Prior period' : 'Your EVI'}: {p.value}
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
  const { days, comparisonEnabled } = useAnalyticsDate();

  // Fetch current period + prior period (2x days to cover both)
  const { data: history, isLoading } = useEVIHistory(comparisonEnabled ? days * 2 : days);

  if (isLoading) return <ChartSkeleton />;

  // Deduplicate: keep only the last data point per calendar date
  const byDate = new Map<string, number>();
  for (const point of history) {
    const label = new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    byDate.set(label, Number(point.evi_score));
  }
  const allPoints = Array.from(byDate, ([date, evi]) => ({ date, evi }));

  // Split into current and prior period
  let chartData: { date: string; evi: number; prior?: number }[];

  if (comparisonEnabled && allPoints.length > days) {
    const priorPoints = allPoints.slice(0, allPoints.length - days);
    const currentPoints = allPoints.slice(allPoints.length - days);

    // Merge: align prior period data alongside current period by index
    chartData = currentPoints.map((point, i) => ({
      ...point,
      prior: priorPoints[i]?.evi,
    }));
  } else {
    chartData = allPoints.slice(-days);
  }

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          EVI Growth Story ({days} days) <InfoTooltip content="Your EVI score over time. Upward trends mean AI engines are citing your brand more frequently and more prominently. Dips often follow competitor content surges." size={12} />
          {comparisonEnabled && <span className="text-white/40 font-normal ml-2">vs prior period</span>}
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
            {comparisonEnabled && (
              <Line
                type="monotone"
                dataKey="prior"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
              />
            )}
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
