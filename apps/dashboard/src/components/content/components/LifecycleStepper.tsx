'use client';

/**
 * Lifecycle Stepper Component
 *
 * Displays content lifecycle states: Draft → Review → Approved → Published
 * Integrates CiteMind gating for transitions.
 * Mode-aware labels per AUTOMATION_MODES_UX canon.
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 * @see /docs/canon/AUTOMATION_MODES_UX.md
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

import { card, text, label, interactive, border, modeTokens } from '../tokens';
import type { CiteMindStatus, AutomationMode } from '../types';

// ============================================
// TYPES
// ============================================

export type LifecycleStatus = 'draft' | 'review' | 'approved' | 'published';

export interface LifecycleStepperProps {
  /** Current lifecycle status */
  currentStatus: LifecycleStatus;
  /** CiteMind status - affects transition eligibility */
  citeMindStatus: CiteMindStatus;
  /** Automation mode for current context */
  automationMode?: AutomationMode;
  /** Whether warning has been acknowledged */
  warningAcknowledged?: boolean;
  /** Callback when transition is requested */
  onTransition?: (from: LifecycleStatus, to: LifecycleStatus) => void;
  /** Whether a transition is in progress */
  isTransitioning?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

// ============================================
// STEP CONFIG
// ============================================

interface StepConfig {
  status: LifecycleStatus;
  label: string;
  description: string;
  /** Mode ceiling per AUTOMATE_EXECUTION_MODEL - highest mode allowed */
  modeCeiling: AutomationMode;
  /** Mode-aware description per AUTOMATION_MODES_UX */
  modeDescriptions: Record<AutomationMode, string>;
  icon: React.ReactNode;
}

/**
 * Lifecycle steps with mode ceilings per CONTENT_WORK_SURFACE_CONTRACT.md Section 7.4
 * - Publishing = Manual only (irreversible, brand-affecting)
 * - Draft creation = Copilot max (human must review)
 */
