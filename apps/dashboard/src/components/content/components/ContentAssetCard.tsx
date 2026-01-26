'use client';

/**
 * Content Asset Card
 *
 * Density-adaptive card for displaying content assets.
 * Follows the Command Center ActionCard density pattern.
 *
 * Density Levels:
 * - Comfortable (≤12 cards): Full preview, all metrics
 * - Standard (13-24 cards): Title, status, key metric
 * - Compact (25+ cards): Row layout, title + status only
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import type { ContentAsset, DensityLevel, ContentStatus } from '../types';
import { CiteMindStatusIndicator } from './CiteMindStatusIndicator';

interface ContentAssetCardProps {
  asset: ContentAsset;
  density: DensityLevel;
  isSelected?: boolean;
  onClick?: () => void;
}

// ============================================
// STATUS STYLING
// ============================================

const STATUS_STYLES: Record<ContentStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-semantic-warning/10', text: 'text-semantic-warning' },
  review: { bg: 'bg-brand-iris/10', text: 'text-brand-iris' },
  approved: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan' },
  published: { bg: 'bg-semantic-success/10', text: 'text-semantic-success' },
  archived: { bg: 'bg-white/10', text: 'text-white/50' },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog_post: 'Blog Post',
  long_form: 'Long Form',
  landing_page: 'Landing Page',
  guide: 'Guide',
  case_study: 'Case Study',
};

// ============================================
// METRIC SCORE COLOR
// ============================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-semantic-success';
  if (score >= 60) return 'text-brand-cyan';
  if (score >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-semantic-success';
  if (score >= 60) return 'bg-brand-cyan';
  if (score >= 40) return 'bg-semantic-warning';
  return 'bg-semantic-danger';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentAssetCard({
  asset,
  density,
  isSelected = false,
  onClick,
}: ContentAssetCardProps) {
  const statusStyle = STATUS_STYLES[asset.status];
  const authorityScore = asset.authoritySignals?.authorityContributionScore ?? 0;

  // Compact mode: Row layout
  if (density === 'compact') {
    return (
      <div
        onClick={onClick}
        className={`
          min-h-[48px] px-3 py-2 flex items-center gap-3 cursor-pointer
          bg-[#13131A] border border-[#1F1F28] rounded-lg
          hover:border-[#2A2A36] hover:bg-[#16161E] transition-all duration-200
          ${isSelected ? 'border-brand-iris/60 bg-brand-iris/5' : ''}
        `}
      >
        {/* Title */}
        <span className="flex-1 text-sm text-white font-medium truncate">
          {asset.title}
        </span>

        {/* Status badge */}
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
          {asset.status}
        </span>

        {/* Score */}
        <span className={`text-xs font-bold ${getScoreColor(authorityScore)}`}>
          {authorityScore}
        </span>
      </div>
    );
  }

  // Standard mode: Condensed layout
  if (density === 'standard') {
    return (
      <div
        onClick={onClick}
        className={`
          min-h-[120px] p-3 flex flex-col cursor-pointer
          bg-[#13131A] border border-[#1F1F28] rounded-lg
          hover:border-[#2A2A36] hover:bg-[#16161E] transition-all duration-200
          ${isSelected ? 'border-brand-iris/60 bg-brand-iris/5' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-white line-clamp-1 flex-1">
            {asset.title}
          </h3>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
            {asset.status}
          </span>
        </div>

        {/* Type + Key metric */}
        <div className="flex items-center gap-3 text-xs text-white/55 mb-2">
          <span>{CONTENT_TYPE_LABELS[asset.contentType] || asset.contentType}</span>
          {asset.wordCount && <span>{asset.wordCount.toLocaleString()} words</span>}
        </div>

        {/* Authority score bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Authority</span>
            <span className={`text-xs font-bold ${getScoreColor(authorityScore)}`}>{authorityScore}</span>
          </div>
          <div className="h-1 bg-[#1A1A24] rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreBgColor(authorityScore)} transition-all duration-300`}
              style={{ width: `${authorityScore}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Comfortable mode: Full layout
  return (
    <div
      onClick={onClick}
      className={`
        min-h-[180px] p-4 flex flex-col cursor-pointer
        bg-[#13131A] border border-[#1F1F28] rounded-lg
        hover:border-brand-iris/40 hover:bg-[#16161E] hover:shadow-[0_0_20px_rgba(168,85,247,0.08)]
        transition-all duration-200 group
        ${isSelected ? 'border-brand-iris/60 bg-brand-iris/5' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1 group-hover:text-brand-iris transition-colors">
          {asset.title}
        </h3>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
          {asset.status}
        </span>
      </div>

      {/* Authority intent */}
      {asset.authorityIntent && (
        <p className="text-xs text-white/55 mb-3 line-clamp-1">
          {asset.authorityIntent}
        </p>
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricTile
          label="Authority"
          value={asset.authoritySignals?.authorityContributionScore ?? 0}
        />
        <MetricTile
          label="Citation"
          value={asset.authoritySignals?.citationEligibilityScore ?? 0}
        />
        <MetricTile
          label="AI Ready"
          value={asset.authoritySignals?.aiIngestionLikelihood ?? 0}
        />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1A1A24]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">
            {CONTENT_TYPE_LABELS[asset.contentType] || asset.contentType}
          </span>
          {asset.wordCount && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-[10px] text-white/40">{asset.wordCount.toLocaleString()} words</span>
            </>
          )}
        </div>
        <CiteMindStatusIndicator status={asset.citeMindStatus} compact />
      </div>

      {/* Entity tags */}
      {asset.entityAssociations && asset.entityAssociations.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {asset.entityAssociations.slice(0, 3).map((entity, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-[10px] bg-brand-iris/10 text-brand-iris rounded"
            >
              {entity}
            </span>
          ))}
          {asset.entityAssociations.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-white/40">
              +{asset.entityAssociations.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// METRIC TILE
// ============================================

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${getScoreColor(value)}`}>{value}</div>
      <div className="text-[9px] text-white/40 uppercase tracking-wider">{label}</div>
    </div>
  );
}
