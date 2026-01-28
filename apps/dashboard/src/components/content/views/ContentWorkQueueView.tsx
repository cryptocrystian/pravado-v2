'use client';

/**
 * Content Work Queue View - Execution-First Landing Surface
 *
 * Phase 7: Content Execution Gravity Model implementation.
 *
 * LAYOUT (Execution-First Hierarchy):
 * 1) Next Best Action - Single dominant action card (no scroll required)
 * 2) Up Next - Max 3 secondary actions
 * 3) Secondary Widgets - Pipeline, deadlines, cross-pillar (non-competing)
 *
 * EXECUTION GRAVITY MODEL:
 * - ONE dominant "Next Best Action" (visually primary)
 * - Priority: Execution-ready > CiteMind issues > Authority gaps > Scheduled > Optional
 * - Mode-aware: Autopilot shows only exception/manual-approval items
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/UX_CONTINUITY_CANON.md (Entry Point Invariant)
 * @see /docs/canon/AUTOMATION_MODES_UX.md
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

interface ContentWorkQueueViewProps {
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
  /** Current automation mode - determines filtering (Autopilot = exception queue) */
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
  /** Launch orchestration editor for a specific action */
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
// EXECUTION GRAVITY MODEL - PRIORITY SCORING
// ============================================

/**
 * Action priority scoring for the Content Execution Gravity Model.
 *
 * PRIORITY ORDER (deterministic, highest to lowest):
 * 1. Execution-ready briefs (Execute →) - score: 100
 * 2. CiteMind/Ingestibility issues (Fix Issue →) - score: 90
 * 3. Authority gaps without asset (Create Brief →) - score: 70
 * 4. Scheduled content near deadline (Review →) - score: 60
 * 5. Optional enhancements (derivatives refresh, etc.) - score: 30
 *
 * Within each tier, use priority level as tiebreaker:
 * critical: +20, high: +15, medium: +10, low: +5
 */
function computeActionScore(action: ContentAction): number {
  // Base score by type (explicit priority order)
  const typeScores: Record<ContentAction['type'], number> = {
    execution: 100,   // Execution-ready briefs
    issue: 90,        // CiteMind/Ingestibility issues
    opportunity: 70,  // Authority gaps
    scheduled: 60,    // Near-deadline content
    sage_proposal: 30, // Optional enhancements
  };

  // Priority bonus (tiebreaker within type)
  const priorityBonus: Record<ContentAction['priority'], number> = {
    critical: 20,
    high: 15,
    medium: 10,
    low: 5,
  };

  return (typeScores[action.type] || 50) + (priorityBonus[action.priority] || 0);
}

/**
 * Select the Next Best Action using explicit priority scoring.
 * Returns sorted actions with the #1 action at index 0.
 */
function selectPrioritizedActions(actions: ContentAction[]): ContentAction[] {
  return [...actions].sort((a, b) => computeActionScore(b) - computeActionScore(a));
}

// ============================================
// NEXT BEST ACTION + UP NEXT LAYOUT
// ============================================

/**
 * Filter actions based on automation mode.
 *
 * MODE-AWARE FILTERING (AUTOMATE governance):
 * - Manual/Copilot: Full priority model (all actions)
 * - Autopilot: Exception queue only (issues + critical execution requiring manual approval)
 *
 * @see /docs/canon/AUTOMATION_MODES_UX.md
 */
function filterActionsByMode(actions: ContentAction[], mode: AutomationMode): ContentAction[] {
  if (mode === 'autopilot') {
    // Autopilot = Exception Queue: only manual-approval items
    // - Issues (CiteMind, ingestibility) always require attention
    // - Critical execution items that can't be auto-handled
    return actions.filter(
      (action) =>
        action.type === 'issue' ||
        (action.type === 'execution' && action.priority === 'critical') ||
        action.priority === 'critical'
    );
  }
  // Manual/Copilot: full priority model
  return actions;
}

