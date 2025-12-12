'use client';

/**
 * Dashboard Client Component - Executive Intelligence Hub (Sprint S92)
 *
 * Premium AI-first executive dashboard with:
 * - 6-tile Global KPI Strip with real-time trends
 * - AI Daily Brief with narrative synthesis
 * - AI Recommendations Panel with proactive suggestions
 * - Scenario & Reality Maps Snapshot
 * - Cross-Pillar Intelligence Cards
 * - Activity Stream with AI summaries
 *
 * Design System: Pravado DS v2
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  execDashboardApi,
  type ExecDashboardKpi,
  type ExecDashboardInsight,
  type ExecDashboardNarrative,
  type ExecDashboard,
  formatRelativeTime,
  getSourceSystemLabel,
} from '@/lib/executiveCommandCenterApi';
import { listRealityMaps, type RealityMap } from '@/lib/realityMapApi';
import { listConflicts } from '@/lib/insightConflictApi';
import { listSimulations, getStats as getSimulationStats } from '@/lib/aiScenarioSimulationApi';
import type { AIScenarioSimulation, AIScenarioSimulationStats } from '@pravado/types';
import { listNarratives, getNarrativeStats, type UnifiedNarrative, type NarrativeStats } from '@/lib/unifiedNarrativeApi';
import { OrchestrationSummaryCard } from '@/components/orchestration';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';
import { PillarBadge, getPillarFromSource, getAffectedPillars } from '@/components/PillarContinuityLinks';

interface DashboardClientProps {
  userName: string;
}

// AI Status type
type AIStatus = 'idle' | 'analyzing' | 'generating';

// Icons
const Icons = {
  pr: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  scenario: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  narrative: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  recommend: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  content: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  seo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  playbook: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  agent: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  realityMap: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  conflict: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  trendUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  trendDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  spark: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// AI Dot component
function AIDot({ status }: { status: AIStatus }) {
  const baseClasses = 'w-2.5 h-2.5 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} ai-dot-analyzing`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} ai-dot-generating`} />;
  }
  return <span className={`${baseClasses} ai-dot`} />;
}

// Intelligence Strip KPI Card
function KPICard({
  label,
  value,
  trend,
  trendValue,
  icon,
  accentColor,
}: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div className="panel-card p-4 hover:shadow-lg transition-shadow duration-200 group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${accentColor}/10 flex items-center justify-center ${accentColor} group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted truncate">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-white">{value}</p>
            {trend && trendValue && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${
                trend === 'up' ? 'text-semantic-success' : trend === 'down' ? 'text-semantic-danger' : 'text-muted'
              }`}>
                {trend === 'up' && Icons.trendUp}
                {trend === 'down' && Icons.trendDown}
                {trendValue}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cross-Pillar Intelligence Card
function IntelligenceCard({
  title,
  icon,
  accentColor,
  items,
  link,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  items: Array<{ id: string; title: string; subtitle?: string; badge?: string; badgeColor?: string }>;
  link: string;
  emptyMessage: string;
}) {
  return (
    <div className="panel-card p-5 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${accentColor}/10 flex items-center justify-center ${accentColor}`}>
            {icon}
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <Link href={link} className="text-muted hover:text-brand-cyan transition-colors">
          {Icons.arrow}
        </Link>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.slice(0, 3).map((item) => (
            <li key={item.id} className="flex items-start gap-3 group/item">
              <span className={`w-1.5 h-1.5 rounded-full ${accentColor} mt-2 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate group-hover/item:text-brand-cyan transition-colors">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-muted truncate">{item.subtitle}</p>
                )}
              </div>
              {item.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-5 text-muted'}`}>
                  {item.badge}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted text-center py-4">{emptyMessage}</p>
      )}
    </div>
  );
}

// AI Insight Banner - Enhanced with Pillar Continuity (S93)
function AIInsightBanner({
  insight,
  onDismiss,
}: {
  insight: ExecDashboardInsight | null;
  onDismiss: () => void;
}) {
  if (!insight) return null;

  const isRisk = insight.isRisk;
  const isOpportunity = insight.isOpportunity;
  const sourcePillar = getPillarFromSource(insight.sourceSystem);
  const affectedPillars = getAffectedPillars(sourcePillar, isRisk || false, isOpportunity || false);

  return (
    <div className={`panel-card p-4 border-l-4 ${
      isRisk ? 'border-l-semantic-danger bg-semantic-danger/5' :
      isOpportunity ? 'border-l-semantic-success bg-semantic-success/5' :
      'border-l-brand-cyan bg-brand-cyan/5'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <AIDot status="idle" />
          <span className="text-xs font-medium text-brand-cyan">Pravado Insight</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">{insight.title}</p>
          {insight.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2">{insight.description}</p>
          )}
          {/* S93: Pillar Continuity Links */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-slate-6 uppercase">From</span>
            <PillarBadge pillar={sourcePillar} />
            {affectedPillars.length > 0 && (
              <>
                <span className="text-[10px] text-slate-6 uppercase ml-1">Affects</span>
                {affectedPillars.slice(0, 2).map((link, idx) => (
                  <PillarBadge key={idx} pillar={link.pillar} actionLabel={link.actionLabel} />
                ))}
              </>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted hover:text-white transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Helper to map source system to pillar
function getSourcePillar(source: string): 'pr' | 'content' | 'seo' | 'exec' | 'crisis' {
  const sourceMap: Record<string, 'pr' | 'content' | 'seo' | 'exec' | 'crisis'> = {
    media_monitoring: 'pr',
    journalist_intel: 'pr',
    content_quality: 'content',
    content_calendar: 'content',
    seo_tracking: 'seo',
    keyword_intel: 'seo',
    crisis_radar: 'crisis',
    risk_detection: 'crisis',
    executive_digest: 'exec',
    playbook_engine: 'exec',
  };
  return sourceMap[source] || 'exec';
}

// Helper to create AI reasoning context from an insight
function createReasoningContext(insight: ExecDashboardInsight): AIReasoningContext {
  const sourcePillar = getSourcePillar(insight.sourceSystem);
  const relatedPillars: AIReasoningContext['relatedPillars'] = [];

  // Add cross-pillar relationships based on insight type
  if (insight.isRisk) {
    relatedPillars.push({
      pillar: 'exec',
      influence: 'affects',
      description: 'Risk signals require executive attention',
    });
    if (sourcePillar === 'pr') {
      relatedPillars.push({
        pillar: 'content',
        influence: 'informs',
        description: 'May impact content messaging strategy',
      });
    }
  }
  if (insight.isOpportunity) {
    relatedPillars.push({
      pillar: 'content',
      influence: 'informs',
      description: 'Opportunity to capitalize in content',
    });
  }

  return {
    triggerSource: getSourceSystemLabel(insight.sourceSystem),
    triggerDescription: insight.description || 'AI-detected signal based on continuous monitoring',
    sourcePillar,
    relatedPillars,
    confidence: insight.severityOrImpact || 75,
    nextActions: insight.isRisk
      ? [
          { label: 'View in Risk Radar', href: '/app/exec/crisis', priority: 'high' },
          { label: 'Run Crisis Simulation', href: '/app/scenarios', priority: 'medium' },
        ]
      : insight.isOpportunity
        ? [
            { label: 'Create Content Brief', href: '/app/content/brief', priority: 'high' },
            { label: 'View Opportunity Details', href: '/app/pr', priority: 'medium' },
          ]
        : [
            { label: 'View Full Details', href: '/app/exec', priority: 'medium' },
          ],
    generatedAt: insight.createdAt,
  };
}

// Activity Item
function ActivityItem({
  insight,
}: {
  insight: ExecDashboardInsight;
}) {
  const reasoningContext = createReasoningContext(insight);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0 group hover:bg-slate-3/30 px-2 -mx-2 rounded-lg transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        insight.isRisk ? 'bg-semantic-danger/10 text-semantic-danger' :
        insight.isOpportunity ? 'bg-semantic-success/10 text-semantic-success' :
        'bg-brand-iris/10 text-brand-iris'
      }`}>
        {insight.isRisk ? Icons.conflict : insight.isOpportunity ? Icons.spark : Icons.agent}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white group-hover:text-brand-cyan transition-colors line-clamp-1">
          {insight.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted">
            {getSourceSystemLabel(insight.sourceSystem)}
          </span>
          <span className="text-xs text-slate-6">•</span>
          <span className="text-xs text-muted">
            {formatRelativeTime(insight.createdAt)}
          </span>
          <span className="text-xs text-slate-6">•</span>
          <AIReasoningPopover context={reasoningContext} variant="link" linkText="Why?" />
        </div>
      </div>
      {insight.severityOrImpact > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
          insight.severityOrImpact >= 80 ? 'badge-confidence-high' :
          insight.severityOrImpact >= 50 ? 'badge-confidence-medium' :
          'badge-confidence-low'
        }`}>
          {insight.severityOrImpact}
        </span>
      )}
    </div>
  );
}

