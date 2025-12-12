/**
 * PR Continuity Links (Sprint S95)
 *
 * Cross-pillar navigation showing how PR connects to:
 * - Content Hub (coverage → content strategy)
 * - SEO (mentions → link building)
 * - Executive Hub (signals → exec digest)
 * - Crisis Radar (negative coverage → escalation)
 *
 * DS v2 Compliant with orchestration visibility
 */

'use client';

import Link from 'next/link';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Types
export type LinkedPillar = 'content' | 'seo' | 'exec' | 'crisis';

export interface PillarConnection {
  pillar: LinkedPillar;
  status: 'active' | 'pending' | 'idle';
  signalCount: number;
  lastSyncedAt?: string;
  influence: 'informs' | 'triggered_by' | 'updates' | 'affects';
  description: string;
  latestSignal?: string;
  actionUrl: string;
  actionLabel: string;
}

export interface PRContinuityLinksData {
  connections: PillarConnection[];
  orchestrationStatus: 'healthy' | 'partial' | 'disconnected';
  lastFullSyncAt: string;
}

interface PRContinuityLinksProps {
  data: PRContinuityLinksData | null;
  loading?: boolean;
  compact?: boolean;
}

// Pillar configurations
const pillarConfig: Record<LinkedPillar, {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  ring: string;
  gradient: string;
  href: string;
}> = {
  content: {
    label: 'Content Hub',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bg: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    ring: 'ring-brand-cyan/30',
    gradient: 'from-brand-cyan/20 to-brand-cyan/5',
    href: '/app/content',
  },
  seo: {
    label: 'SEO Intelligence',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    bg: 'bg-brand-magenta/10',
    text: 'text-brand-magenta',
    ring: 'ring-brand-magenta/30',
    gradient: 'from-brand-magenta/20 to-brand-magenta/5',
    href: '/app/seo',
  },
  exec: {
    label: 'Executive Hub',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bg: 'bg-brand-amber/10',
    text: 'text-brand-amber',
    ring: 'ring-brand-amber/30',
    gradient: 'from-brand-amber/20 to-brand-amber/5',
    href: '/app/exec',
  },
  crisis: {
    label: 'Crisis Radar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bg: 'bg-semantic-danger/10',
    text: 'text-semantic-danger',
    ring: 'ring-semantic-danger/30',
    gradient: 'from-semantic-danger/20 to-semantic-danger/5',
    href: '/app/crisis',
  },
};

// Influence styling
const influenceStyles: Record<string, { label: string; color: string }> = {
  informs: { label: 'Informs', color: 'text-brand-cyan' },
  triggered_by: { label: 'Triggered by', color: 'text-semantic-danger' },
  updates: { label: 'Updates', color: 'text-brand-amber' },
  affects: { label: 'Affects', color: 'text-brand-magenta' },
};

// Status styling
const statusStyles: Record<string, { dot: string; label: string }> = {
  active: { dot: 'bg-semantic-success', label: 'Active' },
  pending: { dot: 'bg-brand-amber animate-pulse', label: 'Pending' },
  idle: { dot: 'bg-slate-6', label: 'Idle' },
};