function ExecutionGravityPane({
  actions,
  mode,
  onLaunchOrchestrate,
  onViewAll,
}: {
  actions: ContentAction[];
  mode: AutomationMode;
  onLaunchOrchestrate?: (actionId: string) => void;
  onViewAll?: () => void;
}) {
  // Apply mode-aware filtering THEN priority scoring
  const modeFilteredActions = filterActionsByMode(actions, mode);
  const prioritizedActions = selectPrioritizedActions(modeFilteredActions);
  const nextBestAction = prioritizedActions[0] || null;
  const upNextActions = prioritizedActions.slice(1, 4); // Max 3 "Up Next"
  const remainingCount = prioritizedActions.length - 4;

  // Track how many actions were filtered out in Autopilot mode
  const filteredOutCount = mode === 'autopilot' ? actions.length - modeFilteredActions.length : 0;

  // Empty state - mode-aware messaging
  if (!nextBestAction) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        {mode === 'autopilot' ? (
          <>
            <h3 className="text-lg font-semibold text-white mb-1">Autopilot Active</h3>
            <p className="text-sm text-white/50 max-w-sm">
              No exceptions requiring manual attention.
              {filteredOutCount > 0 && (
                <span className="block mt-1 text-brand-cyan">
                  {filteredOutCount} routine {filteredOutCount === 1 ? 'action' : 'actions'} being handled automatically.
                </span>
              )}
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-1">All Clear</h3>
            <p className="text-sm text-white/50 max-w-sm">
              No pending actions. Your content authority is building steadily.
            </p>
          </>
        )}
      </div>
    );
  }

  // Header text varies by mode
  const headerText = mode === 'autopilot' ? 'Exception Queue' : 'Next Best Action';
  const headerSubtext = mode === 'autopilot' && filteredOutCount > 0
    ? `${filteredOutCount} auto-handled`
    : undefined;

  return (
    <div className="space-y-4">
      {/* Header with mode indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">{headerText}</h3>
          <ModeIndicator mode={mode} size="default" />
          {headerSubtext && (
            <span className="text-[10px] text-brand-cyan/70">
              ({headerSubtext})
            </span>
          )}
        </div>
        {prioritizedActions.length > 1 && (
          <span className="text-[10px] text-white/40">
            {prioritizedActions.length} {mode === 'autopilot' ? 'exception' : 'total'}{prioritizedActions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* DOMINANT: Next Best Action Card */}
      <NextBestActionCard
        action={nextBestAction}
        mode={mode}
        onLaunchOrchestrate={onLaunchOrchestrate}
      />

      {/* UP NEXT: Secondary actions (max 3, compact) */}
      {upNextActions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {mode === 'autopilot' ? 'More Exceptions' : 'Up Next'}
            </h4>
            {remainingCount > 0 && (
              <button
                onClick={onViewAll}
                className="text-[10px] text-brand-iris hover:underline transition-colors"
              >
                +{remainingCount} more →
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {upNextActions.map((action) => (
              <UpNextActionCard
                key={action.id}
                action={action}
                onLaunchOrchestrate={onLaunchOrchestrate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Autopilot mode explainer - subtle bottom hint */}
      {mode === 'autopilot' && prioritizedActions.length > 0 && (
        <p className="text-[10px] text-white/30 text-center pt-2 border-t border-border-subtle">
          Showing items that require manual review. Routine actions are handled automatically.
        </p>
      )}
    </div>
  );
}

/**
 * ModeIndicator - Shows current automation mode with visual differentiation.
 * DS v3.1 compliant with subtle iconography.
 */
function ModeIndicator({ mode, size = 'default' }: { mode: AutomationMode; size?: 'default' | 'small' }) {
  const modeConfig = {
    manual: {
      label: 'Manual',
      color: 'text-white/60 bg-white/5 border-white/10',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    copilot: {
      label: 'Copilot',
      color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    autopilot: {
      label: 'Autopilot',
      color: 'text-semantic-success bg-semantic-success/10 border-semantic-success/20',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  };

  const config = modeConfig[mode];
  const sizeClass = size === 'small' ? 'px-1.5 py-0.5 text-[9px] gap-1' : 'px-2 py-1 text-[10px] gap-1.5';

  return (
    <span className={`${sizeClass} font-medium uppercase rounded border flex items-center ${config.color} transition-colors duration-150`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ============================================
// NEXT BEST ACTION CARD (DOMINANT)
// ============================================

/**
 * NextBestActionCard - The singular dominant action card.
 * Visually primary, no scroll required in default viewport.
 * DS v3.1 motion: cubic-bezier(0.16, 1, 0.3, 1)
 */
function NextBestActionCard({
  action,
  mode,
  onLaunchOrchestrate,
}: {
  action: ContentAction;
  mode: AutomationMode;
  onLaunchOrchestrate?: (actionId: string) => void;
}) {
  const priorityStyles = {
    critical: {
      border: 'border-semantic-danger',
      glow: 'shadow-[0_0_24px_rgba(239,68,68,0.15)]',
      badge: 'bg-semantic-danger text-white',
    },
    high: {
      border: 'border-semantic-warning',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.12)]',
      badge: 'bg-semantic-warning text-black',
    },
    medium: {
      border: 'border-brand-iris',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      badge: 'bg-brand-iris/20 text-brand-iris',
    },
    low: {
      border: 'border-border-subtle',
      glow: '',
      badge: 'bg-white/10 text-white/60',
    },
  };

  const typeConfig = {
    execution: { label: 'Execute Brief', ctaLabel: 'Execute →', ctaClass: 'bg-brand-iris text-white shadow-[0_0_16px_rgba(168,85,247,0.30)]' },
    issue: { label: 'Fix Issue', ctaLabel: 'Fix Issue →', ctaClass: 'bg-semantic-warning text-black' },
    opportunity: { label: 'Opportunity', ctaLabel: 'Create Brief →', ctaClass: 'bg-brand-iris text-white shadow-[0_0_16px_rgba(168,85,247,0.30)]' },
    scheduled: { label: 'Deadline', ctaLabel: 'Review →', ctaClass: 'bg-brand-cyan text-black' },
    sage_proposal: { label: 'SAGE Proposal', ctaLabel: 'View →', ctaClass: 'bg-white/10 text-white' },
  };

  const style = priorityStyles[action.priority];
  const typeConf = typeConfig[action.type];
  const isOrchestrationReady = !!action.orchestrateActionId;

  const handleClick = () => {
    if (isOrchestrationReady && onLaunchOrchestrate) {
      onLaunchOrchestrate(action.orchestrateActionId!);
    } else {
      action.cta.action();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-5 bg-slate-2 border-2 ${style.border} ${style.glow} rounded-xl
        hover:scale-[1.01] hover:border-brand-iris
        transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer
        group
      `}
    >
      {/* Top row: Type badge + priority + mode */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${style.badge}`}>
            {typeConf.label}
          </span>
          {action.priority === 'critical' && (
            <span className="w-2 h-2 rounded-full bg-semantic-danger animate-pulse" />
          )}
        </div>
        <ModeIndicator mode={mode} size="small" />
      </div>

      {/* Title - prominent */}
      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-iris transition-colors">
        {action.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-white/60 mb-4 line-clamp-2">
        {action.summary}
      </p>

      {/* Bottom row: CTA button (primary) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/40">
          {isOrchestrationReady && (
            <span className="flex items-center gap-1 text-brand-iris">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ready to execute
            </span>
          )}
        </div>
        <button
          className={`
            px-4 py-2 text-sm font-semibold rounded-lg
            transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
            hover:scale-105 active:scale-95
            ${typeConf.ctaClass}
          `}
        >
          {isOrchestrationReady ? 'Execute →' : typeConf.ctaLabel}
        </button>
      </div>
    </div>
  );
}

// ============================================
// UP NEXT ACTION CARD (COMPACT, SECONDARY)
// ============================================

function UpNextActionCard({
  action,
  onLaunchOrchestrate,
}: {
  action: ContentAction;
  onLaunchOrchestrate?: (actionId: string) => void;
}) {
  const priorityDot = {
    critical: 'bg-semantic-danger animate-pulse',
    high: 'bg-semantic-warning',
    medium: 'bg-brand-cyan',
    low: 'bg-white/30',
  };

  const typeLabels = {
    execution: 'Execute',
    issue: 'Issue',
    opportunity: 'Opportunity',
    scheduled: 'Deadline',
    sage_proposal: 'SAGE',
  };

  const isOrchestrationReady = !!action.orchestrateActionId;

  const handleClick = () => {
    if (isOrchestrationReady && onLaunchOrchestrate) {
      onLaunchOrchestrate(action.orchestrateActionId!);
    } else {
      action.cta.action();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-2.5 bg-slate-2/50 border border-border-subtle rounded-lg
        hover:bg-slate-2 hover:border-brand-iris/30
        transition-all duration-150 cursor-pointer
        flex items-center justify-between gap-3
      `}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[action.priority]}`} />
        <span className="text-[10px] font-medium text-white/40 uppercase shrink-0">
          {typeLabels[action.type]}
        </span>
        <span className="text-xs text-white truncate">
          {action.title}
        </span>
      </div>
      <button className="text-[10px] font-medium text-brand-iris hover:underline shrink-0">
        {action.cta.label}
      </button>
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

export function ContentWorkQueueView({
  signals,
  clusters,
  gaps,
  briefs,
  assets = [],
  mode = 'manual', // Default to manual (most restrictive) per AUTOMATE governance
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
}: ContentWorkQueueViewProps) {
  // Loading state
  if (isLoading) {
    return <ContentLoadingSkeleton type="dashboard" />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">Failed to load work queue</h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state - execution-oriented messaging
  const hasData = signals || clusters.length > 0 || gaps.length > 0 || briefs.length > 0;
  if (!hasData) {
    return (
      <ContentEmptyState
        view="work-queue"
        onAction={onGenerateBrief}
        actionLabel="Create Your First Brief"
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

      {/* Primary Region: Execution Gravity (Next Best Action + Up Next) */}
      <section className="min-h-[280px]">
        <ExecutionGravityPane
          actions={actions}
          mode={mode}
          onLaunchOrchestrate={onLaunchOrchestrate}
          onViewAll={onViewLibrary}
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
