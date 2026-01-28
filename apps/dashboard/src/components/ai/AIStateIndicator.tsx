/**
 * AI State Indicator Components - Shared Cross-Pillar
 *
 * Visual indicators for AI Perceptual States.
 * Implements AI_VISUAL_COMMUNICATION_CANON §2.
 *
 * Used by both Content and PR pillars for consistent AI state communication.
 *
 * Two indicator types per surface requirement:
 * 1. Ambient Indicator - Subtle, persistent header-level indicator
 * 2. Local Indicator - Contextual, near affected object (card/action)
 *
 * STATE SEMANTICS (visual behavior):
 * - Idle: No emphasis, no motion
 * - Evaluating: Subtle pulse, cyan tint
 * - Ready: Stable glow, one-time scale transition
 * - Executing: Shimmer effect, iris tint
 * - Blocked: Static, red tint, no motion
 * - Escalating: Bounded pulse, warning tint
 *
 * @see /docs/canon/AI_VISUAL_COMMUNICATION_CANON.md
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { AIPerceptualState } from './ai-perception';
import { AI_PERCEPTUAL_SIGNALS } from './ai-perception';

// ============================================
// AMBIENT INDICATOR (Header-level)
// ============================================

interface AmbientAIIndicatorProps {
  /** Current AI perceptual state */
  state: AIPerceptualState;
  /** Optional size variant */
  size?: 'sm' | 'md';
  /** Show label alongside indicator */
  showLabel?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Ambient AI State Indicator
 *
 * A subtle, persistent indicator that shows the current AI state.
 * Placed in headers or persistent UI areas.
 *
 * Per canon §2.2: Transitions between states must be perceptible.
 * We use CSS transitions for smooth state changes.
 */
export function AmbientAIIndicator({
  state,
  size = 'md',
  showLabel = false,
  className = '',
}: AmbientAIIndicatorProps) {
  const signal = AI_PERCEPTUAL_SIGNALS[state];
  const prevStateRef = useRef<AIPerceptualState>(state);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Track state transitions for one-time ready animation
  useEffect(() => {
    if (prevStateRef.current !== state) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      prevStateRef.current = state;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state]);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  };

  const containerSizeClasses = {
    sm: 'gap-1.5 px-1.5 py-0.5',
    md: 'gap-2 px-2 py-1',
  };

  // Ready state gets one-time scale animation on transition
  const readyTransition = state === 'ready' && isTransitioning
    ? 'scale-125'
    : '';

  return (
    <div
      className={`
        inline-flex items-center rounded-full
        ${containerSizeClasses[size]}
        ${signal.bg}
        ${signal.border ? `border ${signal.border}` : ''}
        ${signal.glow}
        ${signal.transition}
        ${className}
      `}
    >
      {/* State dot with motion */}
      <span
        className={`
          ${sizeClasses[size]}
          rounded-full
          ${signal.indicator}
          ${signal.motion}
          ${readyTransition}
          ${signal.transition}
        `}
      />

      {/* Optional label */}
      {showLabel && (
        <span className={`text-[10px] font-medium ${signal.text}`}>
          {signal.label}
        </span>
      )}
    </div>
  );
}

// ============================================
// LOCAL INDICATOR (Card/Action-level)
// ============================================

interface LocalAIIndicatorProps {
  /** Current AI perceptual state */
  state: AIPerceptualState;
  /** Additional class names */
  className?: string;
}

/**
 * Local AI State Indicator
 *
 * A contextual indicator placed near affected objects (cards, actions).
 * Shows state transitions for individual items.
 *
 * Per canon §2.2: The visual distinction between Evaluating and Executing
 * must be unambiguous.
 */
