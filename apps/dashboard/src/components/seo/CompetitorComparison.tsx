'use client';

/**
 * CompetitorComparison — Donut chart, head-to-head, topic table, content gaps.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react';
import {
  mockShareOfVoice,
  mockPravadoProfile,
  mockCompetitorXProfile,
  mockTopicComparisons,
  mockCompetitorContent,
} from './seo-mock-data';
import type { CompetitorProfile } from './seo-mock-data';

function ProfileCard({
  profile,
  isYou,
  label,
}: {
  profile: CompetitorProfile;
  isYou?: boolean;
  label?: string;
}) {
  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-5 flex-1">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-bold text-white">{profile.name}</h3>
        {isYou && (
          <span className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full font-medium">
            You
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <Row label="EVI" value={String(profile.evi)} bold />
        <Row
          label="Best engine"
          value={`${profile.bestEngine} (${profile.bestEngineScore})`}
        />
        <Row
          label="Weakest"
          value={`${profile.weakestEngine} (${profile.weakestEngineScore})`}
        />
        <Row label="Strong clusters" value={String(profile.strongClusters)} />
        <Row
          label={label ?? 'Gaps'}
          value={String(profile.gaps)}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/45">{label}</span>
      <span className={`text-white ${bold ? 'font-bold text-base' : ''}`}>
        {value}
      </span>
    </div>
  );
}

const statusIcon: Record<string, React.ReactNode> = {
  winning: <CheckCircle size={14} className="text-semantic-success" weight="fill" />,
  narrow: <Warning size={14} className="text-amber-500" weight="fill" />,
  critical: <XCircle size={14} className="text-red-500" weight="fill" />,
};

const statusLabel: Record<string, string> = {
  winning: "You're winning",
  narrow: 'Narrow gap',
  critical: 'Critical gap',
};

export function CompetitorComparison() {
  const router = useRouter();
  const [selected] = useState('CompetitorX');

  return (
    <div className="space-y-8">
      {/* Share of Voice Donut */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
          Share of Voice
        </h3>
        <div className="flex items-center gap-8">
          <div className="w-[240px] h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockShareOfVoice}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={({ name }: { name: string }) =>
                    name === 'Pravado' ? 105 : 100
                  }
                  paddingAngle={2}
                  dataKey="value"
                >
                  {mockShareOfVoice.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4">
            {mockShareOfVoice.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-sm text-white/70">
                  {entry.name} {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Head-to-Head */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">
            Pravado vs
          </h3>
          <select
            className="bg-white/5 border border-white/8 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-cc-cyan/30"
            value={selected}
          >
            <option value="CompetitorX">CompetitorX</option>
            <option value="CompetitorY">CompetitorY</option>
            <option value="CompetitorZ">CompetitorZ</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ProfileCard
            profile={mockPravadoProfile}
            isYou
            label="Gaps vs them"
          />
          <ProfileCard
            profile={mockCompetitorXProfile}
            label="Gaps vs you"
          />
        </div>
      </section>

      {/* Topic-by-Topic Table */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Topic-by-Topic
        </h3>
        <div className="bg-cc-surface border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Topic
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Pravado
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  {selected}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Delta
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {mockTopicComparisons.map((row) => (
                <tr
                  key={row.topic}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3 text-white">{row.topic}</td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {row.yourScore}
                  </td>
                  <td className="px-4 py-3 text-right text-white/70">
                    {row.competitorScore}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      row.delta > 0
                        ? 'text-semantic-success'
                        : Math.abs(row.delta) >= 20
                          ? 'text-red-500'
                          : 'text-amber-500'
                    }`}
                  >
                    {row.delta > 0 ? '+' : ''}
                    {row.delta}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs">
                      {statusIcon[row.status]}
                      <span className="text-white/70">
                        {statusLabel[row.status]}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Competitor Content Cited */}
      <section>
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            CompetitorX content cited more than yours
          </h3>
          <div className="space-y-3">
            {mockCompetitorContent.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div>
                  <p className="text-sm text-white">
                    &ldquo;{item.title}&rdquo;
                  </p>
                  <p className="text-xs text-white/45 mt-0.5">
                    cited {item.citationsPerWeek}x/week on {item.engine}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/app/content/new?title=${encodeURIComponent(item.title)}`,
                    )
                  }
                  className="bg-cc-cyan text-cc-page rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-cc-cyan/90 transition-colors shrink-0 ml-3"
                >
                  Create competing content
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
