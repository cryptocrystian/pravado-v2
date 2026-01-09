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
 * ActionCard v4 - UX Pilot Aligned
 *
 * COMFORTABLE MODE (UX-PILOT AUTHORITY):
 * - Card height ~120-150px
 * - DOMINANT primary CTA (large colored pill, strong contrast, immediate)
 * - SUBDUED secondary action (ghost/outline, never competes)
 * - Clear left accent / severity indication
 * - Title high contrast (white/90+), body readable (white/60+)
 *
 * DENSITY LEVELS:
 * - Comfortable (DEFAULT): Full UX-Pilot design, dominant CTA
 * - Standard: Condensed but CTA visible
 * - Compact: Row-based, primary CTA only
 *
 * CTAs are action-specific based on action.type:
 * - proposal: "Execute" / "Review"
 * - alert: "Investigate" / "Details"
 * - task: "Complete" / "View"
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import type { ActionItem, Pillar, Priority } from './types';

// Pillar accent system - DS v3
const pillarAccents: Record<Pillar, {
  border: string;
  bg: string;
  bgHover: string;
  text: string;
  glow: string;
  badge: string;
}> = {
  pr: {
    border: 'border-l-brand-magenta',
    bg: 'bg-brand-magenta/5',
    bgHover: 'hover:bg-brand-magenta/8',
    text: 'text-brand-magenta',
    glow: 'shadow-[0_0_16px_rgba(232,121,249,0.15)]',
    badge: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30',
  },
  content: {
    border: 'border-l-brand-iris',
    bg: 'bg-brand-iris/5',
    bgHover: 'hover:bg-brand-iris/8',
    text: 'text-brand-iris',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.15)]',
    badge: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30',
  },
  seo: {
    border: 'border-l-brand-cyan',
    bg: 'bg-brand-cyan/5',
    bgHover: 'hover:bg-brand-cyan/8',
    text: 'text-brand-cyan',
    glow: 'shadow-[0_0_16px_rgba(0,217,255,0.15)]',
    badge: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
  },
};

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

// v4: Removed ultra-compact - now just 3 levels per UX-Pilot contract
export type DensityLevel = 'compact' | 'standard' | 'comfortable';

