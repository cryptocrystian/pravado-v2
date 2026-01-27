'use client';

/**
 * Content Overview View v2 - Execution-First Cockpit
 *
 * Phase 5B/5C redesign: Action-first dashboard for Content pillar.
 *
 * LAYOUT (3 REGIONS):
 * 1) Health Strip - Compact metrics row (Authority Score, CiteMind Status, AI Readiness)
 * 2) Today's Work Action Stack - Primary region with 5-8 prioritized actions
 * 3) Secondary Row - Pipeline counts, Upcoming deadlines, Cross-Pillar Impact
 *
 * CTA CLUSTER:
 * - New Brief (primary)
 * - Import Content
 * - Fix Issues (if CiteMind issues exist)
 * - Generate Draft
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import type {
  AuthoritySignals,
  ContentClusterDTO,
  ContentGap,
  ContentBrief,
  ContentAsset,
  AutomationMode,
} from '../types';
import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';

// ============================================
// TYPES
// ============================================

interface ContentAction {
  id: string;
  title: string;
  summary: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'opportunity' | 'issue' | 'scheduled' | 'sage_proposal' | 'execution';
  relatedEntityId?: string;
  relatedEntityType?: 'gap' | 'brief' | 'asset' | 'cluster';
  cta: {
    label: string;
    action: () => void;
  };
  mode: AutomationMode;
  createdAt: string;
  /** For execution actions: the orchestration action ID */
  orchestrateActionId?: string;
}

interface ContentOverviewViewProps {
  /** Aggregate authority signals */
  signals: AuthoritySignals | null;
  /** Topic clusters (themes) */
  clusters: ContentClusterDTO[];
  /** Content gaps/opportunities */
  gaps: ContentGap[];
  /** Recent briefs */
  briefs: ContentBrief[];
  /** Content assets (for pipeline counts) */
  assets?: ContentAsset[];
  /** Current automation mode */
  mode?: AutomationMode;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Action handlers */
  onViewLibrary?: () => void;
  onViewGap?: (keyword: string) => void;
  onViewBrief?: (briefId: string) => void;
  onGenerateBrief?: () => void;
  onImportContent?: () => void;
  onFixIssues?: () => void;
  onGenerateDraft?: () => void;
  onViewCluster?: (clusterId: string) => void;
  onViewCalendar?: () => void;
  /** Launch orchestration editor for a specific action (Phase 6A.7) */
  onLaunchOrchestrate?: (actionId: string) => void;
}

// ============================================
// HEALTH STRIP
// ============================================

