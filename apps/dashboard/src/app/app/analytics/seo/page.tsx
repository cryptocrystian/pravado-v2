'use client';

/**
 * SEO Analytics — /app/analytics/seo
 * Topic cluster performance, engine breakdown, competitive movement.
 */

import { useCallback } from 'react';
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
import { WarningCircle, Warning } from '@phosphor-icons/react';
import {
  mockSEOSummary,
  mockTopicPerformance,
  mockEngineTrend,
  mockNarratives,
} from '@/components/analytics/analytics-mock-data';
import { arrayToCsv, downloadCsv } from '@/lib/csv-export';
import { AINarrativeHeader } from '@/components/analytics/AINarrativeHeader';
import { CitationVelocityByEngine } from '@/components/analytics/CitationVelocityByEngine';
import { TopicOpportunityMatrix } from '@/components/analytics/TopicOpportunityMatrix';

const engineColors: Record<string, string> = {
  ChatGPT: '#00E5CC',
  Perplexity: '#A78BFA',
  GoogleAI: '#F59E0B',
  Gemini: '#EC4899',
  Claude: '#60A5FA',
};

export default function SEOAnalyticsPage() {
  const s = mockSEOSummary;

  const handleExport = useCallback(() => {
    const csv = arrayToCsv(
      ['Topic', 'Start Score', 'End Score', 'Delta', 'Leader', 'Gap to Leader'],
      mockTopicPerformance.map(t => [t.topic, t.startScore, t.endScore, t.delta, t.leader, t.gapToLeader])
    );
    downloadCsv('pravado-analytics-seo.csv', csv);
  }, []);

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleExport}
            className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            Export &darr;
          </button>
        </div>

        <AINarrativeHeader narrative={mockNarratives.seo} />

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1">
              EVI
            </p>
            <p className="text-2xl font-bold text-white">{s.evi.value}</p>
            <p className="text-sm text-emerald-500">{s.evi.delta}</p>
          </div>
          <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1">
              Share of Voice
            </p>
            <p className="text-2xl font-bold text-white">{s.shareOfVoice.value}</p>
            <p className="text-sm text-emerald-500">{s.shareOfVoice.delta}</p>
          </div>
          <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1">
              Total Citations
            </p>
            <p className="text-2xl font-bold text-white">{s.totalCitations.value}</p>
            <p className="text-sm text-emerald-500">{s.totalCitations.delta}</p>
          </div>
          <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1">
              Topics Winning
            </p>
            <p className="text-2xl font-bold text-white">
              {s.topicsWinning.value}
            </p>
          </div>
        </div>

        {/* Topic Cluster Performance Table */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Topic
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Start
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  End
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Delta
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Leader
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Gap to Leader
                </th>
              </tr>
            </thead>
            <tbody>
              {mockTopicPerformance.map((row) => {
                const isLargeGap =
                  row.gapToLeader !== null && Math.abs(row.gapToLeader) > 20;
                return (
                  <tr
                    key={row.topic}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-4 py-3 text-white">{row.topic}</td>
                    <td className="px-4 py-3 text-right text-white/45">
                      {row.startScore}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      {row.endScore}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.delta > 0
                          ? 'text-emerald-500'
                          : row.delta < 0
                            ? 'text-red-500'
                            : 'text-white/45'
                      }`}
                    >
                      {row.delta > 0 ? '+' : ''}
                      {row.delta} {row.delta > 0 ? '\u2191' : row.delta < 0 ? '\u2193' : ''}
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        row.isYou ? 'text-cc-cyan font-medium' : 'text-white/70'
                      }`}
                    >
                      {row.leader}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.gapToLeader !== null ? (
                        <span
                          className={`flex items-center justify-end gap-1 ${
                            isLargeGap ? 'text-red-500 font-medium' : 'text-white/70'
                          }`}
                        >
                          {row.gapToLeader}
                          {isLargeGap && (
                            <WarningCircle
                              size={14}
                              className="text-red-500"
                              weight="fill"
                            />
                          )}
                        </span>
                      ) : (
                        <span className="text-white/30">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Engine Breakdown Chart */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
            Engine Breakdown (30 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockEngineTrend}>
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
                domain={[50, 90]}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--cc-surface)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
                labelStyle={{ color: 'rgba(255,255,255,0.45)' }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.45)',
                }}
              />
              {Object.entries(engineColors).map(([engine, color]) => (
                <Line
                  key={engine}
                  type="monotone"
                  dataKey={engine}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Gemini warning */}
          <div className="flex items-start gap-2 mt-4">
            <Warning
              size={14}
              className="text-amber-500 shrink-0 mt-0.5"
              weight="fill"
            />
            <p className="text-sm text-amber-500">
              Gemini is your weakest engine (&minus;0.8 pts this period). Schema
              optimization is the highest-leverage fix.
            </p>
          </div>
        </div>

        {/* Competitive Movement */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
            Competitive Movement
          </h3>
          <p className="text-sm text-white/70 mb-3">
            Pravado vs CompetitorX this period:
            <br />
            <span className="text-white">
              You: +4.2 pts
            </span>{' '}
            &middot;{' '}
            <span className="text-white/70">CompetitorX: +1.8 pts</span>
          </p>
          <p className="text-sm text-white font-semibold mb-2">
            Overall gap vs leader: 6.8 points (was 9.2 points 30 days ago)
          </p>
          {/* Gap bar */}
          <div className="w-full h-3 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-cc-cyan rounded-full transition-all"
              style={{ width: `${((9.2 - 6.8) / 9.2) * 100}%` }}
            />
          </div>
          <p className="text-xs text-white/45 mt-1">
            Gap closing: 26% improvement this period
          </p>
        </div>
        {/* Citation Velocity by Engine */}
        <CitationVelocityByEngine />

        {/* Topic Opportunity Matrix */}
        <TopicOpportunityMatrix />
      </div>
    </div>
  );
}
