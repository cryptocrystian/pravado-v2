/**
 * AI Perceptual States - Shared Cross-Pillar Module
 *
 * Implements AI Visual Communication Canon §2 (AI Perceptual States).
 * This module is shared across all pillars (Content, PR, SEO) for
 * consistent AI state communication.
 *
 * CANON COMPLIANCE:
 * - §2.1: Six distinct perceptual states (idle, evaluating, ready, executing, blocked, escalating)
 * - §2.2: Transitions must be perceptible (no instantaneous changes)
 * - §2.3: State hierarchy for simultaneous operations
 * - §3.1: Confidence tiers mapped to visual behavior
 * - §7: Anti-patterns avoided (no decorative motion, no theatrical animation)
 *
 * STATE SEMANTICS (strict):
 * - Idle: calm, no motion, low emphasis
 * - Evaluating: subtle, continuous "working" signal (NOT spinner everywhere)
 * - Ready: short transition indicating readiness (one-time, not looping)
 * - Executing: indeterminate→determinate progress where possible
 * - Blocked: no motion; strong constraint feel; actions disabled
 * - Escalating: higher salience than blocked; bounded motion tied to real urgency
 *
 * @see /docs/canon/AI_VISUAL_COMMUNICATION_CANON.md
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 */

// ============================================
// AI PERCEPTUAL STATE TYPE
// ============================================

/**
 * AI Perceptual State - The six canonical states per AI_VISUAL_COMMUNICATION_CANON §2.1
 *
 * These are perceptual categories that users must be able to identify without reading text.
 */
export type AIPerceptualState =
  | 'idle'        // No AI activity in progress; system waiting for input
  | 'evaluating'  // AI is analyzing, but no output yet; outcome unknown
  | 'ready'       // AI has reached a conclusion with confidence; has recommendation
  | 'executing'   // AI is performing an approved action; irreversible change in progress
  | 'blocked'     // AI cannot proceed without intervention; user action required
  | 'escalating'; // Urgency has increased; window is closing; immediate attention warranted

/**
 * State hierarchy for when multiple AI operations occur simultaneously.
 * Per §2.3: Most urgent state takes visual precedence.
 *
 * Escalating > Blocked > Executing > Evaluating > Ready > Idle
 */
export const AI_STATE_PRIORITY: Record<AIPerceptualState, number> = {
  escalating: 6,
  blocked: 5,
  executing: 4,
  evaluating: 3,
  ready: 2,
  idle: 1,
};

// ============================================
// VISUAL SIGNAL MAPPING
// ============================================

/**
 * AI Perceptual Signal - Maps each state to visual expression tokens.
 *
 * IMPORTANT: Uses DS tokens only (no hardcoded hex values).
 * These classes compose to create the visual signal for each state.
 */
export interface AIPerceptualSignal {
  /** Semantic description of the state */
  label: string;
  /** Dot/ring indicator color class */
  indicator: string;
  /** Background tint class (subtle) */
  bg: string;
  /** Border accent class */
  border: string;
  /** Text color class */
  text: string;
  /** Motion class (if any) - per canon, idle has NO motion */
  motion: string;
  /** Ring glow class for ambient indicator */
  glow: string;
  /** Transition timing class */
  transition: string;
}

/**
 * Visual signal mapping for each AI perceptual state.
 *
 * Design rationale:
 * - Idle: No visual emphasis, no motion
 * - Evaluating: Subtle cyan pulse (AI working), continuous but subtle
 * - Ready: Iris/purple stable glow (AI has recommendation)
 * - Executing: Iris with determinate feel (action in progress)
 * - Blocked: Semantic danger, NO motion (static constraint)
 * - Escalating: Warning with bounded pulse (real urgency only)
 */
export const AI_PERCEPTUAL_SIGNALS: Record<AIPerceptualState, AIPerceptualSignal> = {
  idle: {
    label: 'Idle',
    indicator: 'bg-white/20',
    bg: 'bg-transparent',
    border: 'border-border-subtle',
    text: 'text-white/40',
    motion: '', // No motion for idle per §2.2
    glow: '',
    transition: 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
  },
  evaluating: {
    label: 'Evaluating',
    indicator: 'bg-brand-cyan',
    bg: 'bg-brand-cyan/5',
    border: 'border-brand-cyan/30',
    text: 'text-brand-cyan',
    motion: 'animate-pulse', // Subtle continuous signal per §2.1
    glow: 'shadow-[0_0_8px_rgba(0,217,255,0.15)]',
    transition: 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
  },
  ready: {
    label: 'Ready',
    indicator: 'bg-brand-iris',
    bg: 'bg-brand-iris/5',
    border: 'border-brand-iris/30',
    text: 'text-brand-iris',
    motion: '', // Ready is stable, not looping - one-time transition handled in component
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.20)]',
    transition: 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
  },
  executing: {
    label: 'Executing',
    indicator: 'bg-brand-iris',
    bg: 'bg-brand-iris/10',
    border: 'border-brand-iris/40',
    text: 'text-brand-iris',
    motion: 'animate-[shimmer_2s_ease-in-out_infinite]', // Subtle in-progress signal
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.25)]',
    transition: 'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
  },
  blocked: {
    label: 'Blocked',
    indicator: 'bg-semantic-danger',
    bg: 'bg-semantic-danger/5',
    border: 'border-semantic-danger/30',
    text: 'text-semantic-danger',
    motion: '', // NO motion for blocked per §2.2 - static constraint feel
    glow: '',
    transition: 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
  },
  escalating: {
    label: 'Urgent',
    indicator: 'bg-semantic-warning',
    bg: 'bg-semantic-warning/10',
    border: 'border-semantic-warning/40',
    text: 'text-semantic-warning',
    motion: 'animate-pulse', // Bounded pulse for real urgency only
    glow: 'shadow-[0_0_12px_rgba(234,179,8,0.20)]',
    transition: 'transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
  },
};

