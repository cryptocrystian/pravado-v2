'use client';

/**
 * Content Insights View
 *
 * Analytics and insights view for the Content pillar.
 * Shows authority trends, performance metrics, and recommendations.
 * CTAs route to: create brief, open asset for revision, regenerate derivatives.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useRouter } from 'next/navigation';

import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';
import type { AuthoritySignals, ContentAsset, ContentGap } from '../types';

interface ContentInsightsViewProps {
  /** Aggregate authority signals */
  signals: AuthoritySignals | null;
  /** Top performing assets */
  topAssets: ContentAsset[];
  /** Content gaps/opportunities */
  gaps: ContentGap[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Action handlers */
  onViewAsset?: (assetId: string) => void;
  onViewGap?: (keyword: string) => void;
  onGenerateBrief?: () => void;
  onRegenerateDerivatives?: (assetId: string) => void;
}

// ============================================
// SCORE STYLING
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

export function ContentInsightsView({
  signals,
  topAssets,
  gaps,
  isLoading,
  error,
  onViewAsset,
  onViewGap,
  onGenerateBrief,
  onRegenerateDerivatives,
}: ContentInsightsViewProps) {
  const router = useRouter();

  // Handle navigation to asset for revision
  const handleOpenAssetForRevision = (assetId: string) => {
    router.push(`/app/content/asset/${assetId}`);
    onViewAsset?.(assetId);
  };

  // Handle navigation to create brief
  const handleCreateBrief = (_keyword?: string) => {
    // In production, pass keyword to pre-fill brief
    router.push('/app/content/brief/new');
    onGenerateBrief?.();
  };

  // Handle derivative regeneration
  const handleRegenerateDerivatives = (assetId: string) => {
    router.push(`/app/content/asset/${assetId}#derivatives`);
    onRegenerateDerivatives?.(assetId);
  };

  if (isLoading) {
    return <ContentLoadingSkeleton type="dashboard" />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">Failed to load insights</h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const hasData = signals || topAssets.length > 0 || gaps.length > 0;

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
      {/* Authority Trend Summary */}
      {signals && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-3">Authority Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <InsightMetricCard
              label="Authority Score"
              value={signals.authorityContributionScore}
              trend={signals.competitiveAuthorityDelta}
              description="Overall content authority"
            />
            <InsightMetricCard
              label="Citation Ready"
              value={signals.citationEligibilityScore}
              description="CiteMind eligibility"
            />
            <InsightMetricCard
              label="AI Discovery"
              value={signals.aiIngestionLikelihood}
              description="AI engine readiness"
            />
            <InsightMetricCard
              label="Cross-Pillar"
              value={signals.crossPillarImpact}
              description="PR + SEO synergy"
            />
          </div>
        </section>
      )}

      {/* Top Performing Content with Actionable CTAs */}
      {topAssets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Top Performing Content</h3>
            <span className="text-[10px] text-white/40">By authority score</span>
          </div>
          <div className="space-y-2">
            {topAssets.slice(0, 5).map((asset, index) => (
              <TopAssetRow
                key={asset.id}
                rank={index + 1}
                asset={asset}
                onOpenForRevision={() => handleOpenAssetForRevision(asset.id)}
                onRegenerateDerivatives={() => handleRegenerateDerivatives(asset.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Content Opportunities with Actionable CTAs */}
      {gaps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Content Opportunities</h3>
            <span className="text-[10px] text-white/40">{gaps.length} gaps identified</span>
          </div>
          <div className="space-y-2">
            {gaps.slice(0, 5).map((gap, index) => (
              <GapOpportunityRow
                key={index}
                gap={gap}
                onCreateBrief={() => handleCreateBrief(gap.keyword)}
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

      {/* SAGE Recommendations with Actionable CTAs */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-3">SAGE Recommendations</h3>
        <div className="space-y-3">
          <RecommendationCard
            type="opportunity"
            title="High-value keyword gap detected"
            description="Create content for 'marketing automation ROI' - high search volume, low competition"
            actions={[
              { label: 'Create Brief', primary: true, onClick: () => handleCreateBrief('marketing automation ROI') },
            ]}
          />
          <RecommendationCard
            type="improvement"
            title="Improve citation eligibility"
            description="3 assets have citation scores below 50. Add structured data and improve factual accuracy."
            actions={[
              { label: 'View Assets', primary: false, onClick: () => router.push('/app/content?filter=low-citation') },
              { label: 'Open First Asset', primary: true, onClick: () => topAssets[0] && handleOpenAssetForRevision(topAssets[0].id) },
            ]}
          />
          <RecommendationCard
            type="cross-pillar"
            title="Derivatives need refresh"
            description="2 assets have stale derivatives. Regenerate to maintain cross-pillar accuracy."
            actions={[
              { label: 'Regenerate All', primary: true, onClick: () => topAssets[0] && handleRegenerateDerivatives(topAssets[0].id) },
            ]}
          />
        </div>
      </section>

      {/* Authority Distribution Chart Placeholder */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-3">Authority Distribution</h3>
        <div className="p-6 bg-slate-2 border border-border-subtle rounded-lg">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <svg className="w-8 h-8 text-white/20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs text-white/40">Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================
// INSIGHT METRIC CARD
// ============================================

interface InsightMetricCardProps {
  label: string;
  value: number;
  trend?: number;
  description: string;
}

function InsightMetricCard({ label, value, trend, description }: InsightMetricCardProps) {
  return (
    <div className="p-4 bg-slate-2 border border-border-subtle rounded-lg">
      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</span>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium ${
              trend > 0 ? 'text-semantic-success' : trend < 0 ? 'text-semantic-danger' : 'text-white/40'
            }`}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
        <div
          className={`h-full ${getScoreBgColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-[10px] text-white/30 mt-2">{description}</p>
    </div>
  );
}

// ============================================
// TOP ASSET ROW
// ============================================

interface TopAssetRowProps {
  rank: number;
  asset: ContentAsset;
  onOpenForRevision?: () => void;
  onRegenerateDerivatives?: () => void;
}

function TopAssetRow({ rank, asset, onOpenForRevision, onRegenerateDerivatives }: TopAssetRowProps) {
  const score = asset.authoritySignals?.authorityContributionScore ?? 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-2 border border-border-subtle rounded-lg group hover:border-brand-iris/40 transition-colors">
      <span className="text-lg font-bold text-white/30 w-6 text-center">#{rank}</span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{asset.title}</h4>
        <p className="text-[10px] text-white/40">{asset.status}</p>
      </div>
      <div className="text-right mr-2">
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
        <p className="text-[9px] text-white/30 uppercase">Authority</p>
      </div>
      {/* Action buttons - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onOpenForRevision}
          className="p-1.5 text-brand-iris hover:bg-brand-iris/10 rounded transition-colors"
          title="Open for revision"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onRegenerateDerivatives}
          className="p-1.5 text-brand-cyan hover:bg-brand-cyan/10 rounded transition-colors"
          title="Regenerate derivatives"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

function GapOpportunityRow({ gap, onCreateBrief, onViewDetails }: GapOpportunityRowProps) {
  const scoreColor =
    gap.seoOpportunityScore >= 70
      ? 'text-semantic-success bg-semantic-success/10'
      : gap.seoOpportunityScore >= 40
      ? 'text-semantic-warning bg-semantic-warning/10'
      : 'text-white/50 bg-white/10';

  return (
    <div className="flex items-center justify-between p-3 bg-slate-2 border border-border-subtle rounded-lg group hover:border-brand-iris/40 transition-colors">
      <div className="flex-1 min-w-0" onClick={onViewDetails} role="button" tabIndex={0}>
        <h4 className="text-sm font-medium text-white">{gap.keyword}</h4>
        <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
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
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${scoreColor}`}>
          {gap.seoOpportunityScore}
        </span>
        <button
          onClick={onCreateBrief}
          className="px-2 py-1 text-[10px] font-medium text-brand-iris bg-brand-iris/10 hover:bg-brand-iris/20 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          Create Brief
        </button>
      </div>
    </div>
  );
}

// ============================================
// RECOMMENDATION CARD
// ============================================

interface RecommendationAction {
  label: string;
  primary: boolean;
  onClick: () => void;
}

interface RecommendationCardProps {
  type: 'opportunity' | 'improvement' | 'cross-pillar';
  title: string;
  description: string;
  actions: RecommendationAction[];
}

function RecommendationCard({ type, title, description, actions }: RecommendationCardProps) {
  const typeConfig = {
    opportunity: {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      ),
      color: 'brand-cyan',
      bg: 'bg-brand-cyan/10',
      border: 'border-brand-cyan/20',
    },
    improvement: {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      ),
      color: 'brand-iris',
      bg: 'bg-brand-iris/10',
      border: 'border-brand-iris/20',
    },
    'cross-pillar': {
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
        </svg>
      ),
      color: 'brand-magenta',
      bg: 'bg-brand-magenta/10',
      border: 'border-brand-magenta/20',
    },
  };

  const config = typeConfig[type];

  return (
    <div className={`p-3 rounded-lg ${config.bg} border ${config.border}`}>
      <div className="flex items-start gap-3">
        <span className={`text-${config.color} mt-0.5`}>{config.icon}</span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
          <p className="text-xs text-white/55 mb-2">{description}</p>
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  action.primary
                    ? `text-${config.color} bg-${config.color}/20 hover:bg-${config.color}/30`
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
