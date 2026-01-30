'use client';

/**
 * WorkbenchCanvas - Center pane for selected item details and actions.
 *
 * Layout:
 * - Header with item type + priority
 * - AI State indicator (focal)
 * - Action details + summary
 * - Primary CTA with confidence gate
 * - Explainability access ("Why this now?")
 *
 * Mode postures:
 * - Manual: Full editor stub, direct execution CTA
 * - Copilot: Preview-oriented with "Review & Approve" CTA
 * - Autopilot: Exception detail with resolution CTA
 *
 * @see /docs/canon/AUTOMATION_MODE_CONTRACTS_CANON.md
 * @see /docs/canon/AI_VISUAL_COMMUNICATION_CANON.md
 */

import { useState, useCallback } from 'react';
import type { QueueItem } from './QueueRow';
import type { AutomationMode } from '../types';
import {
  type AIPerceptualState,
  AI_PERCEPTUAL_SIGNALS,
} from '@/components/ai';

// ============================================
// TYPES
// ============================================

export interface WorkbenchCanvasProps {
  item: QueueItem | null;
  mode: AutomationMode;
  aiState: AIPerceptualState;
  onExecute?: () => void;
  onLaunchOrchestrate?: (actionId: string) => void;
  onExplain?: () => void;
  onSwitchToManual?: () => void;
  /** Plan approved (Copilot only) */
  isPlanApproved?: boolean;
}

// ============================================
// TYPE DISPLAY CONFIG
// ============================================

const TYPE_CONFIG = {
  execution: {
    label: 'Execute Brief',
    description: 'Ready to build authority content',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-brand-iris',
    bg: 'bg-brand-iris/10',
  },
  issue: {
    label: 'Fix Issue',
    description: 'CiteMind detected quality concerns',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
  },
  opportunity: {
    label: 'Content Gap',
    description: 'Create content to fill authority gap',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
  },
  scheduled: {
    label: 'Deadline Approaching',
    description: 'Content due for review',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-semantic-danger',
    bg: 'bg-semantic-danger/10',
  },
  sage_proposal: {
    label: 'SAGE Proposal',
    description: 'AI-suggested improvement',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'text-white/60',
    bg: 'bg-white/5',
  },
};

const PRIORITY_STYLES = {
  critical: 'border-semantic-danger/40',
  high: 'border-brand-iris/40',
  medium: 'border-slate-4',
  low: 'border-slate-4',
};

// ============================================
// CTA LABELS BY MODE
// ============================================

function getCtaLabel(itemType: QueueItem['type'], mode: AutomationMode): string {
  if (mode === 'copilot') {
    if (itemType === 'execution') return 'Review & Approve';
    return 'Review';
  }
  if (mode === 'autopilot') {
    if (itemType === 'issue') return 'Approve Fix';
    return 'Approve';
  }
  // Manual mode
  if (itemType === 'execution') return 'Execute';
  if (itemType === 'issue') return 'Fix Issue';
  if (itemType === 'opportunity') return 'Create Brief';
  return 'View';
}

function getCtaStyle(isIssue: boolean): string {
  if (isIssue) {
    return 'bg-semantic-warning text-black hover:bg-semantic-warning/90';
  }
  return 'bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)]';
}

// ============================================
// COMPONENT
// ============================================

