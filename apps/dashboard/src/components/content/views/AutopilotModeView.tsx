'use client';

/**
 * AutopilotModeView — "I Am Supervising Automation"
 *
 * System executes within guardrails. User only sees exceptions
 * that need manual attention. "All clear" = success state.
 * This is a SEPARATE component tree — not a conditional branch.
 *
 * Layout (exceptions exist):
 * ┌──────────────────────────────────────────────────────┐
 * │ HealthStrip                    │ Review   │ [Queue]  │  ← top bar
 * ├──────────────────────────────────────────────────────┤
 * │ EXCEPTION   │ EXCEPTION DETAIL    │ GUARDRAILS +    │  ← 3-pane
 * │ QUEUE       │ + resolution CTA    │ ACTIVITY LOG    │
 * │ (280px)     │ flex-1              │ (300px)         │
 * └──────────────────────────────────────────────────────┘
 *
 * Layout (all clear):
 * ┌──────────────────────────────────────────────────────┐
 * │ HealthStrip  │ SupervisedItemsCount │ [Kill Switch]  │
 * ├──────────────────────────────────────────────────────┤
 * │                                                      │
 * │     ✓ Autopilot Active                               │
 * │     No exceptions. X items handled automatically.    │
 * │                                                      │
 * ├──────────────────────────────────────────────────────┤
 * │ Activity Log (collapsible)                           │
 * └──────────────────────────────────────────────────────┘
 *
 * @see /docs/canon/work/CONTENT_WORK_SURFACE_RECONSTRUCTION.md §5 (Autopilot)
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md §5B (Content Autopilot Mode)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  HealthStrip,
  SupervisedItemsCount,
  generateContentActions,
  selectPrioritizedActions,
  filterActionsByMode,
  convertToQueueItems,
  toTriggerAction,
  computePipelineCounts,
  computeCiteMindIssueCount,
  MOCK_AUDIT_LEDGER,
  type ContentModeViewProps,
} from './shared';
import { QueueList, WorkbenchCanvas, ContextRail } from '../work-queue';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';
import { ExplainabilityDrawer } from '../orchestration/ExplainabilityDrawer';
import type { AuditLedgerEntry } from '../types';
import {
  type AIPerceptualState,
  deriveAIPerceptualState,
} from '@/components/ai';

// ============================================
// GUARDRAILS CARD (Autopilot-specific)
// ============================================

function GuardrailsCard() {
  const guardrails = [
    { id: 'g1', name: 'Critical Priority', description: 'Items marked critical always surface', active: true },
    { id: 'g2', name: 'CiteMind Issues', description: 'Quality issues require manual review', active: true },
    { id: 'g3', name: 'Deadline < 24h', description: 'Urgent deadlines need confirmation', active: true },
    { id: 'g4', name: 'High-Risk Actions', description: 'Actions above risk threshold pause', active: false },
  ];

  return (
    <div className="p-3 bg-brand-iris/5 border border-brand-iris/20 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-iris">Active Guardrails</h4>
      </div>
      <div className="space-y-1.5">
        {guardrails.filter(g => g.active).map((guardrail) => (
          <div key={guardrail.id} className="flex items-start gap-2 p-2 bg-slate-2/50 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-iris mt-1.5 shrink-0" />
            <div>
              <span className="text-[13px] font-medium text-white/95">{guardrail.name}</span>
              <p className="text-[13px] text-white/40">{guardrail.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ACTIVITY LOG (Autopilot-specific)
// ============================================

function ActivityLog({
  entries,
  isCollapsed,
  onToggle,
}: {
  entries: AuditLedgerEntry[];
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const typeIcons: Record<AuditLedgerEntry['actionType'], string> = {
    scheduling: '📅',
    derivative_generation: '📄',
    brief_execution: '⚡',
    citemind_check: '✓',
    cross_pillar_sync: '🔄',
    status_change: '↕',
  };

  const formatTime = (timestamp: string): string => {
    const d = new Date(timestamp);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="border-t border-slate-4 bg-slate-2/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 group"
      >
        <div className="flex items-center gap-2">
          <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 group-hover:text-white transition-colors">
            Activity Log
          </h4>
          <span className="px-1.5 py-0.5 text-xs font-medium text-semantic-success bg-semantic-success/10 rounded">
            {entries.length}
          </span>
        </div>
        <span className="text-xs text-white/30">by AUTOMATE</span>
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-3">
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-2.5 py-2 bg-slate-2/50 hover:bg-slate-2/70 rounded text-[13px] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-semantic-success shrink-0">
                    {typeIcons[entry.actionType] || '•'}
                  </span>
                  <span className="text-white/60 truncate">{entry.summary}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                    entry.outcome === 'completed' ? 'text-semantic-success bg-semantic-success/10' :
                    entry.outcome === 'passed' ? 'text-brand-cyan bg-brand-cyan/10' :
                    entry.outcome === 'failed' ? 'text-semantic-danger bg-semantic-danger/10' :
                    'text-white/40 bg-white/5'
                  }`}>
                    {entry.outcome}
                  </span>
                  <span className="text-white/30 text-xs">{formatTime(entry.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN AUTOPILOT MODE VIEW
// ============================================

export function AutopilotModeView({
  signals,
  gaps,
  briefs,
  assets = [],
  clusters: _clusters,
  isLoading,
  error,
  onViewLibrary,
  onViewBrief,
  onGenerateBrief,
  onFixIssues,
  onViewCalendar,
  onLaunchOrchestrate,
  onSwitchToManual,
}: ContentModeViewProps) {
  // Autopilot-specific state
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isSimulatingEvaluate, setIsSimulatingEvaluate] = useState(true);
  const [explainDrawerOpen, setExplainDrawerOpen] = useState(false);
  const [activityLogCollapsed, setActivityLogCollapsed] = useState(false);

  // AI evaluation simulation on mount
  useEffect(() => {
    setIsSimulatingEvaluate(true);
    const timer = setTimeout(() => setIsSimulatingEvaluate(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Derived data
  const citeMindIssueCount = useMemo(() => computeCiteMindIssueCount(assets), [assets]);
  const pipelineCounts = useMemo(() => computePipelineCounts(assets), [assets]);

  const allActions = useMemo(
    () => generateContentActions({
      briefs,
      gaps,
      assets,
      mode: 'autopilot',
      citeMindIssueCount,
      onViewBrief,
      onGenerateBrief,
      onFixIssues,
    }),
    [briefs, gaps, assets, citeMindIssueCount, onViewBrief, onGenerateBrief, onFixIssues]
  );

  // Exception queue: only items requiring manual attention
  const exceptions = useMemo(() => filterActionsByMode(allActions, 'autopilot'), [allActions]);
  const sortedExceptions = useMemo(() => selectPrioritizedActions(exceptions), [exceptions]);
  const exceptionItems = useMemo(() => convertToQueueItems(sortedExceptions), [sortedExceptions]);
  const routineCount = allActions.length - exceptions.length;
  const isAllClear = sortedExceptions.length === 0;

  const selectedItem = useMemo(
    () => {
      if (selectedActionId) return exceptionItems.find(item => item.id === selectedActionId) || null;
      return exceptionItems[0] || null;
    },
    [exceptionItems, selectedActionId]
  );

  const selectedAction = useMemo(
    () => {
      if (selectedActionId) return sortedExceptions.find(a => a.id === selectedActionId) || null;
      return sortedExceptions[0] || null;
    },
    [sortedExceptions, selectedActionId]
  );

  // Derive AI perceptual state
  const aiState: AIPerceptualState = useMemo(() => {
    if (isSimulatingEvaluate) return 'evaluating';
    const hasBlockedAction = sortedExceptions.some(a => a.type === 'issue');
    const hasCriticalDeadline = sortedExceptions.some(a => a.priority === 'critical' && a.type === 'scheduled');
    return deriveAIPerceptualState({
      isLoading: false,
      isValidating: false,
      gateStatus: hasBlockedAction ? 'warning' : 'passed',
      isActionReady: false,
      hasUrgentDeadline: hasCriticalDeadline,
      priority: sortedExceptions[0]?.priority,
      mode: 'autopilot',
    });
  }, [sortedExceptions, isSimulatingEvaluate]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: Health strip + supervised count + kill switch */}
      <div className="px-4 py-3 border-b border-slate-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <HealthStrip signals={signals} citeMindIssueCount={citeMindIssueCount} />
            <SupervisedItemsCount
              routineCount={routineCount}
              exceptionCount={sortedExceptions.length}
            />
          </div>
          {/* Kill switch: revert to manual */}
          <button
            onClick={onSwitchToManual}
            className="px-3 py-2 text-sm font-medium text-white/60 bg-slate-2 border border-border-subtle hover:border-semantic-danger/40 hover:text-semantic-danger rounded-lg transition-all duration-200"
            title="Stop Autopilot and switch to Manual mode"
          >
            Stop Autopilot
          </button>
        </div>
      </div>

      {isAllClear ? (
        /* ============================================
         * ALL CLEAR STATE — success, NOT error
         * Per user instruction: "all clear" in Autopilot is the success state
         * ============================================ */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Autopilot Active</h2>
          <p className="text-sm text-white/50 max-w-md mb-4">
            No exceptions requiring manual attention.
          </p>
          {routineCount > 0 && (
            <p className="text-sm text-brand-cyan">
              {routineCount} routine {routineCount === 1 ? 'action' : 'actions'} being handled automatically.
            </p>
          )}
          <div className="mt-6">
            <GuardrailsCard />
          </div>
        </div>
      ) : (
        /* ============================================
         * EXCEPTION QUEUE — items needing attention
         * ============================================ */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] min-h-0">
          {/* LEFT: Exception queue */}
          <div className="border-r border-slate-4 overflow-hidden">
            <QueueList
              items={exceptionItems}
              selectedId={selectedItem?.id || null}
              onSelect={handleSelect}
              mode="autopilot"
              routineCount={routineCount}
              pinnedId={null}
              onPinToggle={undefined}
            />
          </div>

          {/* CENTER: Exception detail + resolution */}
          <div className="overflow-hidden">
            <WorkbenchCanvas
              item={selectedItem}
              mode="autopilot"
              aiState={aiState}
              onExecute={handleExecute}
              onLaunchOrchestrate={onLaunchOrchestrate}
              onExplain={handleExplain}
              onSwitchToManual={onSwitchToManual}
              isPlanApproved={false}
              onApprovePlan={undefined}
            />
          </div>

          {/* RIGHT: Guardrails + Context */}
          <div className="border-l border-slate-4 overflow-hidden flex flex-col">
            <div className="p-3 shrink-0">
              <GuardrailsCard />
            </div>
            <div className="flex-1 overflow-hidden">
              <ContextRail
                mode="autopilot"
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
                auditLedger={MOCK_AUDIT_LEDGER}
                onViewCalendar={onViewCalendar}
                onViewLibrary={onViewLibrary}
                onFixIssues={onFixIssues}
              />
            </div>
          </div>
        </div>
      )}

      {/* Activity Log — always visible at bottom */}
      <ActivityLog
        entries={MOCK_AUDIT_LEDGER}
        isCollapsed={activityLogCollapsed}
        onToggle={() => setActivityLogCollapsed(!activityLogCollapsed)}
      />

      {/* Explainability Drawer */}
      {selectedAction && (
        <ExplainabilityDrawer
          isOpen={explainDrawerOpen}
          onClose={() => setExplainDrawerOpen(false)}
          action={toTriggerAction(selectedAction)}
          currentMode="autopilot"
        />
      )}
    </div>
  );
}
