'use client';

/**
 * SAGE Brief Flow — /app/content/new/brief/[id]
 *
 * Stub route: shows brief detail + Generate button.
 * Full brief-to-editor flow built in Sprint 2B.
 */

export const dynamic = 'force-dynamic';

import { use } from 'react';
import Link from 'next/link';
import { Lightning } from '@phosphor-icons/react';
import { mockBriefs } from '@/components/content/content-mock-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BriefFlowPage({ params }: PageProps) {
  const { id } = use(params);
  const brief = mockBriefs.find((b) => b.id === id);

  if (!brief) {
    return (
      <div className="min-h-full bg-cc-page pt-8 pb-16 px-8">
        <div className="max-w-[800px] mx-auto text-center py-20">
          <p className="text-sm text-white/45">Brief not found.</p>
          <Link
            href="/app/content/new"
            className="text-sm text-cc-cyan mt-4 inline-block"
          >
            &larr; Back to content
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-cc-page pt-8 pb-16 px-8">
      <div className="max-w-[800px] mx-auto">
        {/* Back */}
        <Link
          href="/app/content/new"
          className="text-sm text-white/45 hover:text-white/70 transition-colors mb-8 inline-block"
        >
          &larr; Back
        </Link>

        {/* Brief header */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightning size={24} className="text-cc-cyan" weight="regular" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/45">
              SAGE Brief
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{brief.topic}</h1>

          <div className="flex items-center gap-2 mb-4">
            <span className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full">
              {brief.contentType}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                brief.priority === 'critical'
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              {brief.priority.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-white/70 mb-6">{brief.aeoGap}</p>

          {/* Brief context (mock) */}
          <div className="border-t border-white/5 pt-4 mb-6 space-y-3">
            <div>
              <span className="text-xs text-white/45 block mb-1">
                Target keywords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['enterprise AEO', 'AI content optimization', 'citation authority'].map((kw) => (
                  <span
                    key={kw}
                    className="bg-white/5 text-white/70 text-xs px-2 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-white/45 block mb-1">
                Competitor context
              </span>
              <p className="text-sm text-white/70">
                CompetitorX published similar content 2 weeks ago and is already
                being cited by ChatGPT and Perplexity in 68% of related queries.
              </p>
            </div>
            <div>
              <span className="text-xs text-white/45 block mb-1">
                Recommended angle
              </span>
              <p className="text-sm text-white/70">
                Differentiate with proprietary data and first-party case studies
                that competitors lack.
              </p>
            </div>
          </div>

          {/* Generate CTA */}
          <button
            type="button"
            className="w-full bg-cc-cyan text-cc-page rounded-xl px-6 py-3 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors"
          >
            Generate Draft from Brief
          </button>
          <p className="text-xs text-white/45 text-center mt-2">
            AI will create a complete first draft based on this brief. Takes
            about 10 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
