/**
 * Orchestration Summary Card (Sprint S93)
 *
 * Dashboard card showing:
 * - AI system status overview
 * - Active pillar connections
 * - Current orchestration state
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface PillarStatus {
  id: string;
  name: string;
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  status: 'active' | 'idle' | 'processing';
  activeStreams: number;
  lastActivity?: string;
}

interface ConnectionFlow {
  id: string;
  from: string;
  fromPillar: string;
  to: string;
  toPillar: string;
  type: 'triggers' | 'informs' | 'updates';
  isActive: boolean;
}

interface OrchestrationOverview {
  totalStreams: number;
  activeConnections: number;
  pillars: PillarStatus[];
  connections: ConnectionFlow[];
  systemHealth: 'healthy' | 'degraded' | 'offline';
}

// AI Dot
function AIDot({ status = 'idle', size = 'sm' }: { status?: 'idle' | 'active' | 'processing'; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'md' ? 'w-3 h-3' : 'w-2 h-2';
  const baseClasses = `${sizeClasses} rounded-full`;

  if (status === 'processing') {
    return <span className={`${baseClasses} bg-brand-iris animate-pulse`} />;
  }
  if (status === 'active') {
    return <span className={`${baseClasses} bg-brand-cyan`} />;
  }
  return <span className={`${baseClasses} bg-slate-6`} />;
}

// Pillar colors
const pillarColors: Record<string, { bg: string; text: string; border: string }> = {
  pr: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris/20' },
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/20' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta/20' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', border: 'border-brand-amber/20' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', border: 'border-semantic-danger/20' },
};

// Pillar Status Badge
function PillarBadge({ pillar }: { pillar: PillarStatus }) {
  const colors = pillarColors[pillar.pillar] || pillarColors.pr;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors.bg} ${colors.border}`}>
      <AIDot status={pillar.status} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${colors.text}`}>{pillar.name}</p>
        <p className="text-xs text-muted">{pillar.activeStreams} active streams</p>
      </div>
    </div>
  );
}

// Connection Line
function ConnectionLine({ connection }: { connection: ConnectionFlow }) {
  const fromColors = pillarColors[connection.fromPillar] || pillarColors.pr;
  const toColors = pillarColors[connection.toPillar] || pillarColors.pr;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`px-2 py-0.5 rounded ${fromColors.bg} ${fromColors.text}`}>
        {connection.from}
      </span>
      <span className={`flex items-center gap-1 ${connection.isActive ? 'text-brand-cyan' : 'text-muted'}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider">{connection.type}</span>
      </span>
      <span className={`px-2 py-0.5 rounded ${toColors.bg} ${toColors.text}`}>
        {connection.to}
      </span>
    </div>
  );
}

// Main Component
export function OrchestrationSummaryCard() {
  const [overview, setOverview] = useState<OrchestrationOverview>({
    totalStreams: 0,
    activeConnections: 0,
    pillars: [],
    connections: [],
    systemHealth: 'healthy',
  });

  // Load orchestration state based on user context
  useEffect(() => {
    const onboardingContext = localStorage.getItem('pravado_onboarding_context');
    let goals: string[] = [];

    if (onboardingContext) {
      try {
        const context = JSON.parse(onboardingContext);
        goals = context.primaryGoals || [];
      } catch {
        // Ignore parse errors
      }
    }

    // Build pillar statuses based on goals
    const pillars: PillarStatus[] = [];
    const connections: ConnectionFlow[] = [];

    // PR Pillar (always active)
    pillars.push({
      id: 'pr',
      name: 'PR Intelligence',
      pillar: 'pr',
      status: 'active',
      activeStreams: goals.includes('pr_media') ? 3 : 1,
    });

    // Content Pillar (always active)
    pillars.push({
      id: 'content',
      name: 'Content Hub',
      pillar: 'content',
      status: 'active',
      activeStreams: goals.includes('content_marketing') ? 3 : 1,
    });

    // SEO Pillar
    if (goals.includes('seo_visibility')) {
      pillars.push({
        id: 'seo',
        name: 'SEO Performance',
        pillar: 'seo',
        status: 'active',
        activeStreams: 2,
      });

      connections.push({
        id: 'seo-content',
        from: 'SEO Insights',
        fromPillar: 'seo',
        to: 'Content Briefs',
        toPillar: 'content',
        type: 'informs',
        isActive: true,
      });
    }

    // Crisis Pillar
    if (goals.includes('crisis_management')) {
      pillars.push({
        id: 'crisis',
        name: 'Risk Radar',
        pillar: 'crisis',
        status: 'active',
        activeStreams: 2,
      });

      connections.push({
        id: 'crisis-exec',
        from: 'Risk Detection',
        fromPillar: 'crisis',
        to: 'Exec Alerts',
        toPillar: 'exec',
        type: 'triggers',
        isActive: true,
      });
    }

    // Executive Pillar
    if (goals.includes('executive_strategy') || goals.includes('investor_relations')) {
      pillars.push({
        id: 'exec',
        name: 'Executive Hub',
        pillar: 'exec',
        status: 'active',
        activeStreams: goals.includes('investor_relations') ? 3 : 2,
      });
    }

    // Default PR → Content connection
    connections.push({
      id: 'pr-content',
      from: 'Media Signals',
      fromPillar: 'pr',
      to: 'Content Strategy',
      toPillar: 'content',
      type: 'informs',
      isActive: true,
    });

    // Calculate totals
    const totalStreams = pillars.reduce((sum, p) => sum + p.activeStreams, 0);
    const activeConnections = connections.filter((c) => c.isActive).length;

    setOverview({
      totalStreams,
      activeConnections,
      pillars,
      connections,
      systemHealth: 'healthy',
    });
  }, []);

  return (
    <div className="panel-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
            <AIDot status="active" size="md" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Orchestration</h3>
            <p className="text-xs text-muted">System Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              overview.systemHealth === 'healthy'
                ? 'bg-semantic-success/10 text-semantic-success'
                : overview.systemHealth === 'degraded'
                  ? 'bg-semantic-warning/10 text-semantic-warning'
                  : 'bg-semantic-danger/10 text-semantic-danger'
            }`}
          >
            {overview.systemHealth === 'healthy' ? 'All Systems Active' : overview.systemHealth}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-slate-3/50 rounded-lg">
          <p className="text-lg font-semibold text-white">{overview.pillars.length}</p>
          <p className="text-xs text-muted">Pillars</p>
        </div>
        <div className="text-center p-2 bg-slate-3/50 rounded-lg">
          <p className="text-lg font-semibold text-brand-cyan">{overview.totalStreams}</p>
          <p className="text-xs text-muted">Streams</p>
        </div>
        <div className="text-center p-2 bg-slate-3/50 rounded-lg">
          <p className="text-lg font-semibold text-brand-iris">{overview.activeConnections}</p>
          <p className="text-xs text-muted">Connections</p>
        </div>
      </div>

      {/* Active Pillars */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Active Pillars</h4>
        <div className="grid grid-cols-2 gap-2">
          {overview.pillars.slice(0, 4).map((pillar) => (
            <PillarBadge key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </div>

      {/* Cross-Pillar Flows */}
      {overview.connections.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            Cross-Pillar Intelligence
          </h4>
          <div className="space-y-2">
            {overview.connections.slice(0, 3).map((conn) => (
              <ConnectionLine key={conn.id} connection={conn} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-xs text-muted">
          AI monitoring {overview.totalStreams} intelligence streams
        </span>
        <Link href="/app/scenarios" className="text-xs text-brand-cyan hover:underline">
          View Simulations
        </Link>
      </div>
    </div>
  );
}

export default OrchestrationSummaryCard;
