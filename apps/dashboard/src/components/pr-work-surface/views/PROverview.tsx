'use client';

/**
 * PR Overview - Situation Brief - DS v3.0
 *
 * This is NOT a second Action Stream. This is the PR Intelligence Snapshot.
 *
 * Content:
 * - Key PR metrics (dashboard style)
 * - Opportunities / Risks / Trends (intelligence cards)
 * - Relationship health summary
 * - Small "From Command Center" preview (secondary, not primary)
 *
 * All actions route to Inbox or Command Center - no duplicate CTAs.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/COMMAND_CENTER_CONTRACT.md
 */

import { useState } from 'react';
import Link from 'next/link';
import type { PRSituationBrief } from '../types';

// ============================================
// MOCK DATA
// ============================================

const MOCK_SITUATION_BRIEF: PRSituationBrief = {
  generatedAt: new Date().toISOString(),
  stats: {
    activePitches: 12,
    pendingFollowUps: 5,
    newCoverage7d: 8,
    citationsDetected7d: 3,
    relationshipsAtRisk: 2,
  },
  topSignals: [
    {
      id: '1',
      type: 'opportunity',
      severity: 85,
      title: 'AI marketing tools trending in tech media',
      description: 'High coverage volume on AI marketing platforms. Optimal time for thought leadership pitches.',
      affectedPillars: ['content', 'seo'],
      ctaLabel: 'View matching journalists',
      ctaHref: '/app/pr?tab=database&filter=ai-marketing',
    },
    {
      id: '2',
      type: 'risk',
      severity: 72,
      title: 'Competitor PR surge incoming',
      description: 'Major competitor announcement scheduled next week. Consider proactive messaging.',
      affectedPillars: ['exec'],
      ctaLabel: 'Prepare response',
      ctaHref: '/app/pr?tab=pitches&template=competitor-response',
    },
    {
      id: '3',
      type: 'trend',
      severity: 65,
      title: 'B2B podcast appearances driving citations',
      description: 'Recent podcast appearances correlated with 40% increase in AI citations.',
      affectedPillars: ['content'],
      ctaLabel: 'Draft pitch angle',
      ctaHref: '/app/pr?tab=pitches&template=podcast-pitch',
    },
  ],
  attentionItems: [
    {
      id: 'a1',
      type: 'respond_inquiry',
      priority: 'critical',
      title: 'Respond to journalist inquiry',
      description: 'TechCrunch reporter requested comment on AI trends - deadline EOD',
      actionLabel: 'View in Inbox',
      actionUrl: '/app/pr?tab=inbox&item=inbox-1',
      dueBy: new Date(Date.now() + 4 * 3600000).toISOString(),
    },
    {
      id: 'a2',
      type: 'follow_up_pitch',
      priority: 'high',
      title: 'Follow up on pending pitches',
      description: '3 pitches in optimal follow-up window',
      actionLabel: 'View in Inbox',
      actionUrl: '/app/pr?tab=inbox',
    },
  ],
  copilotSuggestions: [],
};

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
// METRIC CARD (Hero Stats)
// ============================================