// ============================================
// STATE DERIVATION UTILITIES
// ============================================

/** Generic status type that works across pillars */
export type GenericGateStatus = 'pending' | 'analyzing' | 'passed' | 'warning' | 'blocked';

/** Generic automation mode */
export type GenericAutomationMode = 'manual' | 'copilot' | 'autopilot';

/**
 * Derive AI perceptual state from UI signals.
 *
 * This function maps pillar state to canonical AI perceptual states
 * without requiring pillar-specific backend state.
 *
 * @returns The derived AI perceptual state
 */
export function deriveAIPerceptualState(params: {
  /** Loading state */
  isLoading?: boolean;
  /** Validating/refreshing state */
  isValidating?: boolean;
  /** Gate status (CiteMind or similar) */
  gateStatus?: GenericGateStatus;
  /** Whether an action is ready to execute */
  isActionReady?: boolean;
  /** Whether execution is in progress */
  isExecuting?: boolean;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Whether there's a deadline within 24 hours */
  hasUrgentDeadline?: boolean;
  /** Priority level */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  /** Current automation mode */
  mode?: GenericAutomationMode;
}): AIPerceptualState {
  const {
    isLoading = false,
    isValidating = false,
    gateStatus = 'pending',
    isActionReady = false,
    isExecuting = false,
    isSaving = false,
    hasUrgentDeadline = false,
    priority,
  } = params;

  // Priority order per §2.3: Escalating > Blocked > Executing > Evaluating > Ready > Idle

  // Escalating: Real urgency (deadline + critical/high priority)
  if (hasUrgentDeadline && (priority === 'critical' || priority === 'high')) {
    return 'escalating';
  }

  // Blocked: Gate blocked status or critical issues
  if (gateStatus === 'blocked') {
    return 'blocked';
  }

  // Executing: Active execution or save in progress
  if (isExecuting || isSaving) {
    return 'executing';
  }

  // Evaluating: Loading, validating, or analyzing
  if (isLoading || isValidating || gateStatus === 'analyzing') {
    return 'evaluating';
  }

  // Ready: Action is ready to execute (gate passed)
  if (isActionReady && gateStatus === 'passed') {
    return 'ready';
  }

  // Idle: Default state - no AI activity
  return 'idle';
}

/**
 * Derive urgency from deadline proximity.
 * Returns true if deadline is within 24 hours.
 */
export function deriveUrgencyFromDeadline(dueAt: string | Date | undefined): boolean {
  if (!dueAt) return false;
  const deadline = typeof dueAt === 'string' ? new Date(dueAt) : dueAt;
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const hours24 = 24 * 60 * 60 * 1000;
  return diff > 0 && diff < hours24;
}

/**
 * Get the highest-priority state from multiple states.
 * Per §2.3: When multiple AI operations occur simultaneously,
 * the most urgent state takes visual precedence.
 */
export function getHighestPriorityState(states: AIPerceptualState[]): AIPerceptualState {
  if (states.length === 0) return 'idle';

  return states.reduce((highest, current) => {
    return AI_STATE_PRIORITY[current] > AI_STATE_PRIORITY[highest] ? current : highest;
  }, 'idle' as AIPerceptualState);
}

// ============================================
// CONFIDENCE LEVEL MAPPING
// ============================================

/**
 * Confidence level per AI_VISUAL_COMMUNICATION_CANON §3.1
 */
export type ConfidenceLevel = 'high' | 'moderate' | 'low';

/**
 * Map numeric confidence (0-100) to confidence level.
 * Per AUTOMATE_EXECUTION_MODEL §3.3 thresholds.
 */
export function getConfidenceLevel(confidence: number | undefined): ConfidenceLevel {
  if (confidence === undefined) return 'moderate';
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'moderate';
  return 'low';
}

/**
 * Visual tokens for confidence levels.
 */
export const CONFIDENCE_SIGNALS: Record<ConfidenceLevel, { bg: string; text: string; label: string }> = {
  high: {
    bg: 'bg-semantic-success/10',
    text: 'text-semantic-success',
    label: 'High',
  },
  moderate: {
    bg: 'bg-semantic-warning/10',
    text: 'text-semantic-warning',
    label: 'Moderate',
  },
  low: {
    bg: 'bg-slate-4',
    text: 'text-white/50',
    label: 'Low',
  },
};
