'use client';

/**
 * Content Insights View
 *
 * Analytics view for the Content pillar. Renders the Authority Signals served
 * FROM the persisted content_authority_signals table (computed by the canon
 * scorer per AUTHORITY_SIGNALS_MODEL.md / D038 when CiteMind scoring completes),
 * via GET /api/content/signals.
 *
 * HONEST DATA: four signals carry real values (Authority Contribution, Citation
 * Eligibility, AI Ingestion Likelihood, Cross-Pillar Impact). The fifth —
 * Competitive Authority Delta — is DATA-GATED on DataForSEO and arrives null; it
 * renders an explicit "Not available yet" state, never 0, never a fabricated
 * number. The content accent is IRIS (brand-iris #A855F7) per the design system.
 *
 * @see /docs/canon/AUTHORITY_SIGNALS_MODEL.md
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useRouter } from 'next/navigation';

import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';
import type {
  AuthoritySignalsAggregate,
  AuthoritySignalTopAsset,
  ContentGap,
} from '../types';

interface ContentInsightsViewProps {
  /** Aggregate Authority Signals from content_authority_signals (null until loaded). */
  signals: AuthoritySignalsAggregate | null;
  /** Top assets by authority contribution, from content_authority_signals. */
  topAssets: AuthoritySignalTopAsset[];
  /** Content gaps/opportunities (real /gaps feed). */
  gaps: ContentGap[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Action handlers */
  onViewAsset?: (assetId: string) => void;
  onViewGap?: (keyword: string) => void;
  onGenerateBrief?: () => void;
}

