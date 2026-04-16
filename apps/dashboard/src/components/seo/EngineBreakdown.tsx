'use client';

/**
 * EngineBreakdown — By AI Engine score rows + Top Topics card.
 */

import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, Lightning, ArrowRight } from '@phosphor-icons/react';
import { mockEngineScores, mockTopTopics } from './seo-mock-data';
import { InfoTooltip } from '@/components/shared/InfoTooltip';

const trendBadge: Record<string, { label: string; className: string }> = {
  hot: { label: 'Hot', className: 'bg-amber-500/10 text-amber-500' },
  growing: { label: '\u2191 Growing', className: 'text-semantic-success' },
  stable: { label: '\u2192 Stable', className: 'text-white/45' },
  declining: { label: '\u2193 Declining', className: 'bg-red-500/10 text-semantic-danger' },
};

export function EngineBreakdown() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* By AI Engine */}
      <div>
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/60 mb-3">
          By AI Engine <InfoTooltip content="Your EVI score broken down by each AI engine (ChatGPT, Perplexity, Claude, Gemini). Different engines weight content differently, so optimizing for each can improve your overall visibility." size={11} />
        </h3>
        <div>
          {mockEngineScores.map((eng) => {
            const isPositive = eng.delta >= 0;
            return (
              <button
                key={eng.engine}
                type="button"
                onClick={() =>
                  router.push(`/app/seo/topics?engine=${encodeURIComponent(eng.engine)}`)
                }
                className="flex items-center gap-4 py-2.5 w-full cursor-pointer hover:bg-white/[0.02] rounded-lg px-2 -mx-2 border-b border-white/5 text-left"
              >
                <span className="w-28 text-sm text-white/70 shrink-0">
                  {eng.engine}
                </span>
                {/* Score bar */}
                <div className="w-full max-w-[600px] h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cc-cyan rounded-full transition-all"
                    style={{ width: `${eng.score}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold text-white">
                  {eng.score}
                </span>
                <span
                  className={`w-16 text-right text-xs flex items-center justify-end gap-0.5 ${
                    isPositive ? 'text-semantic-success' : 'text-semantic-danger'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUp size={10} weight="bold" />
                  ) : (
                    <ArrowDown size={10} weight="bold" />
                  )}
                  {isPositive ? '+' : ''}
                  {eng.delta}
                </span>
                {eng.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                      eng.badge === 'Needs attention'
                        ? 'text-semantic-danger'
                        : 'text-cc-cyan'
                    }`}
                  >
                    {eng.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Topics */}
      <div>
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/60 mb-3">
          Top Topics
        </h3>
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-4">
          {mockTopTopics.map((topic) => {
            const badge = trendBadge[topic.trend];
            return (
              <div
                key={topic.name}
                className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0"
              >
                <span className="flex-1 text-sm text-white">{topic.name}</span>
                <div className="w-32 h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cc-cyan rounded-full"
                    style={{ width: `${topic.score}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold text-white">
                  {topic.score}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
          <div className="text-right mt-3">
            <button
              type="button"
              onClick={() => router.push('/app/seo/topics')}
              className="text-xs text-cc-cyan hover:text-cc-cyan/80 transition-colors inline-flex items-center gap-1"
            >
              See all topics <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* SAGE Priority Card */}
      <div className="bg-cc-cyan/5 border border-cc-cyan/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightning size={16} className="text-cc-cyan" weight="fill" />
          <span className="text-sm font-semibold text-cc-cyan">
            SAGE Priority Action
          </span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          The &lsquo;Enterprise AEO&rsquo; cluster scores 23 vs CompetitorX&apos;s 71.
          Creating a comprehensive guide would close a 31-point gap and is estimated
          to deliver +8&ndash;12 EVI points.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/app/content/new')}
            className="bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
          >
            Create Content
          </button>
          <button
            type="button"
            onClick={() => router.push('/app/seo/topics')}
            className="text-sm text-cc-cyan hover:text-cc-cyan/80 transition-colors"
          >
            View Cluster &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
