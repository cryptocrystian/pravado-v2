'use client';

/**
 * Content Overview View
 *
 * Primary dashboard view for the Content pillar showing:
 * - Authority contribution summary (primary KPI)
 * - Active themes with asset counts
 * - AI ingestion readiness aggregate
 * - SAGE proposals for content actions
 * - Cross-pillar hooks
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import type {
  AuthoritySignals,
  ContentClusterDTO,
  ContentGap,
  ContentBrief,
} from '../types';
import { AuthorityDashboard } from '../components/AuthorityDashboard';
import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';

interface ContentOverviewViewProps {
  /** Aggregate authority signals */
  signals: AuthoritySignals | null;
  /** Topic clusters (themes) */
  clusters: ContentClusterDTO[];
  /** Content gaps/opportunities */
  gaps: ContentGap[];
  /** Recent briefs */
  briefs: ContentBrief[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Action handlers */
  onViewLibrary?: () => void;
  onViewGap?: (keyword: string) => void;
  onViewBrief?: (briefId: string) => void;
  onGenerateBrief?: () => void;
}

export function ContentOverviewView({
  signals,
  clusters,
  gaps,
  briefs,
  isLoading,
  error,
  onViewLibrary,
  onViewGap,
  onViewBrief,
  onGenerateBrief,
}: ContentOverviewViewProps) {
  if (isLoading) {
    return <ContentLoadingSkeleton type="dashboard" />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">Failed to load overview</h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const hasData = signals || clusters.length > 0 || gaps.length > 0;

  if (!hasData) {
    return (
      <ContentEmptyState
        view="overview"
        onAction={onViewLibrary}
        actionLabel="Create Content"
      />
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Authority Dashboard */}
      {signals && (
        <section>
          <AuthorityDashboard signals={signals} />
        </section>
      )}

      {/* Active Themes */}
      {clusters.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Active Themes</h3>
            <span className="text-[10px] text-white/40">{clusters.length} clusters</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {clusters.slice(0, 4).map((cluster) => (
              <ThemeCard key={cluster.cluster.id} cluster={cluster} />
            ))}
          </div>
          {clusters.length > 4 && (
            <button
              onClick={onViewLibrary}
              className="mt-2 text-xs text-brand-iris hover:underline"
            >
              View all {clusters.length} themes →
            </button>
          )}
        </section>
      )}

      {/* Content Opportunities */}
      {gaps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Content Opportunities</h3>
            <span className="text-[10px] text-white/40">{gaps.length} gaps</span>
          </div>
          <div className="space-y-2">
            {gaps.slice(0, 5).map((gap, index) => (
              <GapCard
                key={index}
                gap={gap}
                onClick={() => onViewGap?.(gap.keyword)}
              />
            ))}
          </div>
          {gaps.length > 5 && (
            <button
              onClick={onViewLibrary}
              className="mt-2 text-xs text-brand-iris hover:underline"
            >
              View all {gaps.length} opportunities →
            </button>
          )}
        </section>
      )}

      {/* Recent Briefs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Recent Briefs</h3>
          <button
            onClick={onGenerateBrief}
            className="text-xs text-brand-iris hover:underline"
          >
            + New Brief
          </button>
        </div>
        {briefs.length === 0 ? (
          <div className="p-4 bg-slate-2 border border-border-subtle rounded-lg text-center">
            <p className="text-xs text-white/40">No briefs created yet</p>
            <button
              onClick={onGenerateBrief}
              className="mt-2 text-xs text-brand-iris hover:underline"
            >
              Generate your first brief
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {briefs.slice(0, 3).map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                onClick={() => onViewBrief?.(brief.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cross-Pillar Hooks */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-3">Cross-Pillar Hooks</h3>
        <div className="grid grid-cols-2 gap-3">
          <CrossPillarHookCard
            pillar="pr"
            label="PR Integration"
            description="Content can feed pitch angles"
            count={0}
          />
          <CrossPillarHookCard
            pillar="seo"
            label="SEO Sync"
            description="AEO snippets ready"
            count={0}
          />
        </div>
      </section>
    </div>
  );
}

// ============================================
// THEME CARD
// ============================================

function ThemeCard({ cluster }: { cluster: ContentClusterDTO }) {
  return (
    <div className="p-3 bg-slate-2 border border-border-subtle rounded-lg hover:border-brand-iris/40 transition-colors cursor-pointer">
      <h4 className="text-sm font-medium text-white mb-1">{cluster.cluster.name}</h4>
      <div className="flex items-center gap-2 text-[10px] text-white/40">
        <span>{cluster.topics.length} topics</span>
        <span>·</span>
        <span>{cluster.representativeContent.length} assets</span>
      </div>
    </div>
  );
}

// ============================================
// GAP CARD
// ============================================

function GapCard({ gap, onClick }: { gap: ContentGap; onClick?: () => void }) {
  const scoreColor =
    gap.seoOpportunityScore >= 70
      ? 'text-semantic-success bg-semantic-success/10'
      : gap.seoOpportunityScore >= 40
      ? 'text-semantic-warning bg-semantic-warning/10'
      : 'text-white/50 bg-white/10';

  return (
    <div
      onClick={onClick}
      className="p-3 bg-slate-2 border border-border-subtle rounded-lg hover:border-brand-iris/40 transition-colors cursor-pointer flex items-center justify-between"
    >
      <div>
        <h4 className="text-sm font-medium text-white">{gap.keyword}</h4>
        <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
          {gap.intent && <span className="capitalize">{gap.intent}</span>}
          <span>·</span>
          <span>{gap.existingContentCount} existing</span>
        </div>
      </div>
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${scoreColor}`}>
        {gap.seoOpportunityScore}
      </span>
    </div>
  );
}

// ============================================
// BRIEF CARD
// ============================================

function BriefCard({ brief, onClick }: { brief: ContentBrief; onClick?: () => void }) {
  const statusColor =
    brief.status === 'approved'
      ? 'text-brand-cyan bg-brand-cyan/10'
      : brief.status === 'completed'
      ? 'text-semantic-success bg-semantic-success/10'
      : 'text-semantic-warning bg-semantic-warning/10';

  return (
    <div
      onClick={onClick}
      className="p-3 bg-slate-2 border border-border-subtle rounded-lg hover:border-brand-iris/40 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-white line-clamp-1">{brief.title}</h4>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${statusColor}`}>
          {brief.status}
        </span>
      </div>
      {brief.targetKeyword && (
        <p className="text-[10px] text-white/40 mt-1">
          Target: {brief.targetKeyword}
        </p>
      )}
    </div>
  );
}

// ============================================
// CROSS-PILLAR HOOK CARD
// ============================================

function CrossPillarHookCard({
  pillar,
  label,
  description,
  count,
}: {
  pillar: 'pr' | 'seo';
  label: string;
  description: string;
  count: number;
}) {
  const accentColor = pillar === 'pr' ? 'brand-magenta' : 'brand-cyan';

  return (
    <div className={`p-3 bg-${accentColor}/5 border border-${accentColor}/20 rounded-lg`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full bg-${accentColor}`} />
        <span className={`text-xs font-medium text-${accentColor}`}>{label}</span>
      </div>
      <p className="text-[10px] text-white/40">{description}</p>
      {count > 0 && (
        <p className="text-[10px] text-white/55 mt-1">{count} active hooks</p>
      )}
    </div>
  );
}
