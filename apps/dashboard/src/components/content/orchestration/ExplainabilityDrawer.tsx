/**
 * Explainability Drawer
 *
 * Phase 6A.5: 3-level explainability per UX Continuity Canon §6.
 *
 * Levels:
 * - Level 1: User-facing summary ("Why is this recommended?")
 * - Level 2: Technical detail (mode ceiling, CiteMind status, risk)
 * - Level 3: Causal chain (triggers, dependencies, downstream effects)
 *
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, citeMindStatus as citeMindTokens, modeTokens } from '../tokens';
import type { AutomationMode } from '../types';
import type { TriggerAction } from './OrchestrationEditorShell';

// ============================================
// TYPES
// ============================================

interface ExplainabilityDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Handler to close the drawer */
  onClose: () => void;
  /** The action being explained */
  action: TriggerAction;
  /** Current automation mode */
  currentMode: AutomationMode;
}

interface CausalChainNode {
  id: string;
  type: 'trigger' | 'action' | 'effect';
  label: string;
  description: string;
  timestamp?: string;
  pillar?: 'content' | 'pr' | 'seo';
}

// ============================================
// MOCK CAUSAL CHAIN DATA
// ============================================

function getMockCausalChain(action: TriggerAction): CausalChainNode[] {
  const chain: CausalChainNode[] = [];

  // Triggers (what caused this action)
  if (action.type === 'brief_execution') {
    chain.push({
      id: 'trigger-1',
      type: 'trigger',
      label: 'Content Brief Created',
      description: `Brief "${action.sourceContext.briefTitle}" was approved and scheduled for execution.`,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      pillar: 'content',
    });
    chain.push({
      id: 'trigger-2',
      type: 'trigger',
      label: 'SEO Keyword Opportunity',
      description: `Keyword "${action.sourceContext.keyword}" identified as high-value target.`,
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      pillar: 'seo',
    });
  } else if (action.type === 'derivative_generation') {
    chain.push({
      id: 'trigger-1',
      type: 'trigger',
      label: 'Asset Published',
      description: `"${action.sourceContext.assetTitle}" was published and passed CiteMind validation.`,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      pillar: 'content',
    });
  } else {
    chain.push({
      id: 'trigger-1',
      type: 'trigger',
      label: 'Authority Score Drop',
      description: `Asset authority score dropped below threshold, optimization recommended.`,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      pillar: 'content',
    });
  }

  // Current action
  chain.push({
    id: 'action-current',
    type: 'action',
    label: action.title,
    description: 'You are here. Completing this action will advance the authority pipeline.',
    pillar: 'content',
  });

  // Downstream effects
  chain.push({
    id: 'effect-1',
    type: 'effect',
    label: 'EVI Score Update',
    description: 'Earned Visibility Index will recalculate based on new content signals.',
    pillar: 'content',
  });
  chain.push({
    id: 'effect-2',
    type: 'effect',
    label: 'PR Pitch Eligibility',
    description: 'New content may unlock journalist pitch opportunities.',
    pillar: 'pr',
  });
  chain.push({
    id: 'effect-3',
    type: 'effect',
    label: 'SEO Authority Signal',
    description: 'Search authority metrics will update with new content entity coverage.',
    pillar: 'seo',
  });

  return chain;
}

// ============================================
// LEVEL TABS
// ============================================

type ExplainLevel = 'summary' | 'technical' | 'causal';

const LEVEL_CONFIG: Record<ExplainLevel, { label: string; description: string }> = {
  summary: {
    label: 'Summary',
    description: 'Why this action matters',
  },
  technical: {
    label: 'Technical',
    description: 'Mode, risk, and validation details',
  },
  causal: {
    label: 'Causal Chain',
    description: 'What triggered this and what it feeds',
  },
};

// ============================================
// PILLAR COLOR MAPPING
// ============================================

function getPillarColor(pillar: 'content' | 'pr' | 'seo' | undefined): string {
  switch (pillar) {
    case 'content':
      return 'text-brand-iris';
    case 'pr':
      return 'text-brand-magenta';
    case 'seo':
      return 'text-brand-cyan';
    default:
      return 'text-white/50';
  }
}

function getPillarBg(pillar: 'content' | 'pr' | 'seo' | undefined): string {
  switch (pillar) {
    case 'content':
      return 'bg-brand-iris/10 border-brand-iris/20';
    case 'pr':
      return 'bg-brand-magenta/10 border-brand-magenta/20';
    case 'seo':
      return 'bg-brand-cyan/10 border-brand-cyan/20';
    default:
      return 'bg-slate-4 border-slate-5';
  }
}

// ============================================
// MODE CEILING RATIONALE
// ============================================

