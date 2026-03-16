'use client';

/**
 * EVI Hero — Two-column top section with score + trend chart.
 * Uses real EVI data from the backend (Sprint S-INT-01).
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useEVICurrent, useEVIHistory } from '@/lib/useEVI';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-cc-surface border border-white/8 rounded-lg p-2 text-xs">
      <p className="text-white/45 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-cc-cyan font-medium">
          EVI: {p.value}
        </p>
      ))}
    </div>
  );
}

function EviHeroSkeleton() {
  return (
    <div className="grid grid-cols-[35%_1fr] gap-4">
      <div className="bg-cc-surface border border-white/8 rounded-2xl p-6 animate-pulse">
        <div className="h-3 w-10 bg-white/8 rounded mb-2" />
        <div className="h-16 w-20 bg-white/8 rounded mb-4" />
        <div className="h-3 w-full bg-white/8 rounded-full mb-3" />
        <div className="h-3 w-24 bg-white/8 rounded" />
      </div>
      <div className="bg-cc-surface border border-white/8 rounded-2xl p-6 animate-pulse">
        <div className="h-3 w-32 bg-white/8 rounded mb-4" />
        <div className="h-[180px] w-full bg-white/8 rounded" />
      </div>
    </div>
  );
}

export function EviHero() {
  const [showCompetitor] = useState(false);
  const { data: current, isLoading: currentLoading, isStale } = useEVICurrent();
  const { data: history, isLoading: historyLoading } = useEVIHistory(30);

  if (currentLoading && historyLoading) return <EviHeroSkeleton />;

  const score = current?.evi_score ?? 0;
  const delta = current?.delta ?? 0;
  const direction = current?.direction ?? 'flat';

  const statusColor = score >= 70 ? 'text-semantic-success' : score >= 40 ? 'text-amber-400' : 'text-semantic-danger';
  const statusLabel = score >= 70 ? 'Good Standing' : score >= 40 ? 'Needs Attention' : 'Critical';
  const deltaColor = direction === 'up' ? 'text-semantic-success' : direction === 'down' ? 'text-semantic-danger' : 'text-white/45';

  const chartData = history.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    evi: Number(point.evi_score),
  }));

  return (
    <div className="grid grid-cols-[35%_1fr] gap-4">
      {/* Left — EVI Score */}
      <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
            EVI
          </span>
          {isStale && (
            <span className="text-[10px] text-amber-400/70 uppercase tracking-wider">Stale</span>
          )}
        </div>
        <p className={`text-6xl font-bold ${statusColor} mt-1`}>{score.toFixed(1)}</p>

        {/* Score bar */}
        <div className="w-full h-3 bg-white/8 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-semantic-success rounded-full transition-all"
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>

        <p className={`text-sm ${statusColor} mt-3`}>{statusLabel}</p>
        <p className={`text-sm ${deltaColor} mt-1`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} pts this month {direction === 'up' ? '\u2191' : direction === 'down' ? '\u2193' : ''}
        </p>

        <p className="text-xs text-white/45 leading-relaxed mt-4">
          Earned Visibility Index &mdash; weighted measure of your brand&apos;s citation
          presence across AI engines, topic clusters, and competitor context.
        </p>
      </div>

      {/* Right — Trend Chart */}
      <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
            EVI Trend (30 days)
          </span>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
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
              <ReferenceLine
                y={70}
                stroke="#10B981"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
              <Line
                type="monotone"
                dataKey="evi"
                stroke="#00E5CC"
                strokeWidth={2}
                dot={{ fill: '#00E5CC', r: 3 }}
                activeDot={{ r: 5 }}
              />
              {showCompetitor && (
                <Line
                  type="monotone"
                  dataKey="competitor"
                  stroke="#ffffff"
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[180px] text-white/30 text-sm">
            No trend data yet. EVI history will appear after the first calculation.
          </div>
        )}
      </div>
    </div>
  );
}
