'use client';

/**
 * ContextRailEditor - Right rail for document context in Manual mode
 *
 * 280px fixed width, collapsible to 0px. Shows CiteMind status, AEO score,
 * entity associations, derivatives, cross-pillar hooks, and publish button.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useCiteMindScore, useCiteMindTrigger } from '@/lib/useCiteMind';

import type { ContentAsset, CiteMindStatus, CiteMindIssue, DerivativeType } from '../types';
import { CiteMindStatusIndicator } from '../components/CiteMindStatusIndicator';

// ============================================
// TYPES
// ============================================

export interface ContextRailEditorProps {
  asset: ContentAsset | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onPublish?: () => void;
  contextData?: {
    citeMindStatus?: CiteMindStatus;
    citeMindIssues?: CiteMindIssue[];
    aeoScore?: number;
    entities?: string[];
    derivatives?: Array<{ type: DerivativeType; valid: boolean }>;
    crossPillar?: { prHooks: number; seoHooks: number };
  };
}

// ============================================
// AEO SCORE DISPLAY
// ============================================

function AEOScoreCard({ score }: { score: number }) {
  const color =
    score >= 71 ? 'text-semantic-success' :
    score >= 41 ? 'text-semantic-warning' :
    'text-semantic-danger';
  const bg =
    score >= 71 ? 'bg-semantic-success' :
    score >= 41 ? 'bg-semantic-warning' :
    'bg-semantic-danger';

  return (
    <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
      <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">AEO Score</h4>
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold tabular-nums ${color}`}>{score}</span>
        <div className="flex-1">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${bg}`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <span className="text-xs text-white/30 mt-0.5 block">
            {score >= 71 ? 'AI-citation ready' : score >= 41 ? 'Needs improvement' : 'Below threshold'}
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================
// DERIVATIVE TYPE LABELS
// ============================================

const DERIVATIVE_LABELS: Record<DerivativeType, string> = {
  pr_pitch_excerpt: 'PR Pitch Excerpt',
  aeo_snippet: 'AEO Snippet',
  ai_summary: 'AI Summary',
  social_fragment: 'Social Fragment',
};

// ============================================
// MAIN COMPONENT
// ============================================

export function ContextRailEditor({
  asset,
  isCollapsed,
  onToggleCollapse,
  onPublish,
  contextData,
}: ContextRailEditorProps) {
  // Fetch real CiteMind score when asset is selected
  const { score: citeMindScore, gateStatus: realGateStatus } = useCiteMindScore(asset?.id);
  const { triggerScore, isScoring } = useCiteMindTrigger();

  // Use real data when available, fall back to props
  const effectiveStatus: CiteMindStatus = citeMindScore
    ? (realGateStatus as CiteMindStatus)
    : (contextData?.citeMindStatus || 'pending');

  // Collapsed state: slim toggle button
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="h-full w-6 flex items-center justify-center text-white/40 hover:text-brand-iris hover:bg-white/5 transition-colors"
        aria-label="Expand context rail"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
  }

  // No asset selected
  if (!asset) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2.5 border-b border-slate-4 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-semibold text-white/60">Context</h3>
          <button onClick={onToggleCollapse} className="p-1 text-white/40 hover:text-white rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-white/40 text-center">Select a document to see context</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-4 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-white/60">Context</h3>
        <button onClick={onToggleCollapse} className="p-1 text-white/40 hover:text-white rounded transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {/* 1. CiteMind Score — real data from API */}
        <CiteMindStatusIndicator
          status={effectiveStatus}
          issues={contextData?.citeMindIssues?.slice(0, 3)}
          scoreData={citeMindScore ? {
            overall_score: citeMindScore.overall_score,
            entity_density_score: citeMindScore.entity_density_score,
            claim_verifiability_score: citeMindScore.claim_verifiability_score,
            structural_clarity_score: citeMindScore.structural_clarity_score,
            topical_authority_score: citeMindScore.topical_authority_score,
            schema_markup_score: citeMindScore.schema_markup_score,
            citation_pattern_score: citeMindScore.citation_pattern_score,
            recommendations: citeMindScore.recommendations,
          } : null}
        />

        {/* Analyze button */}
        {asset && (
          <button
            onClick={() => triggerScore(asset.id)}
            disabled={isScoring}
            className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isScoring
                ? 'bg-brand-iris/20 text-brand-iris/60 cursor-wait'
                : 'text-white/60 bg-white/5 hover:bg-white/10'
            }`}
          >
            {isScoring ? 'Analyzing...' : 'Run CiteMind Analysis'}
          </button>
        )}

        {/* 2. AEO Score — use CiteMind overall as AEO proxy */}
        {(citeMindScore?.overall_score !== undefined || contextData?.aeoScore !== undefined) && (
          <AEOScoreCard score={citeMindScore?.overall_score ?? contextData?.aeoScore ?? 0} />
        )}

        {/* 3. Entities */}
        {contextData?.entities && contextData.entities.length > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Entities</h4>
            <div className="flex flex-wrap gap-1.5">
              {contextData.entities.map((entity) => (
                <span key={entity} className="px-2 py-0.5 text-xs text-white/60 bg-white/5 rounded">
                  {entity}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 4. Derivatives */}
        {contextData?.derivatives && contextData.derivatives.length > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Derivatives</h4>
            <div className="space-y-1">
              {contextData.derivatives.map((d) => (
                <div key={d.type} className="flex items-center justify-between text-sm">
                  <span className="text-white/50">{DERIVATIVE_LABELS[d.type] || d.type.replace(/_/g, ' ')}</span>
                  <span className={d.valid ? 'text-semantic-success' : 'text-white/30'}>
                    {d.valid ? '\u2713' : '\u2014'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Cross-Pillar Hooks */}
        {contextData?.crossPillar && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Cross-Pillar</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">PR Hooks</span>
                <span className="font-medium text-white/70">{contextData.crossPillar.prHooks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">SEO Hooks</span>
                <span className="font-medium text-white/70">{contextData.crossPillar.seoHooks}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 6. Sticky Publish Button */}
      {onPublish && (
        <div className="p-3 border-t border-slate-4 shrink-0">
          <button
            onClick={onPublish}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors shadow-[0_0_12px_rgba(168,85,247,0.2)]"
          >
            Publish
          </button>
        </div>
      )}
    </div>
  );
}