const STEPS: StepConfig[] = [
  {
    status: 'draft',
    label: 'Draft',
    description: 'Content in progress',
    modeCeiling: 'copilot',
    modeDescriptions: {
      manual: 'Create draft manually',
      copilot: 'AI assists drafting, you review',
      autopilot: 'N/A (Copilot max)',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    status: 'review',
    label: 'Review',
    description: 'Awaiting approval',
    modeCeiling: 'copilot',
    modeDescriptions: {
      manual: 'Submit for manual review',
      copilot: 'AI pre-checks, you approve',
      autopilot: 'N/A (requires human approval)',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    status: 'approved',
    label: 'Approved',
    description: 'Ready to publish',
    modeCeiling: 'copilot',
    modeDescriptions: {
      manual: 'Approved - awaiting manual publish',
      copilot: 'Approved - schedule with AI assist',
      autopilot: 'N/A (publish is manual only)',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    status: 'published',
    label: 'Published',
    description: 'Live content',
    modeCeiling: 'manual',
    modeDescriptions: {
      manual: 'Published - live and visible',
      copilot: 'N/A (manual publish only)',
      autopilot: 'N/A (manual publish only)',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ============================================
// HELPERS
// ============================================

function getStepIndex(status: LifecycleStatus): number {
  return STEPS.findIndex((s) => s.status === status);
}

function getNextStatus(current: LifecycleStatus): LifecycleStatus | null {
  const transitions: Record<LifecycleStatus, LifecycleStatus | null> = {
    draft: 'review',
    review: 'approved',
    approved: 'published',
    published: null,
  };
  return transitions[current];
}

function getTransitionLabel(current: LifecycleStatus): string {
  const labels: Record<LifecycleStatus, string> = {
    draft: 'Submit for Review',
    review: 'Approve',
    approved: 'Publish',
    published: 'Published',
  };
  return labels[current];
}

// ============================================
// MODE BADGE COMPONENT (per AUTOMATION_MODES_UX)
// ============================================

function ModeBadge({ mode, compact = false }: { mode: AutomationMode; compact?: boolean }) {
  const config = modeTokens[mode];
  return (
    <span
      className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'} font-medium rounded-full ${config.bg} ${config.text} border ${config.border}`}
      title={config.description}
    >
      {mode === 'manual' && (
        <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v.5a.5.5 0 001 0V4a1 1 0 012 0v5.5a.5.5 0 001 0V3z" clipRule="evenodd" />
        </svg>
      )}
      {mode === 'copilot' && (
        <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
      )}
      {mode === 'autopilot' && (
        <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      )}
      {config.label}
    </span>
  );
}

// ============================================
// MODE CEILING INDICATOR
// ============================================

function ModeCeilingIndicator({ ceiling, currentMode }: { ceiling: AutomationMode; currentMode: AutomationMode }) {
  const modeOrder: AutomationMode[] = ['manual', 'copilot', 'autopilot'];
  const ceilingIndex = modeOrder.indexOf(ceiling);
  const currentIndex = modeOrder.indexOf(currentMode);
  const isAboveCeiling = currentIndex > ceilingIndex;

  if (isAboveCeiling) {
    return (
      <span className="text-[9px] text-semantic-warning flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Mode ceiling: {modeTokens[ceiling].label}
      </span>
    );
  }
  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LifecycleStepper({
  currentStatus,
  citeMindStatus,
  // Default to manual (most restrictive) per AUTOMATION_MODES_UX.md mode ceiling principle
  automationMode = 'manual',
  warningAcknowledged = false,
  onTransition,
  isTransitioning = false,
  compact = false,
}: LifecycleStepperProps) {
  const currentIndex = getStepIndex(currentStatus);
  const nextStatus = getNextStatus(currentStatus);
  const currentStep = STEPS[currentIndex];
  const nextStep = nextStatus ? STEPS[getStepIndex(nextStatus)] : null;

  // Determine if transitions are blocked
  const isBlocked = citeMindStatus === 'blocked';
  const needsAck = citeMindStatus === 'warning' && !warningAcknowledged;

  // Check mode ceiling per AUTOMATE_EXECUTION_MODEL
  const modeOrder: AutomationMode[] = ['manual', 'copilot', 'autopilot'];
  const nextStepCeiling = nextStep?.modeCeiling || 'manual';
  const isAboveModeCeiling = modeOrder.indexOf(automationMode) > modeOrder.indexOf(nextStepCeiling);
  const effectiveMode: AutomationMode = isAboveModeCeiling ? nextStepCeiling : automationMode;

  const canTransition = !isBlocked && !needsAck && nextStatus !== null;

  return (
    <div className={`${card.base} ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={label}>Content Lifecycle</h3>
          <ModeBadge mode={effectiveMode} compact />
        </div>
        {isBlocked && (
          <span className="px-2 py-0.5 text-[10px] font-medium text-semantic-danger bg-semantic-danger/10 border border-semantic-danger/20 rounded-full">
            Blocked
          </span>
        )}
        {needsAck && (
          <span className="px-2 py-0.5 text-[10px] font-medium text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/20 rounded-full">
            Acknowledge warnings
          </span>
        )}
      </div>

      {/* Mode-aware description */}
      {!compact && currentStep && (
        <p className={`text-[10px] ${text.hint} mb-3`}>
          {currentStep.modeDescriptions[effectiveMode]}
        </p>
      )}

      {/* Steps */}
      <div className="relative">
        {/* Progress line */}
        <div className={`absolute top-4 left-4 right-4 h-0.5 bg-slate-4 ${compact ? 'top-3' : ''}`}>
          <div
            className="h-full bg-brand-iris transition-all duration-500"
            style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div
                key={step.status}
                className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-2'}`}
              >
                {/* Step circle */}
                <div
                  className={`
                    relative z-10 flex items-center justify-center rounded-full transition-all
                    ${compact ? 'w-6 h-6' : 'w-8 h-8'}
                    ${isCompleted ? 'bg-brand-iris text-white' : ''}
                    ${isCurrent ? 'bg-brand-iris/20 text-brand-iris border-2 border-brand-iris' : ''}
                    ${isFuture ? 'bg-slate-3 text-white/30 border border-slate-4' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg className={compact ? 'w-3 h-3' : 'w-4 h-4'} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={compact ? 'scale-75' : ''}>{step.icon}</span>
                  )}
                </div>

                {/* Label */}
                {!compact && (
                  <div className="text-center">
                    <p className={`text-xs font-medium ${isCurrent ? 'text-brand-iris' : isFuture ? text.hint : text.primary}`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] ${text.hint} hidden sm:block`}>
                      {step.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transition Button */}
      {nextStatus && (
        <div className={`${compact ? 'mt-3' : 'mt-4'}`}>
          {/* Mode ceiling warning if autopilot but publish requires manual */}
          {isAboveModeCeiling && nextStep && (
            <div className="mb-2 p-2 bg-semantic-warning/5 border border-semantic-warning/20 rounded-lg">
              <ModeCeilingIndicator ceiling={nextStep.modeCeiling} currentMode={automationMode} />
            </div>
          )}

          <button
            onClick={() => onTransition?.(currentStatus, nextStatus)}
            disabled={!canTransition || isTransitioning}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              canTransition && !isTransitioning
                ? interactive.primary
                : 'bg-slate-4 text-white/30 cursor-not-allowed'
            }`}
          >
            {isTransitioning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {getTransitionLabel(currentStatus)}
                {/* Show mode indicator on button */}
                <ModeBadge mode={effectiveMode} compact />
              </span>
            )}
          </button>

          {isBlocked && (
            <p className={`text-[10px] text-semantic-danger text-center mt-2`}>
              Resolve CiteMind issues to proceed
            </p>
          )}
          {needsAck && (
            <p className={`text-[10px] text-semantic-warning text-center mt-2`}>
              Acknowledge warnings to proceed
            </p>
          )}
        </div>
      )}

      {/* Published state */}
      {currentStatus === 'published' && (
        <div className={`${compact ? 'mt-3' : 'mt-4'} p-3 bg-semantic-success/10 border ${border.default} rounded-lg`}>
          <p className="text-xs text-semantic-success font-medium text-center">
            Content is live and published
          </p>
        </div>
      )}
    </div>
  );
}

export default LifecycleStepper;
