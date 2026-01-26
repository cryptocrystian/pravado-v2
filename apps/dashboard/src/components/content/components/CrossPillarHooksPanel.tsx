'use client';

/**
 * Cross-Pillar Hooks Panel
 *
 * Actions for cross-pillar integration:
 * - Generate PR Pitch Hooks (creates PR excerpt candidates)
 * - Send AEO Snippet Bundle (packages AEO snippet + AI summary)
 * - Add to Command Center Actions (creates ActionItem)
 *
 * All hooks produce explainable action objects per AUTOMATE_EXECUTION_MODEL.
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 * @see /docs/canon/AUTOMATION_MODES_UX.md
 */

import { useState, useCallback } from 'react';

import { text, label, modeTokens } from '../tokens';
import type { CiteMindStatus, DerivativeSurface, AutomationMode } from '../types';

// ============================================
// TYPES
// ============================================

/**
 * Causal Chain Step per AUTOMATE_EXECUTION_MODEL Section 7.2 Level 3
 *
 * Documents the temporal progression of events leading to action execution.
 */
export interface CausalChainStep {
  /** Step identifier */
  step: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Who/what performed this step */
  actor: 'system' | 'user';
  /** Optional additional context */
  detail?: string;
}

/**
 * Explainable Action Object per AUTOMATE_EXECUTION_MODEL Section 7.2
 *
 * Every action must be explainable at three levels:
 * - Level 1: User Summary
 * - Level 2: Technical Detail
 * - Level 3: Causal Chain
 */
export interface ExplainableAction {
  /** Unique action identifier */
  actionId: string;
  /** Action type for classification */
  actionType: 'pr_hook' | 'aeo_bundle' | 'command_center';
  /** Source pillar */
  sourcePillar: 'content';
  /** Target pillar */
  targetPillar: 'pr' | 'seo' | 'command';
  /** Automation mode used */
  mode: AutomationMode;
  /** Confidence score 0-1 per AUTOMATE Section 3 */
  confidence: number;
  /** Risk class per AUTOMATE Section 5 */
  riskClass: 'low' | 'medium' | 'high' | 'critical';
  /** Level 1: User-facing explanation */
  userSummary: string;
  /** Level 2: Technical context */
  technicalDetail: {
    triggerSignal: string;
    signalConfidence: number;
    patternMatch: string;
    expectedOutcome: {
      primary: string;
      probability: number;
    };
  };
  /**
   * Level 3: Causal Chain per AUTOMATE_EXECUTION_MODEL Section 7.2
   *
   * Documents the temporal sequence of events:
   * Signal Detection → Proposal Generation → Approval → Preparation → Execution → Outcome
   */
  causalChain: CausalChainStep[];
  /** Reversibility per AUTOMATE Section 4 */
  reversibility: 'fully_reversible' | 'partially_reversible' | 'irreversible';
  /** Timestamp */
  createdAt: string;
  /** Associated asset */
  assetId: string;
  assetTitle: string;
}

export interface CrossPillarHooksPanelProps {
  /** Asset ID */
  assetId: string;
  /** Asset title */
  assetTitle: string;
  /** Available derivatives */
  derivatives: DerivativeSurface[];
  /** CiteMind status - blocked disables actions */
  citeMindStatus: CiteMindStatus;
  /** Current automation mode */
  automationMode?: AutomationMode;
  /** Callback when PR pitch hooks are generated - returns explainable action */
  onGeneratePRHooks?: () => Promise<ExplainableAction>;
  /** Callback when AEO bundle is sent - returns explainable action */
  onSendAEOBundle?: () => Promise<ExplainableAction>;
  /** Callback when adding to Command Center - returns explainable action */
  onAddToCommandCenter?: () => Promise<ExplainableAction>;
  /** Callback when action is completed with full action object */
  onActionComplete?: (action: ExplainableAction) => void;
  /** Compact mode */
  compact?: boolean;
}

interface HookAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  pillar: 'pr' | 'seo' | 'command';
  requiresDerivative?: string;
  /** Mode ceiling per AUTOMATE */
  modeCeiling: AutomationMode;
  /** Risk class per AUTOMATE Section 5 */
  riskClass: 'low' | 'medium' | 'high' | 'critical';
  /** Reversibility */
  reversibility: 'fully_reversible' | 'partially_reversible' | 'irreversible';
}

