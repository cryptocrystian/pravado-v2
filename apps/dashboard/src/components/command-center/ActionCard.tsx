'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * ActionCard v3 - UX Pilot Reference Match
 *
 * "Ready state" operational cards with:
 * - Priority badge + timestamp
 * - Pillar chip (PR/Content/SEO)
 * - TWO on-card CTAs (Execute/Auto-Fix + Review)
 * - Adaptive density based on available space
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

export type DensityLevel = 'ultra-compact' | 'compact' | 'standard' | 'comfortable';

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
 * ActionCard - Adaptive density card with on-card CTAs
 *
 * MARKER: action-card-v3 (for CI guardrail check)
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

  // Ultra-compact: Single line with minimal info (for 15+ cards)
  if (densityLevel === 'ultra-compact') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick?.();
          }
        }}
        className={`
          action-card-v3
          group relative bg-[#0D0D12] rounded overflow-hidden cursor-pointer
          border-l-[3px] ${pillar.border}
          border border-[#1A1A24] border-l-0
          transition-all duration-150
          hover:bg-[#111116] hover:border-[#2A2A36]
          ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
          focus:outline-none focus:ring-1 focus:ring-brand-cyan/40
        `}
      >
        <div className="px-2 py-1.5 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priority.dot}`} />
          <span className={`px-1 py-0.5 text-[11px] font-bold uppercase rounded border flex-shrink-0 ${pillar.badge}`}>
            {action.pillar}
          </span>
          <span className="flex-1 text-xs text-white/85 truncate font-medium">
            {action.title}
          </span>
          <svg className="w-3 h-3 text-white/30 group-hover:text-brand-cyan transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    );
  }

  // Compact: Two lines with CTA buttons visible (for 8-14 cards)
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
        <div className="p-2.5">
          {/* Row 1: Priority + Pillar + Title */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priority.dot}`} />
            <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase rounded border flex-shrink-0 ${pillar.badge}`}>
              {action.pillar}
            </span>
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
              className="flex-1 text-xs font-semibold text-white/90 truncate cursor-pointer hover:text-brand-cyan transition-colors"
            >
              {action.title}
            </h3>
            <span className="text-[11px] text-white/50 flex-shrink-0">{formatTimestamp(action.updated_at)}</span>
          </div>

          {/* Row 2: CTAs */}
          <div className="flex items-center gap-2">
            {/* Primary CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryAction?.();
              }}
              className={`
                px-2.5 py-1 text-[11px] font-semibold rounded
                transition-all duration-150
                ${ready
                  ? 'bg-semantic-success/15 text-semantic-success border border-semantic-success/30 hover:bg-semantic-success/25'
                  : `${pillar.bg} ${pillar.text} border ${pillar.border.replace('border-l-', 'border-')}/30 hover:brightness-110`
                }
              `}
            >
              {action.cta.primary}
            </button>

            {/* Secondary CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSecondaryAction?.();
              }}
              className="px-2.5 py-1 text-[11px] font-medium text-white/60 hover:text-white/90 bg-[#1A1A24] hover:bg-[#22222D] rounded transition-colors"
            >
              {action.cta.secondary}
            </button>

            <span className="flex-1" />

            {/* Mode badge */}
            {action.mode === 'autopilot' && (
              <span className="px-1.5 py-0.5 text-[11px] font-medium uppercase rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Auto
              </span>
            )}

            {/* Gate warning */}
            {action.gate.required && (
              <span className="px-1.5 py-0.5 text-[11px] font-medium text-semantic-warning bg-semantic-warning/10 rounded border border-semantic-warning/20">
                Gated
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard: Three rows with summary snippet (for 4-7 cards)
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
          {/* Row 1: Header badges */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase rounded border ${pillar.badge}`}>
                {action.pillar}
              </span>
              <span className={`px-1.5 py-0.5 text-[11px] font-semibold rounded border ${priority.badge}`}>
                {priority.label}
              </span>
              {ready && (
                <span className={`px-1.5 py-0.5 text-[11px] font-semibold rounded border ${successBadge}`}>
                  Ready
                </span>
              )}
            </div>
            <span className="text-[11px] text-white/50">{formatTimestamp(action.updated_at)}</span>
          </div>

          {/* Row 2: Title (clickable) */}
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
            className="text-sm font-semibold text-white/90 mb-1 leading-snug line-clamp-1 cursor-pointer hover:text-brand-cyan transition-colors"
          >
            {action.title}
          </h3>

          {/* Row 3: Summary */}
          <p className="text-xs text-white/55 line-clamp-1 mb-2.5">{action.summary}</p>

          {/* Row 4: CTAs + Badges */}
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
                  ? 'bg-semantic-success/20 text-semantic-success border border-semantic-success/40 hover:bg-semantic-success/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                  : `${pillar.bg} ${pillar.text} border ${pillar.border.replace('border-l-', 'border-')}/30 hover:brightness-110`
                }
              `}
            >
              {action.cta.primary}
            </button>

            {/* Secondary CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSecondaryAction?.();
              }}
              className="px-3 py-1.5 text-xs font-medium text-white/65 hover:text-white/90 bg-[#1A1A24] hover:bg-[#22222D] rounded transition-colors"
            >
              {action.cta.secondary}
            </button>

            <span className="flex-1" />

            {/* Confidence pill */}
            <span className="px-1.5 py-0.5 text-[11px] font-bold bg-[#1A1A24] text-white/70 rounded">
              {Math.round(action.confidence * 100)}% conf
            </span>

            {/* Mode badge */}
            {action.mode === 'autopilot' && (
              <span className="px-1.5 py-0.5 text-[11px] font-medium uppercase rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Auto
              </span>
            )}

            {/* Gate warning */}
            {action.gate.required && (
              <span className="px-1.5 py-0.5 text-[11px] font-medium text-semantic-warning bg-semantic-warning/10 rounded border border-semantic-warning/20">
                Gated
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Comfortable: Full card with all details (for 1-3 cards)
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

      <div className="relative p-4">
        {/* Row 1: Header badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${pillar.badge}`}>
              {action.pillar}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded border ${priority.badge}`}>
              {priority.label}
            </span>
            {ready && (
              <span className={`px-2 py-1 text-xs font-semibold rounded border ${successBadge}`}>
                Ready
              </span>
            )}
            {action.mode === 'autopilot' && (
              <span className="px-2 py-1 text-xs font-medium uppercase rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Autopilot
              </span>
            )}
          </div>
          <span className="text-xs text-white/55">{formatTimestamp(action.updated_at)}</span>
        </div>

        {/* Row 2: Title (clickable) */}
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
          className="text-base font-semibold text-white/95 mb-2 leading-snug line-clamp-2 cursor-pointer hover:text-brand-cyan transition-colors"
        >
          {action.title}
        </h3>

        {/* Row 3: Summary */}
        <p className="text-sm text-white/60 line-clamp-2 mb-3">{action.summary}</p>

        {/* Row 4: Metrics */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#1A1A24]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/50">Confidence:</span>
            <span className="text-sm font-bold text-white/90">{Math.round(action.confidence * 100)}%</span>
          </div>
          <div className="w-px h-4 bg-[#1A1A24]" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/50">Impact:</span>
            <span className="text-sm font-bold text-white/90">{Math.round(action.impact * 100)}%</span>
          </div>
          {action.gate.required && (
            <>
              <div className="w-px h-4 bg-[#1A1A24]" />
              <span className="px-2 py-1 text-xs font-medium text-semantic-warning bg-semantic-warning/10 rounded border border-semantic-warning/20">
                {action.gate.reason || 'Approval Required'}
              </span>
            </>
          )}
        </div>

        {/* Row 5: CTAs */}
        <div className="flex items-center gap-3">
          {/* Primary CTA - larger in comfortable mode */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAction?.();
            }}
            className={`
              px-4 py-2 text-sm font-semibold rounded-lg
              transition-all duration-150
              ${ready
                ? 'bg-semantic-success/20 text-semantic-success border border-semantic-success/40 hover:bg-semantic-success/30 shadow-[0_0_16px_rgba(34,197,94,0.2)]'
                : `${pillar.bg} ${pillar.text} border ${pillar.border.replace('border-l-', 'border-')}/40 hover:brightness-110`
              }
            `}
          >
            {action.cta.primary}
          </button>

          {/* Secondary CTA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSecondaryAction?.();
            }}
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white/95 bg-[#1A1A24] hover:bg-[#22222D] rounded-lg transition-colors"
          >
            {action.cta.secondary}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionCard;
