'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 * - UX-Pilot: Authority for Comfortable mode card design
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * ActionCard v8 - Anchored HoverCard Micro-Brief (v5 Pattern)
 *
 * INTERACTION CONTRACT v3.2:
 * - Card body click → Opens ActionModal (investigate)
 * - "Review" button → Opens ActionModal (investigate)
 * - Primary CTA → Executes action (NEVER opens modal)
 * - Hover → Opens anchored HoverCard popover with micro-brief
 *
 * HOVER MICRO-BRIEF v5 (ANCHORED POPOVER):
 * - Uses Radix HoverCard with configurable delays
 * - Popover anchored to card, positioned to left within Action Stream
 * - Arrow points to hovered card
 * - Single hover open at a time (coordinated by ActionStreamPane)
 * - Dimmed appearance when another card's hover is open
 * - Compact mode: NO hover popover
 *
 * HOVER TIMING:
 * - Open delay: ~200ms (hover intent)
 * - Close delay: ~250ms (allows cursor to move into popover)
 *
 * DENSITY HEIGHTS:
 * - Comfortable: min-h-[180px]
 * - Standard: min-h-[120px]
 * - Compact: min-h-[48px] (no hover)
 *
 * EXECUTION STATES:
 * - idle: Default state
 * - executing: Spinner, disabled CTA
 * - success: Green checkmark badge
 * - error: Red error badge
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import type { ActionItem, Priority } from './types';
import { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardArrow } from '../ui/hover-card';
import { ActionHoverBrief } from './ActionHoverBrief';
import { pillarAccents } from './pillar-accents';
import { Lock, CaretRight, Check } from '@phosphor-icons/react';

// Priority styling
const priorityConfig: Record<Priority, {
  dot: string;
  badge: string;
  label: string;
  urgent: boolean;
}> = {
  critical: {
    dot: 'bg-semantic-danger animate-pulse',
    badge: 'bg-semantic-danger/15 text-semantic-danger border-semantic-danger/30',
    label: 'Critical',
    urgent: true,
  },
  high: {
    dot: 'bg-semantic-warning',
    badge: 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30',
    label: 'High',
    urgent: true,
  },
  medium: {
    dot: 'bg-brand-cyan',
    badge: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
    label: 'Medium',
    urgent: false,
  },
  low: {
    dot: 'bg-white/40',
    badge: 'bg-white/10 text-white/60 border-white/20',
    label: 'Low',
    urgent: false,
  },
};

// Success/ready state styling
const successBadge = 'bg-semantic-success/15 text-semantic-success border-semantic-success/30';

// v5: 3 density levels
export type DensityLevel = 'compact' | 'standard' | 'comfortable';

// v5: Execution states
export type ExecutionState = 'idle' | 'executing' | 'success' | 'error';

// v5: Hover timing constants
const HOVER_OPEN_DELAY = 200;
const HOVER_CLOSE_DELAY = 250;

interface ActionCardProps {
  action: ActionItem;
  densityLevel: DensityLevel;
  isSelected?: boolean;
  executionState?: ExecutionState;
  onPrimaryAction?: () => void;
  onReview?: () => void; // Opens modal (card click or Review button)
  // v5: Controlled hover state for single-hover coordination
  isHoverOpen?: boolean;
  onHoverOpenChange?: (open: boolean) => void;
  // v5: Dimmed when another card's hover is open
  isDimmed?: boolean;
}

/**
 * Formats a timestamp for display
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Determines if action is in "ready" state (high confidence, ready to execute)
 */
function isReadyState(action: ActionItem): boolean {
  return action.confidence >= 0.8 && !action.gate.required;
}

/**
 * Determines if action is a crisis/alert that should use danger styling
 * instead of success green for its CTA. Any alert-type action uses
 * semantic-danger (critical) or semantic-warning (non-critical) —
 * crisis actions are never styled as success/green.
 */
function isCrisisAction(action: ActionItem): boolean {
  return action.type === 'alert';
}


/**
 * ActionCard v8 - Anchored HoverCard Micro-Brief (v5 Pattern)
 *
 * MARKER: action-card-v8 (for CI guardrail check)
 */
