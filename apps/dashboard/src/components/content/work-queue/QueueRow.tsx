'use client';

/**
 * QueueRow - Dense row component for the queue list.
 *
 * PROGRESSIVE DISCLOSURE PATTERN:
 * - Base state: Single line with type badge + title (40px height)
 * - Hover state: Reveal metadata chips (same height, inline)
 * - Selected state: Full metadata visible with subtle emphasis
 *
 * CANON COMPLIANCE:
 * - INFORMATION_DENSITY_HIERARCHY_CANON: 12px min, dense rows
 * - EDITOR_IDENTITY_CANON: Click selects item, does not enter editor
 * - ACTION_GRAVITY_CTA_CANON: No CTA in row, selection triggers canvas
 *
 * @see /docs/canon/AUTOMATION_MODE_CONTRACTS_CANON.md
 * @see /docs/canon/AI_VISUAL_COMMUNICATION_CANON.md
 */

import type { AutomationMode, ContentType, ContentStatus } from '../types';
import { CONTENT_TYPE_CONFIG, CONTENT_STATUS_CONFIG } from '../types';

// ============================================
// TYPES
// ============================================

export interface QueueItem {
  id: string;
  title: string;
  summary: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'opportunity' | 'issue' | 'scheduled' | 'sage_proposal' | 'execution';
  /** User-friendly content type for display */
  contentType?: ContentType;
  /** Content lifecycle status */
  status?: ContentStatus;
  /** Last edited timestamp for human-readable "Last edited X ago" */
  lastEditedAt?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'gap' | 'content' | 'asset' | 'cluster';
  mode: AutomationMode;
  createdAt: string;
  orchestrateActionId?: string;
  confidence?: number;
  modeCeiling?: AutomationMode;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  impact?: {
    authority?: number;
    crossPillar?: number;
  };
}

export interface QueueRowProps {
  item: QueueItem;
  isSelected: boolean;
  isPinned?: boolean;
  onClick: () => void;
  onPinToggle?: () => void;
  mode: AutomationMode;
  /** Index for keyboard navigation */
  index: number;
}

// ============================================
// TYPE CONFIG
// ============================================

const TYPE_CONFIG = {
  execution: {
    label: 'Content',
    color: 'text-brand-iris',
    bg: 'bg-brand-iris/10',
  },
  issue: {
    label: 'Fix',
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
  },
  opportunity: {
    label: 'Opportunity',
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
  },
  scheduled: {
    label: 'Due',
    color: 'text-semantic-danger',
    bg: 'bg-semantic-danger/10',
  },
  sage_proposal: {
    label: 'SAGE',
    color: 'text-white/60',
    bg: 'bg-white/5',
  },
};

const PRIORITY_INDICATOR = {
  critical: 'bg-semantic-danger',
  high: 'bg-semantic-warning',
  medium: 'bg-brand-iris',
  low: 'bg-white/20',
};

// ============================================
// COMPONENT
// ============================================

// Helper to format relative time
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function QueueRow({
  item,
  isSelected,
  isPinned = false,
  onClick,
  onPinToggle: _onPinToggle,
  mode,
  index,
}: QueueRowProps) {
  const priorityColor = PRIORITY_INDICATOR[item.priority];

  // Get content type config - prefer contentType field, fallback to type-based inference
  const contentTypeLabel = item.contentType
    ? CONTENT_TYPE_CONFIG[item.contentType]?.label || 'Content'
    : TYPE_CONFIG[item.type]?.label || 'Content';

  const contentTypeIcon = item.contentType
    ? CONTENT_TYPE_CONFIG[item.contentType]?.icon || '📝'
    : '📝';

  // Get status config
  const statusConfig = item.status
    ? CONTENT_STATUS_CONFIG[item.status]
    : { label: 'Draft', color: 'text-white/50' };

  return (
    <div
      role="row"
      tabIndex={0}
      aria-selected={isSelected}
      data-index={index}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        group flex flex-col gap-1.5 px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-150 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-iris/50
        ${isSelected
          ? 'bg-brand-iris/15 border border-brand-iris/40'
          : 'bg-slate-2 border border-transparent hover:border-slate-4 hover:bg-slate-3'
        }
      `}
    >
      {/* PRIMARY ROW: Type badge + Status */}
      <div className="flex items-center gap-2">
        {/* Priority indicator */}
        <div className={`w-1 h-4 rounded-full ${priorityColor} shrink-0`} />

        {/* Content type with icon */}
        <span className="text-sm shrink-0" title={contentTypeLabel}>{contentTypeIcon}</span>
        <span className="text-xs font-medium text-white/60">{contentTypeLabel}</span>

        {/* Status badge */}
        <span className={`px-1.5 py-0.5 text-xs font-medium rounded bg-white/5 ${statusConfig.color}`}>
          {statusConfig.label}
        </span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Pin indicator (Manual mode only) */}
        {mode === 'manual' && isPinned && (
          <span className="text-brand-cyan shrink-0" title="Pinned">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 15l7-7 7 7" />
            </svg>
          </span>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <span className="w-2 h-2 rounded-full bg-brand-iris shrink-0" />
        )}
      </div>

      {/* SECONDARY ROW: Title (most prominent) */}
      <div className="pl-3">
        <span className={`
          text-sm font-medium leading-snug line-clamp-2
          ${isSelected ? 'text-white' : 'text-white/85 group-hover:text-white'}
        `}>
          {item.title}
        </span>
      </div>

      {/* TERTIARY ROW: Last edited (only on hover/selected) */}
      <div className={`
        pl-3 flex items-center gap-3 text-xs text-white/40
        transition-opacity duration-150
        ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      `}>
        {item.lastEditedAt && (
          <span>Last edited {formatRelativeTime(item.lastEditedAt)}</span>
        )}
        {/* System metrics on hover only */}
        {item.confidence !== undefined && (
          <span className={`
            px-1 py-0.5 rounded text-xs
            ${item.confidence >= 80 ? 'text-semantic-success/70' : item.confidence >= 50 ? 'text-semantic-warning/70' : 'text-white/30'}
          `}>
            {item.confidence}% conf
          </span>
        )}
        {item.impact?.authority !== undefined && (
          <span className="text-brand-iris/70">+{item.impact.authority} auth</span>
        )}
      </div>
    </div>
  );
}