export function LocalAIIndicator({ state, className = '' }: LocalAIIndicatorProps) {
  const signal = AI_PERCEPTUAL_SIGNALS[state];

  // Idle state shows nothing - per §2.2: Idle is absence of indicators
  if (state === 'idle') {
    return null;
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded
        ${signal.bg}
        ${signal.border ? `border ${signal.border}` : ''}
        ${signal.transition}
        ${className}
      `}
    >
      <span
        className={`
          w-1.5 h-1.5 rounded-full
          ${signal.indicator}
          ${signal.motion}
        `}
      />
      <span className={`text-[10px] font-medium ${signal.text}`}>
        {signal.label}
      </span>
    </div>
  );
}

// ============================================
// STATE-AWARE DOT (Minimal indicator)
// ============================================

interface AIStateDotProps {
  /** Current AI perceptual state */
  state: AIPerceptualState;
  /** Size of the dot */
  size?: 'xs' | 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

/**
 * Minimal AI State Dot
 *
 * The simplest form of state indication - just a colored dot.
 * Use for compact layouts or as secondary indicator.
 */
export function AIStateDot({ state, size = 'sm', className = '' }: AIStateDotProps) {
  const signal = AI_PERCEPTUAL_SIGNALS[state];

  // Idle shows a very subtle dot
  const idleClasses = state === 'idle' ? 'opacity-30' : '';

  const sizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <span
      className={`
        ${sizeClasses[size]}
        rounded-full
        ${signal.indicator}
        ${signal.motion}
        ${signal.transition}
        ${idleClasses}
        ${className}
      `}
    />
  );
}

// ============================================
// RING INDICATOR (For cards/panels)
// ============================================

interface AIStateRingProps {
  /** Current AI perceptual state */
  state: AIPerceptualState;
  /** Children to wrap */
  children: React.ReactNode;
  /** Additional class names for the ring container */
  className?: string;
  /** Whether to show state on left edge as accent bar */
  showAccentBar?: boolean;
}

/**
 * AI State Ring Wrapper
 *
 * Wraps content with a subtle ring/border that reflects AI state.
 * Used for cards and panels to indicate their AI-driven status.
 *
 * Per canon §1.3: Legibility over aesthetics - the ring communicates
 * state without requiring label reading.
 */
export function AIStateRing({
  state,
  children,
  className = '',
  showAccentBar = false,
}: AIStateRingProps) {
  const signal = AI_PERCEPTUAL_SIGNALS[state];
  const prevStateRef = useRef<AIPerceptualState>(state);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Track state transitions
  useEffect(() => {
    if (prevStateRef.current !== state) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      prevStateRef.current = state;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state]);

  // Idle state: minimal styling
  if (state === 'idle') {
    return (
      <div className={`relative ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`
        relative
        ${signal.glow}
        ${signal.transition}
        ${isTransitioning ? 'ring-2 ring-offset-2 ring-offset-slate-0' : ''}
        ${isTransitioning ? `ring-${state === 'ready' ? 'brand-iris/40' : state === 'blocked' ? 'semantic-danger/40' : 'brand-cyan/40'}` : ''}
        ${className}
      `}
    >
      {/* Accent bar for left edge state indication */}
      {showAccentBar && (
        <div
          className={`
            absolute left-0 top-0 bottom-0 w-[3px] rounded-l
            ${signal.indicator}
            ${signal.motion}
            ${signal.transition}
          `}
        />
      )}
      {children}
    </div>
  );
}

// ============================================
// PROGRESS INDICATOR (For executing state)
// ============================================

interface AIProgressIndicatorProps {
  /** Current AI perceptual state */
  state: AIPerceptualState;
  /** Progress value (0-100) for determinate progress, undefined for indeterminate */
  progress?: number;
  /** Additional class names */
  className?: string;
}

/**
 * AI Progress Indicator
 *
 * Shows progress for executing state.
 * Per canon §4.3: Indeterminate progress must be visually distinct from determinate.
 */
export function AIProgressIndicator({
  state,
  progress,
  className = '',
}: AIProgressIndicatorProps) {
  // Only show for evaluating or executing states
  if (state !== 'evaluating' && state !== 'executing') {
    return null;
  }

  const signal = AI_PERCEPTUAL_SIGNALS[state];
  const isDeterminate = progress !== undefined;

  return (
    <div className={`h-1 bg-slate-4 rounded-full overflow-hidden ${className}`}>
      {isDeterminate ? (
        // Determinate progress bar
        <div
          className={`
            h-full rounded-full
            ${signal.indicator}
            ${signal.transition}
          `}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      ) : (
        // Indeterminate shimmer effect
        <div
          className={`
            h-full w-1/3 rounded-full
            ${signal.indicator}
            animate-[indeterminate_1.5s_ease-in-out_infinite]
          `}
        />
      )}
    </div>
  );
}

export default AmbientAIIndicator;
