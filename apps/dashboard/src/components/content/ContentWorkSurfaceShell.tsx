'use client';

/**
 * Content Work Surface Shell - DS v3.0
 *
 * Main container with tab navigation matching PR/Command Center design language.
 * Premium, AI-first aesthetic with strong visual hierarchy.
 *
 * FEATURES:
 * - Work Surface header block with mode indicator
 * - Explain drawer for page context
 * - DS3 tab styling with pillar accent (Iris)
 * - Full-page shell (no legacy sidebar)
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { ContentView, AutomationMode, ContentType, CreationContentType, OutlineSection, EditorInitData } from './types';

import { modeTokens } from './tokens';
import { ContentCreationOverlay } from './creation/ContentCreationOverlay';
import { CommandCenterTopbar } from '@/components/command-center/CommandCenterTopbar';
import {
  ClipboardText,
  Archive,
  CalendarBlank,
  ChartBar,
  Info,
  X,
  Plus,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Lock,
  User,
  Lightning,
  ClockCounterClockwise,
  TrendUp,
} from '@phosphor-icons/react';

// ============================================
// TYPES
// ============================================

export interface ContentWorkSurfaceShellProps {
  /** Main content area (children) */
  children: ReactNode;
  /** Optional right rail content */
  rightRailContent?: ReactNode;
  /** Whether to show right rail */
  showRightRail?: boolean;
  /** Current active view */
  activeView: ContentView;
  /** View change handler */
  onViewChange: (view: ContentView) => void;
  /** Current automation mode — affects tab labels and visibility */
  mode?: AutomationMode;
  /** AI status for header dot */
  aiStatus?: 'idle' | 'analyzing' | 'generating';
  /** Content creation handler - called when user selects a content type from Create dropdown */
  onCreateContent?: (contentType: ContentType) => void;
  /** Mode change handler - called when user selects a mode from mode switcher dropdown */
  onModeChange?: (mode: AutomationMode) => void;
  /** Editor mode — suppresses normal chrome bar, shows editor header */
  isEditorMode?: boolean;
  /** Current document title in editor (for chrome bar) */
  editorTitle?: string;
  /** Live word count from editor */
  editorWordCount?: number;
  /** Back from editor to content list */
  onEditorBack?: () => void;
  /** Called when creation flow fires "Open in Editor" */
  onEditorLaunch?: (initData: EditorInitData) => void;
  /** Registers a callback that the parent can invoke to open the creation overlay.
   *  stage=2 (default): pre-filled brief form from a SAGE proposal.
   *  stage=1: fresh overlay, no pre-fill (manual create path). */
  registerOpenCreation?: (fn: (briefData: Record<string, string>, contentType?: CreationContentType, stage?: 1 | 2) => void) => void;
}

// ============================================
// VIEW TAB CONFIG
// ============================================

interface ViewTabConfig {
  key: ContentView;
  label: string;
  icon: ReactNode;
  description: string;
  modeCeiling: AutomationMode;
}

const VIEW_TABS: ViewTabConfig[] = [
  {
    key: 'work-queue',
    label: 'Content',
    description: 'Create and manage your content',
    modeCeiling: 'copilot',
    icon: (
      <ClipboardText className="w-4 h-4" weight="regular" />
    ),
  },
  {
    key: 'library',
    label: 'Library',
    description: 'Content assets and derivatives',
    modeCeiling: 'copilot',
    icon: (
      <Archive className="w-4 h-4" weight="regular" />
    ),
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'Publication schedule and deadlines',
    modeCeiling: 'copilot',
    icon: (
      <CalendarBlank className="w-4 h-4" weight="regular" />
    ),
  },
  {
    key: 'insights',
    label: 'Insights',
    description: 'Performance and recommendations',
    modeCeiling: 'copilot',
    icon: (
      <ChartBar className="w-4 h-4" weight="regular" />
    ),
  },
];

// ============================================
// PAGE CONTEXT FOR EXPLAIN DRAWER
// ============================================