interface ActionCardProps {
  action: ActionItem;
  densityLevel: DensityLevel;
  isSelected?: boolean;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onCardClick?: () => void;
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
 * ActionCard v4 - UX Pilot Aligned
 *
 * MARKER: action-card-v3 (for CI guardrail check - kept for compatibility)
 *
 * KEY CHANGE: Comfortable mode now has DOMINANT primary CTA
 * that is immediately visible and actionable.
 */
export function ActionCard({
  action,
  densityLevel,
  isSelected,
  onPrimaryAction,
  onSecondaryAction,
  onCardClick,
}: ActionCardProps) {
  const pillar = pillarAccents[action.pillar];
  const priority = priorityConfig[action.priority];
  const ready = isReadyState(action);

  // ============================================
  // COMPACT MODE (13+ cards or height-constrained)
  // Row-based layout, primary CTA only
  // ============================================
  if (densityLevel === 'compact') {
    return (
      <div
        className={`
          action-card-v3
          group relative bg-[#0D0D12] rounded-lg overflow-hidden
          border-l-[3px] ${pillar.border}
          border border-[#1A1A24] border-l-0
          transition-all duration-150
          hover:bg-[#111116] hover:border-[#2A2A36]
          ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
        `}
      >
        <div className="px-3 py-2.5 flex items-center gap-3">
          {/* Priority indicator */}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />

          {/* Pillar badge */}
          <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border flex-shrink-0 ${pillar.badge}`}>
            {action.pillar}
          </span>

          {/* Title - clickable */}
          <h3
            role="button"
            tabIndex={0}
            onClick={onCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick?.();
              }
            }}
            className="flex-1 text-sm font-medium text-white/90 truncate cursor-pointer hover:text-brand-cyan transition-colors"
          >
            {action.title}
          </h3>

          {/* Primary CTA - compact but visible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAction?.();
            }}
            className={`
              px-3 py-1.5 text-xs font-semibold rounded flex-shrink-0
              transition-all duration-150
              ${ready
                ? 'bg-semantic-success text-white hover:bg-semantic-success/90'
                : `bg-${action.pillar === 'pr' ? 'brand-magenta' : action.pillar === 'content' ? 'brand-iris' : 'brand-cyan'} text-white hover:opacity-90`
              }
            `}
          >
            {action.cta.primary}
          </button>

          {/* Chevron for drawer */}
          <svg
            className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 cursor-pointer"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            onClick={onCardClick}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    );
  }

  // ============================================
  // STANDARD MODE (9-12 cards)
  // Condensed but CTAs visible
  // ============================================
  if (densityLevel === 'standard') {
    return (
      <div
        className={`
          action-card-v3
          group relative bg-[#0D0D12] rounded-lg overflow-hidden
          border-l-[3px] ${pillar.border}
          border border-[#1A1A24] border-l-0
          transition-all duration-200
          hover:bg-[#111116] hover:border-[#2A2A36]
          ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
        `}
      >
        <div className={`absolute inset-0 ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

        <div className="relative p-3">
          {/* Row 1: Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
              <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${pillar.badge}`}>
                {action.pillar}
              </span>
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${priority.badge}`}>
                {priority.label}
              </span>
              {ready && (
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${successBadge}`}>
                  Ready
                </span>
              )}
            </div>
            <span className="text-[11px] text-white/50">{formatTimestamp(action.updated_at)}</span>
          </div>

          {/* Row 2: Title */}
          <h3
            role="button"
            tabIndex={0}
            onClick={onCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick?.();
              }
            }}
            className="text-sm font-semibold text-white/90 mb-1.5 leading-snug line-clamp-1 cursor-pointer hover:text-brand-cyan transition-colors"
          >
            {action.title}
          </h3>

          {/* Row 3: Summary (condensed) */}
          <p className="text-xs text-white/55 line-clamp-1 mb-2.5">{action.summary}</p>

          {/* Row 4: CTAs */}
          <div className="flex items-center gap-2">
            {/* Primary CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryAction?.();
              }}
              className={`
                px-3 py-1.5 text-xs font-semibold rounded
                transition-all duration-150
                ${ready
                  ? 'bg-semantic-success text-white hover:bg-semantic-success/90 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                  : `bg-${action.pillar === 'pr' ? 'brand-magenta' : action.pillar === 'content' ? 'brand-iris' : 'brand-cyan'}/20 ${pillar.text} border ${pillar.border.replace('border-l-', 'border-')}/40 hover:bg-${action.pillar === 'pr' ? 'brand-magenta' : action.pillar === 'content' ? 'brand-iris' : 'brand-cyan'}/30`
                }
              `}
            >
              {action.cta.primary}
            </button>

            {/* Secondary CTA - subdued */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSecondaryAction?.();
              }}
              className="px-3 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 transition-colors"
            >
              {action.cta.secondary}
            </button>

            <span className="flex-1" />

            {/* Confidence */}
            <span className="text-[11px] font-medium text-white/50">
              {Math.round(action.confidence * 100)}%
            </span>

            {/* Gate indicator */}
            {action.gate.required && (
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning" title="Approval required" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // COMFORTABLE MODE (DEFAULT - <=8 cards)
  // UX-PILOT AUTHORITY - Full design with DOMINANT CTA
  // ============================================
  return (
    <div
      className={`
        action-card-v3
        group relative bg-[#0D0D12] rounded-xl overflow-hidden
        border-l-4 ${pillar.border}
        border border-[#1A1A24] border-l-0
        transition-all duration-200
        hover:bg-[#111118] hover:border-[#2A2A36]
        ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
      `}
    >
      {/* Hover overlay */}
      <div className={`absolute inset-0 ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

      <div className="relative p-4">
        {/* Row 1: Status badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Priority with severity indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${priority.dot}`} />
              <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded border ${priority.badge}`}>
                {priority.label}
              </span>
            </div>

            {/* Pillar badge */}
            <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded border ${pillar.badge}`}>
              {action.pillar}
            </span>

            {/* Ready state badge */}
            {ready && (
              <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded border ${successBadge}`}>
                ✓ Ready
              </span>
            )}

            {/* Mode badge */}
            {action.mode === 'autopilot' && (
              <span className="px-2 py-1 text-[11px] font-medium uppercase rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/25">
                Auto
              </span>
            )}
          </div>
          <span className="text-xs text-white/50">{formatTimestamp(action.updated_at)}</span>
        </div>

        {/* Row 2: Title - HIGH CONTRAST */}
        <h3
          role="button"
          tabIndex={0}
          onClick={onCardClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCardClick?.();
            }
          }}
          className="text-base font-semibold text-white mb-2 leading-snug line-clamp-2 cursor-pointer hover:text-brand-cyan transition-colors"
        >
          {action.title}
        </h3>

        {/* Row 3: Summary - readable contrast */}
        <p className="text-sm text-white/65 line-clamp-2 mb-4">{action.summary}</p>

        {/* Row 4: Metrics row */}
        <div className="flex items-center gap-4 mb-4 py-2 px-3 bg-[#0A0A0F] rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/45">Confidence</span>
            <span className="text-sm font-bold text-white">{Math.round(action.confidence * 100)}%</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/45">Impact</span>
            <span className="text-sm font-bold text-white">{Math.round(action.impact * 100)}%</span>
          </div>
          {action.gate.required && (
            <>
              <div className="flex-1" />
              <span className="px-2 py-1 text-[11px] font-medium text-semantic-warning bg-semantic-warning/10 rounded border border-semantic-warning/20">
                {action.gate.reason || 'Approval Required'}
              </span>
            </>
          )}
        </div>

        {/* Row 5: CTAs - DOMINANT PRIMARY */}
        <div className="flex items-center gap-3">
          {/* PRIMARY CTA - DOMINANT (large, colored, strong contrast) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAction?.();
            }}
            className={`
              px-5 py-2.5 text-sm font-bold rounded-lg
              transition-all duration-200
              ${ready
                ? 'bg-semantic-success text-white hover:bg-semantic-success/90 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_24px_rgba(34,197,94,0.4)]'
                : action.pillar === 'pr'
                ? 'bg-brand-magenta text-white hover:bg-brand-magenta/90 shadow-[0_0_16px_rgba(232,121,249,0.25)]'
                : action.pillar === 'content'
                ? 'bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)]'
                : 'bg-brand-cyan text-white hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.25)]'
              }
            `}
          >
            {action.cta.primary}
          </button>

          {/* SECONDARY CTA - SUBDUED (ghost style, never competes) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSecondaryAction?.();
            }}
            className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white/90 border border-white/10 hover:border-white/20 rounded-lg transition-all"
          >
            {action.cta.secondary}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionCard;
