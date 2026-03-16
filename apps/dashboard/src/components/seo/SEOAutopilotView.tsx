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
import {
  MOCK_SHARE_OF_MODEL,
  MOCK_COMPETITORS,
  MOCK_LAYER_HEALTH,
  MOCK_AUTOPILOT_EXCEPTIONS,
  MOCK_AUTOPILOT_RECENT,
  MOCK_AUTOPILOT_STATUS,
} from './mock-data';
import { getAEOBandColor, SEVERITY_CONFIG } from './types';

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

function getLayerStatusDot(status: 'healthy' | 'attention' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return 'bg-semantic-success shadow-[0_0_6px_rgba(22,163,74,0.4)]';
    case 'attention':
      return 'bg-semantic-warning shadow-[0_0_6px_rgba(234,179,8,0.4)]';
    case 'critical':
      return 'bg-semantic-danger shadow-[0_0_6px_rgba(239,68,68,0.4)]';
  }
}

function getLayerScoreColor(status: 'healthy' | 'attention' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return 'text-semantic-success';
    case 'attention':
      return 'text-semantic-warning';
    case 'critical':
      return 'text-semantic-danger';
  }
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* System Status Panel */}
      <div className="bg-panel border border-brand-cyan/20 rounded-xl shadow-elev-1 shadow-[0_0_16px_rgba(0,217,255,0.15)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-cyan shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan">
              Autopilot Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
            >
              View Activity Log
            </button>
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-semibold bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/20 rounded-lg hover:bg-semantic-warning/20 transition-all duration-150"
            >
              Pause All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Running */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
              Running
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-cyan tabular-nums">
                {MOCK_AUTOPILOT_STATUS.running}
              </span>
              <span className="text-sm text-white/50">actions executing</span>
            </div>
          </div>

          {/* Queued */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
              Queue Depth
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white/90 tabular-nums">
                {MOCK_AUTOPILOT_STATUS.queued}
              </span>
              <span className="text-sm text-white/50">actions queued</span>
            </div>
          </div>

          {/* Next Scheduled */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
              Next Scheduled
            </span>
            <p className="text-sm text-white/70 leading-relaxed">
              {MOCK_AUTOPILOT_STATUS.nextAction}
            </p>
          </div>
        </div>
      </div>

      {/* Share of Model + Layer Health row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Share of Model -- simplified */}
        <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-3">
            Share of Model
          </span>
          <div className="flex items-baseline gap-3 mb-3">
            <span className={`text-3xl font-bold tabular-nums ${getAEOBandColor(MOCK_SHARE_OF_MODEL.brand)}`}>
              {MOCK_SHARE_OF_MODEL.brand}%
            </span>
            <span className="text-sm font-semibold text-semantic-success tabular-nums">
              +{MOCK_SHARE_OF_MODEL.trend}%
            </span>
            <span className="text-[13px] text-white/50">
              {MOCK_SHARE_OF_MODEL.period}
            </span>
          </div>

          {/* Competitor delta */}
          <div className="space-y-2">
            {MOCK_COMPETITORS.filter((c) => c.name !== 'Your Brand')
              .slice(0, 3)
              .map((comp) => {
                const delta = MOCK_SHARE_OF_MODEL.brand - comp.shareOfModel;
                const isAhead = delta > 0;
                return (
                  <div key={comp.name} className="flex items-center justify-between">
                    <span className="text-sm text-white/55">{comp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] tabular-nums ${getAEOBandColor(comp.shareOfModel)}`}>
                        {comp.shareOfModel}%
                      </span>
                      <span
                        className={`text-[13px] font-semibold tabular-nums ${
                          isAhead ? 'text-semantic-success' : 'text-semantic-danger'
                        }`}
                      >
                        {isAhead ? '+' : ''}{delta.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Layer Health -- status indicators only */}
        <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-3">
            Layer Health
          </span>
          <div className="space-y-3">
            {MOCK_LAYER_HEALTH.map((layer) => (
              <div
                key={layer.layer}
                className="flex items-center justify-between py-2 px-3 bg-slate-3 rounded-lg cursor-pointer hover:bg-slate-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${getLayerStatusDot(layer.status)}`} />
                  <span className="text-sm font-medium text-white/85">{layer.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold tabular-nums ${getLayerScoreColor(layer.status)}`}>
                    {layer.score}
                  </span>
                  <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Completions */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-3">
          Recent Completions
        </span>
        <div className="space-y-1">
          {MOCK_AUTOPILOT_RECENT.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <svg className="w-4 h-4 text-semantic-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-white/85 truncate">{item.title}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <span className="text-[13px] text-white/50">{formatTimestamp(item.completedAt)}</span>
                <span className="text-sm font-semibold text-semantic-success tabular-nums">
                  +{item.impactDelta.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
            <svg className="w-8 h-8 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white/90 mb-1">
            All clear
          </h3>
          <p className="text-sm text-white/55 mb-5">
            {MOCK_AUTOPILOT_STATUS.running + MOCK_AUTOPILOT_STATUS.queued} items executing autonomously
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
          {unresolvedExceptions.length} Exception{unresolvedExceptions.length !== 1 ? 's' : ''} Requiring Attention
        </span>
      </div>

      {unresolvedExceptions.map((exception) => {
        const severityConf = SEVERITY_CONFIG[exception.severity] ?? SEVERITY_CONFIG.medium;

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
                <p className="text-sm text-white/70 leading-relaxed">{exception.attempted}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-0.5">
                  Why it stopped
                </span>
                <p className="text-sm text-white/70 leading-relaxed">{exception.reason}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-0.5">
                  Your decision
                </span>
                <p className="text-sm text-white/85 leading-relaxed font-medium">{exception.requiresDecision}</p>
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
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'exceptions' && <ExceptionsTab />}
    </div>
  );
}
