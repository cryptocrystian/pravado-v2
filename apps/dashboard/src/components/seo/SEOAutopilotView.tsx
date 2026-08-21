'use client';

/**
 * SEO/AEO Autopilot Mode View
 *
 * Monitoring surface -- sparse, exception-focused. No creation-forward UI.
 * Two tabs only: Overview and Exceptions.
 *
 * Pillar color: brand-cyan (#00D9FF)
 *
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md
 */

import { useState } from 'react';

import { MOCK_AUTOPILOT_EXCEPTIONS, MOCK_AUTOPILOT_STATUS } from './mock-data';
import { SeoOverviewPanel } from './SeoOverviewPanel';
import { SEVERITY_CONFIG } from './types';

// ============================================
// TYPES
// ============================================

interface SEOAutopilotViewProps {
  activeTab: 'overview' | 'exceptions';
}

// ============================================
// HELPERS
// ============================================

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date('2026-02-20T10:00:00Z'); // Stable reference to avoid hydration mismatch
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ============================================
// EXCEPTIONS TAB
// ============================================

function ExceptionsTab() {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const unresolvedExceptions = MOCK_AUTOPILOT_EXCEPTIONS.filter(
    (ex) => !resolvedIds.has(ex.id)
  );

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => new Set([...prev, id]));
  };

  // All-clear empty state
  if (unresolvedExceptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-10 flex flex-col items-center text-center max-w-md">
          {/* Large green checkmark */}
          <div className="w-16 h-16 rounded-full bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center mb-5">
            <svg
              className="w-8 h-8 text-semantic-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white/90 mb-1">
            All clear
          </h3>
          <p className="text-sm text-white/55 mb-5">
            {MOCK_AUTOPILOT_STATUS.running + MOCK_AUTOPILOT_STATUS.queued} items
            executing autonomously
          </p>
          <button
            type="button"
            className="px-4 py-2.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
          >
            View Activity Log
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
          {unresolvedExceptions.length} Exception
          {unresolvedExceptions.length !== 1 ? 's' : ''} Requiring Attention
        </span>
      </div>

      {unresolvedExceptions.map((exception) => {
        const severityConf =
          SEVERITY_CONFIG[exception.severity] ?? SEVERITY_CONFIG.medium;

        return (
          <div
            key={exception.id}
            className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5"
          >
            {/* Header: title + severity badge */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90 leading-snug pr-3">
                {exception.title}
              </h3>
              <span
                className={`shrink-0 px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${severityConf.color}`}
              >
                {severityConf.label}
              </span>
            </div>

            {/* Detail rows */}
            <div className="space-y-3 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-0.5">
                  What it attempted
                </span>
                <p className="text-sm text-white/70 leading-relaxed">
                  {exception.attempted}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-0.5">
                  Why it stopped
                </span>
                <p className="text-sm text-white/70 leading-relaxed">
                  {exception.reason}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-0.5">
                  Your decision
                </span>
                <p className="text-sm text-white/85 leading-relaxed font-medium">
                  {exception.requiresDecision}
                </p>
              </div>
            </div>

            {/* Timestamp + actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <span className="text-[13px] text-white/50">
                {formatTimestamp(exception.timestamp)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResolve(exception.id)}
                  className="px-4 py-2 text-sm font-semibold bg-semantic-success text-white/90 rounded-lg hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all duration-150"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(exception.id)}
                  className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/20 rounded-lg hover:bg-semantic-warning/20 transition-all duration-150"
                >
                  Escalate
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SEOAutopilotView({ activeTab }: SEOAutopilotViewProps) {
  return (
    <div className="max-w-5xl mx-auto">
      {activeTab === 'overview' && <SeoOverviewPanel />}
      {activeTab === 'exceptions' && <ExceptionsTab />}
    </div>
  );
}