// AI Recommendations Panel (S92 Enhancement)
function AIRecommendationsPanel({
  insights,
  scenarios,
}: {
  insights: ExecDashboardInsight[];
  scenarios: AIScenarioSimulation[];
}) {
  // Generate AI recommendations based on insights and scenarios
  const recommendations = [];

  // Check for risk insights that need attention
  const riskInsights = insights.filter(i => i.isRisk);
  if (riskInsights.length > 0) {
    recommendations.push({
      id: 'risk-mitigation',
      type: 'risk',
      title: 'Risk Mitigation Needed',
      description: `${riskInsights.length} risk signal${riskInsights.length > 1 ? 's' : ''} detected. Consider running a crisis simulation.`,
      action: 'Run Simulation',
      actionLink: '/app/scenarios',
      confidence: 85,
      icon: Icons.conflict,
    });
  }

  // Check for opportunity insights
  const opportunityInsights = insights.filter(i => i.isOpportunity);
  if (opportunityInsights.length > 0) {
    recommendations.push({
      id: 'capitalize-opportunity',
      type: 'opportunity',
      title: 'Opportunity Detected',
      description: `${opportunityInsights.length} opportunity signal${opportunityInsights.length > 1 ? 's' : ''} identified. Launch a content playbook to capitalize.`,
      action: 'View Playbooks',
      actionLink: '/app/playbooks',
      confidence: 78,
      icon: Icons.spark,
    });
  }

  // Check for configured (ready to run) scenarios
  const draftScenarios = scenarios.filter(s => s.status === 'configured' || s.status === 'paused');
  if (draftScenarios.length > 0) {
    recommendations.push({
      id: 'pending-scenarios',
      type: 'action',
      title: 'Pending Scenarios',
      description: `${draftScenarios.length} scenario${draftScenarios.length > 1 ? 's' : ''} ready to run. Execute simulations for strategic planning.`,
      action: 'Run Scenarios',
      actionLink: '/app/scenarios',
      confidence: 90,
      icon: Icons.scenario,
    });
  }

  // Default recommendation if none found
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'explore-insights',
      type: 'info',
      title: 'Explore Intelligence',
      description: 'Your dashboard is healthy. Explore deeper insights in the Executive Command Center.',
      action: 'View Command Center',
      actionLink: '/app/exec',
      confidence: 100,
      icon: Icons.recommend,
    });
  }

  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber">
            {Icons.recommend}
          </div>
          <h3 className="font-semibold text-white">AI Recommendations</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan">
          {recommendations.length} suggestions
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec) => (
          <div
            key={rec.id}
            className={`p-3 rounded-xl border transition-all hover:shadow-md ${
              rec.type === 'risk'
                ? 'bg-semantic-danger/5 border-semantic-danger/20 hover:border-semantic-danger/40'
                : rec.type === 'opportunity'
                ? 'bg-semantic-success/5 border-semantic-success/20 hover:border-semantic-success/40'
                : 'bg-slate-3/50 border-border-subtle hover:border-brand-cyan/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  rec.type === 'risk'
                    ? 'bg-semantic-danger/10 text-semantic-danger'
                    : rec.type === 'opportunity'
                    ? 'bg-semantic-success/10 text-semantic-success'
                    : 'bg-brand-cyan/10 text-brand-cyan'
                }`}
              >
                {rec.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{rec.title}</p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      rec.confidence >= 80
                        ? 'bg-brand-cyan/10 text-brand-cyan'
                        : rec.confidence >= 60
                        ? 'bg-brand-magenta/10 text-brand-magenta'
                        : 'bg-slate-5 text-slate-6'
                    }`}
                  >
                    {rec.confidence}%
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 line-clamp-2">{rec.description}</p>
                <Link
                  href={rec.actionLink}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-cyan mt-2 hover:underline"
                >
                  {rec.action}
                  {Icons.arrow}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Playbook Action */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <Link
          href="/app/playbooks"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-brand-iris/10 text-brand-iris text-sm font-medium hover:bg-brand-iris/20 transition-colors"
        >
          {Icons.playbook}
          Run a Playbook
        </Link>
      </div>
    </div>
  );
}

// Scenario & Reality Maps Snapshot (S92 Enhancement)
function ScenarioSnapshot({
  scenarios,
  realityMaps,
  scenarioStats,
}: {
  scenarios: AIScenarioSimulation[];
  realityMaps: RealityMap[];
  scenarioStats: AIScenarioSimulationStats | null;
}) {
  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal">
            {Icons.realityMap}
          </div>
          <h3 className="font-semibold text-white">Scenarios & Reality Maps</h3>
        </div>
        <Link href="/app/scenarios" className="text-muted hover:text-brand-cyan transition-colors">
          {Icons.arrow}
        </Link>
      </div>

      {/* Stats Row */}
      {scenarioStats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-slate-3/50">
            <p className="text-lg font-bold text-white">{scenarioStats.totalSimulations || 0}</p>
            <p className="text-xs text-muted">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-brand-cyan/5">
            <p className="text-lg font-bold text-brand-cyan">{scenarioStats.byStatus?.running || 0}</p>
            <p className="text-xs text-muted">Running</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-semantic-success/5">
            <p className="text-lg font-bold text-semantic-success">{scenarioStats.byStatus?.completed || 0}</p>
            <p className="text-xs text-muted">Completed</p>
          </div>
        </div>
      )}

      {/* Recent Scenarios */}
      {scenarios.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Recent Scenarios</p>
          {scenarios.slice(0, 3).map((scenario) => (
            <Link
              key={scenario.id}
              href={`/app/scenarios/${scenario.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-3/50 transition-colors group"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  scenario.status === 'running'
                    ? 'bg-brand-cyan animate-pulse'
                    : scenario.status === 'completed'
                    ? 'bg-semantic-success'
                    : 'bg-slate-6'
                }`}
              />
              <span className="flex-1 text-sm text-white truncate group-hover:text-brand-cyan transition-colors">
                {scenario.name}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  scenario.status === 'running'
                    ? 'bg-brand-cyan/10 text-brand-cyan'
                    : scenario.status === 'completed'
                    ? 'bg-semantic-success/10 text-semantic-success'
                    : 'bg-slate-5 text-slate-6'
                }`}
              >
                {scenario.status}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted">No scenarios yet</p>
          <Link
            href="/app/scenarios"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-cyan mt-2 hover:underline"
          >
            Create your first scenario
            {Icons.arrow}
          </Link>
        </div>
      )}

      {/* Reality Maps Count */}
      {realityMaps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <Link
            href="/app/reality-maps"
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-3/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-brand-magenta/10 flex items-center justify-center text-brand-magenta text-xs">
                {realityMaps.length}
              </span>
              <span className="text-sm text-muted group-hover:text-white transition-colors">
                Reality Maps Available
              </span>
            </div>
            <span className="text-muted group-hover:text-brand-cyan transition-colors">
              {Icons.arrow}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

// Unified Narrative Tile (S92 Enhancement)
function UnifiedNarrativeTile({
  narratives,
  stats,
}: {
  narratives: UnifiedNarrative[];
  stats: NarrativeStats | null;
}) {
  const latestNarrative = narratives[0];

  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-iris/10 flex items-center justify-center text-brand-iris">
            {Icons.narrative}
          </div>
          <h3 className="font-semibold text-white">Unified Narratives</h3>
        </div>
        <Link href="/app/unified-narratives" className="text-muted hover:text-brand-cyan transition-colors">
          {Icons.arrow}
        </Link>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-slate-3/50">
            <p className="text-base font-bold text-white">{stats.totalNarratives || 0}</p>
            <p className="text-xs text-muted">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-brand-amber/5">
            <p className="text-base font-bold text-brand-amber">{stats.byStatus?.draft || 0}</p>
            <p className="text-xs text-muted">Drafts</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-semantic-success/5">
            <p className="text-base font-bold text-semantic-success">{stats.byStatus?.approved || 0}</p>
            <p className="text-xs text-muted">Approved</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-brand-magenta/5">
            <p className="text-base font-bold text-brand-magenta">{stats.byStatus?.published || 0}</p>
            <p className="text-xs text-muted">Published</p>
          </div>
        </div>
      )}

      {/* Latest Narrative Preview */}
      {latestNarrative ? (
        <Link
          href={`/app/unified-narratives/${latestNarrative.id}`}
          className="block p-3 rounded-xl bg-grad-hero/5 border border-brand-iris/20 hover:border-brand-iris/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-iris/10 text-brand-iris">
              Latest
            </span>
            <span className="text-xs text-muted">
              {latestNarrative.narrativeType?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm font-medium text-white line-clamp-2">{latestNarrative.title}</p>
          {latestNarrative.subtitle && (
            <p className="text-xs text-muted mt-1 line-clamp-1">{latestNarrative.subtitle}</p>
          )}
        </Link>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted">No narratives yet</p>
          <Link
            href="/app/unified-narratives"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-cyan mt-2 hover:underline"
          >
            Create your first narrative
            {Icons.arrow}
          </Link>
        </div>
      )}

      {/* Recent Narratives List */}
      {narratives.length > 1 && (
        <div className="mt-3 space-y-2">
          {narratives.slice(1, 3).map((narrative) => (
            <Link
              key={narrative.id}
              href={`/app/unified-narratives/${narrative.id}`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-3/50 transition-colors group"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  narrative.status === 'published'
                    ? 'bg-brand-magenta'
                    : narrative.status === 'approved'
                    ? 'bg-semantic-success'
                    : 'bg-slate-6'
                }`}
              />
              <span className="flex-1 text-sm text-muted truncate group-hover:text-white transition-colors">
                {narrative.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardClient({ userName }: DashboardClientProps) {
  // State
  const [aiStatus, setAIStatus] = useState<AIStatus>('idle');
  const [dashboard, setDashboard] = useState<ExecDashboard | null>(null);
  const [kpis, setKpis] = useState<ExecDashboardKpi[]>([]);
  const [insights, setInsights] = useState<ExecDashboardInsight[]>([]);
  const [narrative, setNarrative] = useState<ExecDashboardNarrative | null>(null);
  const [topInsight, setTopInsight] = useState<ExecDashboardInsight | null>(null);
  const [realityMapCount, setRealityMapCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extended state for S92 features
  const [scenarios, setScenarios] = useState<AIScenarioSimulation[]>([]);
  const [scenarioStats, setScenarioStats] = useState<AIScenarioSimulationStats | null>(null);
  const [narrativesList, setNarrativesList] = useState<UnifiedNarrative[]>([]);
  const [narrativeStats, setNarrativeStatsData] = useState<NarrativeStats | null>(null);
  const [realityMaps, setRealityMaps] = useState<RealityMap[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setAIStatus('analyzing');
    setError(null);

    try {
      // Fetch dashboards list first
      const dashboardsRes = await execDashboardApi.listDashboards({ limit: 1 });

      if (dashboardsRes.success && dashboardsRes.data?.dashboards?.length) {
        const firstDashboard = dashboardsRes.data.dashboards[0];

        // Fetch dashboard details
        const detailRes = await execDashboardApi.getDashboard(firstDashboard.id);

        if (detailRes.success && detailRes.data) {
          setDashboard(detailRes.data.dashboard);
          setKpis(detailRes.data.kpis || []);
          setInsights(detailRes.data.topInsights || []);
          setNarrative(detailRes.data.currentNarrative);

          // Set top insight
          if (detailRes.data.topInsights?.length) {
            const riskInsight = detailRes.data.topInsights.find(i => i.isRisk);
            const opportunityInsight = detailRes.data.topInsights.find(i => i.isOpportunity);
            setTopInsight(riskInsight || opportunityInsight || detailRes.data.topInsights[0]);
          }
        }
      }

      // Fetch reality maps (with data for display)
      try {
        const realityMapsRes = await listRealityMaps({ limit: 5 });
        setRealityMaps(realityMapsRes?.maps || []);
        setRealityMapCount(realityMapsRes?.total || 0);
      } catch {
        // Silent fail - feature may not be enabled
      }

      // Fetch conflicts count
      try {
        const conflictsRes = await listConflicts({ limit: 1 });
        setConflictCount(conflictsRes?.total || 0);
      } catch {
        // Silent fail - feature may not be enabled
      }

      // Fetch scenarios data (S92 enhancement)
      try {
        const [simulationsRes, simStatsRes] = await Promise.all([
          listSimulations({ limit: 5, sortBy: 'updated_at', sortOrder: 'desc' }),
          getSimulationStats(),
        ]);
        setScenarios(simulationsRes?.simulations || []);
        setScenarioStats(simStatsRes?.stats || null);
      } catch {
        // Silent fail - feature may not be enabled
      }

      // Fetch unified narratives data (S92 enhancement)
      try {
        const [narrativesRes, narStatsRes] = await Promise.all([
          listNarratives({ limit: 5, sortBy: 'updated_at', sortOrder: 'desc' }),
          getNarrativeStats(),
        ]);
        setNarrativesList(narrativesRes?.narratives || []);
        setNarrativeStatsData(narStatsRes || null);
      } catch {
        // Silent fail - feature may not be enabled
      }

      setAIStatus('idle');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setAIStatus('idle');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh dashboard
  const handleRefresh = async () => {
    if (!dashboard) return;

    setAIStatus('generating');
    try {
      await execDashboardApi.refreshDashboard(dashboard.id, {
        regenerateNarrative: true,
        forceRefresh: true,
      });
      await fetchDashboardData();
    } catch (err) {
      console.error('Refresh error:', err);
    }
    setAIStatus('idle');
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Helper to get KPI by source or category
  const getKpiValue = (sourceSystem?: string, category?: string): ExecDashboardKpi | undefined => {
    return kpis.find(k =>
      (sourceSystem && k.sourceSystem === sourceSystem) ||
      (category && k.category === category)
    );
  };

  // Get trending insights by source system
  const prInsights = insights.filter(i => i.sourceSystem === 'media_monitoring' || i.sourceSystem === 'outreach');
  const contentInsights = insights.filter(i => i.sourceSystem === 'press_releases' || i.sourceSystem === 'pitches');
  const riskInsights = insights.filter(i => i.isRisk);
  const opportunityInsights = insights.filter(i => i.isOpportunity);

  // KPI helpers
  const prKpi = getKpiValue('media_monitoring') || getKpiValue('outreach');
  const contentKpi = kpis.find(k => k.category === 'content');
  const seoKpi = kpis.find(k => k.category === 'seo') || getKpiValue('media_performance');
  const playbookKpi = kpis.find(k => k.category === 'playbooks');

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with AI Status */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {userName}!
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-3 border border-border-subtle">
                <AIDot status={aiStatus} />
                <span className="text-xs font-medium text-muted">
                  {aiStatus === 'analyzing' ? 'Analyzing...' :
                   aiStatus === 'generating' ? 'Generating insights...' :
                   'AI Active'}
                </span>
              </div>
            </div>
            <p className="text-muted">
              {dashboard?.title || 'Your AI-powered intelligence dashboard'}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={aiStatus !== 'idle' || loading}
            className="btn-secondary gap-2 disabled:opacity-50"
          >
            <span className={aiStatus !== 'idle' ? 'animate-spin' : ''}>
              {Icons.refresh}
            </span>
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert-error mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* AI Insight Banner */}
        {topInsight && (
          <div className="mb-6">
            <AIInsightBanner
              insight={topInsight}
              onDismiss={() => setTopInsight(null)}
            />
          </div>
        )}

        {/* Top Intelligence Strip - 6 KPI Tiles (S92 Enhancement) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KPICard
            label="PR Velocity"
            value={prKpi?.metricValue?.toLocaleString() || '0'}
            trend={prKpi?.metricTrend?.direction}
            trendValue={prKpi?.metricTrend?.changePercent ? `${prKpi.metricTrend.changePercent}%` : undefined}
            icon={Icons.pr}
            accentColor="text-brand-iris"
          />
          <KPICard
            label="Content Score"
            value={contentKpi?.metricValue?.toLocaleString() || '0'}
            trend={contentKpi?.metricTrend?.direction}
            trendValue={contentKpi?.metricTrend?.changePercent ? `${contentKpi.metricTrend.changePercent}%` : undefined}
            icon={Icons.content}
            accentColor="text-brand-cyan"
          />
          <KPICard
            label="SEO Performance"
            value={seoKpi?.metricValue?.toLocaleString() || '0'}
            trend={seoKpi?.metricTrend?.direction}
            trendValue={seoKpi?.metricTrend?.changePercent ? `${seoKpi.metricTrend.changePercent}%` : undefined}
            icon={Icons.seo}
            accentColor="text-brand-magenta"
          />
          <KPICard
            label="Active Playbooks"
            value={playbookKpi?.metricValue?.toLocaleString() || '0'}
            icon={Icons.playbook}
            accentColor="text-brand-teal"
          />
          <KPICard
            label="Scenarios"
            value={scenarioStats?.totalSimulations?.toLocaleString() || scenarios.length.toString()}
            trend={scenarioStats?.byStatus?.running && scenarioStats.byStatus.running > 0 ? 'up' : 'flat'}
            trendValue={scenarioStats?.byStatus?.running ? `${scenarioStats.byStatus.running} active` : undefined}
            icon={Icons.scenario}
            accentColor="text-brand-amber"
          />
          <KPICard
            label="Narratives"
            value={narrativeStats?.totalNarratives?.toLocaleString() || narrativesList.length.toString()}
            trend={narrativeStats?.byStatus?.draft && narrativeStats.byStatus.draft > 0 ? 'up' : 'flat'}
            trendValue={narrativeStats?.byStatus?.draft ? `${narrativeStats.byStatus.draft} drafts` : undefined}
            icon={Icons.narrative}
            accentColor="text-semantic-info"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Intelligence Cards */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* AI Narrative Panel */}
            <div className="panel-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AIDot status={aiStatus} />
                  <h2 className="text-lg font-semibold text-white">AI Daily Brief</h2>
                </div>
                {narrative && (
                  <span className="text-xs text-muted">
                    Updated {formatRelativeTime(narrative.createdAt)}
                  </span>
                )}
              </div>

              {narrative ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-text leading-relaxed">
                    {narrative.narrativeText || 'No summary available.'}
                  </p>
                  {narrative.risksSection && (
                    <div className="mt-4 p-3 rounded-lg bg-semantic-danger/5 border border-semantic-danger/20">
                      <h4 className="text-sm font-medium text-semantic-danger mb-2">Key Risks</h4>
                      <p className="text-xs text-muted">{narrative.risksSection}</p>
                    </div>
                  )}
                  {narrative.opportunitiesSection && (
                    <div className="mt-4 p-3 rounded-lg bg-semantic-success/5 border border-semantic-success/20">
                      <h4 className="text-sm font-medium text-semantic-success mb-2">Opportunities</h4>
                      <p className="text-xs text-muted">{narrative.opportunitiesSection}</p>
                    </div>
                  )}
                </div>
              ) : loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-slate-4 rounded w-full" />
                  <div className="h-4 bg-slate-4 rounded w-5/6" />
                  <div className="h-4 bg-slate-4 rounded w-4/6" />
                </div>
              ) : (
                <p className="text-muted text-sm">
                  No AI narrative generated yet. Click Refresh to generate insights.
                </p>
              )}

              {/* Trending Insights */}
              {(riskInsights.length > 0 || opportunityInsights.length > 0) && (
                <div className="mt-6 pt-4 border-t border-border-subtle">
                  <h3 className="text-sm font-medium text-muted mb-3">Key Signals</h3>
                  <div className="flex flex-wrap gap-2">
                    {riskInsights.slice(0, 2).map((insight) => (
                      <span
                        key={insight.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-semantic-danger/10 text-semantic-danger text-xs font-medium"
                      >
                        {Icons.conflict}
                        {insight.title.slice(0, 40)}{insight.title.length > 40 ? '...' : ''}
                      </span>
                    ))}
                    {opportunityInsights.slice(0, 2).map((insight) => (
                      <span
                        key={insight.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-semantic-success/10 text-semantic-success text-xs font-medium"
                      >
                        {Icons.spark}
                        {insight.title.slice(0, 40)}{insight.title.length > 40 ? '...' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cross-Pillar Intelligence Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IntelligenceCard
                title="PR Signals"
                icon={Icons.pr}
                accentColor="text-brand-iris"
                link="/app/pr"
                emptyMessage="No PR signals detected"
                items={prInsights.slice(0, 3).map(i => ({
                  id: i.id,
                  title: i.title,
                  subtitle: getSourceSystemLabel(i.sourceSystem),
                  badge: i.isRisk ? 'Risk' : i.isOpportunity ? 'Opportunity' : undefined,
                  badgeColor: i.isRisk ? 'bg-semantic-danger/10 text-semantic-danger' :
                              i.isOpportunity ? 'bg-semantic-success/10 text-semantic-success' : undefined,
                }))}
              />

              <IntelligenceCard
                title="SEO Insights"
                icon={Icons.seo}
                accentColor="text-brand-magenta"
                link="/app/seo"
                emptyMessage="No SEO insights available"
                items={insights
                  .filter(i => i.category === 'seo' || i.sourceSystem === 'media_performance')
                  .slice(0, 3)
                  .map(i => ({
                    id: i.id,
                    title: i.title,
                    subtitle: i.description?.slice(0, 50),
                  }))}
              />

              <IntelligenceCard
                title="Content Opportunities"
                icon={Icons.content}
                accentColor="text-brand-cyan"
                link="/app/content"
                emptyMessage="No content opportunities found"
                items={contentInsights.slice(0, 3).map(i => ({
                  id: i.id,
                  title: i.title,
                  subtitle: i.description?.slice(0, 50),
                }))}
              />

              <IntelligenceCard
                title="Reality Maps"
                icon={Icons.realityMap}
                accentColor="text-brand-teal"
                link="/app/reality-maps"
                emptyMessage="No reality maps created"
                items={realityMapCount > 0 ? [
                  {
                    id: 'rm-summary',
                    title: `${realityMapCount} active reality map${realityMapCount !== 1 ? 's' : ''}`,
                    subtitle: 'AI-driven multi-outcome scenarios',
                  },
                ] : []}
              />
            </div>

            {/* Additional Intelligence Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IntelligenceCard
                title="Insight Conflicts"
                icon={Icons.conflict}
                accentColor="text-semantic-warning"
                link="/app/insight-conflicts"
                emptyMessage="No conflicts detected"
                items={conflictCount > 0 ? [
                  {
                    id: 'conflict-summary',
                    title: `${conflictCount} active conflict${conflictCount !== 1 ? 's' : ''}`,
                    subtitle: 'Cross-system contradictions to resolve',
                    badge: 'Action needed',
                    badgeColor: 'bg-semantic-warning/10 text-semantic-warning',
                  },
                ] : []}
              />

              <IntelligenceCard
                title="Agent Actions"
                icon={Icons.agent}
                accentColor="text-brand-iris"
                link="/app/agents"
                emptyMessage="No recent agent activity"
                items={insights
                  .filter(i => i.isTopInsight)
                  .slice(0, 3)
                  .map(i => ({
                    id: i.id,
                    title: i.title,
                    subtitle: formatRelativeTime(i.createdAt),
                    badge: 'AI',
                    badgeColor: 'bg-brand-iris/10 text-brand-iris',
                  }))}
              />
            </div>
          </div>

          {/* Right Column - Activity Stream */}
          <div className="col-span-12 lg:col-span-4">
            <div className="panel-card p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                <Link href="/app/exec" className="text-xs text-brand-cyan hover:underline">
                  View all
                </Link>
              </div>

              {insights.length > 0 ? (
                <div className="space-y-1">
                  {insights.slice(0, 8).map((insight) => (
                    <ActivityItem key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-4" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-4 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-slate-5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-slate-3 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted">No activity yet</p>
                  <p className="text-xs text-slate-6 mt-1">
                    AI insights will appear here
                  </p>
                </div>
              )}

            </div>

            {/* S93: AI Orchestration Summary Card */}
            <OrchestrationSummaryCard />

            {/* AI Recommendations Panel (S92 Enhancement) */}
            <AIRecommendationsPanel
              insights={insights}
              scenarios={scenarios}
            />

            {/* S92: Enhanced Scenario & Narrative Panels */}
            <ScenarioSnapshot
              scenarios={scenarios}
              realityMaps={realityMaps}
              scenarioStats={scenarioStats}
            />

            <UnifiedNarrativeTile
              narratives={narrativesList}
              stats={narrativeStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
