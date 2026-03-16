'use client';

/**
 * CalendarItemCard — Shared item display for all calendar views
 *
 * Renders a calendar item with status indicator, pillar badge, mode badge,
 * risk indicator, and click handler to open Action Modal.
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md §4–7
 */

import type { CalendarItem } from '../command-center/types';
import { STATUS_CONFIG, MODE_CONFIG, PILLAR_CONFIG, RISK_CONFIG } from './types';

interface CalendarItemCardProps {
  item: CalendarItem;
  onClick: (item: CalendarItem) => void;
  /** Compact mode for month view dots */
  compact?: boolean;
}

// ============================================
// STATUS ICON (§5.1)
// ============================================

function StatusIcon({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  // planned = circle outline
  if (status === 'planned') {
    return (
      <span className="inline-flex w-3 h-3 rounded-full border-2 border-white/30 shrink-0" />
    );
  }

  // drafting = pulsing dot
  if (status === 'drafting') {
    return (
      <span className="relative inline-flex w-3 h-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-iris opacity-50" />
        <span className="relative inline-flex w-3 h-3 rounded-full bg-brand-iris shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
      </span>
    );
  }

  // awaiting_approval = amber badge
  if (status === 'awaiting_approval') {
    return (
      <span className="inline-flex w-3 h-3 rounded-full bg-semantic-warning shadow-[0_0_6px_rgba(234,179,8,0.5)] shrink-0" />
    );
  }

  // scheduled = solid dot
  if (status === 'scheduled') {
    return (
      <span className="inline-flex w-3 h-3 rounded-full bg-brand-cyan shadow-[0_0_6px_rgba(0,217,255,0.4)] shrink-0" />
    );
  }

  // published = checkmark
  if (status === 'published') {
    return (
      <svg className="w-3.5 h-3.5 text-semantic-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  // failed = red X
  if (status === 'failed') {
    return (
      <svg className="w-3.5 h-3.5 text-semantic-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }

  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CalendarItemCard({ item, onClick, compact }: CalendarItemCardProps) {
  const statusConf = STATUS_CONFIG[item.status];
  const modeConf = MODE_CONFIG[item.mode];
  const pillarConf = PILLAR_CONFIG[item.pillar];
  const riskConf = RISK_CONFIG[item.details.risk];

  if (compact) {
    // Minimal display for month view
    return (
      <button
        type="button"
        onClick={() => onClick(item)}
        className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-4 transition-colors cursor-pointer text-left"
      >
        <StatusIcon status={item.status} />
        <span className="text-[13px] text-white/85 truncate flex-1">{item.title}</span>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pillarConf?.dotClass ?? ''}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`w-full bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-4 text-left transition-all duration-150 hover:border-slate-5 hover:bg-slate-3 cursor-pointer ${
        statusConf?.urgent ? 'ring-1 ring-semantic-warning/20' : ''
      }`}
    >
      {/* Top row: time + badges */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold text-white/90 tabular-nums">{item.time}</span>

        {/* Pillar badge */}
        <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${pillarConf?.badgeClass ?? ''}`}>
          {pillarConf?.label ?? item.pillar}
        </span>

        {/* Mode badge */}
        <span className={`px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${modeConf?.badgeClass ?? ''}`}>
          {modeConf?.label ?? item.mode}
        </span>

        {/* Risk indicator */}
        {riskConf && riskConf.dotClass && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${riskConf.dotClass}`} title={`Risk: ${riskConf.label}`} />
        )}

        {/* Status badge (right-aligned) */}
        <span className={`ml-auto px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${statusConf?.badgeClass ?? ''}`}>
          {statusConf?.label ?? item.status}
        </span>
      </div>

      {/* Title row with status icon */}
      <div className="flex items-center gap-2">
        <StatusIcon status={item.status} />
        <h4 className="text-sm font-semibold text-white/90 truncate">{item.title}</h4>
      </div>

      {/* Summary */}
      <p className="text-[13px] text-white/55 mt-1 line-clamp-2 leading-relaxed">{item.details.summary}</p>

      {/* Dependencies (if any) */}
      {item.details.dependencies.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <svg className="w-3 h-3 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            {item.details.dependencies.length} dep{item.details.dependencies.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </button>
  );
}
