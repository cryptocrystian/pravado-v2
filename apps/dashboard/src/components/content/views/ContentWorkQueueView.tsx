'use client';

/**
 * Content Work Queue View - Execution-First Landing Surface
 *
 * Phase 7: Content Execution Gravity Model implementation.
 * Phase 8A: Cockpit layout + explainability chips + mode-shaped UX.
 *
 * LAYOUT (Execution-First Hierarchy):
 * 1) Next Best Action - Single dominant action card (no scroll required)
 * 2) Up Next - Max 3 secondary actions
 * 3) Context Panel - Pipeline, deadlines, cross-pillar (right column)
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

import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { ExplainabilityDrawer } from '../orchestration/ExplainabilityDrawer';
import type { TriggerAction } from '../orchestration/OrchestrationEditorShell';
import {
  type AIPerceptualState,
  deriveAIPerceptualState,
  AI_PERCEPTUAL_SIGNALS,
  AmbientAIIndicator,
  AIStateRing,
} from '@/components/ai';

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
  /** Explainability payload chips (Phase 8A) */
  impact?: {
    authority?: number; // +X points
    crossPillar?: number; // +Y hooks
  };
  /** Confidence band (0-100) per AUTOMATE_EXECUTION_MODEL */
  confidence?: number;
  /** Mode ceiling - highest automation level allowed */
  modeCeiling?: AutomationMode;
  /** Risk level per canon risk vocabulary */
  risk?: 'low' | 'medium' | 'high' | 'critical';
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
      // Phase 9A: Removed isAlert/animate-pulse per AI_VISUAL_COMMUNICATION_CANON §7.4
      // "Pulsing indicators on items with no deadline" is manufactured urgency
      // CiteMind issues have no inherent deadline - warning color alone is sufficient
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
            {/* Phase 9A: Removed animate-pulse from isAlert - per §7.4 no pulsing without deadline */}
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

