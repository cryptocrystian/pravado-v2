'use client';

/**
 * ContentTable — Content performance table + citation velocity + gap analysis.
 * Sprint 1: Replaced bg-cc-surface → bg-panel, border-white/8 → border-border-subtle,
 *           rounded-2xl → rounded-xl, text-purple-400 → text-brand-iris,
 *           phantom stroke colors → DS hex values.
 */

import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUp, ArrowDown, Minus, Fire } from '@phosphor-icons/react';
import {
  mockContentRows,
  mockCitationVelocity,
  mockContentGaps,
  getCiteMindColor,
} from './analytics-mock-data';

const trendIcon: Record<string, React.ReactNode> = {
  up: <ArrowUp size={12} className="text-semantic-success" weight="bold" />,
  down: <ArrowDown size={12} className="text-semantic-danger" weight="bold" />,
  stable: <Minus size={12} className="text-white/30" weight="bold" />,
  hot: <Fire size={12} className="text-brand-amber" weight="fill" />,
};

export function ContentTable() {
  const router = useRouter();

  const topPerformers = mockContentRows.filter((r) => r.citeMind >= 80).length;
  const avgCiteMind = Math.round(
    mockContentRows.reduce((sum, r) => sum + r.citeMind, 0) / mockContentRows.length,
  );

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-panel border border-border-subtle rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
            Published
          </p>
          <p className="text-2xl font-bold text-white/95 tabular-nums">
            {mockContentRows.length} pieces
          </p>
        </div>
        <div className="bg-panel border border-border-subtle rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
            Avg CiteMind
          </p>
          <p className="text-2xl font-bold text-white/95 tabular-nums">{avgCiteMind}</p>
        </div>
        <div className="bg-panel border border-border-subtle rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
            Top Performers
          </p>
          <p className="text-2xl font-bold text-white/95 tabular-nums">
            {topPerformers}{' '}
            <span className="text-sm font-normal text-white/50">
              (CiteMind &ge; 80)
            </span>
          </p>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Type
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                CiteMind
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Citations
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                EVI Lift
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {mockContentRows.map((row) => (
              <tr
                key={row.title}
                className="border-b border-border-subtle/50 last:border-0 hover:bg-slate-3/50 transition-colors"
              >
                <td className="px-4 py-3 text-white/85 max-w-[280px] truncate">
                  {row.title}
                </td>
                <td className="px-4 py-3 text-white/60">{row.type}</td>
                <td
                  className={`px-4 py-3 text-right font-bold tabular-nums ${getCiteMindColor(row.citeMind)}`}
                >
                  {row.citeMind}
                </td>
                <td className="px-4 py-3 text-right text-white/60 tabular-nums">
                  {row.citations !== null ? row.citations : '\u2014'}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    row.earned ? 'text-brand-iris italic' : 'text-white/85'
                  }`}
                >
                  {row.eviLift}
                </td>
                <td className="px-4 py-3 text-center">
                  {trendIcon[row.trend]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Citation Velocity Chart */}
      <div className="bg-panel border border-border-subtle rounded-xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-4">
          Citation Velocity (Top 3 Content Pieces)
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={mockCitationVelocity}>
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
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--panel-bg)',
                border: '1px solid var(--dark-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
              labelStyle={{ color: 'rgba(255,255,255,0.45)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}
            />
            {/* Sprint 1: stroke values use DS brand token hex values */}
            <Line
              type="monotone"
              dataKey="piece1"
              name="AI Visibility Guide"
              stroke="#00D9FF" /* brand-cyan */
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="piece2"
              name="AI Marketing Comparison"
              stroke="#A855F7" /* brand-iris */
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="piece3"
              name="AI Citation Tracking"
              stroke="#F59E0B" /* brand-amber */
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Content Gap Analysis */}
      <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-cyan mb-3">
          Content Gaps Identified
        </h3>
        <div className="space-y-3">
          {mockContentGaps.map((gap) => (
            <div
              key={gap.label}
              className="flex items-center justify-between py-2 border-b border-brand-cyan/10 last:border-0"
            >
              <p className="text-sm text-white/70">{gap.label}</p>
              <button
                type="button"
                onClick={() => router.push('/app/content/new')}
                className="bg-brand-cyan text-page rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-brand-cyan/90 transition-colors shrink-0 ml-3"
              >
                {gap.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
