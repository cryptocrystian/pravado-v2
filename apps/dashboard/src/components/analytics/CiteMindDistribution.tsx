'use client';

/**
 * CiteMindDistribution — Histogram showing content pieces per CiteMind score band.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockContentRows } from './analytics-mock-data';

const BANDS = [
  { label: '0-40\nNeeds Work', min: 0, max: 40, color: '#EF4444' },
  { label: '41-60\nDeveloping', min: 41, max: 60, color: '#F59E0B' },
  { label: '61-80\nGood', min: 61, max: 80, color: '#22C55E' },
  { label: '81-100\nElite', min: 81, max: 100, color: '#00D9FF' },
];

const distributionData = BANDS.map((band) => ({
  name: band.label,
  count: mockContentRows.filter((r) => r.citeMind >= band.min && r.citeMind <= band.max).length,
  color: band.color,
}));

export function CiteMindDistribution() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        CiteMind Score Distribution
      </h3>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={distributionData} barSize={48}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
            width={20}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {distributionData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-[11px] text-white/30 mt-2 text-center">
        {mockContentRows.length} total content pieces scored by CiteMind
      </p>
    </div>
  );
}