function getMetricColor(value: number): string {
  if (value >= 80) return 'text-semantic-success';
  if (value >= 60) return 'text-brand-cyan';
  if (value >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

// ============================================
// CTA CLUSTER (MODE-SHAPED)
// ============================================

/**
 * Mode-shaped header CTAs per AUTOMATION_MODES_UX.md
 *
 * - Manual: primary "New Brief", secondary "Import Content"
 * - Copilot: primary "Generate Draft", secondary "Create Brief with AI"
 * - Autopilot: primary "Review Exceptions", secondary (contextual)
 */
function CTACluster({
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
  // Mode-specific CTA configurations
  const ctaConfig = {
    manual: {
      primary: { label: '+ New Brief', action: onGenerateBrief, enabled: true },
      secondary: { label: 'Import Content', action: onImportContent, enabled: true },
    },
    copilot: {
      primary: { label: 'Generate Draft', action: onGenerateDraft, enabled: true },
      secondary: { label: 'Create Brief with AI', action: onGenerateBrief, enabled: true },
    },
    autopilot: {
      primary: { label: 'Review Exceptions', action: onFixIssues, enabled: hasIssues },
      // Approve Queue is a future feature - show disabled with tooltip
      secondary: { label: 'Approve Queue', action: undefined, enabled: false },
    },
  };

  const config = ctaConfig[mode];

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Primary CTA (one only) */}
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

      {/* Secondary CTA (max 1, contextual) */}
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

// ============================================
// QUEUE REASONING PANEL (Phase 10B - Copilot)
// ============================================

/**
 * Mock queue reasoning data for Copilot mode.
 * Shows top 3 reasons why the current ordering was chosen.
 */
const MOCK_QUEUE_REASONING = [
  {
    id: 'reason-1',
    factor: 'Deadline Proximity',
    explanation: 'Brief has a deadline within 48 hours, prioritizing time-sensitive work.',
    weight: 'High',
  },
  {
    id: 'reason-2',
    factor: 'Authority Impact',
    explanation: 'Executing this brief contributes +15 to authority score based on target keywords.',
    weight: 'High',
  },
  {
    id: 'reason-3',
    factor: 'Cross-Pillar Synergy',
    explanation: 'Content aligns with pending PR pitch, creating amplification opportunity.',
    weight: 'Medium',
  },
];

// ============================================
// QUEUE CONTROLS BAND (Phase 10B - Manual Workbench)
// ============================================

/**
 * Queue Controls Band - Manual mode "Workbench" posture
 * Provides direct queue manipulation: Re-rank, Pin to Next, Batch select
 * Per UX_CONTINUITY_CANON: Mode perceptible within 3 seconds
 */
function QueueControlsBand({
  itemCount,
  selectedCount,
  onRerank,
  onClearSelection,
  onBatchAction,
}: {
  itemCount: number;
  selectedCount: number;
  onRerank: () => void;
  onClearSelection: () => void;
  onBatchAction: (action: 'defer' | 'snooze' | 'archive') => void;
}) {
  return (
    <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Workbench label */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Queue Controls</span>
          </div>

          {/* Item count */}
          <span className="px-2 py-0.5 text-[10px] font-medium text-white/40 bg-white/5 rounded">
            {itemCount} items
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Re-rank button */}
          <button
            onClick={onRerank}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Re-rank
          </button>

          {/* Batch selection indicator/actions */}
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="text-xs text-brand-iris font-medium">{selectedCount} selected</span>
              <button
                onClick={() => onBatchAction('defer')}
                className="px-2 py-1 text-[10px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                Defer
              </button>
              <button
                onClick={() => onBatchAction('snooze')}
                className="px-2 py-1 text-[10px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                Snooze
              </button>
              <button
                onClick={onClearSelection}
                className="p-1 text-white/40 hover:text-white rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-white/30">Click items to select for batch actions</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PLAN PANEL (Phase 10B - Copilot Plan Review)
// ============================================

/**
 * Plan Panel - Copilot mode "Plan Review" posture
 * Shows AI's reasoning for queue order with step numbers
 * Positioned ABOVE NextBestAction card per requirements
 */
function PlanPanel({
  isExpanded,
  onToggle,
  onApprove,
  isApproved,
  reasons = MOCK_QUEUE_REASONING,
  aiState,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  isApproved: boolean;
  reasons?: typeof MOCK_QUEUE_REASONING;
  aiState: AIPerceptualState;
}) {
  return (
    <div className={`mb-4 rounded-lg border overflow-hidden transition-all ${
      isApproved
        ? 'bg-semantic-success/5 border-semantic-success/30'
        : 'bg-brand-cyan/5 border-brand-cyan/20'
    }`}>
      {/* Panel Header - Always visible */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Step indicator */}
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
            aiState === 'evaluating'
              ? 'bg-brand-cyan/20 text-brand-cyan animate-pulse'
              : isApproved
              ? 'bg-semantic-success/20 text-semantic-success'
              : 'bg-brand-cyan/20 text-brand-cyan'
          }`}>
            {aiState === 'evaluating' ? '...' : isApproved ? '✓' : '1'}
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              {aiState === 'evaluating' ? 'Evaluating Queue...' : 'AI Plan Ready'}
            </span>
            <p className="text-[10px] text-white/40">
              {aiState === 'evaluating'
                ? 'Analyzing priorities and context'
                : isApproved
                ? 'Plan approved — execute when ready'
                : 'Review the reasoning below'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Approve Plan CTA */}
          {!isApproved && aiState !== 'evaluating' && (
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-cyan hover:bg-brand-cyan/90 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.25)] transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Plan
            </button>
          )}
          {isApproved && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-semantic-success bg-semantic-success/10 rounded-lg">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approved
            </span>
          )}

          {/* Toggle expand/collapse */}
          <button
            onClick={onToggle}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reasoning Details - Collapsible */}
      {isExpanded && aiState !== 'evaluating' && (
        <div className="px-3 pb-3 border-t border-white/5">
          <div className="pt-3 space-y-2">
            {reasons.map((reason, index) => (
              <div key={reason.id} className="flex items-start gap-3 p-2 bg-slate-2/50 rounded">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] font-bold shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white">{reason.factor}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${
                      reason.weight === 'High' ? 'text-brand-cyan bg-brand-cyan/10' : 'text-white/50 bg-white/5'
                    }`}>
                      {reason.weight}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-0.5">{reason.explanation}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-3 text-center">
            AI re-evaluates when context changes. Step 2: Review items. Step 3: Execute.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUPERVISED ITEMS COUNT (P1.3 - Autopilot Proof-of-Work)
// ============================================

/**
 * SupervisedItemsCount - Ambient proof-of-work indicator for Autopilot mode.
 *
 * Per CONTENT_MODE_RESPONSIBILITY_MAP.md §4.1:
 * - Must show even when exceptions = 0
 * - Quiet presentation (no pulse, no urgency, no CTA)
 * - Provides proof that Autopilot is actively working
 *
 * @see /docs/canon/work/CONTENT_MODE_RESPONSIBILITY_MAP.md §4.1
 * @see /docs/canon/work/CONTENT_SURFACE_ARCHITECTURE_MAP.md §5.1 (S10 surface)
 */
function SupervisedItemsCount({
  routineCount,
  exceptionCount,
}: {
  /** Number of routine items being handled automatically */
  routineCount: number;
  /** Number of exceptions requiring attention */
  exceptionCount: number;
}) {
  // Phrasing per spec: "Running: X routine • Y exceptions"
  // Quiet: no pulse, muted colors, informational only
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-2/50 border border-slate-4/50 rounded text-[10px]">
      <span className="text-white/40">Running:</span>
      <span className="text-white/60 font-medium">{routineCount} routine</span>
      <span className="text-white/30">•</span>
      <span className={`font-medium ${exceptionCount > 0 ? 'text-semantic-warning' : 'text-white/40'}`}>
        {exceptionCount} {exceptionCount === 1 ? 'exception' : 'exceptions'}
      </span>
    </div>
  );
}

// ============================================
// GUARDRAILS CARD (Phase 10B - Autopilot)
// ============================================

/**
 * Guardrails Card - Autopilot mode "Exception Console" posture
 * Shows active guardrails that trigger exceptions
 * Displayed in right rail for context
 */
function GuardrailsCard() {
  const guardrails = [
    { id: 'g1', name: 'Critical Priority', description: 'Items marked critical always surface', active: true },
    { id: 'g2', name: 'CiteMind Issues', description: 'Quality issues require manual review', active: true },
    { id: 'g3', name: 'Deadline < 24h', description: 'Urgent deadlines need confirmation', active: true },
    { id: 'g4', name: 'High-Risk Actions', description: 'Actions above risk threshold pause', active: false },
  ];

  return (
    <div className="p-3 bg-brand-iris/5 border border-brand-iris/20 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-iris">Active Guardrails</h4>
      </div>
      <div className="space-y-1.5">
        {guardrails.filter(g => g.active).map((guardrail) => (
          <div key={guardrail.id} className="flex items-start gap-2 p-2 bg-slate-2/50 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-iris mt-1.5 shrink-0" />
            <div>
              <span className="text-[11px] font-medium text-white">{guardrail.name}</span>
              <p className="text-[10px] text-white/40">{guardrail.description}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-2 py-1.5 text-[10px] text-brand-iris hover:bg-brand-iris/5 rounded transition-colors">
        Configure Guardrails →
      </button>
    </div>
  );
}

// QueueReasoningPanel replaced by PlanPanel for Copilot posture

// ============================================
// EXECUTION GRAVITY PANE
// ============================================

function ExecutionGravityPane({
  actions,
  mode,
  onLaunchOrchestrate,
  onViewAll,
  isLoading = false,
  isValidating = false,
}: {
  actions: ContentAction[];
  mode: AutomationMode;
  onLaunchOrchestrate?: (actionId: string) => void;
  onViewAll?: () => void;
  /** SWR loading state for AI state derivation */
  isLoading?: boolean;
  /** SWR validating state for AI state derivation */
  isValidating?: boolean;
}) {
  // State for explain drawer
  const [explainDrawerOpen, setExplainDrawerOpen] = useState(false);
  const [explainAction, setExplainAction] = useState<ContentAction | null>(null);
  // Phase 10B: Queue reasoning panel state (Copilot mode) - default expanded in Copilot
  const [queueReasoningOpen, setQueueReasoningOpen] = useState(mode === 'copilot');
  // Phase 10B: Plan approval state (Copilot mode)
  const [planApproved, setPlanApproved] = useState(false);
  // Phase 10B: Show all items toggle (Autopilot mode)
  const [showAllItems, setShowAllItems] = useState(false);
  // Phase 10B: Pinned action ID (Manual mode)
  const [pinnedActionId, setPinnedActionId] = useState<string | null>(null);
  // Phase 10B: Simulated AI evaluating state (for queue recalculation)
  const [isSimulatingEvaluate, setIsSimulatingEvaluate] = useState(false);
  // Phase 10B: Batch selection state (Manual mode)
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  // Phase 10B: Audit log collapsed state (Autopilot mode)
  const [auditLogCollapsed, setAuditLogCollapsed] = useState(false);

  // Phase 10B: Simulate evaluating state when mode changes
  useEffect(() => {
    if (mode === 'copilot' || mode === 'autopilot') {
      setIsSimulatingEvaluate(true);
      const timer = setTimeout(() => setIsSimulatingEvaluate(false), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mode]);

  // Reset mode-specific states when mode changes
  useEffect(() => {
    setPlanApproved(false);
    setPinnedActionId(null);
    setSelectedBatchIds(new Set());
    // Open reasoning panel by default in Copilot mode
    setQueueReasoningOpen(mode === 'copilot');
    setAuditLogCollapsed(false);
  }, [mode]);

  // Derive AI perceptual state for ambient indicator (Phase 9A + 10B enhancements)
  const aiState = useMemo((): AIPerceptualState => {
    // Phase 10B: Simulated evaluating state takes precedence
    if (isSimulatingEvaluate) {
      return 'evaluating';
    }

    // Check for blocked/escalating based on action types
    const hasBlockedAction = actions.some(a => a.type === 'issue');
    const hasCriticalDeadline = actions.some(
      a => a.priority === 'critical' && a.type === 'scheduled'
    );
    const hasReadyAction = actions.some(
      a => a.type === 'execution' && a.orchestrateActionId
    );

    return deriveAIPerceptualState({
      isLoading,
      isValidating,
      gateStatus: hasBlockedAction ? 'warning' : 'passed',
      isActionReady: hasReadyAction,
      hasUrgentDeadline: hasCriticalDeadline,
      priority: actions[0]?.priority,
      mode,
    });
  }, [actions, isLoading, isValidating, mode, isSimulatingEvaluate]);

  // Apply mode-aware filtering THEN priority scoring
  // Phase 10B: Respect showAllItems toggle in Autopilot mode
  const modeFilteredActions = (mode === 'autopilot' && showAllItems)
    ? actions
    : filterActionsByMode(actions, mode);

  // Phase 10B: Handle pinned actions (Manual mode)
  const sortedActions = useMemo(() => {
    const prioritized = selectPrioritizedActions(modeFilteredActions);
    if (pinnedActionId) {
      const pinnedIndex = prioritized.findIndex(a => a.id === pinnedActionId);
      if (pinnedIndex > 0) {
        const [pinned] = prioritized.splice(pinnedIndex, 1);
        prioritized.unshift(pinned);
      }
    }
    return prioritized;
  }, [modeFilteredActions, pinnedActionId]);

  const nextBestAction = sortedActions[0] || null;
  // Posture-specific upNextLimit: Manual=5 (Workbench), Copilot=3, Autopilot=3
  const upNextLimit = mode === 'manual' ? 5 : 3;
  const upNextActions = sortedActions.slice(1, 1 + upNextLimit);
  const remainingCount = sortedActions.length - 1 - upNextLimit;

  // Track how many actions were filtered out in Autopilot mode
  const filteredOutCount = mode === 'autopilot' ? actions.length - filterActionsByMode(actions, mode).length : 0;

  // Handle "Why this now" click
  const handleExplain = useCallback((action: ContentAction) => {
    setExplainAction(action);
    setExplainDrawerOpen(true);
  }, []);

  // Convert ContentAction to TriggerAction for ExplainabilityDrawer
  const toTriggerAction = (action: ContentAction): TriggerAction => ({
    id: action.id,
    type: action.type === 'execution' ? 'brief_execution' : action.type === 'opportunity' ? 'derivative_generation' : 'authority_optimization',
    title: action.title,
    priority: action.priority === 'critical' ? 'urgent' : action.priority === 'high' ? 'high' : 'normal',
    modeCeiling: action.modeCeiling || 'copilot',
    citeMindStatus: action.type === 'issue' ? 'warning' : 'passed',
    pillar: 'content',
    createdAt: action.createdAt,
    sourceContext: {
      briefId: action.relatedEntityId,
      briefTitle: action.title,
      keyword: action.relatedEntityId || 'target keyword',
      assetTitle: action.title,
    },
  });

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

  // Header text varies by posture (3-second rule: immediately recognizable)
  const headerText = mode === 'manual'
    ? 'Work Queue'
    : mode === 'copilot'
    ? 'AI Plan'
    : 'Top Exception';
  const headerSubtext = mode === 'autopilot' && filteredOutCount > 0
    ? `${filteredOutCount} auto-handled`
    : undefined;

  // Mode behavior configuration (Phase 10B: Mode-Expressive Mechanics)
  // Per UX_CONTINUITY_CANON: Each mode is a distinct "work posture"
  const modeBehavior = {
    manual: {
      // WORKBENCH posture: Full control, user-driven prioritization
      posture: 'workbench',
      descriptor: 'Workbench — you control the queue. Reorder, pin, and triage as you see fit.',
      showQueueControls: true,      // Queue Controls band (Re-rank, Pin to Next, Batch select)
      showRerank: true,
      showPinToNext: true,
      showBatchSelect: true,
      showInlineTriageActions: true, // Bump up, defer, snooze per item
      showQueueReasoning: false,
      showApprovePlan: false,
      showRecentlyHandled: false,
      showAllItemsToggle: false,
      showGuardrails: false,
      upNextLimit: 5,               // Show more items in Manual
    },
    copilot: {
      // PLAN REVIEW posture: AI proposes, user approves
      posture: 'plan-review',
      descriptor: 'Plan Review — AI prepared this queue. Review the rationale, then approve.',
      showQueueControls: false,
      showRerank: false,
      showPinToNext: false,
      showBatchSelect: false,
      showInlineTriageActions: false,
      showQueueReasoning: true,     // Plan Panel ABOVE NextBestAction
      showApprovePlan: true,
      showRecentlyHandled: false,
      showAllItemsToggle: false,
      showGuardrails: false,
      upNextLimit: 3,               // Standard count
      planPanelExpanded: true,      // Default expanded
    },
    autopilot: {
      // EXCEPTION CONSOLE posture: Only exceptions surface
      posture: 'exception-console',
      descriptor: 'Exception Console — showing only items that need your attention.',
      showQueueControls: false,
      showRerank: false,
      showPinToNext: false,
      showBatchSelect: false,
      showInlineTriageActions: false,
      showQueueReasoning: false,
      showApprovePlan: false,
      showRecentlyHandled: true,    // Auto-handled today ledger
      showAllItemsToggle: true,
      showGuardrails: true,         // Guardrails card in right rail
      upNextLimit: 3,
    },
  };

  const behavior = modeBehavior[mode];

  // Phase 10B: Enhanced audit log entries for Autopilot mode
  const recentlyHandled = [
    { id: 'recent-1', title: 'Auto-scheduled blog post', type: 'scheduled', time: '2 min ago', status: 'completed' },
    { id: 'recent-2', title: 'Derivative generated for SEO', type: 'derivative', time: '5 min ago', status: 'completed' },
    { id: 'recent-3', title: 'Brief execution completed', type: 'execution', time: '12 min ago', status: 'completed' },
    { id: 'recent-4', title: 'CiteMind quality check', type: 'validation', time: '18 min ago', status: 'passed' },
    { id: 'recent-5', title: 'Cross-pillar sync to PR', type: 'sync', time: '25 min ago', status: 'completed' },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Header with mode indicator + AI state indicator (Phase 9A) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white tracking-tight">{headerText}</h3>
            <ModeIndicator mode={mode} size="default" />
            {/* Ambient AI State Indicator (Phase 9A) */}
            <AmbientAIIndicator state={aiState} size="sm" showLabel={aiState !== 'idle'} />
            {headerSubtext && (
              <span className="text-[10px] text-brand-cyan/70">
                ({headerSubtext})
              </span>
            )}
            {/* P1.3: Autopilot Proof-of-Work Indicator - ambient supervised items count */}
            {mode === 'autopilot' && (
              <SupervisedItemsCount
                routineCount={filteredOutCount}
                exceptionCount={sortedActions.length}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Re-rank affordance for Manual mode */}
            {behavior.showRerank && sortedActions.length > 1 && (
              <button
                onClick={() => {/* TODO: Open re-rank modal/popover */}}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Re-rank
              </button>
            )}
            {sortedActions.length > 1 && (
              <span className="text-[10px] text-white/40">
                {sortedActions.length} {mode === 'autopilot' ? 'exception' : 'total'}{sortedActions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Mode descriptor - behavior-specific microcopy */}
        <p className="text-xs text-white/40 -mt-2">
          {behavior.descriptor}
        </p>

        {/* POSTURE: Manual "Workbench" - Queue Controls Band */}
        {behavior.showQueueControls && (
          <QueueControlsBand
            itemCount={sortedActions.length}
            selectedCount={selectedBatchIds.size}
            onRerank={() => {/* TODO: Open re-rank modal */}}
            onClearSelection={() => setSelectedBatchIds(new Set())}
            onBatchAction={(action) => console.log('Batch action:', action, selectedBatchIds)}
          />
        )}

        {/* POSTURE: Copilot "Plan Review" - Plan Panel ABOVE Next Best Action */}
        {behavior.showQueueReasoning && (
          <PlanPanel
            isExpanded={queueReasoningOpen}
            onToggle={() => setQueueReasoningOpen(!queueReasoningOpen)}
            onApprove={() => setPlanApproved(true)}
            isApproved={planApproved}
            aiState={aiState}
          />
        )}

        {/* Phase 10B: Autopilot - Show all items toggle */}
        {behavior.showAllItemsToggle && filteredOutCount > 0 && (
          <div className="flex items-center justify-between -mt-1 p-2 bg-slate-2/50 rounded-lg">
            <span className="text-xs text-white/50">
              {showAllItems ? 'Showing all items' : `${filteredOutCount} routine items hidden`}
            </span>
            <button
              onClick={() => setShowAllItems(!showAllItems)}
              className="text-xs text-brand-iris hover:underline"
            >
              {showAllItems ? 'Show exceptions only' : 'Show all items'}
            </button>
          </div>
        )}

        {/* DOMINANT: Next Best Action Card with AI State Ring (Phase 9A) */}
        <AIStateRing state={aiState} showAccentBar>
          <NextBestActionCard
            action={nextBestAction}
            mode={mode}
            aiState={aiState}
            onLaunchOrchestrate={onLaunchOrchestrate}
            onExplain={() => handleExplain(nextBestAction)}
          />
        </AIStateRing>

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
                  mode={mode}
                  isPinned={pinnedActionId === action.id}
                  onLaunchOrchestrate={onLaunchOrchestrate}
                  onPinToNext={behavior.showPinToNext ? setPinnedActionId : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* POSTURE: Autopilot "Exception Console" - Auto-handled Today Ledger */}
        {behavior.showRecentlyHandled && (
          <div className="pt-3 border-t border-border-subtle">
            <button
              onClick={() => setAuditLogCollapsed(!auditLogCollapsed)}
              className="w-full flex items-center justify-between mb-2 group"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${auditLogCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white transition-colors">
                  Auto-handled Today
                </h4>
                <span className="px-1.5 py-0.5 text-[9px] font-medium text-semantic-success bg-semantic-success/10 rounded">
                  {recentlyHandled.length}
                </span>
              </div>
              <span className="text-[10px] text-white/30">by AUTOMATE</span>
            </button>
            {/* Collapsible content */}
            {!auditLogCollapsed && (
              <>
                <div className="space-y-1 max-h-[180px] overflow-y-auto">
                  {recentlyHandled.slice(0, 5).map((item) => {
                    const typeIcons: Record<string, JSX.Element> = {
                      scheduled: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                      derivative: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
                      execution: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                      validation: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      sync: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
                    };
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-2.5 py-2 bg-slate-2/30 hover:bg-slate-2/50 rounded text-[10px] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-semantic-success">
                            {typeIcons[item.type] || typeIcons.execution}
                          </span>
                          <span className="text-white/60">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                            item.status === 'completed' ? 'text-semantic-success bg-semantic-success/10' :
                            item.status === 'passed' ? 'text-brand-cyan bg-brand-cyan/10' :
                            'text-white/40 bg-white/5'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-white/30">{item.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="w-full mt-2 py-1.5 text-[10px] text-brand-iris hover:bg-brand-iris/5 rounded transition-colors">
                  View Full Audit Log →
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Explainability Drawer (1-interaction access per UX Continuity Canon) */}
      {explainAction && (
        <ExplainabilityDrawer
          isOpen={explainDrawerOpen}
          onClose={() => setExplainDrawerOpen(false)}
          action={toTriggerAction(explainAction)}
          currentMode={mode}
        />
      )}
    </>
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
 *
 * Phase 8A: Added explainability chips + "Why this now" affordance.
 */
function NextBestActionCard({
  action,
  mode,
  aiState = 'idle',
  onLaunchOrchestrate,
  onExplain,
}: {
  action: ContentAction;
  mode: AutomationMode;
  /** AI perceptual state for local indicator (Phase 9A) */
  aiState?: AIPerceptualState;
  onLaunchOrchestrate?: (actionId: string) => void;
  onExplain?: () => void;
}) {
  // Color semantics: iris for primary/recommended, amber for issues
  const isIssue = action.type === 'issue';

  const priorityStyles = {
    critical: {
      border: isIssue ? 'border-semantic-danger' : 'border-semantic-danger',
      glow: 'shadow-[0_0_24px_rgba(239,68,68,0.15)]',
      badge: 'bg-semantic-danger text-white',
    },
    high: {
      // Issues use amber, primary actions use iris
      border: isIssue ? 'border-semantic-warning' : 'border-brand-iris',
      glow: isIssue ? 'shadow-[0_0_20px_rgba(234,179,8,0.12)]' : 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      badge: isIssue ? 'bg-semantic-warning text-black' : 'bg-brand-iris/20 text-brand-iris',
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

  // Phase 10B: Mode-specific CTA labels
  // Manual: "Execute →" | Copilot: "Review & Approve →" | Autopilot: "Approve" (only when needed)
  const getModeCtaLabel = (baseLabel: string): string => {
    if (mode === 'copilot') {
      if (action.type === 'execution') return 'Review & Approve →';
      return 'Review →';
    }
    if (mode === 'autopilot') {
      if (action.type === 'issue') return 'Approve Fix';
      return 'Approve';
    }
    return baseLabel; // Manual mode uses base labels
  };

  const typeConfig = {
    execution: { label: 'Execute Brief', ctaLabel: getModeCtaLabel('Execute →'), ctaClass: 'bg-brand-iris text-white shadow-[0_0_16px_rgba(168,85,247,0.30)]' },
    issue: { label: 'Fix Issue', ctaLabel: getModeCtaLabel('Fix Issue →'), ctaClass: 'bg-semantic-warning text-black' },
    opportunity: { label: 'Opportunity', ctaLabel: getModeCtaLabel('Create Brief →'), ctaClass: 'bg-brand-iris text-white shadow-[0_0_16px_rgba(168,85,247,0.30)]' },
    scheduled: { label: 'Deadline', ctaLabel: getModeCtaLabel('Review →'), ctaClass: 'bg-brand-cyan text-black' },
    sage_proposal: { label: 'SAGE Proposal', ctaLabel: getModeCtaLabel('View →'), ctaClass: 'bg-white/10 text-white' },
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

  // Risk color mapping
  const riskColors = {
    low: 'text-semantic-success bg-semantic-success/10',
    medium: 'text-semantic-warning bg-semantic-warning/10',
    high: 'text-semantic-danger bg-semantic-danger/10',
    critical: 'text-semantic-danger bg-semantic-danger/10',
  };

  // Mode ceiling label
  const getModeCeilingLabel = (ceiling: AutomationMode | undefined): string => {
    if (!ceiling) return '—';
    return ceiling.charAt(0).toUpperCase() + ceiling.slice(1);
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
          {/* Phase 9A: Critical indicator without animate-pulse per §7.4
              Pulse would only be appropriate if there's an actual deadline (escalating state).
              The AI state indicator now handles urgency signaling semantically. */}
          {action.priority === 'critical' && (
            <span className="w-2 h-2 rounded-full bg-semantic-danger" />
          )}
        </div>
        <ModeIndicator mode={mode} size="small" />
      </div>

      {/* Title - prominent */}
      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-iris transition-colors">
        {action.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-white/60 mb-3 line-clamp-2">
        {action.summary}
      </p>

      {/* FOCAL AI STATE ROW - Dedicated row per AI Visual Communication Canon §2 */}
      <div className={`
        mb-4 p-3 rounded-lg border
        ${AI_PERCEPTUAL_SIGNALS[aiState].bg}
        ${AI_PERCEPTUAL_SIGNALS[aiState].border}
        ${AI_PERCEPTUAL_SIGNALS[aiState].transition}
      `}>
        <div className="flex items-center justify-between">
          {/* State indicator with label */}
          <div className="flex items-center gap-3">
            {/* State dot with appropriate motion */}
            <span className={`
              w-3 h-3 rounded-full
              ${AI_PERCEPTUAL_SIGNALS[aiState].indicator}
              ${AI_PERCEPTUAL_SIGNALS[aiState].motion}
            `} />
            <div>
              <span className={`text-sm font-semibold ${AI_PERCEPTUAL_SIGNALS[aiState].text}`}>
                {aiState === 'idle' ? 'Awaiting Input' :
                 aiState === 'evaluating' ? 'AI Analyzing...' :
                 aiState === 'ready' ? 'Ready to Execute' :
                 aiState === 'executing' ? 'Executing...' :
                 aiState === 'blocked' ? 'Action Blocked' :
                 'Urgent Attention Required'}
              </span>
              <p className="text-[10px] text-white/40 mt-0.5">
                {aiState === 'idle' && 'System idle, no active AI processing'}
                {aiState === 'evaluating' && 'AI is preparing recommendations...'}
                {aiState === 'ready' && 'AI has a recommendation ready for you'}
                {aiState === 'executing' && 'Action in progress, please wait'}
                {aiState === 'blocked' && 'Cannot proceed — resolve issues first'}
                {aiState === 'escalating' && 'Deadline approaching, action needed now'}
              </p>
            </div>
          </div>

          {/* Confidence badge (moved here for focal area) */}
          {action.confidence !== undefined && (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
              action.confidence >= 80
                ? 'text-semantic-success bg-semantic-success/15'
                : action.confidence >= 50
                ? 'text-semantic-warning bg-semantic-warning/15'
                : 'text-white/60 bg-slate-4'
            }`}>
              {action.confidence >= 80 ? 'High' : action.confidence >= 50 ? 'Med' : 'Low'} Confidence
            </span>
          )}
        </div>
      </div>

      {/* Explainability Chips Row (Phase 8A) - condensed */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Impact chip */}
        <span className="px-2 py-0.5 text-[10px] font-medium text-white/60 bg-slate-4 rounded">
          Impact: {action.impact?.authority !== undefined ? `+${action.impact.authority}` : '—'}
          {action.impact?.crossPillar !== undefined && `, +${action.impact.crossPillar} hooks`}
        </span>

        {/* Risk / Mode ceiling chip */}
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
          action.risk ? riskColors[action.risk] : 'text-white/40 bg-slate-4'
        }`}>
          {action.modeCeiling
            ? `Ceiling: ${getModeCeilingLabel(action.modeCeiling)}`
            : action.risk
            ? `Risk: ${action.risk}`
            : 'Risk: —'}
        </span>

        {/* "Why this now" affordance (1-interaction to explainability per UX Continuity Canon) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExplain?.();
          }}
          className="px-2 py-0.5 text-[10px] font-medium text-brand-iris bg-brand-iris/10 hover:bg-brand-iris/20 rounded transition-colors"
        >
          Why this now?
        </button>
      </div>

      {/* Bottom row: CTA with confidence-based confirmation */}
      <ConfidenceAwareCTA
        confidence={action.confidence}
        isOrchestrationReady={isOrchestrationReady}
        ctaLabel={typeConf.ctaLabel}
        ctaClass={typeConf.ctaClass}
        onClick={handleClick}
      />
    </div>
  );
}

/**
 * Confidence-Aware CTA Component
 *
 * Per AI_VISUAL_COMMUNICATION_CANON §3 (Confidence & Trust):
 * - High confidence (≥80): Normal CTA
 * - Moderate confidence (50-79): Normal CTA, reduced emphasis
 * - Low confidence (<50): Inline "Confirm" toggle required before Execute
 *
 * No modals - confirmation is inline beside the CTA.
 */
function ConfidenceAwareCTA({
  confidence,
  isOrchestrationReady,
  ctaLabel,
  ctaClass,
  onClick,
}: {
  confidence?: number;
  isOrchestrationReady: boolean;
  ctaLabel: string;
  ctaClass: string;
  onClick: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const isLowConfidence = confidence !== undefined && confidence < 50;
  const isModerateConfidence = confidence !== undefined && confidence >= 50 && confidence < 80;

  // Reset confirmation when confidence changes
  useEffect(() => {
    setConfirmed(false);
  }, [confidence]);

  // Determine if CTA is enabled
  const ctaEnabled = !isLowConfidence || confirmed;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-xs text-white/40">
        {/* Orchestration ready indicator */}
        {isOrchestrationReady && (
          <span className="flex items-center gap-1 text-brand-iris text-[10px]">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Orchestration ready
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Low confidence: Inline confirmation toggle */}
        {isLowConfidence && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-[10px] text-white/50">
              Low confidence — confirm?
            </span>
            <button
              type="button"
              onClick={() => setConfirmed(!confirmed)}
              className={`
                relative w-8 h-4 rounded-full transition-colors duration-200
                ${confirmed ? 'bg-brand-iris' : 'bg-slate-4'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm
                  transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                  ${confirmed ? 'translate-x-4' : 'translate-x-0.5'}
                `}
              />
            </button>
          </label>
        )}

        {/* CTA Button */}
        <button
          onClick={onClick}
          disabled={!ctaEnabled}
          className={`
            px-4 py-2 text-sm font-semibold rounded-lg
            transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${ctaEnabled ? 'hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'}
            ${isModerateConfidence ? 'opacity-80' : ''}
            ${ctaClass}
          `}
        >
          {isOrchestrationReady ? 'Execute →' : ctaLabel}
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
  mode,
  isPinned = false,
  onLaunchOrchestrate,
  onPinToNext,
}: {
  action: ContentAction;
  mode: AutomationMode;
  isPinned?: boolean;
  onLaunchOrchestrate?: (actionId: string) => void;
  onPinToNext?: (actionId: string) => void;
}) {
  // Phase 9A: Removed animate-pulse from critical per §7.4 (manufactured urgency)
  // AI state indicators now handle urgency semantically based on actual deadlines
  const priorityDot = {
    critical: 'bg-semantic-danger',
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

  // Phase 10B: Mode-specific CTA labels
  const getCtaLabel = () => {
    if (mode === 'copilot') return 'Review →';
    if (mode === 'autopilot') return action.type === 'issue' ? 'Resolve' : 'View';
    return action.cta.label;
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-2.5 bg-slate-2/50 border rounded-lg
        hover:bg-slate-2 hover:border-brand-iris/30
        transition-all duration-150 cursor-pointer
        flex items-center justify-between gap-3
        ${isPinned ? 'border-brand-iris/40 bg-brand-iris/5' : 'border-border-subtle'}
      `}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isPinned && (
          <svg className="w-3 h-3 text-brand-iris shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1.5 1.5 0 004 7.323V16a1 1 0 001 1h4v-5a1 1 0 112 0v5h4a1 1 0 001-1V7.323a1.5 1.5 0 00-1.046-1.418L11 4.323V3a1 1 0 00-1-1z" />
          </svg>
        )}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[action.priority]}`} />
        <span className="text-[10px] font-medium text-white/40 uppercase shrink-0">
          {typeLabels[action.type]}
        </span>
        <span className="text-xs text-white truncate">
          {action.title}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Phase 10B: Pin to Next action (Manual mode only) */}
        {mode === 'manual' && onPinToNext && !isPinned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinToNext(action.id);
            }}
            className="p-1 text-white/30 hover:text-brand-iris rounded transition-colors"
            title="Set as Next"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
        <button className="text-[10px] font-medium text-brand-iris hover:underline">
          {getCtaLabel()}
        </button>
      </div>
    </div>
  );
}

// ============================================
// CONTEXT PANEL (RIGHT COLUMN)
// ============================================

/**
 * ContextPanel - Stacked context widgets for the right column of cockpit layout.
 * Displays pipeline, deadlines, cross-pillar impact, and CiteMind issues.
 * Responsive: stacks below left column on smaller screens.
 */
function ContextPanel({
  pipelineCounts,
  upcomingDeadlines,
  crossPillarImpact,
  citeMindIssueCount,
  showGuardrails = false,
  onViewCalendar,
  onViewLibrary,
  onFixIssues,
}: {
  pipelineCounts: { draft: number; review: number; approved: number; published: number };
  upcomingDeadlines: { count: number; nextDate?: string };
  crossPillarImpact: { prHooks: number; seoHooks: number };
  citeMindIssueCount: number;
  /** Autopilot posture: show Guardrails card */
  showGuardrails?: boolean;
  onViewCalendar?: () => void;
  onViewLibrary?: () => void;
  onFixIssues?: () => void;
}) {
  return (
    <>
      {/* POSTURE: Autopilot - Guardrails Card (first in Exception Console) */}
      {showGuardrails && <GuardrailsCard />}

      {/* Pipeline Summary */}
      <div className="p-3 bg-slate-2 border border-border-subtle rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white/70">Pipeline</h4>
          <button
            onClick={onViewLibrary}
            className="text-[10px] text-brand-iris hover:underline transition-colors"
          >
            View →
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <PipelineStat label="Draft" count={pipelineCounts.draft} color="text-white/50" />
          <PipelineStat label="Review" count={pipelineCounts.review} color="text-semantic-warning" />
          <PipelineStat label="Ready" count={pipelineCounts.approved} color="text-semantic-success" />
          <PipelineStat label="Live" count={pipelineCounts.published} color="text-brand-cyan" />
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="p-3 bg-slate-2 border border-border-subtle rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white/70">Deadlines</h4>
          <button
            onClick={onViewCalendar}
            className="text-[10px] text-brand-iris hover:underline transition-colors"
          >
            Calendar →
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">{upcomingDeadlines.count}</span>
          <span className="text-xs text-white/40">this week</span>
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

      {/* CiteMind Issues Module (only if issues exist) */}
      {citeMindIssueCount > 0 && (
        <div className="p-3 bg-semantic-warning/5 border border-semantic-warning/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Phase 9A: Removed animate-pulse per §7.4 - no deadline = no pulsing
                  Warning color alone communicates the blocked/warning state */}
              <span className="w-2 h-2 rounded-full bg-semantic-warning" />
              <h4 className="text-xs font-semibold text-semantic-warning">CiteMind Issues</h4>
            </div>
            <button
              onClick={onFixIssues}
              className="text-[10px] text-semantic-warning hover:underline transition-colors"
            >
              Fix →
            </button>
          </div>
          <p className="text-xs text-white/60">
            {citeMindIssueCount} {citeMindIssueCount === 1 ? 'piece needs' : 'pieces need'} attention
          </p>
        </div>
      )}
    </>
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
      {/* Top Row: Health Strip + Mode-shaped CTAs */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <HealthStrip signals={signals} citeMindIssueCount={citeMindIssueCount} />
        </div>
        <CTACluster
          mode={mode}
          hasIssues={citeMindIssueCount > 0}
          onGenerateBrief={onGenerateBrief}
          onImportContent={onImportContent}
          onFixIssues={onFixIssues}
          onGenerateDraft={onGenerateDraft}
        />
      </div>

      {/* Cockpit Layout: Left Queue + Right Context */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* LEFT: Primary Queue (Next Best Action + Up Next) */}
        <section className="min-h-[320px]">
          <ExecutionGravityPane
            actions={actions}
            isLoading={false} /* TODO: Wire to SWR isLoading when available */
            isValidating={false} /* TODO: Wire to SWR isValidating when available */
            mode={mode}
            onLaunchOrchestrate={onLaunchOrchestrate}
            onViewAll={onViewLibrary}
          />
        </section>

        {/* RIGHT: Context Panel (Pipeline, Deadlines, Cross-Pillar, Issues) */}
        <aside className="space-y-3">
          <ContextPanel
            pipelineCounts={pipelineCounts}
            upcomingDeadlines={{
              count: briefs.filter((b) => b.deadline).length,
              nextDate: briefs.find((b) => b.deadline)?.deadline?.split('T')[0],
            }}
            crossPillarImpact={{
              prHooks: 0, // TODO: Calculate from actual data
              seoHooks: 0,
            }}
            citeMindIssueCount={citeMindIssueCount}
            showGuardrails={mode === 'autopilot'}
            onViewCalendar={onViewCalendar}
            onViewLibrary={onViewLibrary}
            onFixIssues={onFixIssues}
          />
        </aside>
      </div>

      {/* Quick Opportunities (below cockpit, full width) */}
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
