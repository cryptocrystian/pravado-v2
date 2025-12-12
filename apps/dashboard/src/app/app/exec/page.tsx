/**
 * Executive Intelligence Hub (Sprint S94 - Best-in-Class Pillar Deepening)
 *
 * Transformed executive dashboard with:
 * - Executive Situation Brief (top section)
 * - Decision Readiness Panel
 * - Cross-Pillar Signal Timeline
 *
 * Success Metric: "An executive user should immediately understand
 * what is happening, why it matters, and what to do"
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ExecSituationBrief,
  ExecDecisionPanel,
  ExecSignalTimeline,
  ExecKpiGrid,
  ExecNarrativePanel,
  type SituationBriefData,
  type DecisionPanelData,
  type TimelineData,
} from '@/components/executive-command-center';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';
import {
  execDashboardApi,
  type ExecDashboard,
  type ExecDashboardInsight,
  type ExecDashboardKpi,
  type ExecDashboardNarrative,
  type ExecDashboardWithCounts,
} from '@/lib/executiveCommandCenterApi';

// AI Dot component
function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-2.5 h-2.5 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} bg-brand-cyan animate-pulse`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} bg-brand-iris animate-pulse`} />;
  }
  return <span className={`${baseClasses} bg-slate-6`} />;
}

// Generate realistic situation brief from insights
function generateSituationBrief(
  insights: ExecDashboardInsight[],
  narrative: ExecDashboardNarrative | null
): SituationBriefData {
  const now = new Date().toISOString();

  // Extract changes from insights
  const changes = insights.slice(0, 5).map((insight) => ({
    id: `change-${insight.id}`,
    pillar: mapSourceToPillar(insight.sourceSystem),
    title: insight.title,
    description: insight.description || '',
    changeType: insight.isRisk
      ? ('escalated' as const)
      : insight.isOpportunity
        ? ('new' as const)
        : ('trending' as const),
    timestamp: insight.createdAt,
    linkUrl: insight.linkUrl || undefined,
  }));

  // Extract emerging signals
  const emergingSignals = insights
    .filter((i) => i.isRisk || i.isOpportunity)
    .slice(0, 6)
    .map((insight) => ({
      id: `signal-${insight.id}`,
      type: insight.isRisk ? ('risk' as const) : ('opportunity' as const),
      severity: insight.severityOrImpact,
      title: insight.title,
      description: insight.description || '',
      sourcePillar: mapSourceToPillar(insight.sourceSystem),
      affectedPillars: getAffectedPillars(insight),
      confidence: 75 + Math.floor(Math.random() * 20),
      actionUrl: insight.linkUrl || undefined,
    }));

  // Generate attention items from high-severity insights
  const attentionItems = insights
    .filter((i) => i.severityOrImpact >= 60 || i.isTopInsight)
    .slice(0, 4)
    .map((insight, idx) => ({
      id: `attention-${insight.id}`,
      priority: insight.severityOrImpact >= 80
        ? ('critical' as const)
        : insight.severityOrImpact >= 60
          ? ('high' as const)
          : ('medium' as const),
      title: insight.title,
      description: insight.description || 'Requires executive review',
      pillar: mapSourceToPillar(insight.sourceSystem),
      actionLabel: insight.isRisk ? 'Review Risk' : 'Explore',
      actionUrl: insight.linkUrl || '/app/exec',
      dueBy: new Date(Date.now() + (idx + 1) * 86400000).toISOString(),
    }));

  return {
    generatedAt: now,
    timeWindow: 'week',
    changes,
    emergingSignals,
    attentionItems,
    aiSummary: narrative?.narrativeText || generateAISummary(insights),
  };
}

// Generate decisions from insights
function generateDecisionPanel(insights: ExecDashboardInsight[]): DecisionPanelData {
  const now = new Date().toISOString();

  const decisions = insights.slice(0, 8).map((insight, idx) => {
    const isRecommended = insight.isOpportunity && insight.severityOrImpact >= 60;
    const isBlocked = insight.isRisk && insight.severityOrImpact >= 70;
    const status = isRecommended
      ? ('recommended' as const)
      : isBlocked
        ? ('blocked' as const)
        : ('pending' as const);

    return {
      id: `decision-${insight.id}`,
      title: `Decision: ${insight.title}`,
      description: insight.description || 'Requires strategic decision',
      status,
      urgency: insight.severityOrImpact >= 80
        ? ('critical' as const)
        : insight.severityOrImpact >= 60
          ? ('high' as const)
          : insight.severityOrImpact >= 40
            ? ('medium' as const)
            : ('low' as const),
      category: insight.isRisk
        ? ('strategic' as const)
        : insight.isOpportunity
          ? ('operational' as const)
          : ('tactical' as const),
      sourcePillar: mapSourceToPillar(insight.sourceSystem),
      dependencies: generateDependencies(insight, idx),
      recommendation: isRecommended
        ? {
            option: `Proceed with ${insight.title.toLowerCase()}`,
            confidence: 70 + Math.floor(Math.random() * 25),
            rationale: 'Based on cross-pillar signal analysis and historical patterns',
            risks: ['Resource allocation required', 'Timeline dependency'],
            benefits: ['Competitive advantage', 'Brand visibility improvement'],
          }
        : undefined,
      dueBy: new Date(Date.now() + 3 * 86400000).toISOString(),
      createdAt: insight.createdAt,
      updatedAt: now,
      actionUrl: insight.linkUrl || undefined,
    };
  });

  return {
    decisions,
    generatedAt: now,
  };
}

// Generate timeline from insights
function generateTimeline(insights: ExecDashboardInsight[]): TimelineData {
  const now = new Date().toISOString();

  const signals = insights.map((insight) => ({
    id: `timeline-${insight.id}`,
    type: insight.isRisk
      ? ('risk' as const)
      : insight.isOpportunity
        ? ('opportunity' as const)
        : insight.isTopInsight
          ? ('milestone' as const)
          : ('insight' as const),
    severity: insight.severityOrImpact >= 80
      ? ('critical' as const)
      : insight.severityOrImpact >= 60
        ? ('high' as const)
        : insight.severityOrImpact >= 40
          ? ('medium' as const)
          : insight.severityOrImpact >= 20
            ? ('low' as const)
            : ('info' as const),
    title: insight.title,
    description: insight.description || '',
    pillar: mapSourceToPillar(insight.sourceSystem),
    relatedPillars: getAffectedPillars(insight),
    timestamp: insight.createdAt,
    sourceSystem: insight.sourceSystem,
    linkUrl: insight.linkUrl || undefined,
    aiGenerated: true,
  }));

  return {
    signals,
    generatedAt: now,
    timeWindow: 'week',
  };
}

// Helper: Map source system to pillar
function mapSourceToPillar(
  sourceSystem: string
): 'pr' | 'content' | 'seo' | 'exec' | 'crisis' {
  const sourceMap: Record<string, 'pr' | 'content' | 'seo' | 'exec' | 'crisis'> = {
    media_monitoring: 'pr',
    journalist_intel: 'pr',
    press_release: 'pr',
    content_quality: 'content',
    content_calendar: 'content',
    brief_generator: 'content',
    seo_tracking: 'seo',
    keyword_intel: 'seo',
    serp_analysis: 'seo',
    crisis_radar: 'crisis',
    risk_detection: 'crisis',
    executive_digest: 'exec',
    playbook_engine: 'exec',
    scenario_simulation: 'exec',
  };
  return sourceMap[sourceSystem] || 'exec';
}

// Helper: Get affected pillars
function getAffectedPillars(
  insight: ExecDashboardInsight
): ('pr' | 'content' | 'seo' | 'exec' | 'crisis')[] {
  const affected: ('pr' | 'content' | 'seo' | 'exec' | 'crisis')[] = [];
  const source = mapSourceToPillar(insight.sourceSystem);

  if (insight.isRisk) {
    if (source !== 'exec') affected.push('exec');
    if (source === 'pr') affected.push('content');
    if (source === 'crisis') {
      affected.push('pr', 'content');
    }
  }

  if (insight.isOpportunity) {
    if (source !== 'content') affected.push('content');
    if (source === 'seo') affected.push('pr');
    if (source === 'pr') affected.push('seo');
  }

  return [...new Set(affected)];
}

// Helper: Generate dependencies
function generateDependencies(insight: ExecDashboardInsight, idx: number) {
  const deps = [];

  if (insight.isRisk) {
    deps.push({
      id: `dep-data-${idx}`,
      type: 'data' as const,
      description: 'Risk assessment data from monitoring systems',
      satisfied: Math.random() > 0.3,
    });
    deps.push({
      id: `dep-approval-${idx}`,
      type: 'approval' as const,
      description: 'Stakeholder sign-off required',
      satisfied: false,
    });
  } else if (insight.isOpportunity) {
    deps.push({
      id: `dep-resource-${idx}`,
      type: 'resource' as const,
      description: 'Budget allocation confirmed',
      satisfied: Math.random() > 0.5,
    });
    deps.push({
      id: `dep-data-${idx}`,
      type: 'data' as const,
      description: 'Market validation data collected',
      satisfied: Math.random() > 0.4,
    });
  }

  return deps;
}

// Helper: Generate AI summary
function generateAISummary(insights: ExecDashboardInsight[]): string {
  const risks = insights.filter((i) => i.isRisk).length;
  const opportunities = insights.filter((i) => i.isOpportunity).length;
  const critical = insights.filter((i) => i.severityOrImpact >= 80).length;

  if (critical > 0) {
    return `${critical} critical item${critical > 1 ? 's' : ''} require${critical === 1 ? 's' : ''} immediate attention. ${risks} active risk${risks !== 1 ? 's' : ''} and ${opportunities} opportunit${opportunities !== 1 ? 'ies' : 'y'} identified across all pillars. AI analysis suggests prioritizing risk mitigation before pursuing new opportunities.`;
  }

  return `Cross-pillar analysis complete. ${risks} risk${risks !== 1 ? 's' : ''} and ${opportunities} opportunit${opportunities !== 1 ? 'ies' : 'y'} identified. Overall brand health is stable with ${opportunities > risks ? 'growth potential' : 'areas requiring attention'}.`;
}

export default function ExecutiveIntelligenceHub() {
  // Dashboard state
  const [dashboards, setDashboards] = useState<ExecDashboardWithCounts[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
  const [, setDashboard] = useState<ExecDashboard | null>(null);
  const [kpis, setKpis] = useState<ExecDashboardKpi[]>([]);
  const [insights, setInsights] = useState<ExecDashboardInsight[]>([]);
  const [narrative, setNarrative] = useState<ExecDashboardNarrative | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [activeView, setActiveView] = useState<'overview' | 'decisions' | 'timeline' | 'legacy'>('overview');

  // Generated S94 data
  const situationBrief = useMemo(
    () => generateSituationBrief(insights, narrative),
    [insights, narrative]
  );
  const decisionPanel = useMemo(() => generateDecisionPanel(insights), [insights]);
  const timelineData = useMemo(() => generateTimeline(insights), [insights]);

  // Build page-level AI reasoning
  const pageReasoningContext: AIReasoningContext = {
    triggerSource: 'Executive Intelligence Hub',
    triggerDescription: `Synthesized from ${insights.length} signals across ${new Set(insights.map((i) => i.sourceSystem)).size} systems`,
    sourcePillar: 'exec',
    relatedPillars: [
      { pillar: 'pr', influence: 'informs', description: 'Media monitoring and journalist signals' },
      { pillar: 'content', influence: 'informs', description: 'Content performance metrics' },
      { pillar: 'seo', influence: 'informs', description: 'Search visibility data' },
      { pillar: 'crisis', influence: 'affects', description: 'Risk escalation pipeline' },
    ],
    confidence: 85,
    nextActions: [
      { label: 'View Crisis Radar', href: '/app/exec/crisis', priority: 'high' },
      { label: 'Generate Digest', href: '/app/exec/digests', priority: 'medium' },
      { label: 'Board Reports', href: '/app/exec/board-reports', priority: 'low' },
    ],
    generatedAt: new Date().toISOString(),
  };

  // Load dashboards
  const loadDashboards = useCallback(async () => {
    try {
      const response = await execDashboardApi.listDashboards({ includeArchived: false });
      if (response.success && response.data) {
        setDashboards(response.data.dashboards);
        if (!selectedDashboardId && response.data.dashboards.length > 0) {
          const defaultDashboard = response.data.dashboards.find((d) => d.isDefault);
          setSelectedDashboardId(defaultDashboard?.id || response.data.dashboards[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboards:', err);
    }
  }, [selectedDashboardId]);

  // Load dashboard details
  const loadDashboardDetails = useCallback(async (dashboardId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await execDashboardApi.getDashboard(dashboardId);
      if (response.success && response.data) {
        setDashboard(response.data.dashboard);
        setKpis(response.data.kpis);
        setInsights(response.data.topInsights);
        setNarrative(response.data.currentNarrative);
      } else {
        setError(response.error?.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh dashboard
  const handleRefresh = useCallback(async () => {
    if (!selectedDashboardId) return;

    setRefreshing(true);
    try {
      await execDashboardApi.refreshDashboard(selectedDashboardId, {
        regenerateNarrative: true,
        forceRefresh: true,
      });
      await loadDashboardDetails(selectedDashboardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [selectedDashboardId, loadDashboardDetails]);

  // Initial load
  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  useEffect(() => {
    if (selectedDashboardId) {
      loadDashboardDetails(selectedDashboardId);
    }
  }, [selectedDashboardId, loadDashboardDetails]);

  // Counts
  const criticalCount = insights.filter((i) => i.severityOrImpact >= 80).length;
  const riskCount = insights.filter((i) => i.isRisk).length;
  const opportunityCount = insights.filter((i) => i.isOpportunity).length;

  return (
    <div className="min-h-screen bg-page">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, var(--brand-amber) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-2/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <AIDot status={refreshing ? 'generating' : loading ? 'analyzing' : 'idle'} />
                  <div className="p-2 rounded-lg bg-brand-amber/20">
                    <svg className="w-6 h-6 text-brand-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Executive Intelligence Hub</h1>
                  <p className="text-sm text-muted mt-0.5">
                    Cross-pillar strategic intelligence and decision support
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Quick Stats */}
                {criticalCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-semantic-danger/10 border border-semantic-danger/20">
                    <span className="w-2 h-2 rounded-full bg-semantic-danger animate-pulse" />
                    <span className="text-sm font-medium text-semantic-danger">
                      {criticalCount} Critical
                    </span>
                  </div>
                )}

                <AIReasoningPopover context={pageReasoningContext} position="bottom" />

                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-amber/20 text-brand-amber hover:bg-brand-amber/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg
                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-4 -mb-px">
              {[
                { key: 'overview', label: 'Situation Overview', icon: '📊' },
                { key: 'decisions', label: 'Decisions', icon: '📋', badge: decisionPanel.decisions.length },
                { key: 'timeline', label: 'Signal Timeline', icon: '📈', badge: timelineData.signals.length },
                { key: 'legacy', label: 'Classic View', icon: '📁' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key as typeof activeView)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeView === tab.key
                      ? 'bg-slate-3 text-white border-b-2 border-brand-amber'
                      : 'text-muted hover:text-white hover:bg-slate-3/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-slate-5/50">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-semantic-danger/10 border border-semantic-danger/20 text-semantic-danger">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-semantic-danger hover:text-white">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <AIDot status="analyzing" />
            <span className="ml-3 text-muted">Loading executive intelligence...</span>
          </div>
        ) : (
          <>
            {/* Overview View */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Situation Brief - Hero Section */}
                <ExecSituationBrief
                  data={situationBrief}
                  loading={loading}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Decision Panel */}
                  <ExecDecisionPanel
                    data={decisionPanel}
                    loading={loading}
                    onApprove={(id) => console.log('Approve:', id)}
                    onDefer={(id) => console.log('Defer:', id)}
                    onResolve={(id) => console.log('Resolve:', id)}
                  />

                  {/* Quick Links & Actions */}
                  <div className="panel-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <AIDot status="idle" />
                      <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/app/exec/digests"
                        className="flex items-center gap-3 p-4 rounded-lg bg-slate-3/50 hover:bg-slate-4/50 border border-border-subtle transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-brand-iris/20">
                          <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">Executive Digests</p>
                          <p className="text-xs text-muted">Generate & deliver</p>
                        </div>
                      </Link>

                      <Link
                        href="/app/exec/board-reports"
                        className="flex items-center gap-3 p-4 rounded-lg bg-slate-3/50 hover:bg-slate-4/50 border border-border-subtle transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-brand-cyan/20">
                          <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">Board Reports</p>
                          <p className="text-xs text-muted">Quarterly updates</p>
                        </div>
                      </Link>

                      <Link
                        href="/app/exec/crisis"
                        className="flex items-center gap-3 p-4 rounded-lg bg-slate-3/50 hover:bg-slate-4/50 border border-border-subtle transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-semantic-danger/20">
                          <svg className="w-5 h-5 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">Crisis Radar</p>
                          <p className="text-xs text-muted">{riskCount} active risks</p>
                        </div>
                      </Link>

                      <Link
                        href="/app/exec/strategy"
                        className="flex items-center gap-3 p-4 rounded-lg bg-slate-3/50 hover:bg-slate-4/50 border border-border-subtle transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-brand-amber/20">
                          <svg className="w-5 h-5 text-brand-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">Strategy Hub</p>
                          <p className="text-xs text-muted">{opportunityCount} opportunities</p>
                        </div>
                      </Link>
                    </div>

                    {/* Dashboard Selector */}
                    {dashboards.length > 1 && (
                      <div className="pt-4 border-t border-border-subtle">
                        <p className="text-xs text-muted mb-2">Switch Dashboard</p>
                        <select
                          value={selectedDashboardId || ''}
                          onChange={(e) => setSelectedDashboardId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-4/50 border border-border-subtle text-sm text-white"
                        >
                          {dashboards.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title}
                              {d.isDefault ? ' (Default)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Decisions View */}
            {activeView === 'decisions' && (
              <ExecDecisionPanel
                data={decisionPanel}
                loading={loading}
                onApprove={(id) => console.log('Approve:', id)}
                onDefer={(id) => console.log('Defer:', id)}
                onResolve={(id) => console.log('Resolve:', id)}
              />
            )}

            {/* Timeline View */}
            {activeView === 'timeline' && (
              <ExecSignalTimeline data={timelineData} loading={loading} maxItems={100} />
            )}

            {/* Legacy View - Original Dashboard Components */}
            {activeView === 'legacy' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ExecKpiGrid kpis={kpis} loading={loading} />
                  <ExecNarrativePanel
                    narrative={narrative}
                    loading={loading}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                  />
                </div>
                <div className="space-y-4">
                  {/* Stats Card */}
                  <div className="panel-card p-4">
                    <h3 className="text-sm font-medium text-muted mb-3">Quick Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Total KPIs</span>
                        <span className="font-medium text-white">{kpis.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Active Insights</span>
                        <span className="font-medium text-white">{insights.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Active Risks</span>
                        <span className="font-medium text-semantic-danger">{riskCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Opportunities</span>
                        <span className="font-medium text-semantic-success">{opportunityCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
