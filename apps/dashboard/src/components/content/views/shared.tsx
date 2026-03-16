'use client';

/**
 * Shared utilities and components for Content mode views.
 *
 * Extracted from ContentWorkQueueView to support three separate mode view trees:
 * - ManualModeView
 * - CopilotModeView
 * - AutopilotModeView
 *
 * @see /docs/canon/work/CONTENT_WORK_SURFACE_RECONSTRUCTION.md
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md §5B
 */

import type {
  AuthoritySignals,
  ContentClusterDTO,
  ContentGap,
  ContentItem,
  ContentAsset,
  ContentType,
  AutomationMode,
  AuditLedgerEntry,
} from '../types';
import type { TriggerAction } from '../orchestration/OrchestrationEditorShell';
import type { QueueItem } from '../work-queue/QueueRow';

// ============================================
// SHARED TYPES
// ============================================

export interface ContentAction {
  id: string;
  title: string;
  summary: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'opportunity' | 'issue' | 'scheduled' | 'sage_proposal' | 'execution';
  relatedEntityId?: string;
  relatedEntityType?: 'gap' | 'content' | 'asset' | 'cluster';
  cta: {
    label: string;
    action: () => void;
  };
  mode: AutomationMode;
  createdAt: string;
  orchestrateActionId?: string;
  impact?: {
    authority?: number;
    crossPillar?: number;
  };
  confidence?: number;
  modeCeiling?: AutomationMode;
  risk?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContentModeViewProps {
  signals: AuthoritySignals | null;
  clusters: ContentClusterDTO[];
  gaps: ContentGap[];
  briefs: ContentItem[];
  assets?: ContentAsset[];
  isLoading: boolean;
  error?: Error | null;
  onViewLibrary?: () => void;
  onViewGap?: (keyword: string) => void;
  onViewBrief?: (contentId: string) => void;
  onGenerateBrief?: () => void;
  onCreateContent?: (contentType: ContentType) => void;
  onImportContent?: () => void;
  onFixIssues?: () => void;
  onGenerateDraft?: () => void;
  onViewCluster?: (clusterId: string) => void;
  onViewCalendar?: () => void;
  onLaunchOrchestrate?: (actionId: string) => void;
  onSwitchToManual?: () => void;
}

// ============================================
// SCORING UTILITIES
// ============================================

export function computeActionScore(action: ContentAction): number {
  const typeScores: Record<ContentAction['type'], number> = {
    execution: 100,
    issue: 90,
    opportunity: 70,
    scheduled: 60,
    sage_proposal: 30,
  };
  const priorityBonus: Record<ContentAction['priority'], number> = {
    critical: 20,
    high: 15,
    medium: 10,
    low: 5,
  };
  return (typeScores[action.type] || 50) + (priorityBonus[action.priority] || 0);
}

export function selectPrioritizedActions(actions: ContentAction[]): ContentAction[] {
  return [...actions].sort((a, b) => computeActionScore(b) - computeActionScore(a));
}

export function filterActionsByMode(actions: ContentAction[], mode: AutomationMode): ContentAction[] {
  if (mode === 'autopilot') {
    return actions.filter(
      (action) =>
        action.type === 'issue' ||
        (action.type === 'execution' && action.priority === 'critical') ||
        action.priority === 'critical'
    );
  }
  return actions;
}

// ============================================
// ACTION GENERATION
// ============================================

export function generateContentActions(params: {
  briefs: ContentItem[];
  gaps: ContentGap[];
  assets: ContentAsset[];
  mode: AutomationMode;
  citeMindIssueCount: number;
  onViewBrief?: (contentId: string) => void;
  onGenerateBrief?: () => void;
  onFixIssues?: () => void;
}): ContentAction[] {
  const { briefs, gaps, mode, citeMindIssueCount, onViewBrief, onGenerateBrief, onFixIssues } = params;

  return [
    // Execution-ready content
    ...briefs
      .filter((b) => b.status === 'ready' || b.status === 'needs_review')
      .slice(0, 2)
      .map((item, i): ContentAction => ({
        id: `exec-${item.id}`,
        title: item.title,
        summary: `Ready to publish · Target: ${item.targetKeyword || 'Multiple keywords'}`,
        priority: 'high',
        type: 'execution',
        relatedEntityId: item.id,
        relatedEntityType: 'content',
        cta: { label: 'Publish', action: () => onViewBrief?.(item.id) },
        mode,
        createdAt: item.createdAt,
        orchestrateActionId: `action-${(i % 3) + 1}`,
        confidence: 75 + (i * 5),
        impact: { authority: 12 + i * 3, crossPillar: 2 },
        risk: 'low',
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
        cta: { label: 'Start Writing', action: () => onGenerateBrief?.() },
        mode,
        createdAt: '2025-01-15T09:00:00Z',
        confidence: 65 + (i * 5),
        impact: { authority: gap.seoOpportunityScore / 10 },
      })),
    // Draft content needing attention
    ...briefs
      .filter((b) => b.status === 'draft')
      .slice(0, 2)
      .map((item): ContentAction => ({
        id: `content-${item.id}`,
        title: item.title,
        summary: `Status: ${item.status} · Target: ${item.targetKeyword || 'Not set'}`,
        priority: 'medium',
        type: 'scheduled',
        relatedEntityId: item.id,
        relatedEntityType: 'content',
        cta: { label: 'Review', action: () => onViewBrief?.(item.id) },
        mode,
        createdAt: item.createdAt,
        confidence: 70,
      })),
    // CiteMind issues
    ...(citeMindIssueCount > 0
      ? [{
          id: 'citemind-issues',
          title: `${citeMindIssueCount} content pieces need attention`,
          summary: 'CiteMind detected issues that may affect citation eligibility',
          priority: 'high' as const,
          type: 'issue' as const,
          cta: { label: 'Fix Issues', action: () => onFixIssues?.() },
          mode,
          createdAt: '2025-01-15T08:00:00Z',
          confidence: 95,
          risk: 'medium' as const,
        }]
      : []),
  ];
}

// ============================================
// CONVERSION UTILITIES
// ============================================

export function convertToQueueItems(actions: ContentAction[]): QueueItem[] {
  return actions.map((action): QueueItem => ({
    id: action.id,
    title: action.title,
    summary: action.summary,
    priority: action.priority,
    type: action.type,
    relatedEntityId: action.relatedEntityId,
    relatedEntityType: action.relatedEntityType,
    mode: action.mode,
    createdAt: action.createdAt,
    orchestrateActionId: action.orchestrateActionId,
    confidence: action.confidence,
    modeCeiling: action.modeCeiling,
    risk: action.risk,
    impact: action.impact,
  }));
}

export function toTriggerAction(action: ContentAction): TriggerAction {
  return {
    id: action.id,
    type: action.type === 'execution' ? 'content_execution' : action.type === 'opportunity' ? 'derivative_generation' : 'authority_optimization',
    title: action.title,
    priority: action.priority === 'critical' ? 'urgent' : action.priority === 'high' ? 'high' : 'normal',
    modeCeiling: action.modeCeiling || 'copilot',
    citeMindStatus: action.type === 'issue' ? 'warning' : 'passed',
    pillar: 'content',
    createdAt: action.createdAt,
    sourceContext: {
      contentId: action.relatedEntityId,
      contentTitle: action.title,
      keyword: action.relatedEntityId || 'target keyword',
      assetTitle: action.title,
    },
  };
}

// ============================================
// PIPELINE COUNTS
// ============================================

export function computePipelineCounts(assets: ContentAsset[]) {
  return {
    draft: assets.filter((a) => a.status === 'draft').length,
    review: assets.filter((a) => a.status === 'needs_review').length,
    approved: assets.filter((a) => a.status === 'ready').length,
    published: assets.filter((a) => a.status === 'published').length,
  };
}

export function computeCiteMindIssueCount(assets: ContentAsset[]) {
  return assets.filter(
    (a) => a.citeMindStatus === 'warning' || a.citeMindStatus === 'blocked'
  ).length;
}

// ============================================
// MOCK AUDIT LEDGER (Autopilot)
// ============================================

export const MOCK_AUDIT_LEDGER: AuditLedgerEntry[] = [
  { id: 'audit-1', timestamp: '2025-01-15T10:30:00Z', actor: 'system', actionType: 'scheduling', summary: 'Auto-scheduled blog post', outcome: 'completed' },
  { id: 'audit-2', timestamp: '2025-01-15T10:25:00Z', actor: 'system', actionType: 'derivative_generation', summary: 'Generated AEO snippet', outcome: 'completed' },
  { id: 'audit-3', timestamp: '2025-01-15T10:15:00Z', actor: 'system', actionType: 'citemind_check', summary: 'CiteMind check passed', outcome: 'passed' },
  { id: 'audit-4', timestamp: '2025-01-15T10:05:00Z', actor: 'system', actionType: 'cross_pillar_sync', summary: 'Cross-pillar sync to PR', outcome: 'completed' },
  { id: 'audit-5', timestamp: '2025-01-15T09:50:00Z', actor: 'system', actionType: 'brief_execution', summary: 'Content published successfully', outcome: 'completed' },
];

// ============================================
// HEALTH STRIP COMPONENT
// ============================================

function getMetricColor(value: number): string {
  if (value >= 80) return 'text-semantic-success';
  if (value >= 60) return 'text-brand-cyan';
  if (value >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

export function HealthStrip({
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
            <span className="text-xs text-white/40 uppercase tracking-wider whitespace-nowrap">
              {metric.label}
            </span>
            <span className={`text-lg font-bold ${metric.color}`}>
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

// ============================================
// CTA CLUSTER COMPONENT (MODE-SHAPED)
// ============================================

export function CTACluster({
  mode,
  hasIssues,
  onGenerateBrief,
  onImportContent,
  onFixIssues,
  onGenerateDraft,
}: {
  mode: AutomationMode;
  hasIssues: boolean;
  onGenerateBrief?: () => void;
  onImportContent?: () => void;
  onFixIssues?: () => void;
  onGenerateDraft?: () => void;
}) {
  const ctaConfig = {
    manual: {
      primary: { label: '+ Create', action: onGenerateBrief, enabled: true },
      secondary: { label: 'Import Content', action: onImportContent, enabled: true },
    },
    copilot: {
      primary: { label: 'Generate Draft', action: onGenerateDraft, enabled: true },
      secondary: { label: 'Create with AI', action: onGenerateBrief, enabled: true },
    },
    autopilot: {
      primary: { label: 'Review Exceptions', action: onFixIssues, enabled: hasIssues },
      secondary: { label: 'Approve Queue', action: undefined, enabled: false },
    },
  };

  const config = ctaConfig[mode];

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={config.primary.enabled ? config.primary.action : undefined}
        disabled={!config.primary.enabled && mode === 'autopilot'}
        className={`
          px-4 py-2 text-sm font-semibold rounded-lg
          transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${config.primary.enabled
            ? 'text-white bg-brand-iris hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)]'
            : 'text-white/40 bg-slate-4 cursor-not-allowed'
          }
        `}
        title={!config.primary.enabled && mode === 'autopilot' ? 'No exceptions to review' : undefined}
      >
        {config.primary.label}
      </button>

      {config.secondary.enabled ? (
        <button
          onClick={config.secondary.action}
          className="px-3 py-2 text-sm font-medium text-white/70 bg-slate-2 border border-border-subtle hover:border-brand-iris/40 rounded-lg transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          {config.secondary.label}
        </button>
      ) : config.secondary.label && mode === 'autopilot' ? (
        <button
          disabled
          className="px-3 py-2 text-sm font-medium text-white/30 bg-slate-2/50 border border-border-subtle rounded-lg cursor-not-allowed"
          title="Coming soon"
        >
          {config.secondary.label}
        </button>
      ) : null}
    </div>
  );
}

// ============================================
// SUPERVISED ITEMS COUNT (Autopilot proof-of-work)
// ============================================

export function SupervisedItemsCount({
  routineCount,
  exceptionCount,
}: {
  routineCount: number;
  exceptionCount: number;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-2/50 border border-slate-4/50 rounded text-[13px]">
      <span className="text-white/40">Running:</span>
      <span className="text-white/60 font-medium">{routineCount} routine</span>
      <span className="text-white/30">&middot;</span>
      <span className={`font-medium ${exceptionCount > 0 ? 'text-semantic-warning' : 'text-white/40'}`}>
        {exceptionCount} {exceptionCount === 1 ? 'exception' : 'exceptions'}
      </span>
    </div>
  );
}