function getModeCeilingRationale(action: TriggerAction): string {
  switch (action.modeCeiling) {
    case 'manual':
      return 'This action requires human judgment and cannot be automated. Content creation involves strategic decisions that AI cannot make on your behalf.';
    case 'copilot':
      return 'AI can assist with suggestions and completions, but final approval is required. CiteMind validation ensures quality before publishing.';
    case 'autopilot':
      return 'This action meets confidence thresholds for automated execution. AI can draft and you can review before final publication.';
    default:
      return 'Mode determined by action type and confidence level.';
  }
}

// ============================================
// RISK ASSESSMENT
// ============================================

function getRiskAssessment(action: TriggerAction): { level: string; rationale: string } {
  if (action.citeMindStatus === 'blocked') {
    return {
      level: 'High',
      rationale: 'CiteMind has identified critical issues that must be resolved before proceeding.',
    };
  }
  if (action.citeMindStatus === 'warning') {
    return {
      level: 'Medium',
      rationale: 'CiteMind has flagged potential issues. Review recommended before publishing.',
    };
  }
  if (action.priority === 'urgent') {
    return {
      level: 'Medium',
      rationale: 'Time-sensitive action with downstream dependencies. Prompt completion recommended.',
    };
  }
  return {
    level: 'Low',
    rationale: 'Standard action with no identified risks. Safe to proceed.',
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ExplainabilityDrawer({
  isOpen,
  onClose,
  action,
  currentMode,
}: ExplainabilityDrawerProps) {
  const [activeLevel, setActiveLevel] = useState<ExplainLevel>('summary');
  const causalChain = getMockCausalChain(action);
  const risk = getRiskAssessment(action);
  const citeMindConfig = citeMindTokens[action.citeMindStatus];
  const modeConfig = modeTokens[currentMode];
  const ceilingConfig = modeTokens[action.modeCeiling];

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 ${motion.transition.fast}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 w-[440px] max-w-full
          bg-slate-1 border-l border-slate-4 z-50 shadow-elev-3
          flex flex-col
          ${motion.transition.slow}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-drawer-title"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-4 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-iris/10">
                <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 id="explain-drawer-title" className="text-sm font-semibold text-white">
                  Explain This Action
                </h2>
                <p className="text-xs text-white/50">3-level explainability</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 text-white/40 hover:text-white hover:bg-slate-4 rounded-lg ${motion.transition.fast}`}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Level Tabs */}
          <div className="flex gap-1 p-1 bg-slate-2 rounded-lg">
            {(Object.keys(LEVEL_CONFIG) as ExplainLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveLevel(level)}
                className={`
                  flex-1 px-3 py-1.5 text-xs font-medium rounded-md
                  ${activeLevel === level
                    ? 'bg-slate-0 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/80'}
                  ${motion.transition.fast}
                `}
              >
                {LEVEL_CONFIG[level].label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Level 1: Summary */}
          {activeLevel === 'summary' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  Why This Action?
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  This action was recommended because it directly contributes to your authority-building strategy.
                  Completing it will strengthen your content&apos;s visibility in AI answer engines and improve your
                  Earned Visibility Index (EVI).
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  Expected Impact
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-2 border border-slate-4 rounded-lg text-center">
                    <p className="text-lg font-semibold text-brand-iris">+8</p>
                    <p className="text-[10px] text-white/50">EVI Points</p>
                  </div>
                  <div className="p-3 bg-slate-2 border border-slate-4 rounded-lg text-center">
                    <p className="text-lg font-semibold text-brand-cyan">3</p>
                    <p className="text-[10px] text-white/50">Entities Covered</p>
                  </div>
                  <div className="p-3 bg-slate-2 border border-slate-4 rounded-lg text-center">
                    <p className="text-lg font-semibold text-brand-magenta">2</p>
                    <p className="text-[10px] text-white/50">PR Opportunities</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  Quick Summary
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-brand-iris mt-0.5">•</span>
                    Action aligns with your content strategy and keyword targets
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-brand-iris mt-0.5">•</span>
                    Content will be indexed by major AI answer engines
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-brand-iris mt-0.5">•</span>
                    Completion unlocks downstream PR and SEO actions
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Level 2: Technical */}
          {activeLevel === 'technical' && (
            <div className="space-y-5">
              {/* Mode Ceiling */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  Mode Ceiling
                </h3>
                <div className={`p-3 rounded-lg border ${ceilingConfig.bg} ${ceilingConfig.border} mb-2`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${ceilingConfig.text}`}>
                      {ceilingConfig.label} Mode
                    </span>
                    <span className="text-xs text-white/40">(Maximum)</span>
                  </div>
                  <p className="text-xs text-white/60">{ceilingConfig.description}</p>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  {getModeCeilingRationale(action)}
                </p>
              </div>

              {/* Current Mode */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  Current Mode
                </h3>
                <div className={`p-3 rounded-lg border ${modeConfig.bg} ${modeConfig.border}`}>
                  <span className={`text-sm font-medium ${modeConfig.text}`}>
                    {modeConfig.label} Mode
                  </span>
                  <p className="text-xs text-white/50 mt-0.5">{modeConfig.description}</p>
                </div>
              </div>

              {/* CiteMind Status */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  CiteMind Validation
                </h3>
                <div className={`p-3 rounded-lg border ${citeMindConfig.bg} ${citeMindConfig.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${citeMindConfig.dot}`} />
                    <span className={`text-sm font-medium ${citeMindConfig.text} capitalize`}>
                      {action.citeMindStatus}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    {action.citeMindStatus === 'passed' && 'Content meets citation eligibility and factual accuracy standards.'}
                    {action.citeMindStatus === 'analyzing' && 'CiteMind is currently validating content quality and accuracy.'}
                    {action.citeMindStatus === 'warning' && 'Some issues detected. Review recommendations before proceeding.'}
                    {action.citeMindStatus === 'blocked' && 'Critical issues must be resolved before content can be published.'}
                    {action.citeMindStatus === 'pending' && 'Awaiting CiteMind analysis.'}
                  </p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  Risk Assessment
                </h3>
                <div className={`
                  p-3 rounded-lg border
                  ${risk.level === 'High' ? 'bg-semantic-danger/10 border-semantic-danger/20' : ''}
                  ${risk.level === 'Medium' ? 'bg-semantic-warning/10 border-semantic-warning/20' : ''}
                  ${risk.level === 'Low' ? 'bg-semantic-success/10 border-semantic-success/20' : ''}
                `}>
                  <span className={`
                    text-sm font-medium
                    ${risk.level === 'High' ? 'text-semantic-danger' : ''}
                    ${risk.level === 'Medium' ? 'text-semantic-warning' : ''}
                    ${risk.level === 'Low' ? 'text-semantic-success' : ''}
                  `}>
                    {risk.level} Risk
                  </span>
                  <p className="text-xs text-white/50 mt-1">{risk.rationale}</p>
                </div>
              </div>
            </div>
          )}

          {/* Level 3: Causal Chain */}
          {activeLevel === 'causal' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                  Action Lineage
                </h3>
                <p className="text-xs text-white/50 mb-4">
                  This shows what triggered this action and what it will affect downstream.
                </p>

                {/* Causal Chain Visualization */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-6 bottom-6 w-px bg-slate-4" />

                  <div className="space-y-4">
                    {causalChain.map((node) => (
                      <div key={node.id} className="relative flex gap-4">
                        {/* Node marker */}
                        <div className={`
                          relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0
                          ${node.type === 'trigger' ? 'bg-slate-2 border-2 border-slate-4' : ''}
                          ${node.type === 'action' ? 'bg-brand-iris border-2 border-brand-iris/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : ''}
                          ${node.type === 'effect' ? 'bg-slate-2 border-2 border-dashed border-slate-5' : ''}
                        `}>
                          {node.type === 'trigger' && (
                            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          )}
                          {node.type === 'action' && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                          {node.type === 'effect' && (
                            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          )}
                        </div>

                        {/* Node content */}
                        <div className={`
                          flex-1 p-3 rounded-lg border
                          ${node.type === 'action' ? 'bg-brand-iris/5 border-brand-iris/20' : 'bg-slate-2 border-slate-4'}
                        `}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className={`
                              text-xs font-medium
                              ${node.type === 'action' ? 'text-brand-iris' : 'text-white/80'}
                            `}>
                              {node.label}
                            </span>
                            {node.pillar && (
                              <span className={`text-[10px] ${getPillarColor(node.pillar)}`}>
                                {node.pillar.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            {node.description}
                          </p>
                          {node.timestamp && (
                            <p className="text-[10px] text-white/30 mt-1">
                              {new Date(node.timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cross-pillar effects summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                  Cross-Pillar Impact
                </h3>
                <div className="flex gap-2">
                  <div className={`flex-1 p-2 rounded-lg border ${getPillarBg('content')}`}>
                    <p className={`text-[10px] font-medium ${getPillarColor('content')}`}>Content</p>
                    <p className="text-[10px] text-white/40">Primary</p>
                  </div>
                  <div className={`flex-1 p-2 rounded-lg border ${getPillarBg('pr')}`}>
                    <p className={`text-[10px] font-medium ${getPillarColor('pr')}`}>PR</p>
                    <p className="text-[10px] text-white/40">Downstream</p>
                  </div>
                  <div className={`flex-1 p-2 rounded-lg border ${getPillarBg('seo')}`}>
                    <p className={`text-[10px] font-medium ${getPillarColor('seo')}`}>SEO</p>
                    <p className="text-[10px] text-white/40">Downstream</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-4 px-5 py-3 bg-slate-2">
          <p className="text-[10px] text-white/40 text-center">
            Explainability per UX Continuity Canon §6 • AUTOMATE Execution Model
          </p>
        </div>
      </div>
    </>
  );
}

export default ExplainabilityDrawer;