const PAGE_CONTEXT: Record<ContentView, { purpose: string; aiCapabilities: string[]; manualRequired: string[] }> = {
  'work-queue': {
    purpose: 'Create, edit, and manage your content. Write articles, manage status, and track progress.',
    aiCapabilities: [
      'Suggest content improvements',
      'Propose next best content action',
      'Generate derivative content',
    ],
    manualRequired: [
      'Approving proposed actions',
      'Publishing content',
    ],
  },
  library: {
    purpose: 'Browse, filter, and manage your content assets. Track derivatives and lifecycle status.',
    aiCapabilities: [
      'Run CiteMind quality checks',
      'Generate derivative content',
      'Calculate citation eligibility',
    ],
    manualRequired: [
      'Publishing content',
      'Editing content',
      'Deleting assets',
    ],
  },
  calendar: {
    purpose: 'Plan and schedule content publication. Visualize deadlines and coordinate with campaigns.',
    aiCapabilities: [
      'Suggest optimal publish windows',
      'Detect scheduling conflicts',
      'Forecast content velocity',
    ],
    manualRequired: [
      'Setting publication dates',
      'Creating calendar entries',
    ],
  },
  insights: {
    purpose: 'Deep dive into content performance. Understand what drives authority and visibility.',
    aiCapabilities: [
      'Analyze content patterns',
      'Generate recommendations',
      'Calculate EVI impact',
    ],
    manualRequired: [
      'Acting on recommendations routes to Library or Briefs',
    ],
  },
  editor: {
    purpose: 'Write and refine your content with CiteMind governance and inline AI assistance.',
    aiCapabilities: [
      'Suggest improvements inline',
      'Run CiteMind quality checks',
      'Generate derivative content',
    ],
    manualRequired: [
      'Writing and editing content',
      'Publishing final version',
    ],
  },
};

// ============================================
// MODE ICON COMPONENT
// ============================================

function ModeIcon({ mode }: { mode: AutomationMode }) {
  if (mode === 'manual') {
    return (
      <Lock className="w-3.5 h-3.5" weight="regular" />
    );
  }
  if (mode === 'copilot') {
    return (
      <User className="w-3.5 h-3.5" weight="regular" />
    );
  }
  return (
    <Lightning className="w-3.5 h-3.5" weight="regular" />
  );
}

// ============================================
// EXPLAIN DRAWER
// ============================================

interface ExplainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  view: ContentView;
}