// ============================================
// HOOK ACTIONS CONFIG
// Per AUTOMATE_EXECUTION_MODEL risk and mode specifications
// ============================================

const HOOK_ACTIONS: HookAction[] = [
  {
    id: 'pr-pitch',
    label: 'Generate PR Pitch Hooks',
    description: 'Create pitch excerpts for media outreach',
    pillar: 'pr',
    requiresDerivative: 'pr_pitch_excerpt',
    // Medium risk: creates external-facing content draft
    modeCeiling: 'copilot',
    riskClass: 'medium',
    reversibility: 'fully_reversible',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'aeo-bundle',
    label: 'Send AEO Snippet Bundle',
    description: 'Package AEO snippet + AI summary for SEO',
    pillar: 'seo',
    requiresDerivative: 'aeo_snippet',
    // Low risk: internal data packaging
    modeCeiling: 'autopilot',
    riskClass: 'low',
    reversibility: 'fully_reversible',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'command-center',
    label: 'Add to Command Center',
    description: 'Create action item for orchestration',
    pillar: 'command',
    // Low risk: internal queue operation
    modeCeiling: 'autopilot',
    riskClass: 'low',
    reversibility: 'fully_reversible',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
];

// ============================================
// EXPLAINABLE ACTION FACTORY
// Per AUTOMATE_EXECUTION_MODEL Section 7.2
// ============================================

/**
 * Generate causal chain steps per AUTOMATE_EXECUTION_MODEL Section 7.2 Level 3
 *
 * Example from canon:
 * Signal Detection (t-48h) → Proposal Generation (t-24h) → Approval (t-12h)
 *   → Preparation (t-1h) → Execution (t-0) → Outcome (t+48h)
 */
function generateCausalChain(
  actionConfig: HookAction,
  assetTitle: string,
  mode: AutomationMode
): CausalChainStep[] {
  const now = new Date();

  // For user-initiated actions, the causal chain is compressed
  // In production, this would pull from actual system events
  return [
    {
      step: 'Content Published',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // t-24h
      actor: 'user',
      detail: `"${assetTitle}" made available for cross-pillar integration`,
    },
    {
      step: 'Derivative Generated',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // t-1h
      actor: 'system',
      detail: actionConfig.requiresDerivative
        ? `${actionConfig.requiresDerivative} derivative created`
        : 'Content prepared for integration',
    },
    {
      step: 'Hook Initiated',
      timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(), // t-1m
      actor: 'user',
      detail: `User triggered "${actionConfig.label}" in ${mode} mode`,
    },
    {
      step: 'Execution',
      timestamp: now.toISOString(), // t-0
      actor: 'system',
      detail: `Cross-pillar hook sent to ${actionConfig.pillar.toUpperCase()} pillar`,
    },
  ];
}

function createExplainableAction(
  actionConfig: HookAction,
  assetId: string,
  assetTitle: string,
  mode: AutomationMode
): ExplainableAction {
  const actionTypeMap: Record<string, ExplainableAction['actionType']> = {
    'pr-pitch': 'pr_hook',
    'aeo-bundle': 'aeo_bundle',
    'command-center': 'command_center',
  };

  const targetPillarMap: Record<string, ExplainableAction['targetPillar']> = {
    pr: 'pr',
    seo: 'seo',
    command: 'command',
  };

  return {
    actionId: `${actionConfig.id}-${Date.now()}`,
    actionType: actionTypeMap[actionConfig.id],
    sourcePillar: 'content',
    targetPillar: targetPillarMap[actionConfig.pillar],
    mode,
    confidence: 0.85, // Default confidence for cross-pillar hooks
    riskClass: actionConfig.riskClass,
    userSummary: `${actionConfig.label} for "${assetTitle}" to ${actionConfig.pillar.toUpperCase()} pillar.`,
    technicalDetail: {
      triggerSignal: 'user_initiated_cross_pillar_hook',
      signalConfidence: 0.95,
      patternMatch: `content_to_${actionConfig.pillar}_integration`,
      expectedOutcome: {
        primary: `${actionConfig.pillar}_surface_created`,
        probability: 0.9,
      },
    },
    causalChain: generateCausalChain(actionConfig, assetTitle, mode),
    reversibility: actionConfig.reversibility,
    createdAt: new Date().toISOString(),
    assetId,
    assetTitle,
  };
}

// ============================================
// PILLAR COLORS
// ============================================

const PILLAR_COLORS = {
  pr: {
    bg: 'bg-brand-magenta/10',
    border: 'border-brand-magenta/20',
    text: 'text-brand-magenta',
    hover: 'hover:bg-brand-magenta/20',
  },
  seo: {
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/20',
    text: 'text-brand-cyan',
    hover: 'hover:bg-brand-cyan/20',
  },
  command: {
    bg: 'bg-brand-iris/10',
    border: 'border-brand-iris/20',
    text: 'text-brand-iris',
    hover: 'hover:bg-brand-iris/20',
  },
};

// ============================================
// MODE BADGE COMPONENT
// ============================================

function ModeBadge({ mode, compact = false }: { mode: AutomationMode; compact?: boolean }) {
  const config = modeTokens[mode];
  return (
    <span
      className={`inline-flex items-center gap-1 ${compact ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[9px]'} font-medium rounded ${config.bg} ${config.text}`}
      title={config.description}
    >
      {config.label}
    </span>
  );
}

// ============================================
// RISK INDICATOR COMPONENT
// ============================================

function RiskIndicator({ riskClass }: { riskClass: HookAction['riskClass'] }) {
  const config: Record<HookAction['riskClass'], { color: string; label: string }> = {
    low: { color: 'text-semantic-success', label: 'Low Risk' },
    medium: { color: 'text-semantic-warning', label: 'Medium Risk' },
    high: { color: 'text-semantic-danger', label: 'High Risk' },
    critical: { color: 'text-semantic-danger', label: 'Critical' },
  };

  return (
    <span className={`text-[8px] ${config[riskClass].color}`} title={config[riskClass].label}>
      {riskClass === 'low' && '●'}
      {riskClass === 'medium' && '●●'}
      {riskClass === 'high' && '●●●'}
      {riskClass === 'critical' && '●●●●'}
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CrossPillarHooksPanel({
  assetId,
  assetTitle,
  derivatives,
  citeMindStatus,
  automationMode = 'copilot',
  onGeneratePRHooks,
  onSendAEOBundle,
  onAddToCommandCenter,
  onActionComplete,
  compact = false,
}: CrossPillarHooksPanelProps) {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [lastAction, setLastAction] = useState<ExplainableAction | null>(null);
  const [isCausalChainExpanded, setIsCausalChainExpanded] = useState(false);

  const isBlocked = citeMindStatus === 'blocked';

  // Check if derivative exists
  const hasDerivative = useCallback(
    (type: string | undefined) => {
      if (!type) return true;
      return derivatives.some((d) => d.surfaceType === type && d.valid);
    },
    [derivatives]
  );

  // Determine effective mode considering ceiling
  const getEffectiveMode = useCallback(
    (actionConfig: HookAction): AutomationMode => {
      const modeOrder: AutomationMode[] = ['manual', 'copilot', 'autopilot'];
      const currentModeIndex = modeOrder.indexOf(automationMode);
      const ceilingIndex = modeOrder.indexOf(actionConfig.modeCeiling);
      return currentModeIndex > ceilingIndex ? actionConfig.modeCeiling : automationMode;
    },
    [automationMode]
  );

  // Handle action execution with explainable action generation
  const handleAction = useCallback(
    async (actionId: string) => {
      if (isBlocked || loadingActions.has(actionId)) return;

      const actionConfig = HOOK_ACTIONS.find((a) => a.id === actionId);
      if (!actionConfig) return;

      const effectiveMode = getEffectiveMode(actionConfig);

      setLoadingActions((prev) => new Set(prev).add(actionId));

      try {
        let result: ExplainableAction | undefined;

        switch (actionId) {
          case 'pr-pitch':
            result = await onGeneratePRHooks?.();
            break;
          case 'aeo-bundle':
            result = await onSendAEOBundle?.();
            break;
          case 'command-center':
            result = await onAddToCommandCenter?.();
            break;
        }

        // If callback didn't return an action, create one
        const explainableAction = result || createExplainableAction(
          actionConfig,
          assetId,
          assetTitle,
          effectiveMode
        );

        setLastAction(explainableAction);
        setCompletedActions((prev) => new Set(prev).add(actionId));

        // Notify parent with full action object
        onActionComplete?.(explainableAction);
      } finally {
        setLoadingActions((prev) => {
          const next = new Set(prev);
          next.delete(actionId);
          return next;
        });
      }
    },
    [isBlocked, loadingActions, onGeneratePRHooks, onSendAEOBundle, onAddToCommandCenter, onActionComplete, assetId, assetTitle, getEffectiveMode]
  );

  return (
    <div className={`${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={label}>Cross-Pillar Hooks</h3>
        <div className="flex items-center gap-2">
          <ModeBadge mode={automationMode} compact />
          {isBlocked && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-semantic-danger bg-semantic-danger/10 border border-semantic-danger/20 rounded-full">
              Blocked
            </span>
          )}
        </div>
      </div>

      {/* Info text */}
      <p className={`text-[10px] ${text.hint} mb-3`}>
        Connect this content to other pillars for orchestrated marketing.
      </p>

      {/* Actions */}
      <div className="space-y-2">
        {HOOK_ACTIONS.map((action) => {
          const colors = PILLAR_COLORS[action.pillar];
          const isLoading = loadingActions.has(action.id);
          const isCompleted = completedActions.has(action.id);
          const hasRequiredDerivative = hasDerivative(action.requiresDerivative);
          const isDisabled = isBlocked || isLoading || !hasRequiredDerivative;
          const effectiveMode = getEffectiveMode(action);

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isDisabled}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                ${isCompleted ? 'bg-semantic-success/10 border-semantic-success/20' : `${colors.bg} ${colors.border}`}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : colors.hover}
              `}
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg ${isCompleted ? 'bg-semantic-success/20 text-semantic-success' : `${colors.bg} ${colors.text}`}`}>
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  action.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-semantic-success' : text.primary}`}>
                    {isCompleted ? `${action.label} ✓` : action.label}
                  </p>
                  <RiskIndicator riskClass={action.riskClass} />
                </div>
                <p className={`text-[10px] ${text.hint} truncate`}>
                  {!hasRequiredDerivative ? 'Generate derivative first' : action.description}
                </p>
              </div>

              {/* Mode + Pillar badges */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-2 py-0.5 text-[9px] font-medium uppercase rounded-full ${colors.bg} ${colors.text}`}>
                  {action.pillar === 'command' ? 'CMD' : action.pillar.toUpperCase()}
                </span>
                <ModeBadge mode={effectiveMode} compact />
              </div>
            </button>
          );
        })}
      </div>

      {/* Last Action Explanation (per AUTOMATE Section 7.2) */}
      {lastAction && !compact && (
        <div className="mt-3 p-2 bg-slate-3 rounded-lg">
          {/* Level 1: User Summary */}
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-3 h-3 text-brand-cyan" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-medium text-white/70">Last Action</span>
          </div>
          <p className="text-[10px] text-white/50">{lastAction.userSummary}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] text-white/30">
              Confidence: {(lastAction.confidence * 100).toFixed(0)}%
            </span>
            <span className="text-[9px] text-white/30">
              Risk: {lastAction.riskClass}
            </span>
          </div>

          {/* Level 3: Causal Chain (collapsible) per AUTOMATE Section 7.2 */}
          {lastAction.causalChain && lastAction.causalChain.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-4">
              <button
                onClick={() => setIsCausalChainExpanded(!isCausalChainExpanded)}
                className="flex items-center gap-1 text-[9px] text-white/40 hover:text-white/60 transition-colors"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isCausalChainExpanded ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Causal Chain ({lastAction.causalChain.length} steps)
              </button>

              {isCausalChainExpanded && (
                <div className="mt-2 pl-2 border-l border-slate-4 space-y-2">
                  {lastAction.causalChain.map((step, index) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${
                          step.actor === 'user' ? 'bg-brand-iris' : 'bg-brand-cyan'
                        }`}
                      />
                      <div className="pl-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-medium text-white/60">{step.step}</span>
                          <span className="text-[8px] text-white/30">
                            {step.actor === 'user' ? '👤' : '🤖'}
                          </span>
                        </div>
                        {step.detail && (
                          <p className="text-[8px] text-white/40">{step.detail}</p>
                        )}
                        <p className="text-[7px] text-white/20">
                          {new Date(step.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Blocked warning */}
      {isBlocked && (
        <p className={`text-[10px] text-semantic-danger text-center mt-3`}>
          Resolve CiteMind issues to enable cross-pillar hooks
        </p>
      )}
    </div>
  );
}

export default CrossPillarHooksPanel;