// Orchestration status styling
const orchestrationStatusStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  healthy: {
    bg: 'bg-semantic-success/10',
    text: 'text-semantic-success',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  partial: {
    bg: 'bg-brand-amber/10',
    text: 'text-brand-amber',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
      </svg>
    ),
  },
  disconnected: {
    bg: 'bg-semantic-danger/10',
    text: 'text-semantic-danger',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

export function PRContinuityLinks({
  data,
  loading,
  compact = false,
}: PRContinuityLinksProps) {
  // Build AI reasoning context
  const buildReasoningContext = (): AIReasoningContext => ({
    triggerSource: 'Cross-Pillar Orchestration',
    triggerDescription: 'PR Intelligence feeds signals to Content, SEO, Executive, and Crisis pillars for unified marketing intelligence',
    sourcePillar: 'pr',
    relatedPillars: data?.connections.map((c) => ({
      pillar: c.pillar,
      influence: c.influence,
      description: c.description,
    })) || [],
    confidence: 95,
    nextActions: [
      { label: 'View Orchestration Map', href: '/app/exec', priority: 'medium' },
      { label: 'Configure Sync', href: '/app/settings/integrations', priority: 'low' },
    ],
    generatedAt: data?.lastFullSyncAt,
  });

  if (loading) {
    return (
      <div className="panel-card p-6 shadow-lg shadow-slate-1/20">
        <div className="flex items-center justify-center py-8">
          <div className="w-2 h-2 rounded-full bg-brand-iris animate-pulse" />
          <span className="ml-3 text-muted">Loading connections...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-card p-6 shadow-lg shadow-slate-1/20">
        <div className="text-center py-8">
          <p className="text-muted">No pillar connections configured</p>
        </div>
      </div>
    );
  }

  const activeConnections = data.connections.filter((c) => c.status === 'active');
  const totalSignals = data.connections.reduce((acc, c) => acc + c.signalCount, 0);
  const orchStatus = orchestrationStatusStyles[data.orchestrationStatus];

  if (compact) {
    return (
      <div className="panel-card p-5 shadow-lg shadow-slate-1/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Cross-Pillar Links</h3>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${orchStatus.bg} ${orchStatus.text}`}>
              {orchStatus.icon}
              {data.orchestrationStatus}
            </span>
          </div>
          <AIReasoningPopover context={buildReasoningContext()} position="left" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {data.connections.map((conn) => {
            const config = pillarConfig[conn.pillar];
            const status = statusStyles[conn.status];
            return (
              <Link
                key={conn.pillar}
                href={conn.actionUrl}
                className={`p-3 rounded-lg border border-border-subtle ${config.bg} hover:border-${conn.pillar === 'content' ? 'brand-cyan' : conn.pillar === 'seo' ? 'brand-magenta' : conn.pillar === 'exec' ? 'brand-amber' : 'semantic-danger'}/30 transition-all group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={config.text}>{config.icon}</span>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                </div>
                <p className="text-xs font-medium text-white truncate">{config.label}</p>
                <p className="text-xs text-slate-10">{conn.signalCount} signals</p>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card overflow-hidden shadow-lg shadow-slate-1/20">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border-subtle bg-gradient-to-r from-slate-3/50 to-slate-3/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand-iris/15 ring-1 ring-brand-iris/20">
              <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Cross-Pillar Intelligence</h2>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${orchStatus.bg} ${orchStatus.text}`}>
                  {orchStatus.icon}
                  <span className="capitalize">{data.orchestrationStatus}</span>
                </span>
              </div>
              <p className="text-sm text-slate-10 mt-0.5">
                {activeConnections.length} active connections · {totalSignals} signals flowing
              </p>
            </div>
          </div>
          <AIReasoningPopover context={buildReasoningContext()} position="bottom" />
        </div>
      </div>

      {/* Connections Grid */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {data.connections.map((conn) => {
          const config = pillarConfig[conn.pillar];
          const status = statusStyles[conn.status];
          const influence = influenceStyles[conn.influence];
          const isActive = conn.status === 'active';

          return (
            <div
              key={conn.pillar}
              className={`relative p-5 rounded-xl border transition-all ${
                isActive
                  ? `bg-gradient-to-br ${config.gradient} border-${conn.pillar === 'content' ? 'brand-cyan' : conn.pillar === 'seo' ? 'brand-magenta' : conn.pillar === 'exec' ? 'brand-amber' : 'semantic-danger'}/20`
                  : 'bg-slate-3/30 border-border-subtle'
              }`}
            >
              {/* Status Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                <span className="text-xs text-slate-10">{status.label}</span>
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <span className={config.text}>{config.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{config.label}</h3>
                  <p className={`text-xs ${influence.color}`}>
                    PR {influence.label.toLowerCase()} this pillar
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-11 mb-3 leading-relaxed">{conn.description}</p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-10">Signals:</span>
                  <span className={`text-xs font-semibold ${config.text}`}>{conn.signalCount}</span>
                </div>
                {conn.lastSyncedAt && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-10">Synced:</span>
                    <span className="text-xs text-slate-11">
                      {new Date(conn.lastSyncedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Latest Signal */}
              {conn.latestSignal && (
                <div className="p-2.5 rounded-lg bg-slate-4/40 mb-3">
                  <p className="text-xs text-slate-11 line-clamp-2">{conn.latestSignal}</p>
                </div>
              )}

              {/* Action */}
              <Link
                href={conn.actionUrl}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${config.bg} ${config.text} hover:opacity-80`}
              >
                {conn.actionLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border-subtle bg-slate-2/50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-10">
            Last full sync: {new Date(data.lastFullSyncAt).toLocaleString()}
          </p>
          <Link
            href="/app/exec"
            className="text-xs font-medium text-brand-iris hover:text-brand-iris/80 transition-colors"
          >
            View Full Orchestration Map →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PRContinuityLinks;
