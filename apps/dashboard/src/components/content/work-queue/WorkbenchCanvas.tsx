'use client';

/**
 * WorkbenchCanvas - Center pane for selected item details and actions.
 *
 * VIEWPORT-FIRST LAYOUT (Phase 11A.1):
 * - HEADER (fixed): Type badge, title, AI state indicator
 * - BODY (scrollable): Details, metadata, plan content, editor preview
 * - ACTIONS (sticky footer): Primary CTA, secondary actions, confidence gate
 *
 * Key principle: Primary CTA MUST always be visible without scrolling.
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
  /** Handler to approve plan (Copilot only) */
  onApprovePlan?: () => void;
  /** Plan reasoning factors (Copilot only) */
  planReasons?: Array<{ id: string; factor: string; explanation: string }>;
}

// ============================================
// TYPE DISPLAY CONFIG
// ============================================

const TYPE_CONFIG = {
  execution: {
    label: 'Brief',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-brand-iris',
    bg: 'bg-brand-iris/10',
  },
  issue: {
    label: 'Issue',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
  },
  opportunity: {
    label: 'Gap',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
  },
  scheduled: {
    label: 'Deadline',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-semantic-danger',
    bg: 'bg-semantic-danger/10',
  },
  sage_proposal: {
    label: 'SAGE',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'text-white/60',
    bg: 'bg-white/5',
  },
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
  return 'bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
}

// ============================================
// COMPONENT
// ============================================

// Default plan reasons for demo
const DEFAULT_PLAN_REASONS = [
  { id: 'r1', factor: 'Deadline Proximity', explanation: 'Brief has a deadline within 48 hours' },
  { id: 'r2', factor: 'Authority Impact', explanation: 'Contributes +15 to authority score' },
  { id: 'r3', factor: 'Cross-Pillar Synergy', explanation: 'Aligns with pending PR pitch' },
];

