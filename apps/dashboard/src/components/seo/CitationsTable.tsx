'use client';

/**
 * CitationsTable — Full citation tracking table with slide-in detail panel.
 */

import { useState } from 'react';
import {
  House,
  Newspaper,
  ArrowUp,
  Minus,
  Star,
  X,
  Lightning,
  Link as LinkIcon,
} from '@phosphor-icons/react';
import { mockCitations } from './seo-mock-data';
import type { CitationRow } from './seo-mock-data';

const typeIcon: Record<string, React.ReactNode> = {
  owned: <House size={14} className="text-cc-cyan" weight="fill" />,
  earned: <Newspaper size={14} className="text-brand-iris" weight="fill" />,
};

const typeLabel: Record<string, string> = {
  owned: 'Owned',
  earned: 'Earned',
};

const trendDisplay: Record<string, { icon: React.ReactNode; label: string }> = {
  daily: { icon: <ArrowUp size={10} className="text-semantic-success" weight="bold" />, label: 'Daily' },
  growing: { icon: <ArrowUp size={10} className="text-semantic-success" weight="bold" />, label: 'Growing' },
  stable: { icon: <Minus size={10} className="text-white/30" weight="bold" />, label: 'Stable' },
  new: { icon: <Star size={10} className="text-cc-cyan" weight="fill" />, label: 'New' },
};

export function CitationsTable() {
  const [selectedCitation, setSelectedCitation] = useState<CitationRow | null>(null);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Citations</h2>
          <p className="text-sm text-white/45">
            247 citations in the last 30 days
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        {['All Engines', 'All Topics', 'All Sources', 'Date Range'].map(
          (label) => (
            <button
              key={label}
              type="button"
              className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
            >
              {label} &darr;
            </button>
          ),
        )}
      </div>

      {/* Table */}
      <div className="bg-cc-surface border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                Source URL
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                Engine
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                Topic
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                Citations
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                Trend
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody>
            {mockCitations.map((row) => {
              const trend = trendDisplay[row.trend];
              return (
                <tr
                  key={row.id}
                  className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setSelectedCitation(row)}
                >
                  <td className="px-4 py-3 text-white font-mono text-xs max-w-[220px] truncate">
                    {row.sourceLabel}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      {typeIcon[row.type]}
                      <span className="text-white/70 text-xs">
                        {typeLabel[row.type]}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">{row.engine}</td>
                  <td className="px-4 py-3 text-white/70">{row.topic}</td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {row.citationCount}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-white/70">
                      {trend.icon}
                      {trend.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/45">
                    {row.lastSeen}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-in Detail Panel */}
      {selectedCitation && (
        <>
          <div
            className="fixed inset-0 bg-page/70 z-40"
            onClick={() => setSelectedCitation(null)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-cc-surface border-l border-white/8 z-50 overflow-y-auto">
            <div className="sticky top-0 bg-cc-surface border-b border-white/8 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon size={16} className="text-cc-cyan" />
                <h3 className="text-sm font-semibold text-white">
                  Citation Detail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={16} className="text-white/45" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Source */}
              <div>
                <p className="text-xs text-white/45 mb-1">Source URL</p>
                <p className="text-sm text-cc-cyan font-mono">
                  {selectedCitation.sourceUrl}
                </p>
              </div>

              {/* Engine breakdown */}
              <div>
                <p className="text-xs text-white/45 mb-2">
                  Citation count by engine
                </p>
                <div className="space-y-1">
                  {selectedCitation.detail.engineBreakdown.map((eb) => (
                    <div
                      key={eb.engine}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-white/70">{eb.engine}</span>
                      <span className="font-bold text-white">{eb.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* First cited */}
              <div>
                <p className="text-xs text-white/45 mb-1">First cited</p>
                <p className="text-sm text-white/70">
                  This page started being cited{' '}
                  {selectedCitation.detail.startDate}
                </p>
              </div>

              {/* Trigger prompts */}
              <div>
                <p className="text-xs text-white/45 mb-2">
                  Prompts that trigger this citation
                </p>
                <div className="space-y-1.5">
                  {selectedCitation.detail.triggerPrompts.map((prompt) => (
                    <p
                      key={prompt}
                      className="text-sm text-white/70 bg-white/[0.03] rounded-lg px-3 py-2 italic"
                    >
                      &ldquo;{prompt}&rdquo;
                    </p>
                  ))}
                </div>
              </div>

              {/* SAGE recommendation */}
              <div className="bg-cc-cyan/5 border border-cc-cyan/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightning size={14} className="text-cc-cyan" weight="fill" />
                  <span className="text-xs font-semibold text-cc-cyan">
                    SAGE Recommendation
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  {selectedCitation.detail.recommendation}
                </p>
                <button
                  type="button"
                  className="bg-cc-cyan text-cc-page rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-cc-cyan/90 transition-colors"
                >
                  {selectedCitation.detail.recommendationCta}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