function HealthStrip({
  signals,
  citeMindIssueCount,
}: {
  signals: AuthoritySignals | null;
  citeMindIssueCount: number;
}) {
  const metrics = [
    {
      label: 'Authority Score',
      value: signals?.authorityContributionScore ?? 0,
      suffix: '',
      color: getMetricColor(signals?.authorityContributionScore ?? 0),
      isPrimary: true,
    },
    {
      label: 'Citation Ready',
      value: signals?.citationEligibilityScore ?? 0,
      suffix: '%',
      color: getMetricColor(signals?.citationEligibilityScore ?? 0),
    },
    {
      label: 'AI Readiness',
      value: signals?.aiIngestionLikelihood ?? 0,
      suffix: '%',
      color: getMetricColor(signals?.aiIngestionLikelihood ?? 0),
    },
    {
      label: 'Cross-Pillar',
      value: signals?.crossPillarImpact ?? 0,
      suffix: '',
      color: getMetricColor(signals?.crossPillarImpact ?? 0),
    },
    {
      label: 'CiteMind Issues',
      value: citeMindIssueCount,
      suffix: '',
      color: citeMindIssueCount > 0 ? 'text-semantic-warning' : 'text-semantic-success',
      isAlert: citeMindIssueCount > 0,
    },
  ];

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-2 border border-border-subtle rounded-lg overflow-x-auto">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`flex items-center gap-2 ${index !== 0 ? 'pl-4 border-l border-slate-4' : ''} ${
            metric.isPrimary ? 'min-w-[120px]' : 'min-w-[100px]'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-wider whitespace-nowrap">
              {metric.label}
            </span>
            <span className={`text-lg font-bold ${metric.color} ${metric.isAlert ? 'animate-pulse' : ''}`}>
              {metric.value}{metric.suffix}
            </span>
          </div>
          {metric.isPrimary && (
            <div className="w-8 h-8 rounded-full bg-brand-iris/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getMetricColor(value: number): string {
  if (value >= 80) return 'text-semantic-success';
  if (value >= 60) return 'text-brand-cyan';
  if (value >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

// ============================================
// CTA CLUSTER
// ============================================

function CTACluster({
  hasIssues,
  onGenerateBrief,
  onImportContent,
  onFixIssues,
  onGenerateDraft,
}: {
  hasIssues: boolean;
  onGenerateBrief?: () => void;
  onImportContent?: () => void;
  onFixIssues?: () => void;
  onGenerateDraft?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Primary CTA */}
      <button
        onClick={onGenerateBrief}
        className="px-4 py-2 text-sm font-semibold text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors shadow-[0_0_16px_rgba(168,85,247,0.25)]"
      >
        + New Brief
      </button>

      {/* Secondary CTAs */}
      <button
        onClick={onImportContent}
        className="px-3 py-2 text-sm font-medium text-white/70 bg-slate-2 border border-border-subtle hover:border-brand-iris/40 rounded-lg transition-colors"
      >
        Import Content
      </button>

      {hasIssues && (
        <button
          onClick={onFixIssues}
          className="px-3 py-2 text-sm font-medium text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/30 hover:bg-semantic-warning/15 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning animate-pulse" />
          Fix Issues
        </button>
      )}

      <button
        onClick={onGenerateDraft}
        className="px-3 py-2 text-sm font-medium text-white/70 bg-slate-2 border border-border-subtle hover:border-brand-iris/40 rounded-lg transition-colors"
      >
        Generate Draft
      </button>
    </div>
  );
}

// ============================================
// TODAY'S WORK ACTION STACK
// ============================================

function TodaysWorkActionStack({
  actions,
  mode,
  onLaunchOrchestrate,
}: {
  actions: ContentAction[];
  mode: AutomationMode;
  onLaunchOrchestrate?: (actionId: string) => void;
}) {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedActions = [...actions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const displayActions = sortedActions.slice(0, 8);

  if (displayActions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand-iris/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-white/60">No actions needed right now</p>
          <p className="text-xs text-white/40 mt-1">Your content is looking good!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Today&apos;s Work</h3>
          <span className="px-2 py-0.5 text-[10px] font-medium text-brand-iris bg-brand-iris/10 border border-brand-iris/20 rounded-full">
            {displayActions.length} actions
          </span>
        </div>
        <ModeIndicator mode={mode} />
      </div>

      <div className="space-y-2">
        {displayActions.map((action, index) => (
          <ContentActionCard
            key={action.id}
            action={action}
            isFirst={index === 0}
            onLaunchOrchestrate={onLaunchOrchestrate}
          />
        ))}
      </div>

      {actions.length > 8 && (
        <button className="w-full py-2 text-xs text-white/50 hover:text-white/70 transition-colors">
          View all {actions.length} actions →
        </button>
      )}
    </div>
  );
}

function ModeIndicator({ mode }: { mode: AutomationMode }) {
  const modeConfig = {
    manual: { label: 'Manual', color: 'text-white/60 bg-white/10' },
    copilot: { label: 'Copilot', color: 'text-brand-cyan bg-brand-cyan/15' },
    autopilot: { label: 'Autopilot', color: 'text-semantic-success bg-semantic-success/15' },
  };

  const config = modeConfig[mode];

  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium uppercase rounded ${config.color}`}>
      {config.label}
    </span>
  );
}

function ContentActionCard({
  action,
  isFirst,
  onLaunchOrchestrate,
}: {
  action: ContentAction;
  isFirst: boolean;
  onLaunchOrchestrate?: (actionId: string) => void;
}) {
  const priorityStyles = {
    critical: {
      dot: 'bg-semantic-danger animate-pulse',
      border: isFirst ? 'border-l-semantic-danger' : 'border-l-semantic-danger/50',
    },
    high: {
      dot: 'bg-semantic-warning',
      border: isFirst ? 'border-l-semantic-warning' : 'border-l-semantic-warning/50',
    },
    medium: {
      dot: 'bg-brand-cyan',
      border: isFirst ? 'border-l-brand-cyan' : 'border-l-brand-cyan/50',
    },
    low: {
      dot: 'bg-white/40',
      border: isFirst ? 'border-l-white/40' : 'border-l-white/20',
    },
  };

  const typeLabels = {
    opportunity: 'Opportunity',
    issue: 'Issue',
    scheduled: 'Scheduled',
    sage_proposal: 'SAGE',
    execution: 'Execute',
  };

  const style = priorityStyles[action.priority];

  // Handle card click for orchestration (Phase 6A.7)
  const handleCardClick = () => {
    if (action.orchestrateActionId && onLaunchOrchestrate) {
      onLaunchOrchestrate(action.orchestrateActionId);
    }
  };

  const isOrchestrationReady = !!action.orchestrateActionId;

  return (
    <div
      onClick={handleCardClick}
      className={`
        p-3 bg-slate-2 border border-border-subtle rounded-lg
        border-l-[3px] ${style.border}
        hover:border-brand-iris/40 hover:bg-[#111116]
        transition-all cursor-pointer
        ${isFirst ? 'ring-1 ring-brand-iris/20' : ''}
        ${isOrchestrationReady ? 'group' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className="text-[10px] font-medium text-white/50 uppercase">
              {typeLabels[action.type]}
            </span>
            {action.mode === 'autopilot' && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium text-semantic-success bg-semantic-success/15 rounded">
                AUTO
              </span>
            )}
            {isOrchestrationReady && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium text-brand-iris bg-brand-iris/15 rounded flex items-center gap-1">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Ready
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium text-white line-clamp-1 mb-0.5">
            {action.title}
          </h4>

          {/* Summary */}
          <p className="text-xs text-white/50 line-clamp-1">
            {action.summary}
          </p>
        </div>

        {/* CTA - Shows "Execute" for orchestration-ready actions */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isOrchestrationReady && onLaunchOrchestrate) {
              onLaunchOrchestrate(action.orchestrateActionId!);
            } else {
              action.cta.action();
            }
          }}
          className={`
            px-3 py-1.5 text-xs font-semibold rounded shrink-0
            transition-all
            ${isFirst
              ? 'bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
              : 'bg-brand-iris/10 text-brand-iris border border-brand-iris/30 hover:bg-brand-iris/20'
            }
            ${isOrchestrationReady ? 'group-hover:shadow-[0_0_16px_rgba(168,85,247,0.30)]' : ''}
          `}
        >
          {isOrchestrationReady ? 'Execute →' : action.cta.label}
        </button>
      </div>
    </div>
  );
}

// ============================================
// SECONDARY ROW
// ============================================

function SecondaryRow({
  pipelineCounts,
  upcomingDeadlines,
  crossPillarImpact,
  onViewCalendar,
  onViewLibrary,
}: {
  pipelineCounts: { draft: number; review: number; approved: number; published: number };
  upcomingDeadlines: { count: number; nextDate?: string };
  crossPillarImpact: { prHooks: number; seoHooks: number };
  onViewCalendar?: () => void;
  onViewLibrary?: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Pipeline Status */}
      <div className="p-3 bg-slate-2 border border-border-subtle rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white/70">Pipeline</h4>
          <button
            onClick={onViewLibrary}
            className="text-[10px] text-brand-iris hover:underline"
          >
            View →
          </button>
        </div>
        <div className="flex items-center gap-3">
          <PipelineStat label="Draft" count={pipelineCounts.draft} color="text-white/50" />
          <PipelineStat label="Review" count={pipelineCounts.review} color="text-semantic-warning" />
          <PipelineStat label="Ready" count={pipelineCounts.approved} color="text-semantic-success" />
          <PipelineStat label="Live" count={pipelineCounts.published} color="text-brand-cyan" />
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="p-3 bg-slate-2 border border-border-subtle rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white/70">Upcoming</h4>
          <button
            onClick={onViewCalendar}
            className="text-[10px] text-brand-iris hover:underline"
          >
            Calendar →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{upcomingDeadlines.count}</span>
          <span className="text-xs text-white/40">deadlines this week</span>
        </div>
        {upcomingDeadlines.nextDate && (
          <p className="text-[10px] text-white/50 mt-1">
            Next: {upcomingDeadlines.nextDate}
          </p>
        )}
      </div>

      {/* Cross-Pillar Impact */}
      <div className="p-3 bg-slate-2 border border-border-subtle rounded-lg">
        <h4 className="text-xs font-semibold text-white/70 mb-2">Cross-Pillar</h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand-magenta" />
            <span className="text-xs text-white/60">{crossPillarImpact.prHooks} PR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand-cyan" />
            <span className="text-xs text-white/60">{crossPillarImpact.seoHooks} SEO</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStat({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-bold ${color}`}>{count}</span>
      <span className="text-[9px] text-white/40 uppercase">{label}</span>
    </div>
  );
}

// ============================================
// QUICK OPPORTUNITIES (Themes + Gaps with CTAs)
// ============================================

function QuickOpportunities({
  clusters,
  gaps,
  onViewCluster,
  onViewGap,
  onGenerateBrief,
}: {
  clusters: ContentClusterDTO[];
  gaps: ContentGap[];
  onViewCluster?: (clusterId: string) => void;
  onViewGap?: (keyword: string) => void;
  onGenerateBrief?: () => void;
}) {
  const topGaps = gaps.slice(0, 3);
  const topClusters = clusters.slice(0, 2);

  if (topGaps.length === 0 && topClusters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Quick Opportunities</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* High-Score Gaps */}
        {topGaps.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Content Gaps</span>
            {topGaps.map((gap, index) => (
              <GapOpportunityCard
                key={index}
                gap={gap}
                onViewGap={() => onViewGap?.(gap.keyword)}
                onCreateBrief={onGenerateBrief}
              />
            ))}
          </div>
        )}

        {/* Active Themes */}
        {topClusters.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Active Themes</span>
            {topClusters.map((cluster) => (
              <ThemeOpportunityCard
                key={cluster.cluster.id}
                cluster={cluster}
                onViewCluster={() => onViewCluster?.(cluster.cluster.id)}
                onAddContent={onGenerateBrief}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GapOpportunityCard({
  gap,
  onViewGap,
  onCreateBrief,
}: {
  gap: ContentGap;
  onViewGap?: () => void;
  onCreateBrief?: () => void;
}) {
  const scoreColor =
    gap.seoOpportunityScore >= 70
      ? 'text-semantic-success bg-semantic-success/10'
      : gap.seoOpportunityScore >= 40
      ? 'text-semantic-warning bg-semantic-warning/10'
      : 'text-white/50 bg-white/10';

  return (
    <div
      onClick={onViewGap}
      className="p-2.5 bg-slate-2 border border-border-subtle rounded-lg hover:border-brand-iris/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h5 className="text-xs font-medium text-white line-clamp-1">{gap.keyword}</h5>
        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${scoreColor}`}>
          {gap.seoOpportunityScore}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40">
          {gap.intent && <span className="capitalize">{gap.intent}</span>}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateBrief?.();
          }}
          className="px-2 py-0.5 text-[10px] font-medium text-brand-iris hover:bg-brand-iris/10 rounded transition-colors"
        >
          Create Brief →
        </button>
      </div>
    </div>
  );
}

function ThemeOpportunityCard({
  cluster,
  onViewCluster,
  onAddContent,
}: {
  cluster: ContentClusterDTO;
  onViewCluster?: () => void;
  onAddContent?: () => void;
}) {
  return (
    <div
      onClick={onViewCluster}
      className="p-2.5 bg-slate-2 border border-border-subtle rounded-lg hover:border-brand-iris/40 transition-colors cursor-pointer"
    >
      <h5 className="text-xs font-medium text-white mb-1 line-clamp-1">{cluster.cluster.name}</h5>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40">
          {cluster.topics.length} topics · {cluster.representativeContent.length} assets
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddContent?.();
          }}
          className="px-2 py-0.5 text-[10px] font-medium text-brand-iris hover:bg-brand-iris/10 rounded transition-colors"
        >
          Add Content →
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentOverviewView({
  signals,
  clusters,
  gaps,
  briefs,
  assets = [],
  mode = 'copilot',
  isLoading,
  error,
  onViewLibrary,
  onViewGap,
  onViewBrief,
  onGenerateBrief,
  onImportContent,
  onFixIssues,
  onGenerateDraft,
  onViewCluster,
  onViewCalendar,
  onLaunchOrchestrate,
}: ContentOverviewViewProps) {
  // Loading state
  if (isLoading) {
    return <ContentLoadingSkeleton type="dashboard" />;
  }

  // Error state
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

  // Empty state
  const hasData = signals || clusters.length > 0 || gaps.length > 0 || briefs.length > 0;
  if (!hasData) {
    return (
      <ContentEmptyState
        view="overview"
        onAction={onViewLibrary}
        actionLabel="Create Content"
      />
    );
  }

  // Calculate CiteMind issues
  const citeMindIssueCount = assets.filter(
    (a) => a.citeMindStatus === 'warning' || a.citeMindStatus === 'blocked'
  ).length;

  // Calculate pipeline counts
  const pipelineCounts = {
    draft: assets.filter((a) => a.status === 'draft').length,
    review: assets.filter((a) => a.status === 'review').length,
    approved: assets.filter((a) => a.status === 'approved').length,
    published: assets.filter((a) => a.status === 'published').length,
  };

  // Generate actions from gaps, briefs, and SAGE proposals
  const actions: ContentAction[] = [
    // Execution-ready briefs (Phase 6A.7: Entry point to Orchestration Editor)
    ...briefs
      .filter((b) => b.status === 'approved' || b.status === 'in_progress')
      .slice(0, 2)
      .map((brief, i): ContentAction => ({
        id: `exec-${brief.id}`,
        title: `Execute Brief: ${brief.title}`,
        summary: `Ready to build authority · Target: ${brief.targetKeyword || 'Multiple keywords'}`,
        priority: 'high',
        type: 'execution',
        relatedEntityId: brief.id,
        relatedEntityType: 'brief',
        cta: {
          label: 'Execute',
          action: () => onViewBrief?.(brief.id),
        },
        mode: mode,
        createdAt: brief.createdAt,
        // Map brief ID to orchestration action ID (using mock IDs for now)
        orchestrateActionId: `action-${(i % 3) + 1}`,
      })),
    // High-opportunity gaps
    ...gaps
      .filter((g) => g.seoOpportunityScore >= 60)
      .slice(0, 3)
      .map((gap, i): ContentAction => ({
        id: `gap-${i}`,
        title: `Create content for "${gap.keyword}"`,
        summary: `${gap.seoOpportunityScore} opportunity score · ${gap.existingContentCount} existing pieces`,
        priority: gap.seoOpportunityScore >= 80 ? 'high' : 'medium',
        type: 'opportunity',
        relatedEntityId: gap.keyword,
        relatedEntityType: 'gap',
        cta: {
          label: 'Create Brief',
          action: () => onGenerateBrief?.(),
        },
        mode: mode,
        createdAt: new Date().toISOString(),
      })),
    // Briefs needing attention (draft status)
    ...briefs
      .filter((b) => b.status === 'draft')
      .slice(0, 2)
      .map((brief): ContentAction => ({
        id: `brief-${brief.id}`,
        title: brief.title,
        summary: `Status: ${brief.status} · Target: ${brief.targetKeyword || 'Not set'}`,
        priority: 'medium',
        type: 'scheduled',
        relatedEntityId: brief.id,
        relatedEntityType: 'brief',
        cta: {
          label: 'Review',
          action: () => onViewBrief?.(brief.id),
        },
        mode: mode,
        createdAt: brief.createdAt,
      })),
    // CiteMind issues
    ...(citeMindIssueCount > 0
      ? [
          {
            id: 'citemind-issues',
            title: `${citeMindIssueCount} content pieces need attention`,
            summary: 'CiteMind detected issues that may affect citation eligibility',
            priority: 'high' as const,
            type: 'issue' as const,
            cta: {
              label: 'Fix Issues',
              action: () => onFixIssues?.(),
            },
            mode: mode,
            createdAt: new Date().toISOString(),
          },
        ]
      : []),
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Top Row: Health Strip + CTA Cluster */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <HealthStrip signals={signals} citeMindIssueCount={citeMindIssueCount} />
        </div>
        <CTACluster
          hasIssues={citeMindIssueCount > 0}
          onGenerateBrief={onGenerateBrief}
          onImportContent={onImportContent}
          onFixIssues={onFixIssues}
          onGenerateDraft={onGenerateDraft}
        />
      </div>

      {/* Primary Region: Today's Work Action Stack */}
      <section className="min-h-[280px]">
        <TodaysWorkActionStack
          actions={actions}
          mode={mode}
          onLaunchOrchestrate={onLaunchOrchestrate}
        />
      </section>

      {/* Secondary Row: Pipeline, Upcoming, Cross-Pillar */}
      <SecondaryRow
        pipelineCounts={pipelineCounts}
        upcomingDeadlines={{
          count: briefs.filter((b) => b.deadline).length,
          nextDate: briefs.find((b) => b.deadline)?.deadline?.split('T')[0],
        }}
        crossPillarImpact={{
          prHooks: 0, // TODO: Calculate from actual data
          seoHooks: 0,
        }}
        onViewCalendar={onViewCalendar}
        onViewLibrary={onViewLibrary}
      />

      {/* Quick Opportunities */}
      <QuickOpportunities
        clusters={clusters}
        gaps={gaps}
        onViewCluster={onViewCluster}
        onViewGap={onViewGap}
        onGenerateBrief={onGenerateBrief}
      />
    </div>
  );
}
