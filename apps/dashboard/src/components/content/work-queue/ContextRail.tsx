'use client';

/**
 * ContextRail - Right pane for contextual information.
 *
 * Sections:
 * - CiteMind Status (quality gate)
 * - Entity Associations
 * - Derivatives (generated surfaces)
 * - Cross-Pillar Impacts (PR, SEO hooks)
 * - Guardrails (Autopilot only)
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/AUTOMATION_MODE_CONTRACTS_CANON.md
 */

import { useState } from 'react';
import type { AutomationMode, CiteMindStatus, CiteMindIssue, DerivativeType, AuditLedgerEntry } from '../types';

// ============================================
// TYPES
// ============================================

export interface ContextRailProps {
  mode: AutomationMode;
  /** CiteMind status */
  citeMindStatus?: CiteMindStatus;
  citeMindIssues?: CiteMindIssue[];
  /** Entity associations */
  entities?: string[];
  /** Available/generated derivatives */
  derivatives?: Array<{
    type: DerivativeType;
    valid: boolean;
    generatedAt?: string;
  }>;
  /** Cross-pillar summary */
  crossPillar?: {
    prHooks: number;
    seoHooks: number;
  };
  /** Pipeline counts */
  pipelineCounts?: {
    draft: number;
    review: number;
    approved: number;
    published: number;
  };
  /** Upcoming deadlines */
  upcomingDeadlines?: {
    count: number;
    nextDate?: string;
  };
  /** Audit ledger entries (Autopilot only) */
  auditLedger?: AuditLedgerEntry[];
  /** Handlers */
  onViewCalendar?: () => void;
  onViewLibrary?: () => void;
  onFixIssues?: () => void;
}

// ============================================
// CITEMIND SECTION
// ============================================