export function WorkbenchCanvas({
  item,
  mode,
  aiState,
  onExecute,
  onLaunchOrchestrate,
  onExplain,
  onSwitchToManual,
  isPlanApproved = false,
}: WorkbenchCanvasProps) {
  const [showConfidenceExplainer, setShowConfidenceExplainer] = useState(false);

  const handlePrimaryAction = useCallback(() => {
    if (!item) return;
    if (item.orchestrateActionId && onLaunchOrchestrate) {
      onLaunchOrchestrate(item.orchestrateActionId);
    } else if (onExecute) {
      onExecute();
    }
  }, [item, onLaunchOrchestrate, onExecute]);

  // Empty state - no item selected
  if (!item) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-3 border border-slate-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white/60 mb-1">
          Select an item
        </h3>
        <p className="text-sm text-white/40 max-w-xs">
          Choose an item from the queue to see details and take action.
        </p>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[item.type];
  const priorityBorder = PRIORITY_STYLES[item.priority];
  const isIssue = item.type === 'issue';
  const ctaLabel = getCtaLabel(item.type, mode);
  const ctaStyle = getCtaStyle(isIssue);

  // Confidence gate logic (P1.5)
  const isLowConfidence = item.confidence !== undefined && item.confidence < 70;
  const requiresManualGate = isLowConfidence && mode === 'copilot';

  return (
    <div className="flex flex-col h-full">
      {/* Header: Type + Priority */}
      <div className={`px-5 py-4 border-b ${priorityBorder}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeConf.bg}`}>
              <span className={typeConf.color}>{typeConf.icon}</span>
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${typeConf.color}`}>
                {typeConf.label}
              </span>
              <p className="text-[10px] text-white/40 mt-0.5">{typeConf.description}</p>
            </div>
          </div>
          {item.priority === 'critical' && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase text-semantic-danger bg-semantic-danger/10 rounded">
              Critical
            </span>
          )}
        </div>
      </div>

      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Title */}
        <h2 className="text-xl font-semibold text-white leading-tight">
          {item.title}
        </h2>

        {/* Summary */}
        <p className="text-sm text-white/60 leading-relaxed">
          {item.summary}
        </p>

        {/* AI State Indicator - Focal */}
        <div className={`
          p-4 rounded-lg border
          ${AI_PERCEPTUAL_SIGNALS[aiState].bg}
          ${AI_PERCEPTUAL_SIGNALS[aiState].border}
        `}>
          <div className="flex items-center gap-3">
            <span className={`
              w-3 h-3 rounded-full
              ${AI_PERCEPTUAL_SIGNALS[aiState].indicator}
              ${AI_PERCEPTUAL_SIGNALS[aiState].motion}
            `} />
            <div>
              <span className={`text-sm font-semibold ${AI_PERCEPTUAL_SIGNALS[aiState].text}`}>
                {aiState === 'idle' && 'Awaiting Input'}
                {aiState === 'evaluating' && 'AI Analyzing...'}
                {aiState === 'ready' && 'Ready to Execute'}
                {aiState === 'executing' && 'Executing...'}
                {aiState === 'blocked' && 'Action Blocked'}
                {aiState === 'escalating' && 'Urgent Attention Required'}
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
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Impact */}
          {item.impact?.authority !== undefined && (
            <span className="px-2 py-1 text-xs font-medium text-brand-iris bg-brand-iris/10 rounded">
              +{item.impact.authority} authority
            </span>
          )}
          {item.impact?.crossPillar !== undefined && (
            <span className="px-2 py-1 text-xs font-medium text-brand-cyan bg-brand-cyan/10 rounded">
              +{item.impact.crossPillar} hooks
            </span>
          )}

          {/* Risk */}
          {item.risk && (
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              item.risk === 'low' ? 'text-semantic-success bg-semantic-success/10' :
              item.risk === 'medium' ? 'text-semantic-warning bg-semantic-warning/10' :
              'text-semantic-danger bg-semantic-danger/10'
            }`}>
              {item.risk} risk
            </span>
          )}

          {/* Confidence */}
          {item.confidence !== undefined && (
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              item.confidence >= 80 ? 'text-semantic-success bg-semantic-success/10' :
              item.confidence >= 50 ? 'text-semantic-warning bg-semantic-warning/10' :
              'text-white/50 bg-white/5'
            }`}>
              {item.confidence}% confidence
            </span>
          )}

          {/* Mode ceiling */}
          {item.modeCeiling && (
            <span className="px-2 py-1 text-xs font-medium text-white/50 bg-white/5 rounded">
              Max: {item.modeCeiling}
            </span>
          )}
        </div>

        {/* Editor stub (Manual mode) */}
        {mode === 'manual' && item.type === 'execution' && (
          <div className="p-4 bg-slate-3 border border-slate-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/60">Editor Preview</span>
              <span className="text-[10px] text-white/30">Full editor in detail view</span>
            </div>
            <div className="h-24 bg-slate-2 rounded border border-dashed border-slate-4 flex items-center justify-center">
              <span className="text-sm text-white/30">Content will load here...</span>
            </div>
          </div>
        )}

        {/* Plan approval indicator (Copilot mode) */}
        {mode === 'copilot' && isPlanApproved && (
          <div className="flex items-center gap-2 p-3 bg-semantic-success/10 border border-semantic-success/20 rounded-lg">
            <svg className="w-4 h-4 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-semantic-success font-medium">Plan approved — ready to execute</span>
          </div>
        )}
      </div>

      {/* Footer: CTA area */}
      <div className="px-5 py-4 border-t border-slate-4 shrink-0 space-y-3">
        {/* Manual-required gate (P1.5) */}
        {requiresManualGate ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfidenceExplainer(!showConfidenceExplainer)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/50 bg-slate-4/50 border border-slate-5 rounded-lg hover:bg-slate-4 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Manual required
                <svg className={`w-2.5 h-2.5 transition-transform ${showConfidenceExplainer ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {showConfidenceExplainer && (
              <div className="p-3 bg-slate-3 border border-slate-4 rounded-lg space-y-2">
                <p className="text-xs text-white/60">
                  This action has low confidence ({item.confidence}%) and requires Manual mode for execution.
                </p>
                <button
                  onClick={onSwitchToManual}
                  className="w-full px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded transition-colors"
                >
                  Switch to Manual Mode
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrimaryAction}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${ctaStyle}`}
            >
              {ctaLabel}
            </button>
            <button
              onClick={onExplain}
              className="px-3 py-2.5 text-sm font-medium text-brand-iris bg-brand-iris/10 hover:bg-brand-iris/20 rounded-lg transition-colors"
            >
              Why this?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