export function ActionCard({
  action,
  densityLevel,
  isSelected,
  executionState = 'idle',
  onPrimaryAction,
  onReview,
  isHoverOpen,
  onHoverOpenChange,
  isDimmed,
}: ActionCardProps) {
  const pillar = pillarAccents[action.pillar];
  const priority = priorityConfig[action.priority];
  const ready = isReadyState(action);
  const crisis = isCrisisAction(action);
  const isExecuting = executionState === 'executing';
  const isCompleted = executionState === 'success';
  const hasError = executionState === 'error';

  /**
   * LOCKED ACTIONS POLICY:
   * - Locked = gate.required && gate.min_plan exists
   * - Locked cards have muted styling (no urgency colors)
   * - Locked cards show "Unlock Pro" instead of Execute CTA
   * - Locked cards NEVER show execute buttons anywhere
   */
  const isLocked = action.gate.required && !!action.gate.min_plan;

  // Dimmed state class for when another card's hover is open
  const dimmedClass = isDimmed ? 'opacity-40 transition-opacity duration-200' : '';

  // Locked styling: muted background, no urgency colors, grayscale
  const lockedClass = isLocked ? 'opacity-60 grayscale-[30%]' : '';

  // Locked cards use neutral styling for priority (no urgency colors)
  const lockedPriorityStyle = {
    dot: 'bg-white/30',
    badge: 'bg-white/10 text-white/50 border-white/20',
  };

  // ============================================
  // COMPACT MODE (13+ cards or height-constrained)
  // Row-based layout, primary CTA only, card click = review
  // NO HOVER INTELLIGENCE in compact mode
  // ============================================
  if (densityLevel === 'compact') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onReview}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onReview?.();
          }
        }}
        className={`
          action-card-v8
          group relative bg-slate-1 rounded-lg overflow-hidden cursor-pointer
          border-l-[3px] ${pillar.borderLeft}
          border border-border-subtle border-l-0
          transition-all duration-150
          hover:bg-slate-2 hover:border-slate-5
          ${isSelected ? `${pillar.glow} border-slate-5` : ''}
          ${isExecuting ? 'animate-pulse' : ''}
          ${isCompleted ? 'border-semantic-success/30' : ''}
          ${hasError ? 'border-semantic-danger/30' : ''}
          ${dimmedClass}
          ${lockedClass}
        `}
      >
        <div className="px-3 py-2.5 flex items-center gap-3">
          {/* Priority indicator - muted for locked */}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isLocked ? lockedPriorityStyle.dot : priority.dot}`} />

          {/* Lock icon for locked cards */}
          {isLocked && (
            <Lock weight="regular" className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          )}

          {/* Pillar badge */}
          <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase rounded border flex-shrink-0 ${pillar.badge}`}>
            {action.pillar}
          </span>

          {/* Mode badge — all three modes */}
          {!isCompleted && (
            <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border flex-shrink-0 ${
              action.mode === 'autopilot' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' :
              action.mode === 'copilot'   ? 'bg-brand-iris/10 text-brand-iris border-brand-iris/30' :
                                            'bg-white/5 text-white/70 border-white/20'
            }`}>
              {action.mode === 'autopilot' ? 'Auto' : action.mode === 'copilot' ? 'Copilot' : 'Manual'}
            </span>
          )}

          {/* Execution state badge */}
          {isCompleted && (
            <span className="px-1.5 py-0.5 text-[11px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30 flex-shrink-0">
              Done
            </span>
          )}
          {hasError && (
            <span className="px-1.5 py-0.5 text-[11px] font-bold uppercase rounded bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30 flex-shrink-0">
              Error
            </span>
          )}

          {/* Title */}
          <h3 className="flex-1 text-sm font-medium text-white/90 truncate">
            {action.title}
          </h3>

          {/* Primary CTA - "Unlock Pro" for locked, Execute for active */}
          {isLocked ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview?.(); // Opens modal which shows upgrade option
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded flex-shrink-0
                transition-all duration-150 flex items-center gap-1.5
                bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90
                border border-white/20"
            >
              <Lock weight="regular" className="w-3 h-3" />
              Unlock Pro
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryAction?.();
              }}
              disabled={isExecuting || action.gate.required}
              className={`
                px-3 py-1.5 text-xs font-semibold rounded flex-shrink-0
                transition-all duration-150 flex items-center gap-1.5
                ${isExecuting ? 'opacity-70 cursor-wait' : ''}
                ${action.gate.required ? 'opacity-50 cursor-not-allowed' : ''}
                ${isCompleted
                  ? 'bg-semantic-success/20 text-semantic-success'
                  : crisis && action.priority === 'critical'
                  ? 'bg-semantic-danger text-white hover:bg-semantic-danger/90'
                  : crisis
                  ? 'bg-semantic-warning text-white hover:bg-semantic-warning/90'
                  : ready
                  ? 'bg-semantic-success text-white hover:bg-semantic-success/90'
                  : `${pillar.solidBg} text-white hover:opacity-90`
                }
              `}
            >
              {isExecuting && (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isCompleted ? 'Done' : action.cta.primary}
            </button>
          )}

          {/* Chevron hint for modal */}
          <CaretRight
            weight="regular"
            className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0"
          />
        </div>
      </div>
    );
  }

  // ============================================
  // STANDARD MODE (9-12 cards)
  // Fixed height card with anchored HoverCard micro-brief
  // ============================================
  if (densityLevel === 'standard') {
    const cardContent = (
      <div
        className={`
          action-card-v8
          group relative bg-slate-1 rounded-lg overflow-hidden
          border-l-[3px] ${pillar.borderLeft}
          border border-border-subtle border-l-0
          transition-all duration-200
          hover:bg-slate-2 hover:border-slate-5
          ${isSelected ? `${pillar.glow} border-slate-5` : ''}
          ${isExecuting ? 'animate-pulse' : ''}
          ${isCompleted ? 'border-semantic-success/30' : ''}
          ${dimmedClass}
          ${lockedClass}
        `}
      >
        <div className={`absolute inset-0 ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg`} />

        <div className="relative p-3 h-full flex flex-col">
          {/* Row 1: Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {/* Priority dot - muted for locked */}
              <span className={`w-2 h-2 rounded-full ${isLocked ? lockedPriorityStyle.dot : priority.dot}`} />
              {/* Lock icon for locked cards */}
              {isLocked && (
                <Lock weight="regular" className="w-3.5 h-3.5 text-white/40" />
              )}
              <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase rounded border ${pillar.badge}`}>
                {action.pillar}
              </span>
              <span className={`px-1.5 py-0.5 text-xs font-semibold rounded border ${isLocked ? lockedPriorityStyle.badge : priority.badge}`}>
                {priority.label}
              </span>
              {ready && !isCompleted && !isLocked && (
                <span className={`px-1.5 py-0.5 text-xs font-semibold rounded border ${successBadge}`}>
                  Ready
                </span>
              )}
              {isCompleted && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
                  Completed
                </span>
              )}
              {/* Mode badge — all three modes */}
              {!isCompleted && (
                <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${
                  action.mode === 'autopilot' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' :
                  action.mode === 'copilot'   ? 'bg-brand-iris/10 text-brand-iris border-brand-iris/30' :
                                                'bg-white/5 text-white/70 border-white/20'
                }`}>
                  {action.mode === 'autopilot' ? 'Auto' : action.mode === 'copilot' ? 'Copilot' : 'Manual'}
                </span>
              )}
            </div>
            <span className="text-xs text-white/50">{formatTimestamp(action.updated_at)}</span>
          </div>

          {/* Row 2: Title - clickable for modal */}
          <h3
            role="button"
            tabIndex={0}
            onClick={onReview}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onReview?.();
              }
            }}
            className="text-sm font-semibold text-white/90 mb-1 leading-snug line-clamp-1 cursor-pointer hover:text-brand-cyan transition-colors"
          >
            {action.title}
          </h3>

          {/* Row 3: Summary (static, no hover swap in v5) */}
          <p className="text-xs text-white/55 line-clamp-2 mb-auto">{action.summary}</p>

          {/* Row 4: CTAs - FIXED POSITION at bottom */}
          <div className="flex items-center gap-2 mt-1.5">
            {/* Primary CTA - "Unlock Pro" for locked, Execute for active */}
            {isLocked ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReview?.(); // Opens modal which shows upgrade option
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-1.5
                  transition-all duration-150
                  bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90
                  border border-white/20"
              >
                <Lock weight="regular" className="w-3 h-3" />
                Unlock Pro
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrimaryAction?.();
                }}
                disabled={isExecuting || action.gate.required}
                className={`
                  px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-1.5
                  transition-all duration-150
                  ${isExecuting ? 'opacity-70 cursor-wait' : ''}
                  ${action.gate.required ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isCompleted
                    ? 'bg-semantic-success/20 text-semantic-success'
                    : crisis && action.priority === 'critical'
                    ? 'bg-semantic-danger text-white hover:bg-semantic-danger/90 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    : crisis
                    ? 'bg-semantic-warning text-white hover:bg-semantic-warning/90 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : ready
                    ? 'bg-semantic-success text-white hover:bg-semantic-success/90 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                    : `${pillar.bg} ${pillar.text} border ${pillar.border} hover:${pillar.bgHover}`
                  }
                `}
              >
                {isExecuting && (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isCompleted ? 'Done' : action.cta.primary}
              </button>
            )}

            {/* Secondary CTA - "Review →" text link, opens modal (Preview for locked) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview?.();
              }}
              className="px-2 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 transition-colors"
            >
              {isLocked ? 'Preview →' : 'Review →'}
            </button>

            <span className="flex-1" />

            {/* Gate indicator - only show for non-locked gated items */}
            {action.gate.required && !isLocked && (
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning" title="Approval required" />
            )}
          </div>
        </div>
      </div>
    );

    // Wrap with HoverCard for standard mode
    return (
      <HoverCard
        open={isHoverOpen}
        onOpenChange={onHoverOpenChange}
        openDelay={HOVER_OPEN_DELAY}
        closeDelay={HOVER_CLOSE_DELAY}
      >
        <HoverCardTrigger asChild>
          {cardContent}
        </HoverCardTrigger>
        <HoverCardContent side="left" align="start" sideOffset={8} className="w-[280px]">
          <HoverCardArrow className="fill-slate-3" />
          <ActionHoverBrief
            action={action}
            onPrimaryAction={isLocked ? undefined : onPrimaryAction}
            executionState={executionState}
            isLocked={isLocked}
          />
        </HoverCardContent>
      </HoverCard>
    );
  }

  // ============================================
  // COMFORTABLE MODE (DEFAULT - <=8 cards)
  // UX-PILOT AUTHORITY - Full design with DOMINANT CTA + Anchored HoverCard
  // ============================================
  const comfortableCardContent = (
    <div
      className={`
        action-card-v8
        group relative bg-slate-1 rounded-xl overflow-hidden
        border-l-4 ${pillar.borderLeft}
        border border-border-subtle border-l-0
        transition-all duration-200
        hover:bg-slate-2 hover:border-slate-5
        ${isSelected ? `${pillar.glow} border-slate-5` : ''}
        ${isExecuting ? 'animate-pulse' : ''}
        ${isCompleted ? 'border-semantic-success/30' : ''}
        ${dimmedClass}
        ${lockedClass}
        `}
        >
        {/* Hover overlay */}
        <div className={`absolute inset-0 ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl`} />

      <div className="relative px-4 py-2.5 h-full flex flex-col">
        {/* Row 1: Status badges */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {/* Priority with severity indicator - muted for locked */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isLocked ? lockedPriorityStyle.dot : priority.dot}`} />
              {/* Lock icon for locked cards */}
              {isLocked && (
                <Lock weight="regular" className="w-4 h-4 text-white/40" />
              )}
              <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded border ${isLocked ? lockedPriorityStyle.badge : priority.badge}`}>
                {priority.label}
              </span>
            </div>

            {/* Pillar badge */}
            <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded border ${pillar.badge}`}>
              {action.pillar}
            </span>

            {/* Ready state badge - not shown for locked */}
            {ready && !isCompleted && !isLocked && (
              <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded border ${successBadge}`}>
                Ready
              </span>
            )}

            {/* Execution state badges */}
            {isCompleted && (
              <span className="px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30 flex items-center gap-1">
                <Check weight="regular" className="w-3 h-3" />
                Completed
              </span>
            )}
            {hasError && (
              <span className="px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30">
                Error
              </span>
            )}

            {/* Mode badge — all three modes shown per MODE_UX_ARCHITECTURE.md */}
            {!isCompleted && (
              <span className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${
                action.mode === 'autopilot' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' :
                action.mode === 'copilot'   ? 'bg-brand-iris/10 text-brand-iris border-brand-iris/30' :
                                              'bg-white/5 text-white/70 border-white/20'
              }`}>
                {action.mode === 'autopilot' ? 'Auto' : action.mode === 'copilot' ? 'Copilot' : 'Manual'}
              </span>
            )}
          </div>
          <span className="text-xs text-white/50">{formatTimestamp(action.updated_at)}</span>
        </div>

        {/* Row 2: Title - HIGH CONTRAST, clickable for modal */}
        <h3
          role="button"
          tabIndex={0}
          onClick={onReview}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onReview?.();
            }
          }}
          className="text-base font-semibold text-white mb-1.5 leading-snug line-clamp-2 cursor-pointer hover:text-brand-cyan transition-colors"
        >
          {action.title}
        </h3>

        {/* Row 3: Summary (static in v5, hover details in popover) */}
        <p className="text-xs text-white/55 line-clamp-2 mb-auto">{action.summary}</p>

        {/* Row 4: CTAs - FIXED POSITION at bottom */}
        <div className="flex items-center gap-2 mt-1.5">
          {/* PRIMARY CTA - "Unlock Pro" for locked, Execute for active */}
          {isLocked ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview?.(); // Opens modal which shows upgrade option
              }}
              className="px-4 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2
                transition-all duration-200
                bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90
                border border-white/20"
            >
              <Lock weight="regular" className="w-4 h-4" />
              Unlock Pro
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryAction?.();
              }}
              disabled={isExecuting || action.gate.required || isCompleted}
              className={`
                px-4 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2
                transition-all duration-200
                ${isExecuting ? 'opacity-70 cursor-wait' : ''}
                ${action.gate.required ? 'opacity-50 cursor-not-allowed' : ''}
                ${isCompleted
                  ? 'bg-semantic-success/20 text-semantic-success cursor-default'
                  : crisis && action.priority === 'critical'
                  ? 'bg-semantic-danger text-white hover:bg-semantic-danger/90 shadow-[0_0_16px_rgba(239,68,68,0.15)]'
                  : crisis
                  ? 'bg-semantic-warning text-white hover:bg-semantic-warning/90 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
                  : ready
                  ? 'bg-semantic-success text-white hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.15)]'
                  : action.pillar === 'pr'
                  ? 'bg-brand-magenta text-white hover:bg-brand-magenta/90 shadow-[0_0_16px_rgba(232,121,249,0.15)]'
                  : action.pillar === 'content'
                  ? 'bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.15)]'
                  : 'bg-brand-cyan text-white hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.15)]'
                }
              `}
            >
              {isExecuting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isCompleted && (
                <Check weight="regular" className="w-4 h-4" />
              )}
              {isCompleted ? 'Completed' : isExecuting ? 'Executing...' : action.cta.primary}
            </button>
          )}

          {/* SECONDARY CTA - "Preview" for locked, "Review" for active (ghost style, opens modal) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReview?.();
            }}
            className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white/90 border border-white/10 hover:border-white/20 rounded-lg transition-all"
          >
            {isLocked ? 'Preview' : 'Review'}
          </button>
        </div>
      </div>
    </div>
  );

  // Wrap with HoverCard for comfortable mode
  return (
    <HoverCard
      open={isHoverOpen}
      onOpenChange={onHoverOpenChange}
      openDelay={HOVER_OPEN_DELAY}
      closeDelay={HOVER_CLOSE_DELAY}
    >
      <HoverCardTrigger asChild>
        {comfortableCardContent}
      </HoverCardTrigger>
      <HoverCardContent side="left" align="start" sideOffset={12} className="w-[300px]">
        <HoverCardArrow className="fill-slate-3" />
        <ActionHoverBrief
          action={action}
          onPrimaryAction={isLocked ? undefined : onPrimaryAction}
          executionState={executionState}
          isLocked={isLocked}
        />
      </HoverCardContent>
    </HoverCard>
  );
}

export default ActionCard;