export function WorkbenchCanvas({
  item,
  mode,
  aiState,
  onExecute,
  onLaunchOrchestrate,
  onExplain,
  onSwitchToManual,
  isPlanApproved = false,
  onApprovePlan,
  planReasons = DEFAULT_PLAN_REASONS,
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
      <div className="flex flex-col h-full items-center justify-center p-4 text-center">
        <div className="w-10 h-10 mb-2 rounded-lg bg-slate-3 border border-slate-4 flex items-center justify-center">
          <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white/60 mb-0.5">
          Select an item
        </h3>
        <p className="text-xs text-white/40">
          Choose from the queue to see details.
        </p>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[item.type];
  const isIssue = item.type === 'issue';
  const ctaLabel = getCtaLabel(item.type, mode);
  const ctaStyle = getCtaStyle(isIssue);

  // Confidence gate logic (P1.5)
  const isLowConfidence = item.confidence !== undefined && item.confidence < 70;
  const requiresManualGate = isLowConfidence && mode === 'copilot';

  return (
    <div className="flex flex-col h-full">
      {/* ============================================
          HEADER (fixed) - Type, Title, AI State
          ============================================ */}
      <div className="px-4 py-3 border-b border-slate-4 shrink-0">
        {/* Row 1: Type badge + Priority + AI State */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase rounded ${typeConf.color} ${typeConf.bg}`}>
              {typeConf.icon}
              {typeConf.label}
            </span>
            {item.priority === 'critical' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase text-semantic-danger bg-semantic-danger/10 rounded">
                Critical
              </span>
            )}
          </div>
          {/* AI State indicator - compact */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${AI_PERCEPTUAL_SIGNALS[aiState].bg} ${AI_PERCEPTUAL_SIGNALS[aiState].border}`}>
            <span className={`w-2 h-2 rounded-full ${AI_PERCEPTUAL_SIGNALS[aiState].indicator} ${AI_PERCEPTUAL_SIGNALS[aiState].motion}`} />
            <span className={`font-medium ${AI_PERCEPTUAL_SIGNALS[aiState].text}`}>
              {aiState === 'idle' && 'Idle'}
              {aiState === 'evaluating' && 'Analyzing'}
              {aiState === 'ready' && 'Ready'}
              {aiState === 'executing' && 'Running'}
              {aiState === 'blocked' && 'Blocked'}
              {aiState === 'escalating' && 'Urgent'}
            </span>
          </div>
        </div>

        {/* Row 2: Title */}
        <h2 className="text-base font-semibold text-white leading-tight line-clamp-2">
          {item.title}
        </h2>

        {/* Row 3 (Copilot only): Inline AI Plan Bar - compact, no inline expand */}
        {mode === 'copilot' && (
          <div className={`mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg ${
            isPlanApproved
              ? 'bg-semantic-success/5 border border-semantic-success/30'
              : 'bg-brand-cyan/5 border border-brand-cyan/20'
          }`}>
            {/* AI indicator */}
            <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
              aiState === 'evaluating'
                ? 'bg-brand-cyan/20 text-brand-cyan animate-pulse'
                : isPlanApproved
                ? 'bg-semantic-success/20 text-semantic-success'
                : 'bg-brand-cyan/20 text-brand-cyan'
            }`}>
              {aiState === 'evaluating' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
              ) : isPlanApproved ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold">AI</span>
              )}
            </div>

            {/* Label + factor chips */}
            <span className="text-xs font-semibold text-white shrink-0">
              {aiState === 'evaluating' ? 'Analyzing...' : isPlanApproved ? 'Approved' : 'Plan'}
            </span>
            {!isPlanApproved && aiState !== 'evaluating' && (
              <span className="text-xs text-white/40 truncate flex-1 min-w-0">
                {planReasons.slice(0, 3).map(r => r.factor).join(' · ')}
              </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {!isPlanApproved && aiState !== 'evaluating' && (
                <>
                  <button
                    onClick={onExplain}
                    className="text-xs font-medium text-brand-cyan hover:text-brand-cyan/80 transition-colors"
                  >
                    Why?
                  </button>
                  <button
                    onClick={onApprovePlan}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-white bg-brand-cyan hover:bg-brand-cyan/90 rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          BODY (scrollable) - Details, metadata, preview
          Reduced padding for density; scroll is pane-internal.
          ============================================ */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 py-3 space-y-2">
          {/* Summary */}
          <p className="text-sm text-white/60 leading-relaxed">
            {item.summary}
          </p>

          {/* Metadata chips - compact row */}
          <div className="flex flex-wrap items-center gap-2">
            {item.impact?.authority !== undefined && (
              <span className="px-2 py-0.5 text-xs font-medium text-brand-iris bg-brand-iris/10 rounded">
                +{item.impact.authority} authority
              </span>
            )}
            {item.impact?.crossPillar !== undefined && (
              <span className="px-2 py-0.5 text-xs font-medium text-brand-cyan bg-brand-cyan/10 rounded">
                +{item.impact.crossPillar} hooks
              </span>
            )}
            {item.risk && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                item.risk === 'low' ? 'text-semantic-success bg-semantic-success/10' :
                item.risk === 'medium' ? 'text-semantic-warning bg-semantic-warning/10' :
                'text-semantic-danger bg-semantic-danger/10'
              }`}>
                {item.risk} risk
              </span>
            )}
            {item.confidence !== undefined && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                item.confidence >= 80 ? 'text-semantic-success bg-semantic-success/10' :
                item.confidence >= 50 ? 'text-semantic-warning bg-semantic-warning/10' :
                'text-white/50 bg-white/5'
              }`}>
                {item.confidence}%
              </span>
            )}
          </div>

          {/* Editor stub (Manual mode execution actions only) */}
          {mode === 'manual' && item.type === 'execution' && (
            <div className="p-2.5 bg-slate-3/50 border border-slate-4 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-white/50">Preview</span>
                <span className="text-[10px] text-white/30">Full editor in detail view</span>
              </div>
              <div className="h-12 bg-slate-2 rounded border border-dashed border-slate-4 flex items-center justify-center">
                <span className="text-sm text-white/30">Content preview...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          ACTION DOCK (compact sticky footer) - h-11/h-12 max
          Pinned to bottom of center pane, not a full-width runway.
          DS v3: subtle glass effect, no theatrical motion.
          ============================================ */}
      <div className="shrink-0 h-12 px-4 flex items-center border-t border-slate-4 bg-slate-1/80 backdrop-blur-sm">
        {/* Manual-required gate (P1.5) */}
        {requiresManualGate ? (
          <div className="flex-1 flex items-center justify-between gap-2">
            <button
              onClick={() => setShowConfidenceExplainer(!showConfidenceExplainer)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/50 bg-slate-4/50 border border-slate-5 rounded hover:bg-slate-4 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Manual required
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onExplain}
                className="text-xs font-medium text-brand-iris hover:text-brand-iris/80 transition-colors"
              >
                Why?
              </button>
              <button
                onClick={onSwitchToManual}
                className="px-2.5 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded transition-colors"
              >
                Switch to Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            {/* Primary CTA - right aligned */}
            <div className="flex-1" />
            <button
              onClick={onExplain}
              className="px-2.5 py-1.5 text-xs font-medium text-brand-iris bg-brand-iris/10 hover:bg-brand-iris/15 rounded-lg transition-colors"
            >
              Why?
            </button>
            <button
              onClick={handlePrimaryAction}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${ctaStyle}`}
            >
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