interface MetricCardProps {
  label: string;
  value: number | string;
  subLabel?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: number };
  comparison?: string; // e.g., "vs last 7d"
  accent?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({ label, value, subLabel, trend, comparison, accent = 'default' }: MetricCardProps) {
  const accentStyles = {
    default: 'text-white',
    success: 'text-semantic-success',
    warning: 'text-semantic-warning',
    danger: 'text-semantic-danger',
  };

  return (
    <div className="p-3 rounded-xl bg-[#0D0D12] border border-[#1A1A24] hover:border-[#2A2A36] transition-all">
      <div className="flex items-baseline justify-between">
        <div className={`text-xl font-bold ${accentStyles[accent]}`}>{value}</div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${
            trend.direction === 'up' ? 'text-semantic-success' :
            trend.direction === 'down' ? 'text-semantic-danger' : 'text-white/50'
          }`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            {trend.value}%
          </span>
        )}
      </div>
      <span className="text-xs text-white/50">{label}</span>
      {(comparison || subLabel) && (
        <p className="text-[10px] text-white/35 mt-0.5">{comparison || subLabel}</p>
      )}
    </div>
  );
}

// ============================================
// SIGNAL CARD (Opportunities/Risks/Trends)
// ============================================

interface SignalCardProps {
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  severity: number;
  ctaLabel: string;
  ctaHref: string;
}

function SignalCard({ type, title, description, severity, ctaLabel, ctaHref }: SignalCardProps) {
  const typeStyles = {
    opportunity: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-semantic-success',
      bg: 'bg-semantic-success/10',
      border: 'border-semantic-success/20',
      ctaBg: 'bg-semantic-success/10 hover:bg-semantic-success/20',
    },
    risk: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'text-semantic-danger',
      bg: 'bg-semantic-danger/10',
      border: 'border-semantic-danger/20',
      ctaBg: 'bg-semantic-danger/10 hover:bg-semantic-danger/20',
    },
    trend: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-brand-cyan',
      bg: 'bg-brand-cyan/10',
      border: 'border-brand-cyan/20',
      ctaBg: 'bg-brand-cyan/10 hover:bg-brand-cyan/20',
    },
  };

  const style = typeStyles[type];

  return (
    <div className={`p-3 rounded-xl bg-[#0D0D12] border ${style.border} hover:border-[#2A2A36] transition-all`}>
      <div className="flex items-start gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${style.bg}`}>
          <span className={style.color}>{style.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase ${style.color}`}>{type}</span>
            <span className="text-[10px] text-white/40">{severity}%</span>
          </div>
        </div>
      </div>
      <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">{title}</h3>
      <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 mb-3">{description}</p>
      <Link
        href={ctaHref}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium ${style.color} ${style.ctaBg} transition-colors`}
      >
        {ctaLabel}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ============================================
// RELATIONSHIP HEALTH PANEL
// ============================================

function RelationshipHealthPanel() {
  const total = RELATIONSHIP_HEALTH.total;
  const segments = [
    { label: 'Warm', count: RELATIONSHIP_HEALTH.warm, color: 'bg-semantic-success', textColor: 'text-semantic-success', pct: Math.round((RELATIONSHIP_HEALTH.warm / total) * 100) },
    { label: 'Engaged', count: RELATIONSHIP_HEALTH.engaged, color: 'bg-brand-cyan', textColor: 'text-brand-cyan', pct: Math.round((RELATIONSHIP_HEALTH.engaged / total) * 100) },
    { label: 'Cold', count: RELATIONSHIP_HEALTH.cold, color: 'bg-white/40', textColor: 'text-white/60', pct: Math.round((RELATIONSHIP_HEALTH.cold / total) * 100) },
    { label: 'Decaying', count: RELATIONSHIP_HEALTH.decaying, color: 'bg-semantic-danger', textColor: 'text-semantic-danger', pct: Math.round((RELATIONSHIP_HEALTH.decaying / total) * 100) },
  ];

  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-sm font-semibold text-white">Relationship Health</h3>
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-brand-magenta/15 text-brand-magenta ml-auto">
          {total} contacts
        </span>
      </div>

      {/* Distribution bar with inline labels */}
      <div className="relative mb-3">
        <div className="h-6 rounded-lg bg-[#1A1A24] overflow-hidden flex">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={`${seg.color} relative flex items-center justify-center first:rounded-l-lg last:rounded-r-lg transition-all`}
              style={{ width: `${seg.pct}%` }}
            >
              {seg.pct >= 12 && (
                <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">
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
            <span className={`text-[10px] font-medium ${seg.textColor}`}>{seg.label}</span>
            <span className="text-[10px] text-white/35">({seg.count})</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="pt-3 border-t border-[#1A1A24] grid grid-cols-2 gap-3">
        <div>
          <span className="text-base font-bold text-brand-cyan">{RELATIONSHIP_HEALTH.avgResponseRate}%</span>
          <p className="text-[10px] text-white/50">Response rate</p>
        </div>
        <div>
          <span className="text-base font-bold text-white">{RELATIONSHIP_HEALTH.avgTimeToResponse}</span>
          <p className="text-[10px] text-white/50">Avg reply time</p>
        </div>
      </div>

      <Link
        href="/app/pr?tab=database"
        className="mt-3 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/60 hover:text-white transition-all"
      >
        View Database
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ============================================
// ATTENTION ITEMS (Routes to Inbox)
// ============================================

function AttentionItemsPanel({ items }: { items: PRSituationBrief['attentionItems'] }) {
  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-sm font-semibold text-white">Requires Attention</h3>
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-semantic-warning/15 text-semantic-warning">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="p-3 rounded-lg bg-[#111116] border border-[#1A1A24]">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                item.priority === 'critical' ? 'bg-semantic-danger/15 text-semantic-danger' :
                item.priority === 'high' ? 'bg-semantic-warning/15 text-semantic-warning' :
                'bg-white/10 text-white/60'
              }`}>
                {item.priority}
              </span>
              {item.dueBy && (
                <span className="text-[10px] text-white/50">
                  Due {new Date(item.dueBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <h4 className="text-sm font-medium text-white">{item.title}</h4>
            <p className="text-xs text-white/50 mt-1">{item.description}</p>
            {item.actionUrl && (
              <Link
                href={item.actionUrl}
                className="inline-flex items-center gap-1 mt-2 text-xs text-brand-magenta hover:underline"
              >
                {item.actionLabel}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMMAND CENTER PREVIEW (Secondary Module)
// ============================================

function CommandCenterPreview() {
  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <span className="text-xs font-medium text-white/70">From Command Center</span>
        </div>
        <Link
          href="/app/command-center?pillar=pr"
          className="text-[10px] text-brand-iris hover:underline"
        >
          View all →
        </Link>
      </div>

      {/* Info notice */}
      <div className="p-2 rounded-lg bg-brand-iris/5 border border-brand-iris/10 mb-3">
        <p className="text-[10px] text-white/50">
          <span className="text-brand-iris">Cross-pillar orchestration</span> happens in Command Center.
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
            <svg className="w-3 h-3 text-white/30 group-hover:text-brand-iris transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
  const [brief] = useState<PRSituationBrief>(MOCK_SITUATION_BRIEF);

  const opportunities = brief.topSignals.filter(s => s.type === 'opportunity');
  const risks = brief.topSignals.filter(s => s.type === 'risk');
  const trends = brief.topSignals.filter(s => s.type === 'trend');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Situation Brief</h2>
          <p className="text-xs text-white/40 mt-0.5">Understand what matters before acting</p>
          <p className="text-[10px] text-white/30 mt-0.5">
            Generated {new Date(brief.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          label="Active Pitches"
          value={brief.stats.activePitches}
          trend={{ direction: 'up', value: 15 }}
          comparison="vs last 7d"
        />
        <MetricCard
          label="Pending Follow-ups"
          value={brief.stats.pendingFollowUps}
          accent={brief.stats.pendingFollowUps > 3 ? 'warning' : 'default'}
          comparison="optimal window"
        />
        <MetricCard
          label="Coverage (7d)"
          value={brief.stats.newCoverage7d}
          trend={{ direction: 'up', value: 25 }}
          accent="success"
          comparison="vs prior 7d"
        />
        <MetricCard
          label="AI Citations"
          value={brief.stats.citationsDetected7d}
          comparison="CiteMind tracked"
        />
        <MetricCard
          label="At-Risk Contacts"
          value={brief.stats.relationshipsAtRisk}
          accent={brief.stats.relationshipsAtRisk > 0 ? 'danger' : 'default'}
          comparison="decaying >60d"
        />
      </div>

      {/* Intelligence Signals Grid */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-3">Intelligence Signals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Opportunities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success">
                Opportunities
              </span>
              <span className="text-[10px] text-white/40">{opportunities.length}</span>
            </div>
            {opportunities.map((signal) => (
              <SignalCard
                key={signal.id}
                type="opportunity"
                title={signal.title}
                description={signal.description}
                severity={signal.severity}
                ctaLabel={signal.ctaLabel || 'View details'}
                ctaHref={signal.ctaHref || '/app/pr?tab=inbox'}
              />
            ))}
          </div>

          {/* Risks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-semantic-danger/15 text-semantic-danger">
                Risks
              </span>
              <span className="text-[10px] text-white/40">{risks.length}</span>
            </div>
            {risks.map((signal) => (
              <SignalCard
                key={signal.id}
                type="risk"
                title={signal.title}
                description={signal.description}
                severity={signal.severity}
                ctaLabel={signal.ctaLabel || 'View details'}
                ctaHref={signal.ctaHref || '/app/pr?tab=inbox'}
              />
            ))}
          </div>

          {/* Trends */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-brand-cyan/15 text-brand-cyan">
                Trends
              </span>
              <span className="text-[10px] text-white/40">{trends.length}</span>
            </div>
            {trends.map((signal) => (
              <SignalCard
                key={signal.id}
                type="trend"
                title={signal.title}
                description={signal.description}
                severity={signal.severity}
                ctaLabel={signal.ctaLabel || 'View details'}
                ctaHref={signal.ctaHref || '/app/pr?tab=inbox'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Attention + Relationships + CC Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AttentionItemsPanel items={brief.attentionItems} />
        <RelationshipHealthPanel />
        <CommandCenterPreview />
      </div>
    </div>
  );
}
