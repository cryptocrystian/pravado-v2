'use client';

/**
 * Entry Point Selection — /app/content/new
 *
 * Three option cards: SAGE Brief (recommended), Template, Blank
 * Cross-pillar prefill: reads ?title, ?topic, ?source from URL params
 * (source: 'seo' | 'pr' — shown in the context banner).
 *
 * DS v3.1 tokens throughout.
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lightning, Layout, PencilSimple } from '@phosphor-icons/react';
import { BriefCard } from '@/components/content/BriefCard';
import { TemplateLibrary } from '@/components/content/TemplateLibrary';
import { mockBriefs } from '@/components/content/content-mock-data';

type ActiveSection = null | 'briefs' | 'templates';

const SOURCE_LABEL: Record<string, string> = {
  seo: 'SEO / AEO',
  pr: 'PR',
};

export default function ContentNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  // Cross-pillar prefill params
  const prefillTitle = searchParams?.get('title') ?? null;
  const prefillTopic = searchParams?.get('topic') ?? null;
  const prefillSource = searchParams?.get('source') ?? null;

  useEffect(() => {
    const view = searchParams?.get('view');
    if (view === 'templates') setActiveSection('templates');
    else if (view === 'briefs') setActiveSection('briefs');
  }, [searchParams]);

  function handleBlankClick() {
    router.push('/app/content/new-document');
  }

  const sourceLabel = prefillSource ? (SOURCE_LABEL[prefillSource] ?? prefillSource) : null;

  return (
    <div className="min-h-full bg-slate-0 pt-8 pb-16 px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Back link */}
        <Link
          href="/app/content"
          className="text-sm text-white/45 hover:text-white/70 transition-colors mb-8 inline-block"
        >
          &larr; Content
        </Link>

        {/* Cross-pillar context banner */}
        {(prefillTitle || prefillTopic) && (
          <div className="bg-brand-iris/5 border border-brand-iris/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {sourceLabel && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-iris mb-1">
                  Pre-filled from {sourceLabel}
                </p>
              )}
              {prefillTitle && (
                <p className="text-sm text-white">
                  Title: <span className="font-semibold">{decodeURIComponent(prefillTitle)}</span>
                </p>
              )}
              {prefillTopic && (
                <p className="text-sm text-white/70 mt-0.5">
                  Topic cluster: <span className="font-medium text-white/85">{decodeURIComponent(prefillTopic)}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2">
          What would you like to create?
        </h1>
        <p className="text-sm text-white/50 mb-10">Choose your starting point.</p>

        {/* Three option cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1: SAGE Brief */}
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'briefs' ? null : 'briefs')}
            className={`bg-slate-2 rounded-2xl p-6 cursor-pointer text-left transition-all ${
              activeSection === 'briefs'
                ? 'border-2 border-brand-iris/70 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                : 'border-2 border-brand-iris/30 hover:border-brand-iris/60'
            }`}
          >
            <span className="bg-brand-iris/10 text-brand-iris text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mb-3 uppercase tracking-wide">
              RECOMMENDED
            </span>
            <Lightning size={32} className="text-brand-iris" weight="regular" />
            <h3 className="text-xl font-semibold text-white mt-3">
              Start from SAGE Brief
            </h3>
            <p className="text-sm text-white/60 leading-relaxed mt-2">
              SAGE has identified content gaps based on your AEO performance.
              Start with a strategic brief pre-loaded with topic, entities, and
              competitive context.
            </p>
            <p className="text-xs text-brand-iris mt-4">
              {mockBriefs.length} brief{mockBriefs.length !== 1 ? 's' : ''} ready
            </p>
            <span className="text-sm font-semibold text-brand-iris mt-2 block">
              Select Brief &rarr;
            </span>
          </button>

          {/* Card 2: Template */}
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'templates' ? null : 'templates')}
            className={`bg-slate-2 rounded-2xl p-6 cursor-pointer text-left transition-all ${
              activeSection === 'templates'
                ? 'border-2 border-slate-5'
                : 'border border-slate-4 hover:border-slate-5'
            }`}
          >
            <Layout size={32} className="text-white/60" weight="regular" />
            <h3 className="text-xl font-semibold text-white mt-3">Choose a Template</h3>
            <p className="text-sm text-white/60 leading-relaxed mt-2">
              Pick from 8 proven content types with guided brief intake forms.
              AI generates a first draft from your inputs.
            </p>
          </button>

          {/* Card 3: Blank */}
          <button
            type="button"
            onClick={handleBlankClick}
            className="bg-slate-2 border border-slate-4 rounded-2xl p-6 cursor-pointer hover:border-slate-5 transition-all text-left"
          >
            <PencilSimple size={32} className="text-white/60" weight="regular" />
            <h3 className="text-xl font-semibold text-white mt-3">Start Blank</h3>
            <p className="text-sm text-white/60 leading-relaxed mt-2">
              Open the editor directly. AI assist, slash commands, and CiteMind
              scoring are always available &mdash; press / to get started.
            </p>
          </button>
        </div>

        {/* Expandable brief selection */}
        {activeSection === 'briefs' && (
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
              Select a SAGE Brief
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {mockBriefs.map((brief) => (
                <BriefCard key={brief.id} brief={brief} />
              ))}
            </div>
          </div>
        )}

        {/* Expandable template library */}
        {activeSection === 'templates' && (
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
              Template Library
            </h3>
            <TemplateLibrary />
          </div>
        )}
      </div>
    </div>
  );
}
