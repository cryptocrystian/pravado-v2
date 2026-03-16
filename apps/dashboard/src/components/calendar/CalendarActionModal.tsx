'use client';

/**
 * CalendarActionModal -- Centered overlay for calendar item details + actions
 *
 * Frozen contract: clicking a calendar item MUST open this modal.
 * Never navigate away, never use a drawer.
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md §10.1, §11
 */

import { useEffect, useCallback } from 'react';
import type { CalendarItem } from '../command-center/types';
import { STATUS_CONFIG, MODE_CONFIG, PILLAR_CONFIG, RISK_CONFIG } from './types';

// ============================================
// PROPS
// ============================================

interface CalendarActionModalProps {
  item: CalendarItem;
  onClose: () => void;
}

// ============================================
// DATE FORMATTING HELPER
// ============================================

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ============================================
// CHAIN LINK ICON (for dependencies)
// ============================================

function ChainLinkIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-white/40 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
      />
    </svg>
  );
}

// ============================================
// CLOSE (X) ICON
// ============================================

function CloseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// ============================================
// STATUS-APPROPRIATE ACTIONS (§11.2 -- FROZEN)
// ============================================

function StatusActions({ status }: { status: string }) {
  switch (status) {
    case 'planned':
      return (
        <p className="text-sm text-white/50 italic">No actions required</p>
      );

    case 'drafting':
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
          >
            Preview Draft
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
          >
            Pause
          </button>
        </div>
      );

    case 'awaiting_approval':
      return (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold bg-semantic-success text-white/90 rounded-lg hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all duration-150"
          >
            Approve
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-semantic-danger border border-semantic-danger/20 rounded-lg hover:bg-semantic-danger/10 hover:border-semantic-danger/30 transition-all duration-150"
          >
            Reject
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
          >
            Request Changes
          </button>
        </div>
      );

    case 'scheduled':
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-semantic-warning border border-semantic-warning/20 rounded-lg hover:bg-semantic-warning/10 hover:border-semantic-warning/30 transition-all duration-150"
          >
            Pause
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-semantic-danger border border-semantic-danger/20 rounded-lg hover:bg-semantic-danger/10 hover:border-semantic-danger/30 transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      );

    case 'published':
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
          >
            View Details
          </button>
        </div>
      );

    case 'failed':
      return (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold bg-brand-cyan text-white/90 rounded-lg hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.25)] transition-all duration-150"
          >
            Retry
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-semantic-danger border border-semantic-danger/20 rounded-lg hover:bg-semantic-danger/10 hover:border-semantic-danger/30 transition-all duration-150"
          >
            Abandon
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
          >
            Investigate
          </button>
        </div>
      );

    default:
      return null;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CalendarActionModal({ item, onClose }: CalendarActionModalProps) {
  const statusConf = STATUS_CONFIG[item.status];
  const modeConf = MODE_CONFIG[item.mode];
  const pillarConf = PILLAR_CONFIG[item.pillar];
  const riskConf = RISK_CONFIG[item.details.risk];

  // ---- Escape key handler ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop -- click to close */}
      <div
        className="fixed inset-0 z-50 bg-page/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Modal card */}
        <div
          className="bg-panel border border-border-subtle rounded-xl shadow-elev-3 w-full max-w-lg max-h-[80vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ---- HEADER ---- */}
          <div className="flex items-start justify-between gap-4 p-6 pb-4">
            <div className="flex-1 min-w-0">
              <h2
                id="cal-modal-title"
                className="text-lg font-semibold text-white/90 leading-snug"
              >
                {item.title}
              </h2>

              {/* Badge row: pillar + mode + status */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* Pillar badge */}
                <span
                  className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${
                    pillarConf?.badgeClass ?? ''
                  }`}
                >
                  {pillarConf?.label ?? item.pillar}
                </span>

                {/* Mode badge */}
                <span
                  className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${
                    modeConf?.badgeClass ?? ''
                  }`}
                >
                  {modeConf?.label ?? item.mode}
                </span>

                {/* Status badge */}
                <span
                  className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${
                    statusConf?.badgeClass ?? ''
                  }`}
                >
                  {statusConf?.label ?? item.status}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-slate-4/50 transition-colors"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ---- SUMMARY ---- */}
          {item.details.summary && (
            <div className="px-6 pb-4">
              <p className="text-sm text-white/70 leading-relaxed">
                {item.details.summary}
              </p>
            </div>
          )}

          {/* ---- METADATA GRID ---- */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {/* Date */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                  Date
                </span>
                <span className="text-sm text-white/85">
                  {formatDate(item.date)}
                </span>
              </div>

              {/* Time */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                  Time
                </span>
                <span className="text-sm text-white/85 tabular-nums">
                  {item.time}
                </span>
              </div>

              {/* Duration */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                  Duration
                </span>
                <span className="text-sm text-white/85">
                  {item.details.estimated_duration ?? 'N/A'}
                </span>
              </div>

              {/* Owner */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                  Owner
                </span>
                <span
                  className={`text-sm font-medium ${
                    item.details.owner === 'AI'
                      ? 'text-brand-cyan'
                      : 'text-white/85'
                  }`}
                >
                  {item.details.owner}
                </span>
              </div>

              {/* Risk */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                  Risk
                </span>
                <span className="flex items-center gap-2">
                  {riskConf?.dotClass && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${riskConf.dotClass}`}
                    />
                  )}
                  <span className="text-sm text-white/85">
                    {riskConf?.label ?? item.details.risk}
                  </span>
                </span>
              </div>

              {/* Status */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                  Status
                </span>
                <span className="text-sm text-white/85">
                  {statusConf?.label ?? item.status}
                </span>
              </div>
            </div>
          </div>

          {/* ---- DEPENDENCIES ---- */}
          {item.details.dependencies.length > 0 && (
            <div className="px-6 pb-4">
              <div className="border-t border-border-subtle pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-3">
                  Dependencies
                </span>
                <ul className="space-y-2">
                  {item.details.dependencies.map((dep, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-white/70"
                    >
                      <ChainLinkIcon />
                      <span>{dep}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ---- ACTIONS (§11.2 -- FROZEN, status-appropriate) ---- */}
          <div className="px-6 pb-6">
            <div className="border-t border-border-subtle pt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-3">
                Actions
              </span>
              <StatusActions status={item.status} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