// ============================================
// SCORE STYLING (iris accent for the Content pillar)
// ============================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-semantic-success';
  if (score >= 60) return 'text-brand-iris';
  if (score >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-semantic-success';
  if (score >= 60) return 'bg-brand-iris';
  if (score >= 40) return 'bg-semantic-warning';
  return 'bg-semantic-danger';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentInsightsView({
  signals,
  topAssets,
  gaps,
  isLoading,
  error,
  onViewAsset,
  onViewGap,
  onGenerateBrief,
}: ContentInsightsViewProps) {
  const router = useRouter();

  const handleOpenAssetForRevision = (assetId: string) => {
    router.push(`/app/content/asset/${assetId}`);
    onViewAsset?.(assetId);
  };

  const handleCreateBrief = () => {
    router.push('/app/content/new');
    onGenerateBrief?.();
  };

  if (isLoading) {
    return <ContentLoadingSkeleton type="dashboard" />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">
            Failed to load insights
          </h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const hasScoredContent = !!signals && signals.scoredAssetCount > 0;
  const hasData = hasScoredContent || gaps.length > 0;

  // Empty = new org with no scored content and no gap feed.
  if (!hasData) {
    return (
      <ContentEmptyState
        view="insights"
        onAction={onGenerateBrief}
        actionLabel="Create Content"
      />
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Authority Summary — real persisted Authority Signals (D038) */}
      {hasScoredContent && signals && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Authority Summary
            </h3>
            <span className="text-xs text-white/40">
              {signals.scoredAssetCount} scored{' '}
              {signals.scoredAssetCount === 1 ? 'asset' : 'assets'}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <InsightMetricCard
              label="Authority Contribution"
              value={signals.authorityContributionScore}
              description="Overall content authority (CiteMind score gated by publish status)"
            />
            <InsightMetricCard
              label="Citation Eligibility"
              value={signals.citationEligibilityScore}
              description="Mean CiteMind score — predicts whether AI engines will cite your content"
            />
            <InsightMetricCard
              label="AI Ingestion Likelihood"
              value={signals.aiIngestionLikelihood}
              description="Schema, structure & entity readiness for AI-engine ingestion"
            />
            <InsightMetricCard
              label="Cross-Pillar Impact"
              value={signals.crossPillarImpact}
              format="evi"
              description="Reinforced authority lift into PR + SEO, in EVI points"
            />
            <InsightMetricCard
              label="Competitive Delta"
              value={signals.competitiveAuthorityDelta}
              description="Authority vs. competitors — requires DataForSEO (not yet provisioned)"
            />
          </div>
          <p className="mt-3 text-xs text-white/35">
            Served live from persisted Authority Signals. Data-gated metrics
            show “Not available yet” rather than a placeholder number.
          </p>
        </section>
      )}

      {/* Top Performing Content by authority contribution (real persisted scores) */}
      {topAssets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/95">
              Top Performing Content
            </h3>
            <span className="text-xs text-white/40">
              By authority contribution
            </span>
          </div>
          <div className="space-y-2">
            {topAssets.slice(0, 5).map((asset, index) => (
              <TopAssetRow
                key={asset.id}
                rank={index + 1}
                asset={asset}
                onOpenForRevision={() => handleOpenAssetForRevision(asset.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Content Opportunities — real /gaps feed */}
      {gaps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/95">
              Content Opportunities
            </h3>
            <span className="text-xs text-white/40">
              {gaps.length} gaps identified
            </span>
          </div>
          <div className="space-y-2">
            {gaps.slice(0, 5).map((gap, index) => (
              <GapOpportunityRow
                key={index}
                gap={gap}
                onCreateBrief={handleCreateBrief}
                onViewDetails={() => onViewGap?.(gap.keyword)}
              />
            ))}
          </div>
          {gaps.length > 5 && (
            <button
              onClick={() => onViewGap?.('')}
              className="mt-2 text-xs text-brand-iris hover:underline"
            >
              View all {gaps.length} opportunities →
            </button>
          )}
        </section>
      )}
    </div>
  );
}

// ============================================
// INSIGHT METRIC CARD
// ============================================

interface InsightMetricCardProps {
  label: string;
  /** null → render an explicit "Not available yet" state (never 0). */
  value: number | null;
  description: string;
  /** 'score' = 0-100 with progress bar; 'evi' = EVI points, no bar. */
  format?: 'score' | 'evi';
}

function InsightMetricCard({
  label,
  value,
  description,
  format = 'score',
}: InsightMetricCardProps) {
  const available = value !== null;

  return (
    <div className="p-4 bg-slate-2 border border-border-subtle rounded-lg">
      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
        {label}
      </div>

      {available && format === 'score' ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(value)}`}>
              {value}
            </span>
            <span className="text-xs text-white/30">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 bg-slate-4 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreBgColor(value)} transition-all duration-500`}
              style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
          </div>
        </>
      ) : available ? (
        // EVI-point metric: plain value, no 0-100 bar (it is not a percentage).
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-iris">{value}</span>
          <span className="text-xs text-white/30">EVI pts</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-white/30">
            Not available yet
          </span>
        </div>
      )}

      <p className="text-xs text-white/30 mt-2">{description}</p>
    </div>
  );
}

// ============================================
// TOP ASSET ROW
// ============================================

interface TopAssetRowProps {
  rank: number;
  asset: AuthoritySignalTopAsset;
  onOpenForRevision?: () => void;
}

function TopAssetRow({ rank, asset, onOpenForRevision }: TopAssetRowProps) {
  const score = asset.authorityContributionScore;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-2 border border-border-subtle rounded-lg group hover:border-brand-iris/40 transition-colors">
      <span className="text-lg font-bold text-white/30 w-6 text-center">
        #{rank}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">
          {asset.title}
        </h4>
        <p className="text-xs text-white/40 capitalize">{asset.status}</p>
      </div>
      <div className="text-right mr-2">
        {score !== null ? (
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        ) : (
          <span className="text-xs font-medium text-white/30">—</span>
        )}
        <p className="text-xs text-white/30 uppercase">Authority</p>
      </div>
      {/* Action button — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onOpenForRevision}
          className="p-1.5 text-brand-iris hover:bg-brand-iris/10 rounded transition-colors"
          title="Open for revision"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// GAP OPPORTUNITY ROW
// ============================================

interface GapOpportunityRowProps {
  gap: ContentGap;
  onCreateBrief?: () => void;
  onViewDetails?: () => void;
}

function GapOpportunityRow({
  gap,
  onCreateBrief,
  onViewDetails,
}: GapOpportunityRowProps) {
  const scoreColor =
    gap.seoOpportunityScore >= 70
      ? 'text-semantic-success bg-semantic-success/10'
      : gap.seoOpportunityScore >= 40
        ? 'text-semantic-warning bg-semantic-warning/10'
        : 'text-white/50 bg-white/10';

  return (
    <div className="flex items-center justify-between p-3 bg-slate-2 border border-border-subtle rounded-lg group hover:border-brand-iris/40 transition-colors">
      <div
        className="flex-1 min-w-0"
        onClick={onViewDetails}
        role="button"
        tabIndex={0}
      >
        <h4 className="text-sm font-medium text-white/95">{gap.keyword}</h4>
        <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
          {gap.intent && <span className="capitalize">{gap.intent}</span>}
          <span>·</span>
          <span>{gap.existingContentCount} existing</span>
          {gap.competitorCount !== undefined && (
            <>
              <span>·</span>
              <span>{gap.competitorCount} competitors</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-0.5 text-xs font-bold rounded-full ${scoreColor}`}
        >
          {gap.seoOpportunityScore}
        </span>
        <button
          onClick={onCreateBrief}
          className="px-2 py-1 text-xs font-medium text-brand-iris bg-brand-iris/10 hover:bg-brand-iris/20 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          Start Writing
        </button>
      </div>
    </div>
  );
}