const CITEMIND_STATUS_CONFIG = {
  passed: {
    label: 'Passed',
    color: 'text-semantic-success',
    bg: 'bg-semantic-success/10',
    border: 'border-semantic-success/20',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    label: 'Issues Found',
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
    border: 'border-semantic-warning/20',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  blocked: {
    label: 'Blocked',
    color: 'text-semantic-danger',
    bg: 'bg-semantic-danger/10',
    border: 'border-semantic-danger/20',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  pending: {
    label: 'Pending',
    color: 'text-white/50',
    bg: 'bg-white/5',
    border: 'border-white/10',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  analyzing: {
    label: 'Analyzing',
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/20',
    icon: (
      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
};

const DERIVATIVE_LABELS: Record<DerivativeType, string> = {
  pr_pitch_excerpt: 'PR Pitch Excerpt',
  aeo_snippet: 'AEO Snippet',
  ai_summary: 'AI Summary',
  social_fragment: 'Social Fragment',
};

// ============================================
// GUARDRAILS (Autopilot)
// ============================================

const GUARDRAILS = [
  { id: 'g1', name: 'Critical Priority', description: 'Critical items always surface', active: true },
  { id: 'g2', name: 'CiteMind Issues', description: 'Quality issues require review', active: true },
  { id: 'g3', name: 'Deadline < 24h', description: 'Urgent deadlines need confirmation', active: true },
];

// ============================================
// COMPONENT
// ============================================

export function ContextRail({
  mode,
  citeMindStatus,
  citeMindIssues = [],
  entities = [],
  derivatives = [],
  crossPillar,
  pipelineCounts,
  upcomingDeadlines,
  auditLedger = [],
  onViewCalendar,
  onViewLibrary,
  onFixIssues,
}: ContextRailProps) {
  const [crossPillarCollapsed, setCrossPillarCollapsed] = useState(mode === 'autopilot');
  const [auditLogCollapsed, setAuditLogCollapsed] = useState(false);

  const citeMindConf = citeMindStatus ? CITEMIND_STATUS_CONFIG[citeMindStatus] : null;
  const isAutopilotReadOnly = mode === 'autopilot';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 space-y-4">

        {/* SECTION: CiteMind Status */}
        {citeMindConf && (
          <section className={`p-3 rounded-lg border ${citeMindConf.border} ${citeMindConf.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={citeMindConf.color}>{citeMindConf.icon}</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">CiteMind</h4>
              <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded ${citeMindConf.color} ${citeMindConf.bg}`}>
                {citeMindConf.label}
              </span>
            </div>
            {citeMindIssues.length > 0 && (
              <div className="space-y-1.5">
                {citeMindIssues.slice(0, 3).map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={issue.severity === 'error' ? 'text-semantic-danger' : 'text-semantic-warning'}>
                      {issue.severity === 'error' ? '!' : '?'}
                    </span>
                    <span className="text-white/60">{issue.message}</span>
                  </div>
                ))}
                {citeMindIssues.length > 3 && (
                  <button
                    onClick={onFixIssues}
                    className="text-xs text-brand-iris hover:underline"
                  >
                    +{citeMindIssues.length - 3} more issues
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* SECTION: Pipeline Status */}
        {pipelineCounts && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Pipeline</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(pipelineCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs">
                  <span className="text-white/50 capitalize">{status}</span>
                  <span className="font-medium text-white/70">{count}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onViewLibrary}
              className="w-full mt-2 py-1.5 text-xs text-brand-iris hover:bg-brand-iris/5 rounded transition-colors"
            >
              View Library →
            </button>
          </section>
        )}

        {/* SECTION: Upcoming Deadlines */}
        {upcomingDeadlines && upcomingDeadlines.count > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Deadlines</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">{upcomingDeadlines.count} upcoming</span>
              {upcomingDeadlines.nextDate && (
                <span className="text-xs text-semantic-warning">Next: {upcomingDeadlines.nextDate}</span>
              )}
            </div>
            <button
              onClick={onViewCalendar}
              className="w-full mt-2 py-1.5 text-xs text-brand-iris hover:bg-brand-iris/5 rounded transition-colors"
            >
              View Calendar →
            </button>
          </section>
        )}

        {/* SECTION: Entities */}
        {entities.length > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Entities</h4>
            <div className="flex flex-wrap gap-1.5">
              {entities.map((entity) => (
                <span
                  key={entity}
                  className="px-2 py-0.5 text-xs font-medium text-white/60 bg-white/5 rounded"
                >
                  {entity}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: Derivatives */}
        {derivatives.length > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Derivatives</h4>
            <div className="space-y-1.5">
              {derivatives.map((d) => (
                <div key={d.type} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{DERIVATIVE_LABELS[d.type]}</span>
                  <span className={d.valid ? 'text-semantic-success' : 'text-white/30'}>
                    {d.valid ? '✓ Ready' : '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: Cross-Pillar Impacts */}
        {crossPillar && (crossPillar.prHooks > 0 || crossPillar.seoHooks > 0 || mode === 'autopilot') && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <button
              onClick={() => setCrossPillarCollapsed(!crossPillarCollapsed)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${crossPillarCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Cross-Pillar</h4>
              </div>
              {isAutopilotReadOnly && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-white/30 bg-white/5 rounded">
                  Read-Only
                </span>
              )}
            </button>
            {!crossPillarCollapsed && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">PR Hooks</span>
                  <span className="font-medium text-white/70">{crossPillar.prHooks}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">SEO Hooks</span>
                  <span className="font-medium text-white/70">{crossPillar.seoHooks}</span>
                </div>
                {!isAutopilotReadOnly && (
                  <button className="w-full mt-1 py-1.5 text-xs text-brand-iris hover:bg-brand-iris/5 rounded transition-colors">
                    Manage Hooks →
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* SECTION: Guardrails (Autopilot only) */}
        {mode === 'autopilot' && (
          <section className="p-3 bg-brand-iris/5 border border-brand-iris/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-iris">Guardrails</h4>
            </div>
            <div className="space-y-1.5">
              {GUARDRAILS.filter(g => g.active).map((guardrail) => (
                <div key={guardrail.id} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-iris mt-1.5 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-white/70">{guardrail.name}</span>
                    <p className="text-[10px] text-white/40">{guardrail.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: Audit Ledger (Autopilot only) */}
        {mode === 'autopilot' && auditLedger.length > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <button
              onClick={() => setAuditLogCollapsed(!auditLogCollapsed)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${auditLogCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Auto-handled</h4>
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-semantic-success bg-semantic-success/10 rounded">
                  {auditLedger.length}
                </span>
              </div>
            </button>
            {!auditLogCollapsed && (
              <div className="mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                {auditLedger.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-3/50 rounded">
                    <span className="text-white/60 truncate flex-1">{entry.summary}</span>
                    <span className="text-white/30 shrink-0 ml-2">
                      {(() => {
                        const d = new Date(entry.timestamp);
                        return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
                      })()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
