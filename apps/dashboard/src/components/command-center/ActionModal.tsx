'use client';

/**
 * ActionModal v3.0 - Investigation + Decision Surface
 *
 * INTERACTION CONTRACT v3.2:
 * - Opens when user clicks card body OR "Review" button
 * - NEVER opens from Primary CTA (that executes)
 * - Centered overlay, NOT a right-side drawer
 * - Contains Primary Execute CTA for execution from modal
 * - Modal is BOTH investigation AND decision surface
 *
 * DECISION CTAs (v3.0 REQUIREMENT):
 * - Primary CTA: Executes action (same callback as card CTA)
 * - Secondary: Close + action.controls (Schedule/Edit/Assign)
 * - Footer is STICKY (visible even when content scrolls)
 *
 * EXECUTION STATES IN MODAL:
 * - idle: Default state, primary CTA enabled
 * - executing: Spinner, disabled buttons
 * - success: Green completed state, auto-close OR show deep link
 * - error: Red error state, retry button
 *
 * DISMISSAL:
 * - Click backdrop overlay (outside modal) → closes
 * - Press Escape key → closes (unless executing)
 * - Click X button → closes
 * - Click inside modal → does NOT close
 * - Auto-close on success (after brief delay)
 *
 * ACCESSIBILITY:
 * - Primary CTA receives focus when modal opens
 * - Enter key triggers primary CTA (when not disabled)
 * - Focus trapped inside modal
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useCallback, useEffect, useRef } from 'react';
import { pillarAccents, priorityStyles, modeStyles } from './pillar-accents';
import type { ActionItem, ActionSignal, ActionEvidence } from './types';
import type { ExecutionState } from './ActionCard';

// Signal tone colors - DS v3 semantic colors
const signalToneColors: Record<ActionSignal['tone'], string> = {
  positive: 'text-semantic-success',
  neutral: 'text-white/60',
  warning: 'text-semantic-warning',
  critical: 'text-semantic-danger',
};

// Evidence type icons
const evidenceIcons: Record<ActionEvidence['type'], JSX.Element> = {
  citation: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  url: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  diff: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  metric: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

interface ActionModalProps {
  action: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPrimaryAction?: (action: ActionItem) => void;
  /** v3: Full execution state for inline success/error display */
  executionState?: ExecutionState;
  /** @deprecated Use executionState instead */
  isExecuting?: boolean;
  /** v3.1: Is this action locked (requires plan upgrade) */
  isLocked?: boolean;
  /** v3.1: Callback to open upgrade modal */
  onUpgrade?: () => void;
}

