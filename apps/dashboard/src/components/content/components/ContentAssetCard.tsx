'use client';

/**
 * ContentAssetCard v3 — CiteMind-First, DS v3.1 Compliant
 *
 * Per CONTENT_OVERVIEW_REDESIGN_BRIEF.md:
 * 1. CiteMind score is ALWAYS the dominant visual element
 * 2. Title is secondary — prominent but subordinate to score
 * 3. Entity tags and metadata are tertiary
 * 4. EVI delta always present when non-zero
 *
 * Three density modes: comfortable (≤12), standard (13–24), compact (25+)
 *
 * DS Compliance: All tokens verified against DS_v3_1_EXPRESSION.md
 * No phantom hex, no bg-gray-*, no plain text-white, no translate-y hover.
 */

import type { ContentAsset, DensityLevel, ContentStatus } from '../types';

interface ContentAssetCardProps {
  asset: ContentAsset;
  density: DensityLevel;
  isSelected?: boolean;
  onClick?: () => void;
  hasSageRecommendation?: boolean;
}

// ============================================
// STATUS CONFIG — DS v3.1 semantic pattern
// ============================================

const STATUS_CONFIG: Record<ContentStatus, { label: string; classes: string }> = {
  draft:        { label: 'Draft',        classes: 'bg-white/10 text-white/60 border-white/20' },
  needs_review: { label: 'Needs Review', classes: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20' },
  ready:        { label: 'Ready',        classes: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20' },
  published:    { label: 'Published',    classes: 'bg-semantic-success/10 text-semantic-success border-semantic-success/20' },
  archived:     { label: 'Archived',     classes: 'bg-white/5 text-white/40 border-white/10' },
};

// ============================================
// CITEMIND SCORE HELPERS
// ============================================

function getCiteScoreColor(score: number): string {
  if (score >= 80) return 'text-semantic-success';
  if (score >= 60) return 'text-brand-cyan';
  if (score >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

function getCiteScoreLabel(score: number): string {
  if (score >= 80) return 'Citation-ready';
  if (score >= 60) return 'Good standing';
  if (score >= 40) return 'Needs work';
  return 'Low eligibility';
}

function getCiteDotColor(score: number): string {
  if (score >= 80) return 'bg-semantic-success';
  if (score >= 60) return 'bg-brand-cyan';
  if (score >= 40) return 'bg-semantic-warning';
  return 'bg-semantic-danger';
}

// ============================================
// COMPACT ROW (25+ cards)
// ============================================

function CompactCard({ asset, isSelected, onClick }: Pick<ContentAssetCardProps, 'asset' | 'isSelected' | 'onClick'>) {
  const citeMindScore = asset.authoritySignals?.citationEligibilityScore ?? 0;
  const status = STATUS_CONFIG[asset.status];

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 cursor-pointer
        bg-slate-1 border rounded-lg
        transition-all duration-150
        hover:border-slate-5 hover:bg-panel
        ${isSelected ? 'border-brand-iris/50 bg-brand-iris/5' : 'border-border-subtle'}
      `}
    >
      {/* CiteMind dot — color signal only */}
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getCiteDotColor(citeMindScore)}`} />

      {/* Title */}
      <span className="flex-1 text-sm font-medium text-white/85 truncate">{asset.title}</span>

      {/* Score number */}
      <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${getCiteScoreColor(citeMindScore)}`}>
        {citeMindScore}
      </span>

      {/* Status badge — text only, no bg */}
      <span className={`text-[11px] font-bold uppercase tracking-wider flex-shrink-0 ${getCiteScoreColor(citeMindScore)}`}>
        {status.label}
      </span>
    </div>
  );
}

// ============================================
// STANDARD CARD (13–24 cards)
// ============================================

function StandardCard({ asset, isSelected, onClick }: ContentAssetCardProps) {
  const citeMindScore = asset.authoritySignals?.citationEligibilityScore ?? 0;
  const eviDelta = asset.authoritySignals?.competitiveAuthorityDelta ?? 0;
  const status = STATUS_CONFIG[asset.status];

  return (
    <div
      onClick={onClick}
      className={`
        p-3 flex flex-col cursor-pointer
        bg-slate-1 border rounded-xl
        transition-all duration-150
        hover:border-slate-5 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.1)]
        ${isSelected ? 'border-brand-iris/50 bg-brand-iris/5' : 'border-border-subtle'}
      `}
    >
      {/* Row 1: Status badge (left) + CiteMind block (right) */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${status.classes}`}>
          {status.label}
        </span>

        {/* CiteMind score — text-xl per standard density spec */}
        <div className="flex flex-col items-end">
          <span className={`text-xl font-bold tabular-nums leading-none ${getCiteScoreColor(citeMindScore)}`}>
            {citeMindScore}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${getCiteScoreColor(citeMindScore)} opacity-70`}>
            CiteMind
          </span>
        </div>
      </div>

      {/* Row 2: Title */}
      <h3 className="text-sm font-semibold text-white/90 line-clamp-1 mb-auto">
        {asset.title}
      </h3>

      {/* Row 3: EVI delta */}
      {eviDelta !== 0 && (
        <div className="flex justify-end mt-2">
          <span className={`text-[13px] font-bold tabular-nums ${eviDelta > 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
            {eviDelta > 0 ? '+' : ''}{eviDelta.toFixed(1)}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 ml-1">EVI pts</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMFORTABLE CARD (≤12 cards) — Full layout
// ============================================

function ComfortableCard({ asset, isSelected, onClick }: ContentAssetCardProps) {
  const citeMindScore = asset.authoritySignals?.citationEligibilityScore ?? 0;
  const aiIngestion = asset.authoritySignals?.aiIngestionLikelihood ?? 0;
  const crossPillar = asset.authoritySignals?.crossPillarImpact ?? 0;
  const eviDelta = asset.authoritySignals?.competitiveAuthorityDelta ?? 0;
  const status = STATUS_CONFIG[asset.status];

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-1 border rounded-xl p-4 flex flex-col gap-2 cursor-pointer
        transition-all duration-150
        hover:border-slate-5 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.1)]
        ${isSelected ? 'border-brand-iris/50 bg-brand-iris/5' : 'border-border-subtle'}
      `}
    >
      {/* Row 1 — Status badge (left) + CiteMind block (right) */}
      <div className="flex items-start justify-between">
        {/* Status badge */}
        <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${status.classes}`}>
          {status.label}
        </span>

        {/* CiteMind block — THE PRIMARY VISUAL ANCHOR */}
        <div className="flex flex-col items-end">
          <span className={`text-2xl font-bold tabular-nums leading-none ${getCiteScoreColor(citeMindScore)}`}>
            {citeMindScore}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${getCiteScoreColor(citeMindScore)} opacity-70`}>
            CiteMind
          </span>
          <span className={`text-[11px] uppercase tracking-wider ${getCiteScoreColor(citeMindScore)} opacity-60`}>
            {getCiteScoreLabel(citeMindScore)}
          </span>
        </div>
      </div>

      {/* Row 2 — Title */}
      <h3 className="text-[15px] font-semibold text-white/90 leading-snug line-clamp-2">
        {asset.title}
      </h3>

      {/* Row 3 — Authority intent */}
      {asset.authorityIntent && (
        <p className="text-[13px] text-white/55 leading-snug line-clamp-1">
          {asset.authorityIntent}
        </p>
      )}

      {/* Row 4 — Secondary metrics */}
      <div className="flex items-center gap-1 text-[13px] text-white/50">
        <span className={`font-bold tabular-nums ${getCiteScoreColor(aiIngestion)}`}>{aiIngestion}</span>
        <span className="text-white/40">AI Ingestion</span>
        <span className="text-white/30 mx-1">&middot;</span>
        <span className={`font-bold tabular-nums ${getCiteScoreColor(crossPillar)}`}>{crossPillar}</span>
        <span className="text-white/40">Cross-Pillar</span>
      </div>

      {/* Row 5 — Footer: Entity tags (left) + EVI delta (right) */}
      <div className="flex items-center justify-between mt-1">
        {/* Entity tags */}
        {asset.entityAssociations && asset.entityAssociations.length > 0 ? (
          <div className="flex items-center gap-1">
            {asset.entityAssociations.slice(0, 2).map((entity, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-brand-iris/10 text-brand-iris border border-brand-iris/20"
              >
                {entity}
              </span>
            ))}
            {asset.entityAssociations.length > 2 && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                +{asset.entityAssociations.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[13px] text-white/30">No entities</span>
        )}

        {/* EVI delta */}
        {eviDelta !== 0 && (
          <div className="flex items-center">
            <span className={`text-[13px] font-bold tabular-nums ${eviDelta > 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
              {eviDelta > 0 ? '+' : ''}{eviDelta.toFixed(1)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 ml-0.5">EVI pts</span>
          </div>
        )}
      </div>

      {/* Bottom edge — Word count + date */}
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/35">
        {asset.wordCount && (
          <span>{asset.wordCount.toLocaleString()} words</span>
        )}
        {asset.wordCount && <span>&middot;</span>}
        <span>
          Updated {new Date(asset.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN EXPORT — Density router
// ============================================

export function ContentAssetCard({
  asset,
  density,
  isSelected = false,
  onClick,
  hasSageRecommendation = false,
}: ContentAssetCardProps) {
  if (density === 'compact') {
    return <CompactCard asset={asset} isSelected={isSelected} onClick={onClick} />;
  }
  if (density === 'standard') {
    return <StandardCard asset={asset} density={density} isSelected={isSelected} onClick={onClick} hasSageRecommendation={hasSageRecommendation} />;
  }
  return <ComfortableCard asset={asset} density={density} isSelected={isSelected} onClick={onClick} hasSageRecommendation={hasSageRecommendation} />;
}
