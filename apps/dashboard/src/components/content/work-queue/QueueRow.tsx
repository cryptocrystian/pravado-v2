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

import type { AutomationMode } from '../types';

// ============================================
// TYPES
// ============================================

export interface QueueItem {
  id: string;
  title: string;
  summary: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'opportunity' | 'issue' | 'scheduled' | 'sage_proposal' | 'execution';
  relatedEntityId?: string;
  relatedEntityType?: 'gap' | 'brief' | 'asset' | 'cluster';
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
    label: 'Brief',
    color: 'text-brand-iris',
    bg: 'bg-brand-iris/10',
  },
  issue: {
    label: 'Issue',
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
  },
  opportunity: {
    label: 'Gap',
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
  },
  scheduled: {
    label: 'Deadline',
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

export function QueueRow({
  item,
  isSelected,
  isPinned = false,
  onClick,
  onPinToggle,
  mode,
  index,
}: QueueRowProps) {
  const typeConf = TYPE_CONFIG[item.type];
  const priorityColor = PRIORITY_INDICATOR[item.priority];

  // Confidence display
  const confidenceDisplay = item.confidence !== undefined
    ? item.confidence >= 80 ? 'Hi' : item.confidence >= 50 ? 'Med' : 'Lo'
    : null;

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
        group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-150 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-iris/50
        ${isSelected
          ? 'bg-brand-iris/15 border border-brand-iris/40'
          : 'bg-slate-2 border border-transparent hover:border-slate-4 hover:bg-slate-3'
        }
      `}
    >
      {/* Priority indicator bar */}
      <div className={`w-1 h-8 rounded-full ${priorityColor} shrink-0`} />

      {/* Type badge - compact */}
      <span className={`
        px-1.5 py-0.5 text-[10px] font-bold uppercase rounded shrink-0
        ${typeConf.color} ${typeConf.bg}
      `}>
        {typeConf.label}
      </span>

      {/* Title - flex grow, truncate */}
      <span className={`
        flex-1 text-sm font-medium truncate
        ${isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'}
      `}>
        {item.title}
      </span>

      {/* Metadata chips - right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Confidence chip */}
        {confidenceDisplay && (
          <span className={`
            px-1.5 py-0.5 text-[10px] font-medium rounded
            ${item.confidence! >= 80
              ? 'text-semantic-success bg-semantic-success/10'
              : item.confidence! >= 50
              ? 'text-semantic-warning bg-semantic-warning/10'
              : 'text-white/50 bg-white/5'
            }
          `}>
            {confidenceDisplay}
          </span>
        )}

        {/* Impact chip (if present) */}
        {item.impact?.authority !== undefined && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium text-brand-iris bg-brand-iris/10 rounded">
            +{item.impact.authority}
          </span>
        )}

        {/* Pin indicator (Manual mode only) */}
        {mode === 'manual' && isPinned && (
          <span className="text-brand-cyan" title="Pinned to next">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.88 12.12a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06-1.06l1.72-1.72H3a.75.75 0 0 1 0-1.5h4.04l-1.72-1.72a.75.75 0 0 1 1.06-1.06l3.5 3.5ZM14.12 7.88a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 1 1 1.06 1.06L16.96 6.1H21a.75.75 0 0 1 0 1.5h-4.04l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3.5-3.5Z" />
            </svg>
          </span>
        )}

        {/* Pin toggle button (Manual mode, on hover) */}
        {mode === 'manual' && onPinToggle && !isPinned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinToggle();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-brand-cyan transition-all"
            title="Pin to next"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <span className="w-2 h-2 rounded-full bg-brand-iris shrink-0" />
        )}
      </div>
    </div>
  );
}
