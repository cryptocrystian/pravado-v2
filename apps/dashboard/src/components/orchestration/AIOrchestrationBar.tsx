/**
 * AI Orchestration Bar (Sprint S93)
 *
 * Global component that shows:
 * - Active intelligence streams
 * - Cross-pillar dependencies
 * - Current AI monitoring and influence patterns
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface IntelligenceStream {
  id: string;
  name: string;
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  status: 'active' | 'idle' | 'processing';
  lastUpdate?: string;
}

interface CrossPillarDependency {
  id: string;
  source: string;
  sourcePillar: string;
  target: string;
  targetPillar: string;
  influence: 'triggers' | 'informs' | 'updates';
  description: string;
}

interface OrchestrationState {
  streams: IntelligenceStream[];
  dependencies: CrossPillarDependency[];
  currentActivity?: string;
  isProcessing: boolean;
}

// AI Dot
function AIDot({ status = 'idle' }: { status?: 'idle' | 'active' | 'processing' }) {
  const baseClasses = 'w-2 h-2 rounded-full';
  if (status === 'processing') {
    return <span className={`${baseClasses} bg-brand-iris animate-pulse`} />;
  }
  if (status === 'active') {
    return <span className={`${baseClasses} bg-brand-cyan`} />;
  }
  return <span className={`${baseClasses} bg-slate-6`} />;
}

// Pillar badge colors
const pillarColors: Record<string, { bg: string; text: string; border: string }> = {
  pr: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris/20' },
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/20' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta/20' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', border: 'border-brand-amber/20' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', border: 'border-semantic-danger/20' },
};

// Stream Item
function StreamItem({ stream }: { stream: IntelligenceStream }) {
  const colors = pillarColors[stream.pillar] || pillarColors.pr;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors.bg} ${colors.border}`}>
      <AIDot status={stream.status} />
      <span className={`text-xs font-medium ${colors.text}`}>{stream.name}</span>
    </div>
  );
}

// Dependency Flow
function DependencyFlow({ dependency }: { dependency: CrossPillarDependency }) {
  const sourceColors = pillarColors[dependency.sourcePillar] || pillarColors.pr;
  const targetColors = pillarColors[dependency.targetPillar] || pillarColors.pr;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`px-2 py-0.5 rounded ${sourceColors.bg} ${sourceColors.text}`}>
        {dependency.source}
      </span>
      <span className="text-muted flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        {dependency.influence}
      </span>
      <span className={`px-2 py-0.5 rounded ${targetColors.bg} ${targetColors.text}`}>
        {dependency.target}
      </span>
    </div>
  );
}

// Main Orchestration Bar Component
export function AIOrchestrationBar() {
  const [expanded, setExpanded] = useState(false);
  const [orchestration, setOrchestration] = useState<OrchestrationState>({
    streams: [],
    dependencies: [],
    isProcessing: false,
  });

  // Fetch orchestration state
  useEffect(() => {
    // Load from localStorage for user preferences context
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

    // Generate streams based on user's goals
    const streams: IntelligenceStream[] = [];
    const dependencies: CrossPillarDependency[] = [];

    // Core streams (always active)
    streams.push({
      id: 'media-monitor',
      name: 'Media Monitoring',
      pillar: 'pr',
      status: 'active',
    });

    streams.push({
      id: 'content-quality',
      name: 'Content Quality',
      pillar: 'content',
      status: 'active',
    });

    // Add streams based on goals
    if (goals.includes('pr_media')) {
      streams.push({
        id: 'journalist-intel',
        name: 'Journalist Intelligence',
        pillar: 'pr',
        status: 'active',
      });
      dependencies.push({
        id: 'pr-to-content',
        source: 'PR Signals',
        sourcePillar: 'pr',
        target: 'Content Calendar',
        targetPillar: 'content',
        influence: 'informs',
        description: 'Media coverage trends inform content strategy',
      });
    }

    if (goals.includes('seo_visibility')) {
      streams.push({
        id: 'seo-tracking',
        name: 'SERP Tracking',
        pillar: 'seo',
        status: 'active',
      });
      dependencies.push({
        id: 'seo-to-content',
        source: 'SEO Insights',
        sourcePillar: 'seo',
        target: 'Content Briefs',
        targetPillar: 'content',
        influence: 'updates',
        description: 'Keyword performance influences content optimization',
      });
    }

    if (goals.includes('crisis_management')) {
      streams.push({
        id: 'risk-radar',
        name: 'Risk Radar',
        pillar: 'crisis',
        status: 'active',
      });
      dependencies.push({
        id: 'crisis-to-exec',
        source: 'Risk Detection',
        sourcePillar: 'crisis',
        target: 'Exec Alerts',
        targetPillar: 'exec',
        influence: 'triggers',
        description: 'Risk signals trigger executive notifications',
      });
    }

    if (goals.includes('executive_strategy')) {
      streams.push({
        id: 'exec-digest',
        name: 'Executive Digest',
        pillar: 'exec',
        status: 'active',
      });
    }

    // Default dependencies if none set
    if (dependencies.length === 0) {
      dependencies.push({
        id: 'default-pr-seo',
        source: 'Media Coverage',
        sourcePillar: 'pr',
        target: 'SEO Impact',
        targetPillar: 'seo',
        influence: 'informs',
        description: 'Press coverage influences search visibility',
      });
    }

    setOrchestration({
      streams,
      dependencies,
      currentActivity: 'Monitoring intelligence streams across all pillars',
      isProcessing: false,
    });
  }, []);

  // Calculate active stream count
  const activeCount = orchestration.streams.filter((s) => s.status === 'active').length;

  return (
    <div className="bg-slate-2/80 backdrop-blur-sm border-b border-border-subtle">
      {/* Collapsed View */}
      <div className="px-4 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                <AIDot status={orchestration.isProcessing ? 'processing' : 'active'} />
              </div>
              <span className="text-xs font-medium text-brand-cyan">AI Orchestration</span>
            </div>

            {!expanded && (
              <>
                <span className="text-xs text-muted">|</span>
                <span className="text-xs text-muted">
                  {activeCount} streams active
                </span>
                {orchestration.dependencies.length > 0 && (
                  <>
                    <span className="text-xs text-muted">|</span>
                    <span className="text-xs text-muted">
                      {orchestration.dependencies.length} cross-pillar connections
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!expanded && orchestration.streams.slice(0, 3).map((stream) => (
              <StreamItem key={stream.id} stream={stream} />
            ))}
            <svg
              className={`w-4 h-4 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border-subtle mt-2 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Streams */}
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                Active Intelligence Streams
              </h4>
              <div className="flex flex-wrap gap-2">
                {orchestration.streams.map((stream) => (
                  <StreamItem key={stream.id} stream={stream} />
                ))}
              </div>
            </div>

            {/* Cross-Pillar Dependencies */}
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                Cross-Pillar Influence
              </h4>
              <div className="space-y-3">
                {orchestration.dependencies.map((dep) => (
                  <div key={dep.id}>
                    <DependencyFlow dependency={dep} />
                    <p className="text-xs text-slate-6 mt-1 ml-2">{dep.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Activity */}
          {orchestration.currentActivity && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="flex items-center gap-2">
                <AIDot status="active" />
                <span className="text-xs text-muted">{orchestration.currentActivity}</span>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-4">
            <Link
              href="/app/scenarios"
              className="text-xs text-brand-cyan hover:underline"
            >
              View Scenario Simulations
            </Link>
            <Link
              href="/app/insight-conflicts"
              className="text-xs text-brand-cyan hover:underline"
            >
              View Insight Conflicts
            </Link>
            <Link
              href="/app/reality-maps"
              className="text-xs text-brand-cyan hover:underline"
            >
              View Reality Maps
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIOrchestrationBar;
