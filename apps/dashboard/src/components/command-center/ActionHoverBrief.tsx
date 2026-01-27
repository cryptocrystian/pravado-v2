'use client';

/**
 * ActionHoverBrief v5.1 - Anchored Popover Micro-Brief with Execute CTA
 *
 * PLACEMENT: Inside Action Stream column, to the left of hovered card
 *
 * CONTENT SECTIONS:
 * - WHY: 2-3 lines explaining strategic importance
 * - NEXT STEP: Single line with recommended action
 * - SIGNALS: Key metrics/data points (max 3)
 * - GUARDRAILS: Warnings/constraints (max 2)
 * - PRIMARY CTA: Execute button for quick action (v5.1)
 *
 * INTERACTION CONTRACT:
 * - Opens on hover (~200ms delay)
 * - Closes on leave (~250ms delay)
 * - Stays open when cursor moves into popover
 * - Only one popover open at a time (coordinated externally)
 * - Primary CTA executes action without opening modal (v5.1)
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import type { ActionItem, ActionSignal, Pillar } from './types';
import type { ExecutionState } from './ActionCard';

// Signal tone colors - DS v3 semantic colors
const signalToneColors: Record<ActionSignal['tone'], string> = {
  positive: 'text-semantic-success',
  neutral: 'text-white/60',
  warning: 'text-semantic-warning',
  critical: 'text-semantic-danger',
};

// Pillar accent colors for header and CTA
const pillarColors: Record<Pillar, { text: string; bg: string; bgHover: string }> = {
  pr: {
    text: 'text-brand-magenta',
    bg: 'bg-brand-magenta',
    bgHover: 'hover:bg-brand-magenta/90',
  },
  content: {
    text: 'text-brand-iris',
    bg: 'bg-brand-iris',
    bgHover: 'hover:bg-brand-iris/90',
  },
  seo: {
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan',
    bgHover: 'hover:bg-brand-cyan/90',
  },
};

interface ActionHoverBriefProps {
  action: ActionItem;
  /** v5.1: Callback to execute the primary action */
  onPrimaryAction?: () => void;
  /** v5.1: Current execution state */
  executionState?: ExecutionState;
  /** v6: Is this action locked (requires plan upgrade) */
  isLocked?: boolean;
}

/**
 * ActionHoverBrief v5.1 - Micro-brief with inline Execute CTA
 *
 * MARKER: action-hover-brief-v5 (for CI guardrail check)
 */
export function ActionHoverBrief({
  action,
  onPrimaryAction,
  executionState = 'idle',
  isLocked = false,
}: ActionHoverBriefProps) {
  const pillarStyle = pillarColors[action.pillar];
  const isExecuting = executionState === 'executing';
  const isCompleted = executionState === 'success';
  const hasError = executionState === 'error';
  const isGated = action.gate.required;
  const isReady = action.confidence >= 0.8 && !isGated && !isLocked;

  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    if (onPrimaryAction && !isExecuting && !isCompleted && !isGated) {
      onPrimaryAction();
    }
  };

  return (
    <div className="action-hover-brief-v5 space-y-3 max-h-[320px] overflow-y-auto">
      {/* Header: Title with pillar accent */}
      <div className="pb-2 border-b border-white/10">
        <h4 className={`text-sm font-semibold ${pillarStyle.text} line-clamp-2 leading-snug`}>
          {action.title}
        </h4>
      </div>

      {/* WHY Section */}
      {action.why && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Why Now</span>
          </div>
          <p className="text-[13px] text-white/75 leading-relaxed line-clamp-3">
            {action.why}
          </p>
        </div>
      )}

      {/* NEXT STEP Section */}
      {action.recommended_next_step && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Next Step</span>
          </div>
          <p className="text-[13px] text-white/80 leading-snug line-clamp-2">
            {action.recommended_next_step}
          </p>
        </div>
      )}

      {/* SIGNALS Section */}
      {action.signals && action.signals.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Signals</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {action.signals.slice(0, 3).map((signal, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{signal.label}</span>
                <span className={`text-xs font-bold ${signalToneColors[signal.tone]}`}>
                  {signal.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GUARDRAILS Section */}
      {action.guardrails && action.guardrails.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-semantic-warning/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-semantic-warning/70">Guardrails</span>
          </div>
          <div className="space-y-1">
            {action.guardrails.slice(0, 2).map((guardrail, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 text-[13px] text-semantic-warning/80"
              >
                <span className="text-[10px] mt-0.5">⚠</span>
                <span className="line-clamp-2">{guardrail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* v5.1: Primary Execute CTA Footer */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        {/* Locked state messaging */}
        {isLocked && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 border border-white/15 rounded text-xs text-white/60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Requires {action.gate.min_plan || 'Pro'} plan</span>
          </div>
        )}

        {/* Execution state feedback - only for non-locked */}
        {!isLocked && isCompleted && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-semantic-success/10 border border-semantic-success/30 rounded text-xs text-semantic-success">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Completed</span>
          </div>
        )}

        {!isLocked && hasError && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-semantic-danger/10 border border-semantic-danger/30 rounded text-xs text-semantic-danger">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>Failed - try again</span>
          </div>
        )}

        {/* Primary CTA Button - Execute for active, nothing for locked */}
        {onPrimaryAction && !isCompleted && !isLocked && (
          <button
            onClick={handleExecute}
            disabled={isExecuting || isGated}
            className={`
              hover-brief-cta w-full px-3 py-2 text-xs font-bold rounded-lg
              transition-all duration-200 flex items-center justify-center gap-2
              ${isExecuting ? 'opacity-70 cursor-wait' : ''}
              ${isGated ? 'opacity-50 cursor-not-allowed bg-white/10 text-white/50' : ''}
              ${hasError
                ? 'bg-semantic-danger text-white hover:bg-semantic-danger/90'
                : isReady && !isGated
                ? 'bg-semantic-success text-white hover:bg-semantic-success/90 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                : !isGated
                ? `${pillarStyle.bg} text-white ${pillarStyle.bgHover}`
                : ''
              }
            `}
          >
            {isExecuting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Executing...</span>
              </>
            ) : hasError ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retry</span>
              </>
            ) : isGated ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Requires {action.gate.min_plan}</span>
              </>
            ) : (
              action.cta.primary
            )}
          </button>
        )}

        {/* Fallback hint for non-locked without action handler */}
        {!onPrimaryAction && !isCompleted && !isLocked && (
          <p className="text-[10px] text-white/40 text-center">
            Click card to review full details
          </p>
        )}

        {/* Locked action hint */}
        {isLocked && (
          <p className="text-[10px] text-white/40 text-center">
            Click &ldquo;Unlock Pro&rdquo; to upgrade
          </p>
        )}
      </div>
    </div>
  );
}

export default ActionHoverBrief;
