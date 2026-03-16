'use client';

/**
 * CopilotModeView — "I Am Reviewing AI Work"
 *
 * AI proposes queue ordering + drafts. User reviews reasoning,
 * approves/rejects the plan, then acts on individual items.
 * This is a SEPARATE component tree — not a conditional branch.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────┐
 * │ HealthStrip                    │ Generate │ Create   │  ← top bar
 * ├──────────────────────────────────────────────────────┤
 * │ QUEUE LIST  │ PLAN + DETAIL CANVAS  │ CONTEXT RAIL  │  ← 3-pane triage
 * │ AI-sorted   │ Plan banner + detail  │ CiteMind etc  │
 * │ (280px)     │ flex-1                │ (300px)       │
 * └──────────────────────────────────────────────────────┘
 *
 * @see /docs/canon/work/CONTENT_WORK_SURFACE_RECONSTRUCTION.md §4 (Copilot)
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md §5B (Content Copilot Mode)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  HealthStrip,
  CTACluster,
  generateContentActions,
  selectPrioritizedActions,
  convertToQueueItems,
  toTriggerAction,
  computePipelineCounts,
  computeCiteMindIssueCount,
  type ContentModeViewProps,
} from './shared';
import { QueueList, WorkbenchCanvas, ContextRail } from '../work-queue';
import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';
import { ExplainabilityDrawer } from '../orchestration/ExplainabilityDrawer';
import {
  type AIPerceptualState,
  deriveAIPerceptualState,
} from '@/components/ai';

export function CopilotModeView({
  signals,
  gaps,
  briefs,
  assets = [],
  clusters,
  isLoading,
  error,
  onViewLibrary,
  onViewBrief,
  onGenerateBrief,
  onImportContent,
  onFixIssues,
  onGenerateDraft,
  onViewCalendar,
  onLaunchOrchestrate,
  onSwitchToManual,
}: ContentModeViewProps) {
  // Copilot-specific state
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isPlanApproved, setIsPlanApproved] = useState(false);
  const [isSimulatingEvaluate, setIsSimulatingEvaluate] = useState(true);
  const [explainDrawerOpen, setExplainDrawerOpen] = useState(false);

  // AI evaluation simulation on mount (1200ms per spec)
  useEffect(() => {
    setIsSimulatingEvaluate(true);
    const timer = setTimeout(() => setIsSimulatingEvaluate(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Derived data
  const citeMindIssueCount = useMemo(() => computeCiteMindIssueCount(assets), [assets]);
  const pipelineCounts = useMemo(() => computePipelineCounts(assets), [assets]);

  const actions = useMemo(
    () => generateContentActions({
      briefs,
      gaps,
      assets,
      mode: 'copilot',
      citeMindIssueCount,
      onViewBrief,
      onGenerateBrief,
      onFixIssues,
    }),
    [briefs, gaps, assets, citeMindIssueCount, onViewBrief, onGenerateBrief, onFixIssues]
  );

  const sortedActions = useMemo(() => selectPrioritizedActions(actions), [actions]);
  const queueItems = useMemo(() => convertToQueueItems(sortedActions), [sortedActions]);

  const selectedItem = useMemo(
    () => {
      if (selectedActionId) return queueItems.find(item => item.id === selectedActionId) || null;
      return queueItems[0] || null;
    },
    [queueItems, selectedActionId]
  );

  const selectedAction = useMemo(
    () => {
      if (selectedActionId) return sortedActions.find(a => a.id === selectedActionId) || null;
      return sortedActions[0] || null;
    },
    [sortedActions, selectedActionId]
  );

  // Derive AI perceptual state
  const aiState: AIPerceptualState = useMemo(() => {
    if (isSimulatingEvaluate) return 'evaluating';
    const hasBlockedAction = sortedActions.some(a => a.type === 'issue');
    const hasCriticalDeadline = sortedActions.some(a => a.priority === 'critical' && a.type === 'scheduled');
    const hasReadyAction = sortedActions.some(a => a.type === 'execution' && a.orchestrateActionId);
    return deriveAIPerceptualState({
      isLoading: false,
      isValidating: false,
      gateStatus: hasBlockedAction ? 'warning' : 'passed',
      isActionReady: hasReadyAction,
      hasUrgentDeadline: hasCriticalDeadline,
      priority: sortedActions[0]?.priority,
      mode: 'copilot',
    });
  }, [sortedActions, isSimulatingEvaluate]);

  // Handlers
  const handleSelect = useCallback((id: string) => setSelectedActionId(id), []);

  const handleExecute = useCallback(() => {
    if (selectedAction) {
      selectedAction.cta.action();
    }
  }, [selectedAction]);

  const handleExplain = useCallback(() => setExplainDrawerOpen(true), []);

  // Loading
  if (isLoading) {
    return <ContentLoadingSkeleton type="dashboard" />;
  }

  // Error
  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">Failed to load content</h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty
  const hasData = signals || clusters.length > 0 || gaps.length > 0 || briefs.length > 0;
  if (!hasData) {
    return (
      <ContentEmptyState
        view="work-queue"
        onAction={onGenerateBrief}
        actionLabel="Generate Draft"
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: Health strip + Copilot CTAs */}
      <div className="px-4 py-3 border-b border-slate-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <HealthStrip signals={signals} citeMindIssueCount={citeMindIssueCount} />
          </div>
          <CTACluster
            mode="copilot"
            hasIssues={citeMindIssueCount > 0}
            onGenerateBrief={onGenerateBrief}
            onImportContent={onImportContent}
            onFixIssues={onFixIssues}
            onGenerateDraft={onGenerateDraft}
          />
        </div>
      </div>

      {/* 3-pane triage layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] min-h-0">
        {/* LEFT PANE: QueueList (AI-sorted, with step numbers) */}
        <div className="border-r border-slate-4 overflow-hidden">
          <QueueList
            items={queueItems}
            selectedId={selectedItem?.id || null}
            onSelect={handleSelect}
            mode="copilot"
            routineCount={0}
            pinnedId={null}
            onPinToggle={undefined}
          />
        </div>

        {/* CENTER PANE: WorkbenchCanvas with inline Plan */}
        <div className="overflow-hidden">
          <WorkbenchCanvas
            item={selectedItem}
            mode="copilot"
            aiState={aiState}
            onExecute={handleExecute}
            onLaunchOrchestrate={onLaunchOrchestrate}
            onExplain={handleExplain}
            onSwitchToManual={onSwitchToManual}
            isPlanApproved={isPlanApproved}
            onApprovePlan={() => setIsPlanApproved(true)}
          />
        </div>

        {/* RIGHT PANE: ContextRail */}
        <div className="border-l border-slate-4 overflow-hidden">
          <ContextRail
            mode="copilot"
            citeMindStatus={citeMindIssueCount > 0 ? 'warning' : 'passed'}
            citeMindIssues={assets
              .filter(a => a.citeMindIssues && a.citeMindIssues.length > 0)
              .flatMap(a => a.citeMindIssues || [])}
            entities={selectedAction?.relatedEntityId ? [selectedAction.relatedEntityId] : []}
            derivatives={[
              { type: 'pr_pitch_excerpt', valid: true },
              { type: 'aeo_snippet', valid: true },
              { type: 'ai_summary', valid: false },
            ]}
            crossPillar={{ prHooks: 0, seoHooks: 0 }}
            pipelineCounts={pipelineCounts}
            upcomingDeadlines={{
              count: briefs.filter((b) => b.deadline).length,
              nextDate: briefs.find((b) => b.deadline)?.deadline?.split('T')[0],
            }}
            auditLedger={[]}
            onViewCalendar={onViewCalendar}
            onViewLibrary={onViewLibrary}
            onFixIssues={onFixIssues}
          />
        </div>
      </div>

      {/* Explainability Drawer */}
      {selectedAction && (
        <ExplainabilityDrawer
          isOpen={explainDrawerOpen}
          onClose={() => setExplainDrawerOpen(false)}
          action={toTriggerAction(selectedAction)}
          currentMode="copilot"
        />
      )}
    </div>
  );
}
