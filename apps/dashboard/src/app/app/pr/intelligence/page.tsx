'use client';

/**
 * PR Intelligence — /app/pr/intelligence
 * Stub page. Full functionality requires SAGE backend.
 */

export const dynamic = 'force-dynamic';

import { Lightning, ArrowRight, TrendUp } from '@phosphor-icons/react';
import { mockTopicActivity } from '@/components/pr/pr-mock-data';

export default function IntelligencePage() {
  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Stub card */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-8 text-center mb-8">
          <Lightning size={48} className="text-cc-cyan mx-auto" weight="regular" />
          <h2 className="text-xl font-bold text-white mt-4">SAGE Situation Brief</h2>
          <p className="text-sm text-white/70 leading-relaxed mt-2 mb-6 max-w-md mx-auto">
            SAGE monitors your media landscape in real-time and generates weekly
            intelligence briefings. Connect your topic clusters in the SEO surface
            to activate.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
          >
            Set Up Topic Clusters <ArrowRight size={14} />
          </button>
        </div>

        {/* Topic activity preview cards */}
        <div className="space-y-3 max-w-[600px]">
          {mockTopicActivity.map((topic) => (
            <div
              key={topic.topic}
              className="bg-cc-surface border border-white/8 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-semibold text-white">{topic.topic}</h3>
                <p className="text-xs text-white/70 mt-0.5">
                  {topic.articles} articles this week
                  {topic.delta && (
                    <span className="text-white/45 ml-1">({topic.delta})</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {topic.trending && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-cc-cyan/10 text-cc-cyan px-2 py-0.5 rounded-full">
                    <TrendUp size={10} weight="bold" />
                    TRENDING
                  </span>
                )}
                <button
                  type="button"
                  className="text-xs text-cc-cyan hover:text-cc-cyan/80 transition-colors"
                >
                  View journalists
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
