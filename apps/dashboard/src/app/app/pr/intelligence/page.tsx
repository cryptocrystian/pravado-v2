'use client';

/**
 * PR Intelligence — /app/pr/intelligence
 *
 * Phase 0 Track 0B: the "Set up topic clusters" CTA card stays (it's an
 * honest empty-state). The fabricated topic-activity list below it is
 * gated on PR_INTELLIGENCE_WIRED and the `mockTopicActivity` import is
 * removed.
 */

export const dynamic = 'force-dynamic';

import { Lightning, ArrowRight } from '@phosphor-icons/react';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function IntelligencePage() {
  const wired = useFeatureFlag('PR_INTELLIGENCE_WIRED');

  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Honest empty-state card — always shown */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-8 text-center mb-8">
          <Lightning
            size={48}
            className="text-cc-cyan mx-auto"
            weight="regular"
          />
          <h2 className="text-xl font-bold text-white mt-4">
            SAGE Situation Brief
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mt-2 mb-6 max-w-md mx-auto">
            SAGE monitors your media landscape in real-time and generates weekly
            intelligence briefings. Connect your topic clusters in the SEO
            surface to activate.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
          >
            Set Up Topic Clusters <ArrowRight size={14} />
          </button>
        </div>

        {/* Topic activity list — gated. Phase 1 wires real topic-activity data. */}
        {wired ? (
          <div className="space-y-3 max-w-[600px]">
            {/* Phase 1 restores the topic-activity cards here. */}
          </div>
        ) : null}
      </div>
    </div>
  );
}
