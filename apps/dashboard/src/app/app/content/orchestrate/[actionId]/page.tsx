/**
 * Content Orchestration Editor
 *
 * Phase 6A: Golden-path orchestration surface for content authority building.
 * This is an execution-focused editor, NOT a blank-page content generator.
 *
 * INVARIANT COMPLIANCE:
 * - Entry Point (§4): Context-required entry - no blank editor
 * - Mode-Driven (§5): Mode ceiling enforced by action type
 * - Explainability (§6): 3-level explain drawer (Phase 6A.5)
 * - Progress Feedback (§8): Micro-interactions for state changes (Phase 6A.6)
 *
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

'use client';

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { modeTokens, motion, citeMindStatus as citeMindTokens, surface, border, text } from '@/components/content/tokens';
import type { AutomationMode, CiteMindStatus } from '@/components/content/types';

// ============================================
// TYPES
// ============================================

interface TriggerAction {
  id: string;
  title: string;
  type: 'brief_execution' | 'derivative_generation' | 'authority_optimization';
  sourceContext: {
    briefId?: string;
    briefTitle?: string;
    assetId?: string;
    assetTitle?: string;
    keyword?: string;
  };
  modeCeiling: AutomationMode;
  citeMindStatus: CiteMindStatus;
  pillar: 'content';
  priority: 'urgent' | 'high' | 'normal';
  createdAt: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_TRIGGER_ACTIONS: Record<string, TriggerAction> = {
  'action-1': {
    id: 'action-1',
    title: 'Execute Brief: AI-Powered Content Creation Guide',
    type: 'brief_execution',
    sourceContext: {
      briefId: 'brief-1',
      briefTitle: 'AI-Powered Content Creation Guide',
      keyword: 'AI content creation',
    },
    modeCeiling: 'copilot',
    citeMindStatus: 'passed',
    pillar: 'content',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  'action-2': {
    id: 'action-2',
    title: 'Generate Derivatives: Marketing Automation Guide',
    type: 'derivative_generation',
    sourceContext: {
      assetId: 'asset-1',
      assetTitle: 'Ultimate Guide to Marketing Automation',
    },
    modeCeiling: 'copilot',
    citeMindStatus: 'analyzing',
    pillar: 'content',
    priority: 'normal',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  'action-3': {
    id: 'action-3',
    title: 'Optimize Authority: Content Strategy Best Practices',
    type: 'authority_optimization',
    sourceContext: {
      assetId: 'asset-2',
      assetTitle: 'Content Strategy Best Practices for 2024',
    },
    modeCeiling: 'manual',
    citeMindStatus: 'warning',
    pillar: 'content',
    priority: 'urgent',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getActionTypeLabel(type: TriggerAction['type']): string {
  switch (type) {
    case 'brief_execution':
      return 'Brief Execution';
    case 'derivative_generation':
      return 'Derivative Generation';
    case 'authority_optimization':
      return 'Authority Optimization';
    default:
      return 'Unknown';
  }
}

function getPriorityTokens(priority: TriggerAction['priority']) {
  switch (priority) {
    case 'urgent':
      return { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', border: 'border-semantic-danger/20' };
    case 'high':
      return { bg: 'bg-semantic-warning/10', text: 'text-semantic-warning', border: 'border-semantic-warning/20' };
    default:
      return { bg: 'bg-slate-4', text: 'text-white/50', border: 'border-slate-5' };
  }
}

// ============================================
// MODE ICON COMPONENT
// ============================================

function ModeIcon({ mode, className = 'w-4 h-4' }: { mode: AutomationMode; className?: string }) {
  if (mode === 'manual') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  }
  if (mode === 'copilot') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

// ============================================
// CONTEXT REQUIRED EMPTY STATE
// ============================================

interface ContextRequiredEmptyStateProps {
  onNavigateBack: () => void;
}

function ContextRequiredEmptyState({ onNavigateBack }: ContextRequiredEmptyStateProps) {
  return (
    <div className="min-h-screen bg-slate-0 flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-iris/10 border border-brand-iris/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-white mb-2">Context Required</h1>

        {/* Explanation */}
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          The Orchestration Editor requires an action context to begin.
          Start from the Content Overview and select an action from Today&apos;s Work.
        </p>

        {/* Explainability hint */}
        <div className="bg-slate-2 border border-slate-4 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-brand-cyan/10">
              <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-white/80 mb-1">Why context is required</p>
              <p className="text-xs text-white/50 leading-relaxed">
                Pravado is an orchestration platform, not a content generator.
                Each editing session is tied to a strategic action that feeds your authority signals.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNavigateBack}
          className={`
            inline-flex items-center gap-2 px-5 py-2.5
            bg-brand-iris text-white text-sm font-medium rounded-lg
            hover:bg-brand-iris/90 shadow-[0_0_20px_rgba(168,85,247,0.20)]
            ${motion.transition.fast}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go to Content Overview
        </button>
      </div>
    </div>
  );
}

// ============================================
// TRIGGER CARD (Context Display)
// ============================================

interface TriggerCardProps {
  action: TriggerAction;
}

function TriggerCard({ action }: TriggerCardProps) {
  const modeConfig = modeTokens[action.modeCeiling];
  const citeMindConfig = citeMindTokens[action.citeMindStatus];
  const priorityConfig = getPriorityTokens(action.priority);

  return (
    <div className={`${surface.panel} border ${border.subtle} rounded-lg p-4`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${priorityConfig.bg} ${priorityConfig.text}`}>
            {action.priority}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${citeMindConfig.bg} ${citeMindConfig.text}`}>
            CiteMind: {action.citeMindStatus}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${modeConfig.bg} ${modeConfig.border}`}>
          <ModeIcon mode={action.modeCeiling} className="w-3.5 h-3.5" />
          <span className={`text-xs font-medium ${modeConfig.text}`}>{modeConfig.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white mb-2">{action.title}</h3>

      {/* Context Details */}
      <div className="space-y-1.5">
        <p className={`text-xs ${text.muted}`}>
          <span className="text-white/40">Type:</span> {getActionTypeLabel(action.type)}
        </p>
        {action.sourceContext.briefTitle && (
          <p className={`text-xs ${text.muted}`}>
            <span className="text-white/40">Brief:</span> {action.sourceContext.briefTitle}
          </p>
        )}
        {action.sourceContext.assetTitle && (
          <p className={`text-xs ${text.muted}`}>
            <span className="text-white/40">Asset:</span> {action.sourceContext.assetTitle}
          </p>
        )}
        {action.sourceContext.keyword && (
          <p className={`text-xs ${text.muted}`}>
            <span className="text-white/40">Target Keyword:</span> {action.sourceContext.keyword}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// ORCHESTRATION EDITOR SHELL (Placeholder)
// ============================================

interface OrchestrationEditorShellProps {
  action: TriggerAction;
  onBack: () => void;
}

function OrchestrationEditorShell({ action, onBack }: OrchestrationEditorShellProps) {
  const modeConfig = modeTokens[action.modeCeiling];

  return (
    <div className="min-h-screen bg-slate-0">
      {/* Header */}
      <div className="border-b border-[#1A1A24] bg-gradient-to-b from-slate-1 to-transparent">
        <div className="px-6 py-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
              {/* Left: Back + Title */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className={`p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 ${motion.transition.fast}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="p-2.5 rounded-xl bg-brand-iris/10 ring-1 ring-brand-iris/20">
                  <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white tracking-tight">Orchestration Editor</h1>
                  <p className="text-xs text-white/50">{action.title}</p>
                </div>
              </div>

              {/* Right: Mode + Actions */}
              <div className="flex items-center gap-3">
                {/* Mode Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${modeConfig.bg} ${modeConfig.border}`}>
                  <ModeIcon mode={action.modeCeiling} className="w-3.5 h-3.5" />
                  <span className={`text-xs font-medium ${modeConfig.text}`}>{modeConfig.label}</span>
                </div>

                {/* Explain Button */}
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Explain
                </button>

                {/* Save Draft */}
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white/70 bg-slate-4 hover:bg-slate-5 rounded-lg transition-colors"
                >
                  Save Draft
                </button>

                {/* Complete Action */}
                <button
                  type="button"
                  className="px-4 py-2 bg-brand-iris text-white text-sm font-medium rounded-lg hover:bg-brand-iris/90 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.20)]"
                >
                  Complete Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Pane Layout Placeholder (Phase 6A.2) */}
      <div className="px-6 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-12 gap-4" style={{ minHeight: 'calc(100vh - 160px)' }}>
            {/* Left Pane: Strategic Anchor (3 cols) */}
            <div className="col-span-3 bg-slate-2 border border-slate-4 rounded-lg p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Strategic Anchor</h2>
              <TriggerCard action={action} />

              {/* Placeholder for additional strategic context */}
              <div className="mt-4 p-3 bg-slate-1 border border-slate-4 rounded-lg">
                <p className="text-xs text-white/40 text-center">
                  Entity checklist & AEO targets will appear here (Phase 6A.4)
                </p>
              </div>
            </div>

            {/* Center Pane: Living Canvas (6 cols) */}
            <div className="col-span-6 bg-slate-2 border border-slate-4 rounded-lg p-4 flex flex-col">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Living Canvas</h2>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-iris/10 border border-brand-iris/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/70 font-medium mb-1">Editor Coming Soon</p>
                  <p className="text-xs text-white/40">
                    Minimal editor with phantom writing (Phase 6A.4)
                  </p>
                </div>
              </div>
            </div>

            {/* Right Pane: AEO Audit (3 cols) */}
            <div className="col-span-3 bg-slate-2 border border-slate-4 rounded-lg p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">AEO Audit</h2>
              <div className="space-y-3">
                {/* AI Profiles Placeholder */}
                <div className="p-3 bg-slate-1 border border-slate-4 rounded-lg">
                  <p className="text-xs text-white/40 mb-2">Target AI Profiles</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-[10px] bg-slate-4 text-white/50 rounded">ChatGPT</span>
                    <span className="px-2 py-1 text-[10px] bg-slate-4 text-white/50 rounded">Gemini</span>
                    <span className="px-2 py-1 text-[10px] bg-slate-4 text-white/50 rounded">Perplexity</span>
                  </div>
                </div>

                {/* Schema Preview Placeholder */}
                <div className="p-3 bg-slate-1 border border-slate-4 rounded-lg">
                  <p className="text-xs text-white/40 mb-2">Schema Preview</p>
                  <p className="text-[10px] text-white/30 font-mono">
                    JSON-LD preview (Phase 6A.4)
                  </p>
                </div>

                {/* CiteMind Status */}
                <div className="p-3 bg-slate-1 border border-slate-4 rounded-lg">
                  <p className="text-xs text-white/40 mb-2">CiteMind Status</p>
                  <div className={`flex items-center gap-2 ${citeMindTokens[action.citeMindStatus].text}`}>
                    <span className={`w-2 h-2 rounded-full ${citeMindTokens[action.citeMindStatus].dot}`} />
                    <span className="text-xs font-medium capitalize">{action.citeMindStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ContentOrchestratePage() {
  const params = useParams();
  const router = useRouter();
  const actionId = params?.actionId as string | undefined;

  const [action, setAction] = useState<TriggerAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Fetch action context (mock for now)
  useEffect(() => {
    if (!actionId) {
      setAction(null);
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    // Simulate API fetch delay
    const timer = setTimeout(() => {
      const foundAction = MOCK_TRIGGER_ACTIONS[actionId];
      if (foundAction) {
        setAction(foundAction);
        setNotFound(false);
      } else {
        setAction(null);
        setNotFound(true);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [actionId]);

  const handleNavigateBack = () => {
    router.push('/app/content');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-0 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-brand-iris/30 border-t-brand-iris rounded-full animate-spin" />
          <span className="text-sm text-white/50">Loading action context...</span>
        </div>
      </div>
    );
  }

  // Context required (not found)
  if (notFound || !action) {
    return <ContextRequiredEmptyState onNavigateBack={handleNavigateBack} />;
  }

  // Render orchestration editor
  return <OrchestrationEditorShell action={action} onBack={handleNavigateBack} />;
}