function ExplainDrawer({ isOpen, onClose, view }: ExplainDrawerProps) {
  const context = PAGE_CONTEXT[view];
  const viewConfig = VIEW_TABS.find((t) => t.key === view);
  const modeConfig = modeTokens[viewConfig?.modeCeiling || 'manual'];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-0/80 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-slate-2 border-l border-slate-4 z-50 shadow-elev-3 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-2 border-b border-slate-4 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-iris/10">
              <Info className="w-5 h-5 text-brand-iris" weight="regular" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/95">Page Guide</h3>
              <p className="text-xs text-white/50">{viewConfig?.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-white/50" weight="regular" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Purpose */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">What This Page Is For</h4>
            <p className="text-sm text-white/85 leading-relaxed">{context.purpose}</p>
          </div>

          {/* Mode Ceiling */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Automation Mode</h4>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${modeConfig.bg} ${modeConfig.border}`}>
              <ModeIcon mode={viewConfig?.modeCeiling || 'manual'} />
              <span className={`text-sm font-medium ${modeConfig.text}`}>{modeConfig.label}</span>
              <span className="text-xs text-white/50 ml-auto">{modeConfig.description}</span>
            </div>
          </div>

          {/* AI Capabilities */}
          {context.aiCapabilities.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">What AI Can Do Here</h4>
              <ul className="space-y-2">
                {context.aiCapabilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" weight="regular" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Manual Required */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">What Requires Your Approval</h4>
            <ul className="space-y-2">
              {context.manualRequired.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <Lock className="w-4 h-4 text-white/40 shrink-0 mt-0.5" weight="regular" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentWorkSurfaceShell({
  children,
  rightRailContent,
  showRightRail = false,
  activeView,
  onViewChange,
  mode,
  onCreateContent: _onCreateContent,
  onModeChange,
  isEditorMode = false,
  editorTitle = '',
  editorWordCount = 0,
  onEditorBack,
  onEditorLaunch,
  registerOpenCreation,
}: ContentWorkSurfaceShellProps) {
  void _onCreateContent; // Preserved for external callers; overlay handles creation now
  const [evi, setEvi] = useState<{ score: number; delta: number } | null>(null);

  useEffect(() => {
    fetch('/api/command-center/strategy-panel')
      .then(r => r.json())
      .then(d => {
        if (d.success !== false && d.evi) {
          setEvi({ score: d.evi.score, delta: d.evi.delta_7d });
        }
      })
      .catch(() => {});
  }, []);

  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // Creation overlay state
  const [isCreationOverlayOpen, setIsCreationOverlayOpen] = useState(false);
  const [creationStage, setCreationStage] = useState<1 | 2 | 3>(1);
  const [selectedContentType, setSelectedContentType] = useState<CreationContentType | null>(null);
  const [selectedSageBriefId, setSelectedSageBriefId] = useState<string | null>(null);
  const [briefFormData, setBriefFormData] = useState<Record<string, string>>({});
  const [generatedOutline, setGeneratedOutline] = useState<OutlineSection[] | null>(null);

  // Register imperative opener for parent to trigger creation overlay pre-filled
  useEffect(() => {
    registerOpenCreation?.((data, contentType, stage = 2) => {
      setBriefFormData(data);
      if (contentType) setSelectedContentType(contentType);
      setCreationStage(stage);
      setIsCreationOverlayOpen(true);
    });
  }, [registerOpenCreation]);

  // Autopilot Activity Log tab tracking
  const [isActivityLogActive, setIsActivityLogActive] = useState(false);

  useEffect(() => {
    if (mode !== 'autopilot' || activeView !== 'work-queue') {
      setIsActivityLogActive(false);
    }
  }, [mode, activeView]);

  const isTabActive = (tabKey: string) => {
    if (mode === 'autopilot' && tabKey === 'work-queue') return activeView === 'work-queue' && !isActivityLogActive;
    if (tabKey === 'activity-log') return isActivityLogActive;
    return activeView === tabKey;
  };

  const handleTabClick = (tabKey: string) => {
    if (tabKey === 'activity-log') {
      setIsActivityLogActive(true);
      onViewChange('work-queue');
    } else {
      setIsActivityLogActive(false);
      onViewChange(tabKey as ContentView);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const effectiveMode = mode || 'copilot';
  const currentModeTokens = modeTokens[effectiveMode];

  // Close creation overlay and reset all creation state
  const closeCreationOverlay = () => {
    setIsCreationOverlayOpen(false);
    setCreationStage(1);
    setSelectedContentType(null);
    setSelectedSageBriefId(null);
    setBriefFormData({});
    setGeneratedOutline(null);
  };

  const handleLaunchEditor = useCallback(
    (briefData: Record<string, string>, outline: OutlineSection[] | null) => {
      const initData: EditorInitData = {
        title: briefData.title || briefData.topic || 'Untitled',
        topic: briefData.topic || '',
        keyword: briefData.targetKeyword || '',
        audience: briefData.audience || '',
        tone: briefData.tone || '',
        contentType: selectedContentType,
        outline: outline ?? [],
      };
      closeCreationOverlay();
      onEditorLaunch?.(initData);
    },
    [selectedContentType, closeCreationOverlay, onEditorLaunch]
  );

  const createButtonClass = effectiveMode === 'manual'
    ? "flex items-center gap-2 px-4 py-1.5 bg-brand-iris text-white/95 text-sm font-semibold rounded-lg hover:bg-brand-iris/90 transition-colors shadow-[0_0_16px_rgba(168,85,247,0.25)]"
    : effectiveMode === 'copilot'
    ? "flex items-center gap-2 px-3 py-1.5 border border-white/15 text-white/60 text-sm font-medium rounded-lg hover:text-white/80 hover:border-white/25 hover:bg-white/5 transition-all"
    : "flex items-center gap-2 px-3 py-1.5 text-white/50 text-sm font-medium rounded-lg hover:text-white/70 hover:bg-white/5 transition-all";

  // DS v3 palette tokens (per DS_v3_1_EXPRESSION.md)
  // dark-bg: #0A0A0F (slate-0), dark-card: #13131A (slate-2), dark-border: #1F1F28
  return (
    <div className="h-screen bg-slate-0 flex flex-col overflow-hidden">
      {/* Global topbar navigation — same as CC/Calendar/Analytics */}
      <CommandCenterTopbar />

      {/* Unified chrome bar — 48px, replaces header + tabs + ImpactStrip */}
      <div className="flex items-center h-12 px-4 border-b border-border-subtle bg-slate-1 shrink-0 relative z-[60]">
        {isCreationOverlayOpen ? (
          <>
            {/* === CREATION FLOW HEADER — replaces normal chrome bar === */}

            {/* Left: back arrow (stages 2+) + title + divider */}
            {creationStage > 1 && (
              <button
                type="button"
                onClick={() => setCreationStage((creationStage - 1) as 1 | 2 | 3)}
                className="p-1.5 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors mr-2"
              >
                <CaretLeft className="w-4 h-4" weight="regular" />
              </button>
            )}
            <span className="text-sm font-semibold text-white/90 shrink-0">New Content</span>
            <div className="w-px h-4 bg-white/10 mx-3 shrink-0" />

            {/* Center: step pills */}
            <div className="flex-1 flex items-center justify-center gap-2">
              {(['Type', 'Brief', 'Outline'] as const).map((label, i) => {
                const stepNum = (i + 1) as 1 | 2 | 3;
                const isActive = stepNum === creationStage;
                return (
                  <span
                    key={label}
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
                      isActive
                        ? 'bg-brand-iris/20 text-brand-iris border-brand-iris/30'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    Step {stepNum}/3
                  </span>
                );
              })}
            </div>

            {/* Right: close */}
            <button
              type="button"
              onClick={closeCreationOverlay}
              className="p-1.5 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
            >
              <X className="w-4 h-4" weight="regular" />
            </button>
          </>
        ) : isEditorMode ? (
          <>
            {/* === EDITOR CHROME BAR === */}

            {/* Left: back to content */}
            <button
              type="button"
              onClick={onEditorBack}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white/80 transition-colors"
            >
              <CaretLeft className="w-4 h-4" weight="regular" />
              Content
            </button>
            <div className="w-px h-4 bg-white/10 mx-3 shrink-0" />

            {/* Document title */}
            <span className="text-sm font-medium text-white/85 max-w-[300px] truncate">
              {editorTitle || 'Untitled'}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right: word count + CiteMind + Publish */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[13px] text-white/50 tabular-nums">
                {editorWordCount.toLocaleString()} words
              </span>
              <div className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-1.5 text-[13px] text-white/50">
                <span className="w-2 h-2 rounded-full bg-brand-iris" />
                <span className="tabular-nums">60</span>
              </span>
              <div className="w-px h-4 bg-white/10" />
              <button
                type="button"
                className="border border-white/15 text-white/60 text-sm px-3 py-1 rounded-lg hover:border-white/25 hover:bg-white/5 transition-all"
              >
                Publish
              </button>
            </div>
          </>
        ) : (
          <>
            {/* === NORMAL CHROME BAR === */}

            {/* Left cluster: pillar indicator + SAGE tag + divider + tabs */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-iris" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/40">Content</span>
            </div>
            <div className="w-px h-3.5 bg-white/10 mx-3 shrink-0" />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-iris/8 border border-brand-iris/15 shrink-0">
              <Lightning className="w-3 h-3 text-brand-iris/70" weight="fill" />
              <span className="text-[11px] font-semibold text-brand-iris/80 tracking-wide">SAGE ACTIVE</span>
            </div>
            <div className="w-px h-4 bg-white/10 mx-3 shrink-0" />

            {/* Tabs — mode-aware per MODE_UX_ARCHITECTURE §5B */}
            {VIEW_TABS
              .filter((tab) => {
                if (mode === 'autopilot' && tab.key === 'insights') return false;
                if (mode === 'autopilot' && tab.key === 'library') return false;
                return true;
              })
              .map((tab) => {
                const label = mode === 'autopilot' && tab.key === 'work-queue'
                  ? 'Exceptions'
                  : tab.label;
                const active = isTabActive(tab.key);

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTabClick(tab.key);
                    }}
                    className={`group flex items-center gap-1.5 px-3 h-full text-sm font-medium transition-all relative cursor-pointer ${
                      active
                        ? 'text-white/95'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <span className={active ? 'text-brand-iris' : 'text-white/40 group-hover:text-white/60'}>
                      {tab.icon}
                    </span>
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-iris rounded-t shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    )}
                  </button>
                );
              })}
            {/* Activity Log tab — Autopilot mode only */}
            {mode === 'autopilot' && (() => {
              const active = isTabActive('activity-log');
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabClick('activity-log');
                  }}
                  className={`group flex items-center gap-1.5 px-3 h-full text-sm font-medium transition-all relative cursor-pointer ${
                    active
                      ? 'text-white/95'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <span className={active ? 'text-brand-iris' : 'text-white/40 group-hover:text-white/60'}>
                    <ClockCounterClockwise className="w-4 h-4" weight="regular" />
                  </span>
                  Activity Log
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-iris rounded-t shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  )}
                </button>
              );
            })()}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right cluster: SAGE + EVI + Mode + Explain + Create */}
            <div className="flex items-center gap-2 shrink-0">
              {/* SAGE tag */}
              <div className="flex items-center gap-1.5">
                <Lightning className="w-3.5 h-3.5 text-brand-iris shrink-0" weight="fill" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-iris max-w-[200px] truncate">
                  Content authority gap: AI citation coverage
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />

              {/* EVI indicator */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mr-1">EVI</span>
                <span className="text-sm font-bold tabular-nums text-brand-cyan">{(evi?.score ?? 0).toFixed(1)}</span>
                <span className={`text-xs flex items-center gap-0.5 ${(evi?.delta ?? 0) >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                  <TrendUp className="w-3 h-3" weight="bold" />
                  {(evi?.delta ?? 0) >= 0 ? '+' : ''}{(evi?.delta ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />

              {/* Mode switcher badge */}
              <div className="relative" ref={modeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wider transition-colors ${currentModeTokens.bg} ${currentModeTokens.text} ${currentModeTokens.border}`}
                >
                  <ModeIcon mode={effectiveMode} />
                  {currentModeTokens.label}
                  <CaretDown className="w-3 h-3" weight="regular" />
                </button>

                {/* Mode dropdown — opens leftward (right-0) */}
                {isModeDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-2 border border-slate-4 rounded-lg shadow-elev-3 py-1 z-[200]">
                    {(['manual', 'copilot', 'autopilot'] as AutomationMode[]).map((m) => {
                      const tokens = modeTokens[m];
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            onModeChange?.(m);
                            setIsModeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                            m === effectiveMode ? tokens.text : 'text-white/70'
                          }`}
                        >
                          <ModeIcon mode={m} />
                          <span className="font-medium">{tokens.label}</span>
                          {m === effectiveMode && (
                            <CheckCircle className="w-4 h-4 ml-auto" weight="fill" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Explain — icon-only ghost button */}
              <button
                type="button"
                onClick={() => setIsExplainOpen(true)}
                className="p-1.5 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
              >
                <Info className="w-4 h-4" weight="regular" />
              </button>

              {/* Create button — hidden in copilot work-queue (moved to SAGE queue header) */}
              {!(effectiveMode === 'copilot' && activeView === 'work-queue') && (
                <button
                  type="button"
                  onClick={() => setIsCreationOverlayOpen(true)}
                  className={createButtonClass}
                >
                  <Plus className="w-4 h-4" weight="regular" />
                  Create
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content Creation Overlay — full-screen below chrome bar */}
      {isCreationOverlayOpen && (
        <ContentCreationOverlay
          mode={effectiveMode}
          stage={creationStage}
          selectedContentType={selectedContentType}
          selectedSageBriefId={selectedSageBriefId}
          briefFormData={briefFormData}
          generatedOutline={generatedOutline}
          onStageChange={setCreationStage}
          onContentTypeSelect={setSelectedContentType}
          onSageBriefSelect={setSelectedSageBriefId}
          onBriefFormChange={setBriefFormData}
          onOutlineReady={setGeneratedOutline}
          onClose={closeCreationOverlay}
          onLaunchEditor={handleLaunchEditor}
        />
      )}

      {/* Content Area with Optional Right Rail */}
      <div className="flex-1 flex min-h-0">
        {/* Main Content - constrained so inner overflow-y-auto scrolls correctly */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Right Rail (when enabled) */}
        {showRightRail && (
          <div
            className={`
              hidden lg:flex flex-col border-l border-border-subtle bg-slate-0
              transition-all duration-300 ease-out shrink-0
              ${rightRailCollapsed ? 'w-12' : 'w-[320px] xl:w-[360px]'}
            `}
          >
            {rightRailCollapsed ? (
              <button
                onClick={() => setRightRailCollapsed(false)}
                className="h-full flex items-center justify-center text-white/50 hover:text-brand-iris transition-colors group"
                aria-label="Expand Details Panel"
              >
                <div className="flex flex-col items-center gap-3">
                  <CaretLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" weight="regular" />
                  <span className="text-[11px] font-medium uppercase tracking-wider [writing-mode:vertical-lr]">Details</span>
                </div>
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-gradient-to-r from-slate-1 to-slate-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-iris/50" />
                    <h2 className="text-sm font-semibold text-white tracking-tight">Asset Details</h2>
                  </div>
                  <button
                    onClick={() => setRightRailCollapsed(true)}
                    className="p-1.5 text-white/50 hover:text-white hover:bg-slate-3 rounded transition-colors"
                    aria-label="Collapse Details Panel"
                  >
                    <CaretRight className="w-4 h-4" weight="regular" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {rightRailContent}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Explain Drawer */}
      <ExplainDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        view={activeView}
      />
    </div>
  );
}