function ConfidenceImpactMeter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const percentage = Math.round(value * 100);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-bold text-white">{percentage}%</span>
      </div>
      <div className="h-2 bg-[#1F1F28] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function GateWarning({ gate }: { gate: ActionItem['gate'] }) {
  if (!gate.required) return null;

  return (
    <div className="p-3 bg-semantic-warning/10 border border-semantic-warning/20 rounded-lg">
      <div className="flex items-start gap-2">
        <svg
          className="w-4 h-4 text-semantic-warning flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-semantic-warning">
            Approval Required
          </h4>
          <p className="text-[13px] text-white/60 mt-0.5">
            {gate.reason || 'This action requires approval before execution.'}
          </p>
          {gate.min_plan && (
            <p className="text-[13px] text-semantic-warning/80 mt-1">
              Available on <span className="font-semibold">{gate.min_plan}</span> plan
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isReadyState(action: ActionItem, isLocked: boolean): boolean {
  return action.confidence >= 0.8 && !action.gate.required && !isLocked;
}

/**
 * ActionModal v3.0 - Investigation + Decision Surface
 *
 * MARKER: action-modal-v3 (for CI guardrail check)
 */
export function ActionModal({
  action,
  isOpen,
  onClose,
  onPrimaryAction,
  executionState = 'idle',
  isExecuting: isExecutingDeprecated,
  isLocked = false,
  onUpgrade,
}: ActionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryCtaRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Resolve execution state (support deprecated prop)
  const isExecuting = executionState === 'executing' || isExecutingDeprecated;
  const isCompleted = executionState === 'success';
  const hasError = executionState === 'error';

  // Focus trap, escape handling, and Enter key for primary CTA
  useEffect(() => {
    if (!isOpen) return;

    // Store previous active element
    previousActiveElement.current = document.activeElement;

    // Focus the primary CTA button (accessibility requirement)
    setTimeout(() => {
      primaryCtaRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes modal (unless executing)
      if (e.key === 'Escape' && !isExecuting) {
        onClose();
      }

      // Enter triggers primary CTA (when focused in modal and CTA is enabled)
      // LOCKED ACTIONS: Enter key does NOT trigger execute (only upgrade)
      if (e.key === 'Enter' && !e.defaultPrevented) {
        const activeElement = document.activeElement;
        const isButton = activeElement?.tagName === 'BUTTON';
        const isLink = activeElement?.tagName === 'A';

        // Only trigger primary CTA if not focused on another button/link
        // DO NOT trigger execute for locked actions
        if (!isButton && !isLink && action && !isExecuting && !isCompleted && !isLocked) {
          if (onPrimaryAction && !action.gate.required) {
            e.preventDefault();
            onPrimaryAction(action);
          }
        }
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Restore focus
      (previousActiveElement.current as HTMLElement)?.focus?.();
    };
  }, [isOpen, onClose, isExecuting, action, onPrimaryAction, isCompleted, isLocked]);

  // Handle backdrop click - use onMouseDown to avoid drag-select-release-outside issues
  const handleBackdropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking directly on the backdrop overlay, not the modal content
      // Don't close while executing
      if (e.target === e.currentTarget && !isExecuting) {
        onClose();
      }
    },
    [onClose, isExecuting]
  );

  // Prevent clicks inside modal from bubbling to backdrop
  const handleModalMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // LOCKED ACTIONS: No execute, only upgrade
  const handlePrimaryClick = useCallback(() => {
    if (action && !isExecuting && !isCompleted && !isLocked) {
      if (onPrimaryAction) {
        onPrimaryAction(action);
      }
    }
  }, [action, onPrimaryAction, isExecuting, isCompleted, isLocked]);

  const handleUpgradeClick = useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    }
  }, [onUpgrade]);

  if (!isOpen || !action) return null;

  const pillarStyle = pillarAccents[action.pillar];
  const priorityStyle = priorityStyles[action.priority];
  const modeStyle = modeStyles[action.mode];
  const ready = isReadyState(action, isLocked);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
    >
      {/* Backdrop - clickable to dismiss */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm ${isExecuting ? 'cursor-wait' : 'cursor-pointer'}`}
        onMouseDown={handleBackdropMouseDown}
        aria-hidden="true"
      />

      {/* Modal Panel - flex column for sticky footer */}
      <div
        ref={modalRef}
        tabIndex={-1}
        onMouseDown={handleModalMouseDown}
        className="action-modal-v3 relative z-10 w-full max-w-lg bg-[#13131A] rounded-xl border border-[#1F1F28] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header with pillar gradient */}
        <div className={`px-5 pt-5 pb-4 bg-gradient-to-b ${pillarStyle.gradient} relative flex-shrink-0`}>
          {/* Close X button */}
          <button
            onClick={onClose}
            disabled={isExecuting}
            className={`absolute top-4 right-4 p-1.5 text-white/40 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-3 pr-8">
            {/* Pillar chip */}
            <span
              className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wide rounded ${pillarStyle.bg} ${pillarStyle.text} border ${pillarStyle.border}`}
            >
              {action.pillar}
            </span>

            {/* Priority badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1F1F28] rounded">
              <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
              <span className="text-xs text-white/70">{priorityStyle.label}</span>
            </div>

            {/* Ready state badge (only when not completed/error/locked) */}
            {ready && !isCompleted && !hasError && !isLocked && (
              <span className="px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
                Ready
              </span>
            )}

            {/* Locked badge */}
            {isLocked && (
              <span className="px-2 py-1 text-[11px] font-bold uppercase rounded bg-white/10 text-white/60 border border-white/20 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Locked
              </span>
            )}

            {/* v3: Completed state badge */}
            {isCompleted && (
              <span className="px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Completed
              </span>
            )}

            {/* v3: Error state badge */}
            {hasError && (
              <span className="px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30">
                Error
              </span>
            )}

            {/* Mode badge */}
            <span
              className={`px-2 py-1 text-[11px] font-medium uppercase tracking-wide rounded ${modeStyle.bg} ${modeStyle.text}`}
            >
              {modeStyle.label}
            </span>

            <span className="flex-1" />

            {/* Timestamp */}
            <span className="text-xs text-white/50">{formatTimestamp(action.updated_at)}</span>
          </div>

          {/* Title */}
          <h2 id="action-modal-title" className="text-lg font-semibold text-white leading-tight pr-8">
            {action.title}
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* v3: Success state inline message */}
          {isCompleted && (
            <div className="p-4 bg-semantic-success/10 border border-semantic-success/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-semantic-success/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-semantic-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-semantic-success">Action Completed</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    &quot;{action.cta.primary}&quot; was executed successfully.
                  </p>
                </div>
              </div>
              {action.deep_link && (
                <a
                  href={action.deep_link.href}
                  className="mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-semantic-success bg-semantic-success/10 hover:bg-semantic-success/20 border border-semantic-success/30 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {action.deep_link.label}
                </a>
              )}
            </div>
          )}

          {/* v3: Error state inline message */}
          {hasError && (
            <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-semantic-danger/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-semantic-danger" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-semantic-danger">Action Failed</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    Failed to execute &quot;{action.cta.primary}&quot;. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* v3.1: Locked action upgrade prompt */}
          {isLocked && (
            <div className="p-4 bg-brand-iris/10 border border-brand-iris/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-iris/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-brand-iris">Pro Feature</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    This action requires the {action.gate.min_plan || 'Pro'} plan. Upgrade to unlock this and other premium features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Why This Matters - uses action.why */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
              Why This Matters
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">{action.why}</p>
          </div>

          {/* Recommended Next Step */}
          <div className="p-3 bg-semantic-success/5 border border-semantic-success/20 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-semantic-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div>
                <h4 className="text-xs font-semibold text-semantic-success uppercase tracking-wide mb-1">
                  Recommended Next Step
                </h4>
                <p className="text-sm text-white/70">{action.recommended_next_step}</p>
              </div>
            </div>
          </div>

          {/* Signals */}
          {action.signals && action.signals.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Key Signals
              </h3>
              <div className="flex flex-wrap gap-3">
                {action.signals.map((signal, idx) => (
                  <div key={idx} className="px-3 py-2 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg">
                    <span className="text-xs text-white/50 block mb-0.5">{signal.label}</span>
                    <span className={`text-sm font-bold ${signalToneColors[signal.tone]}`}>
                      {signal.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">
              AI Analysis
            </h3>
            <div className="flex gap-4">
              <ConfidenceImpactMeter label="Confidence" value={action.confidence} color="bg-brand-cyan" />
              <ConfidenceImpactMeter label="Impact" value={action.impact} color="bg-brand-iris" />
            </div>
          </div>

          {/* Gate Warning */}
          <GateWarning gate={action.gate} />

          {/* Guardrails */}
          {action.guardrails && action.guardrails.length > 0 && (
            <div className="p-3 bg-semantic-warning/5 border border-semantic-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-semantic-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="text-xs font-semibold text-semantic-warning uppercase tracking-wide mb-1">
                    Guardrails
                  </h4>
                  <ul className="space-y-1">
                    {action.guardrails.map((guardrail, idx) => (
                      <li key={idx} className="text-sm text-white/60">{guardrail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Evidence */}
          {action.evidence && action.evidence.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Evidence
              </h3>
              <div className="space-y-2">
                {action.evidence.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-white/40 flex-shrink-0">
                        {evidenceIcons[item.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-white/50 block">{item.label}</span>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-cyan hover:underline truncate block"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className="text-sm text-white/80">{item.value}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep Link to Work Surface (only when NOT completed - completed shows above) */}
          {action.deep_link && !isCompleted && (
            <div className="pt-2">
              <a
                href={action.deep_link.href}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-cyan bg-brand-cyan/10 hover:bg-brand-cyan/15 border border-brand-cyan/25 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {action.deep_link.label}
              </a>
            </div>
          )}
        </div>

        {/* STICKY Footer with Decision CTAs (v3.0 REQUIREMENT) */}
        <div className="px-5 py-4 bg-[#0D0D12] border-t border-[#1F1F28] flex-shrink-0">
          {/* Controls row (optional) - Left side */}
          {action.controls && action.controls.length > 0 && !isCompleted && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#1F1F28]">
              {action.controls.includes('schedule') && (
                <button
                  onClick={() => {/* TODO: Open schedule picker */}}
                  disabled={isExecuting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white bg-[#1F1F28] hover:bg-[#2A2A36] rounded-lg transition-colors ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </button>
              )}
              {action.controls.includes('edit') && action.deep_link && (
                <a
                  href={action.deep_link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white bg-[#1F1F28] hover:bg-[#2A2A36] rounded-lg transition-colors ${isExecuting ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </a>
              )}
              {action.controls.includes('assign') && (
                <button
                  onClick={() => {/* TODO: Open assignee picker */}}
                  disabled={isExecuting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white bg-[#1F1F28] hover:bg-[#2A2A36] rounded-lg transition-colors ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Assign
                </button>
              )}
            </div>
          )}

          {/* CTA buttons - Primary Execute/Unlock + Close */}
          <div className="flex items-center gap-3">
            {/* LOCKED ACTIONS: Show "Unlock Pro" instead of Execute */}
            {isLocked ? (
              <button
                ref={primaryCtaRef}
                onClick={handleUpgradeClick}
                className="modal-primary-cta modal-upgrade-cta flex-1 px-4 py-2.5 text-sm font-bold rounded-lg
                  transition-all duration-200 flex items-center justify-center gap-2
                  bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.3)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Unlock Pro
              </button>
            ) : !isCompleted ? (
              /* Primary Execute CTA (v3.0 REQUIREMENT) */
              <button
                ref={primaryCtaRef}
                onClick={handlePrimaryClick}
                disabled={isExecuting || action.gate.required}
                className={`
                  modal-primary-cta
                  flex-1 px-4 py-2.5 text-sm font-bold rounded-lg
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${isExecuting ? 'opacity-70 cursor-wait' : ''}
                  ${action.gate.required ? 'opacity-50 cursor-not-allowed' : ''}
                  ${hasError
                    ? 'bg-semantic-danger text-white hover:bg-semantic-danger/90'
                    : ready && !action.gate.required
                    ? 'bg-semantic-success text-white hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.3)]'
                    : `${pillarStyle.solidBg} text-white hover:opacity-90`
                  }
                `}
              >
                {isExecuting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Executing...</span>
                  </>
                ) : hasError ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </>
                ) : (
                  action.cta.primary
                )}
              </button>
            ) : (
              /* Completed state - show "Done" button that closes modal */
              <button
                ref={primaryCtaRef}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg bg-semantic-success/20 text-semantic-success flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Done
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              disabled={isExecuting}
              className={`modal-close-cta px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-[#1F1F28] hover:bg-[#2A2A36] rounded-lg transition-colors ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionModal;
