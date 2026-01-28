/**
 * Orchestration Editor Shell - 3-Pane Layout
 *
 * Phase 6A.2: The execution-focused orchestration surface.
 * NOT a content generator - an authority orchestration terminal.
 *
 * Layout:
 * - Strategic Anchor (left, 3 cols): Trigger context, entity checklist, confidence
 * - Living Canvas (center, 6 cols): Editor area with phantom writing support
 * - AEO Audit (right, 3 cols): AI profiles, schema preview, CiteMind status
 *
 * INVARIANT COMPLIANCE:
 * - Mode-Driven (§5): Mode indicator always visible, affects pane behavior
 * - Explainability (§6): Explain drawer accessible from header
 * - Progress Feedback (§8): Pane states communicate progress
 * - Density & Focus (§9): Focused layout during execution
 *
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { motion, citeMindStatus as citeMindTokens, surface, border, label as labelClass } from '../tokens';
import type { AutomationMode, CiteMindStatus } from '../types';
import { ModeSelector, ModeBehaviorBanner } from './ModeSelector';
import {
  type AIPerceptualState,
  deriveAIPerceptualState,
  AI_PERCEPTUAL_SIGNALS,
} from '../ai-perception';
import { AmbientAIIndicator, AIProgressIndicator } from '../components/AIStateIndicator';

// ============================================
// MICRO-INTERACTION HOOKS (Phase 6A.6)
// ============================================

/**
 * Hook for save flash micro-interaction.
 * Provides visual feedback when content is saved.
 */
