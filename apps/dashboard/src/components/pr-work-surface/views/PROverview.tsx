'use client';

/**
 * PR Overview - DS v3.0
 *
 * A lightweight PR snapshot. The fabricated mock "Situation Brief" (metrics,
 * intelligence signals, attention items) was removed — the canonical brief is
 * the SAGE Daily Brief in the Command Center (D039), not a duplicated,
 * mock-fed surface here.
 *
 * What remains:
 * - Relationship health summary
 * - Small "From Command Center" preview (secondary, not primary)
 *
 * All actions route to Inbox or Command Center - no duplicate CTAs.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/COMMAND_CENTER_CONTRACT.md
 */

import Link from 'next/link';

// ============================================
// MOCK DATA
// ============================================

// Mock relationship health data
const RELATIONSHIP_HEALTH = {
  total: 156,
  warm: 42,
  engaged: 68,
  cold: 32,
  decaying: 14,
  avgResponseRate: 32,
  avgTimeToResponse: '2.3 days',
};

// Mock Command Center PR actions (small preview)
const MOCK_CC_PR_ACTIONS = [
  {
    id: 'cc-1',
    headline: 'Draft pitch for trending AI Governance topic',
    eviDriver: 'visibility',
    confidence: 82,
  },
  {
    id: 'cc-2',
    headline: 'Prepare response: Competitor announcement',
    eviDriver: 'authority',
    confidence: 75,
  },
];

// ============================================
// RELATIONSHIP HEALTH PANEL
// ============================================

function RelationshipHealthPanel() {
  const total = RELATIONSHIP_HEALTH.total;
  const segments = [
    {
      label: 'Warm',
      count: RELATIONSHIP_HEALTH.warm,
      color: 'bg-semantic-success',
      textColor: 'text-semantic-success',
      pct: Math.round((RELATIONSHIP_HEALTH.warm / total) * 100),
    },
    {
      label: 'Engaged',
      count: RELATIONSHIP_HEALTH.engaged,
      color: 'bg-brand-cyan',
      textColor: 'text-brand-cyan',
      pct: Math.round((RELATIONSHIP_HEALTH.engaged / total) * 100),
    },
    {
      label: 'Cold',
      count: RELATIONSHIP_HEALTH.cold,
      color: 'bg-white/40',
      textColor: 'text-white/60',
      pct: Math.round((RELATIONSHIP_HEALTH.cold / total) * 100),
    },
    {
      label: 'Decaying',
      count: RELATIONSHIP_HEALTH.decaying,
      color: 'bg-semantic-danger',
      textColor: 'text-semantic-danger',
      pct: Math.round((RELATIONSHIP_HEALTH.decaying / total) * 100),
    },
  ];

  return (
    <div className="p-4 rounded-xl bg-panel border border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-brand-magenta"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-sm font-semibold text-white/95">
          Relationship Health
        </h3>
        <span className="px-1.5 py-0.5 text-[13px] font-semibold rounded bg-brand-magenta/15 text-brand-magenta ml-auto">
          {total} contacts
        </span>
      </div>

      {/* Distribution bar with inline labels */}
      <div className="relative mb-3">
        <div className="h-6 rounded-lg bg-slate-4 overflow-hidden flex">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={`${seg.color} relative flex items-center justify-center first:rounded-l-lg last:rounded-r-lg transition-all`}
              style={{ width: `${seg.pct}%` }}
            >
              {seg.pct >= 12 && (
                <span className="text-[13px] font-bold text-white/90 drop-shadow-sm">
                  {seg.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compact inline legend attached to bar */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-sm ${seg.color}`} />
            <span className={`text-[13px] font-medium ${seg.textColor}`}>
              {seg.label}
            </span>
            <span className="text-[13px] text-white/35">({seg.count})</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-3">
        <div>
          <span className="text-base font-bold text-brand-cyan">
            {RELATIONSHIP_HEALTH.avgResponseRate}%
          </span>
          <p className="text-[13px] text-white/50">Response rate</p>
        </div>
        <div>
          <span className="text-base font-bold text-white/95">
            {RELATIONSHIP_HEALTH.avgTimeToResponse}
          </span>
          <p className="text-[13px] text-white/50">Avg reply time</p>
        </div>
      </div>

      <Link
        href="/app/pr?tab=database"
        className="mt-3 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[13px] text-white/60 hover:text-white transition-all"
      >
        View Database
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  );
}

// ============================================
// COMMAND CENTER PREVIEW (Secondary Module)
// ============================================

function CommandCenterPreview() {
  return (
    <div className="p-4 rounded-xl bg-panel border border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-brand-iris"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <span className="text-xs font-medium text-white/70">
            From Command Center
          </span>
        </div>
        <Link
          href="/app/command-center?pillar=pr"
          className="text-[13px] text-brand-iris hover:underline"
        >
          View all →
        </Link>
      </div>

      {/* Info notice */}
      <div className="p-2 rounded-lg bg-brand-iris/5 border border-brand-iris/10 mb-3">
        <p className="text-[13px] text-white/50">
          <span className="text-brand-iris">Cross-pillar orchestration</span>{' '}
          happens in Command Center.
        </p>
      </div>

      {/* Mini action list */}
      <div className="space-y-2">
        {MOCK_CC_PR_ACTIONS.map((action) => (
          <Link
            key={action.id}
            href={`/app/command-center?action=${action.id}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-iris shrink-0" />
            <span className="flex-1 text-xs text-white/70 group-hover:text-white truncate">
              {action.headline}
            </span>
            <svg
              className="w-3 h-3 text-white/30 group-hover:text-brand-iris transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PROverview() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white/95">PR Overview</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Your relationship health at a glance
          </p>
        </div>
        <Link
          href="/app/command-center?pillar=pr"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          Open Daily Brief
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Secondary Grid: Relationships + CC Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RelationshipHealthPanel />
        <CommandCenterPreview />
      </div>
    </div>
  );
}