function useSaveFlash() {
  const [showFlash, setShowFlash] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFlash = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowFlash(true);
    timeoutRef.current = setTimeout(() => {
      setShowFlash(false);
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { showFlash, triggerFlash };
}

/**
 * Hook for tracking entity state changes for animations.
 */
function useEntityStateTransitions(items: EntityChecklistItem[]) {
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());
  const prevItemsRef = useRef<EntityChecklistItem[]>(items);

  useEffect(() => {
    const newlyChanged = new Set<string>();

    items.forEach((item) => {
      const prevItem = prevItemsRef.current.find(p => p.id === item.id);
      if (prevItem && prevItem.state !== item.state) {
        newlyChanged.add(item.id);
      }
    });

    let timer: NodeJS.Timeout | undefined;

    if (newlyChanged.size > 0) {
      setRecentlyChanged(newlyChanged);
      timer = setTimeout(() => {
        setRecentlyChanged(new Set());
      }, 600);
    }

    prevItemsRef.current = items;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [items]);

  return recentlyChanged;
}

/**
 * Hook for mode change pulse animation.
 */
function useModeChangePulse(currentMode: AutomationMode) {
  const [showPulse, setShowPulse] = useState(false);
  const prevModeRef = useRef(currentMode);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (prevModeRef.current !== currentMode) {
      setShowPulse(true);
      timer = setTimeout(() => {
        setShowPulse(false);
      }, 500);
      prevModeRef.current = currentMode;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentMode]);

  return showPulse;
}

// ============================================
// TYPES
// ============================================

export interface TriggerAction {
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

export interface EntityChecklistItem {
  id: string;
  entity: string;
  state: 'missing' | 'mentioned' | 'satisfied';
  requiredMentions?: number;
  currentMentions?: number;
}

export interface TargetAIProfile {
  id: string;
  name: string;
  icon?: ReactNode;
  coverage: number; // 0-100
  status: 'optimal' | 'partial' | 'poor';
}

export interface OrchestrationEditorShellProps {
  /** The action context that triggered this editor session */
  action: TriggerAction;
  /** Current automation mode (may be lower than ceiling) */
  currentMode: AutomationMode;
  /** Handler for mode change */
  onModeChange?: (mode: AutomationMode) => void;
  /** Back navigation handler */
  onBack: () => void;
  /** Save draft handler */
  onSaveDraft?: () => void;
  /** Complete action handler */
  onComplete?: () => void;
  /** Explain drawer toggle handler */
  onExplainToggle?: () => void;
  /** Entity checklist items */
  entityChecklist?: EntityChecklistItem[];
  /** Target AI profiles for AEO */
  targetProfiles?: TargetAIProfile[];
  /** Schema preview content */
  schemaPreview?: string;
  /** Children rendered in Living Canvas area */
  children?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Whether editor has unsaved changes */
  hasUnsavedChanges?: boolean;
}

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

function getActionTypeIcon(type: TriggerAction['type']): ReactNode {
  switch (type) {
    case 'brief_execution':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'derivative_generation':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case 'authority_optimization':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    default:
      return null;
  }
}

function getPriorityTokens(priority: TriggerAction['priority']) {
  switch (priority) {
    case 'urgent':
      return { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', border: 'border-semantic-danger/20', label: 'Urgent' };
    case 'high':
      return { bg: 'bg-semantic-warning/10', text: 'text-semantic-warning', border: 'border-semantic-warning/20', label: 'High' };
    default:
      return { bg: 'bg-slate-4', text: 'text-white/50', border: 'border-slate-5', label: 'Normal' };
  }
}

function getEntityStateTokens(state: EntityChecklistItem['state']) {
  switch (state) {
    case 'satisfied':
      return { bg: 'bg-semantic-success/10', text: 'text-semantic-success', icon: '✓' };
    case 'mentioned':
      return { bg: 'bg-semantic-warning/10', text: 'text-semantic-warning', icon: '○' };
    default:
      return { bg: 'bg-slate-4', text: 'text-white/40', icon: '—' };
  }
}

function getProfileStatusTokens(status: TargetAIProfile['status']) {
  switch (status) {
    case 'optimal':
      return { bg: 'bg-semantic-success/10', text: 'text-semantic-success' };
    case 'partial':
      return { bg: 'bg-semantic-warning/10', text: 'text-semantic-warning' };
    default:
      return { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger' };
  }
}


// ============================================
// TRIGGER CARD COMPONENT
// ============================================

interface TriggerCardProps {
  action: TriggerAction;
}

function TriggerCard({ action }: TriggerCardProps) {
  const citeMindConfig = citeMindTokens[action.citeMindStatus];
  const priorityConfig = getPriorityTokens(action.priority);

  return (
    <div className={`${surface.panel} border ${border.subtle} rounded-lg p-3`}>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-iris/10">
            {getActionTypeIcon(action.type)}
          </div>
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${priorityConfig.bg} ${priorityConfig.text}`}>
            {priorityConfig.label}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${citeMindConfig.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${citeMindConfig.dot}`} />
          <span className={`text-[10px] font-medium ${citeMindConfig.text}`}>{action.citeMindStatus}</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-white mb-2 line-clamp-2">{action.title}</p>

      {/* Context Details */}
      <div className="space-y-1">
        <p className="text-[10px] text-white/40">
          {getActionTypeLabel(action.type)}
        </p>
        {action.sourceContext.keyword && (
          <p className="text-[10px] text-white/50">
            <span className="text-white/30">Target:</span> {action.sourceContext.keyword}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// ENTITY CHECKLIST COMPONENT
// ============================================

interface EntityChecklistProps {
  items: EntityChecklistItem[];
}

function EntityChecklist({ items }: EntityChecklistProps) {
  const recentlyChanged = useEntityStateTransitions(items);

  if (items.length === 0) return null;

  const satisfiedCount = items.filter(i => i.state === 'satisfied').length;
  const progress = Math.round((satisfiedCount / items.length) * 100);

  return (
    <div className={`${surface.panel} border ${border.subtle} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={labelClass}>Entity Checklist</h4>
        <span className="text-[10px] text-brand-iris font-medium">{progress}%</span>
      </div>

      {/* Progress bar with smooth transition */}
      <div className="h-1 bg-slate-4 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full bg-brand-iris rounded-full ${motion.transition.base}`}
          style={{ width: `${progress}%`, transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </div>

      {/* Checklist items with state change animations */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const stateTokens = getEntityStateTokens(item.state);
          const isJustChanged = recentlyChanged.has(item.id);
          return (
            <div
              key={item.id}
              className={`
                flex items-center justify-between px-2 py-1.5 rounded ${stateTokens.bg} ${motion.transition.fast}
                ${isJustChanged ? 'ring-2 ring-brand-iris/40 animate-[pulse_0.6s_ease-out]' : ''}
              `}
              style={{
                transition: 'background-color 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${stateTokens.text} ${isJustChanged ? 'scale-125' : ''}`}
                  style={{ transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  {stateTokens.icon}
                </span>
                <span className={`text-xs ${item.state === 'satisfied' ? 'text-white/80' : 'text-white/50'}`}>
                  {item.entity}
                </span>
              </div>
              {item.requiredMentions && (
                <span className={`text-[10px] ${isJustChanged ? 'text-brand-iris' : 'text-white/30'}`}>
                  {item.currentMentions ?? 0}/{item.requiredMentions}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// AEO PROFILES COMPONENT
// ============================================

interface AEOProfilesProps {
  profiles: TargetAIProfile[];
}

function AEOProfiles({ profiles }: AEOProfilesProps) {
  return (
    <div className={`${surface.panel} border ${border.subtle} rounded-lg p-3`}>
      <h4 className={`${labelClass} mb-3`}>Target AI Profiles</h4>
      <div className="space-y-2">
        {profiles.map((profile) => {
          const statusTokens = getProfileStatusTokens(profile.status);
          return (
            <div key={profile.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">{profile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-slate-4 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusTokens.bg.replace('/10', '')}`}
                    style={{ width: `${profile.coverage}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${statusTokens.text}`}>
                  {profile.coverage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SCHEMA PREVIEW COMPONENT
// ============================================

interface SchemaPreviewProps {
  schema?: string;
}

function SchemaPreview({ schema }: SchemaPreviewProps) {
  return (
    <div className={`${surface.panel} border ${border.subtle} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={labelClass}>Schema Preview</h4>
        <span className="text-[10px] text-white/30">JSON-LD</span>
      </div>
      <div className="bg-slate-1 rounded p-2 max-h-32 overflow-y-auto">
        <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap">
          {schema || '{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "...\n}'}
        </pre>
      </div>
    </div>
  );
}

// ============================================
// CITEMIND STATUS COMPONENT
// ============================================

interface CiteMindStatusPanelProps {
  status: CiteMindStatus;
  issues?: Array<{ type: string; message: string }>;
}

function CiteMindStatusPanel({ status, issues = [] }: CiteMindStatusPanelProps) {
  const config = citeMindTokens[status];

  return (
    <div className={`${surface.panel} border ${border.subtle} rounded-lg p-3`}>
      <h4 className={`${labelClass} mb-2`}>CiteMind Status</h4>
      <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${config.bg} border ${config.border}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`text-xs font-medium ${config.text} capitalize`}>{status}</span>
      </div>

      {issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {issues.slice(0, 3).map((issue, i) => (
            <p key={i} className="text-[10px] text-semantic-warning/80 flex items-start gap-1.5">
              <span>⚠</span>
              <span>{issue.message}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN SHELL COMPONENT
// ============================================

export function OrchestrationEditorShell({
  action,
  currentMode,
  onModeChange,
  onBack,
  onSaveDraft,
  onComplete,
  onExplainToggle,
  entityChecklist = [],
  targetProfiles = [],
  schemaPreview,
  children,
  isLoading = false,
  hasUnsavedChanges = false,
}: OrchestrationEditorShellProps) {
  const [isLeftPaneCollapsed, setIsLeftPaneCollapsed] = useState(false);
  const [isRightPaneCollapsed, setIsRightPaneCollapsed] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Micro-interaction hooks (Phase 6A.6)
  const { showFlash, triggerFlash } = useSaveFlash();
  const showModePulse = useModeChangePulse(currentMode);

  // Derive AI perceptual state for ambient indicator (Phase 9A)
  const aiState = useMemo((): AIPerceptualState => {
    return deriveAIPerceptualState({
      isLoading,
      citeMindStatus: action.citeMindStatus,
      isActionReady: action.citeMindStatus === 'passed',
      isExecuting: isCompleting,
      isSaving,
      priority: action.priority === 'urgent' ? 'critical' : action.priority === 'high' ? 'high' : 'medium',
      mode: currentMode,
    });
  }, [isLoading, action.citeMindStatus, action.priority, isCompleting, isSaving, currentMode]);

  // Handle mode change (only if handler provided)
  const handleModeChange = (newMode: AutomationMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Handle save with flash feedback and AI state tracking (Phase 9A)
  const handleSaveDraft = useCallback(() => {
    if (onSaveDraft) {
      setIsSaving(true);
      onSaveDraft();
      triggerFlash();
      // Reset saving state after brief delay
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [onSaveDraft, triggerFlash]);

  // Handle complete - triggers immediate completion with AI state feedback (Phase 9A)
  // Removed theatrical delay per AI_VISUAL_COMMUNICATION_CANON §7.2
  const handleComplete = useCallback(() => {
    setIsCompleting(true);
    // Execute immediately - AI state indicator shows "executing" state
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-slate-0 flex flex-col relative">
      {/*
       * Phase 9A: Removed theatrical overlays per AI_VISUAL_COMMUNICATION_CANON §7.2
       *
       * Previous: Full-screen save flash overlay + completion overlay with pulsing checkmark
       * These violated §7.2: "Celebratory animations for routine completions"
       *
       * Current: Proportional inline feedback via:
       * - Save: Button text changes to "Saved" with subtle checkmark (line ~660)
       * - Complete: AI state indicator shows "executing" state (header ambient indicator)
       *
       * This maintains Progress Feedback Invariant (§8) while avoiding theatrical motion.
       */}

      {/* Header */}
      <header className="border-b border-[#1A1A24] bg-gradient-to-b from-slate-1 to-transparent shrink-0">
        <div className="px-6 py-3">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center justify-between">
              {/* Left: Back + Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className={`p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 ${motion.transition.fast}`}
                  aria-label="Back to Content"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>

                <div className="p-2 rounded-xl bg-brand-iris/10 ring-1 ring-brand-iris/20">
                  <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-semibold text-white tracking-tight truncate">
                      Orchestration Editor
                    </h1>
                    {hasUnsavedChanges && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-semantic-warning/10 text-semantic-warning rounded">
                        Unsaved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 truncate max-w-md">{action.title}</p>
                </div>
              </div>

              {/* Right: AI State + Mode + Actions */}
              <div className="flex items-center gap-2">
                {/* Ambient AI State Indicator (Phase 9A) */}
                <AmbientAIIndicator state={aiState} size="md" showLabel />

                {/* Mode Selector (with ceiling enforcement + pulse effect) */}
                <div className={`relative ${showModePulse ? 'animate-[pulse_0.5s_ease-out]' : ''}`}>
                  <ModeSelector
                    currentMode={currentMode}
                    modeCeiling={action.modeCeiling}
                    onModeChange={handleModeChange}
                    disabled={!onModeChange}
                  />
                  {showModePulse && (
                    <div
                      className="absolute inset-0 rounded-lg ring-2 ring-brand-iris/50 pointer-events-none"
                      style={{ animation: 'fadeOut 0.5s ease-out forwards' }}
                    />
                  )}
                </div>

                {/* Explain Button */}
                <button
                  type="button"
                  onClick={onExplainToggle}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-lg ${motion.transition.fast}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Explain
                </button>

                {/* Save Draft with flash feedback */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!hasUnsavedChanges}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg ${motion.transition.fast} ${
                    hasUnsavedChanges
                      ? 'text-white/70 bg-slate-4 hover:bg-slate-5'
                      : 'text-white/30 bg-slate-4/50 cursor-not-allowed'
                  }`}
                >
                  {showFlash ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  ) : (
                    'Save Draft'
                  )}
                </button>

                {/* Complete Action with animation */}
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className={`px-4 py-1.5 bg-brand-iris text-white text-xs font-medium rounded-lg hover:bg-brand-iris/90 shadow-[0_0_20px_rgba(168,85,247,0.20)] ${motion.transition.fast} ${
                    isCompleting ? 'opacity-70 cursor-wait' : ''
                  }`}
                >
                  {isCompleting ? 'Completing...' : 'Complete Action'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Strategic Anchor */}
        <aside
          className={`
            shrink-0 border-r border-[#1A1A24] bg-slate-0 overflow-y-auto
            ${motion.transition.slow}
            ${isLeftPaneCollapsed ? 'w-10' : 'w-72 xl:w-80'}
          `}
        >
          {isLeftPaneCollapsed ? (
            <button
              onClick={() => setIsLeftPaneCollapsed(false)}
              className="w-full h-full flex items-center justify-center text-white/40 hover:text-brand-iris"
              aria-label="Expand Strategic Anchor"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="p-4 space-y-4">
              {/* Pane Header */}
              <div className="flex items-center justify-between">
                <h2 className={labelClass}>Strategic Anchor</h2>
                <button
                  onClick={() => setIsLeftPaneCollapsed(true)}
                  className="p-1 text-white/30 hover:text-white/60 rounded"
                  aria-label="Collapse"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* Trigger Card */}
              <TriggerCard action={action} />

              {/* Entity Checklist */}
              {entityChecklist.length > 0 && (
                <EntityChecklist items={entityChecklist} />
              )}

              {/* Placeholder if no checklist */}
              {entityChecklist.length === 0 && (
                <div className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
                  <p className="text-[10px] text-white/30 text-center">
                    Entity checklist will populate from brief
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Center Pane: Living Canvas */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col bg-slate-0">
          {/* Canvas Header with AI Progress (Phase 9A) */}
          <div className="px-4 py-2 border-b border-[#1A1A24] bg-slate-1/30 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className={labelClass}>Living Canvas</h2>
              {/* AI state label for evaluating/executing */}
              {(aiState === 'evaluating' || aiState === 'executing') && (
                <div className="flex items-center gap-2">
                  <span className={`
                    w-2 h-2 rounded-full
                    ${AI_PERCEPTUAL_SIGNALS[aiState].indicator}
                    ${AI_PERCEPTUAL_SIGNALS[aiState].motion}
                  `} />
                  <span className={`text-[10px] ${AI_PERCEPTUAL_SIGNALS[aiState].text}`}>
                    {aiState === 'evaluating' ? 'AI analyzing...' : 'Saving...'}
                  </span>
                </div>
              )}
            </div>
            {/* AI Progress Indicator (Phase 9A) */}
            <AIProgressIndicator state={aiState} className="mt-2" />
          </div>

          {/* Mode Behavior Banner */}
          <div className="px-4 pt-3 pb-0">
            <ModeBehaviorBanner mode={currentMode} isActive />
          </div>

          {/* Canvas Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children || (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-iris/10 border border-brand-iris/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/60">Editor content area</p>
                  <p className="text-xs text-white/30 mt-1">Phase 6A.4: Minimal editor implementation</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Pane: AEO Audit */}
        <aside
          className={`
            shrink-0 border-l border-[#1A1A24] bg-slate-0 overflow-y-auto
            ${motion.transition.slow}
            ${isRightPaneCollapsed ? 'w-10' : 'w-72 xl:w-80'}
          `}
        >
          {isRightPaneCollapsed ? (
            <button
              onClick={() => setIsRightPaneCollapsed(false)}
              className="w-full h-full flex items-center justify-center text-white/40 hover:text-brand-iris"
              aria-label="Expand AEO Audit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="p-4 space-y-4">
              {/* Pane Header */}
              <div className="flex items-center justify-between">
                <h2 className={labelClass}>AEO Audit</h2>
                <button
                  onClick={() => setIsRightPaneCollapsed(true)}
                  className="p-1 text-white/30 hover:text-white/60 rounded"
                  aria-label="Collapse"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Target AI Profiles */}
              {targetProfiles.length > 0 ? (
                <AEOProfiles profiles={targetProfiles} />
              ) : (
                <div className={`${surface.panel} border ${border.subtle} rounded-lg p-3`}>
                  <h4 className={`${labelClass} mb-2`}>Target AI Profiles</h4>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 text-[10px] bg-slate-4 text-white/50 rounded">ChatGPT</span>
                    <span className="px-2 py-1 text-[10px] bg-slate-4 text-white/50 rounded">Gemini</span>
                    <span className="px-2 py-1 text-[10px] bg-slate-4 text-white/50 rounded">Perplexity</span>
                  </div>
                </div>
              )}

              {/* Schema Preview */}
              <SchemaPreview schema={schemaPreview} />

              {/* CiteMind Status */}
              <CiteMindStatusPanel status={action.citeMindStatus} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default OrchestrationEditorShell;
