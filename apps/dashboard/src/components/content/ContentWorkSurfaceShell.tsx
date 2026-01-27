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

import { useState, type ReactNode } from 'react';
import type { ContentView, AutomationMode } from './types';
import { modeTokens } from './tokens';

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
  /** AI status for header dot */
  aiStatus?: 'idle' | 'analyzing' | 'generating';
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
    key: 'overview',
    label: 'Overview',
    description: 'Authority signals and content health',
    modeCeiling: 'copilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: 'library',
    label: 'Library',
    description: 'Content assets and derivatives',
    modeCeiling: 'copilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'Publication schedule and deadlines',
    modeCeiling: 'copilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'insights',
    label: 'Insights',
    description: 'Performance and recommendations',
    modeCeiling: 'copilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// ============================================
// PAGE CONTEXT FOR EXPLAIN DRAWER
// ============================================

const PAGE_CONTEXT: Record<ContentView, { purpose: string; aiCapabilities: string[]; manualRequired: string[] }> = {
  overview: {
    purpose: 'Your content authority dashboard. Monitor signals, track health, and identify opportunities.',
    aiCapabilities: [
      'Calculate authority contribution scores',
      'Detect content gaps and opportunities',
      'Generate performance insights',
    ],
    manualRequired: [
      'Creating new briefs',
      'Approving content for publication',
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
};

// ============================================
// MODE ICON COMPONENT
// ============================================

function ModeIcon({ mode }: { mode: AutomationMode }) {
  if (mode === 'manual') {
    return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  }
  if (mode === 'copilot') {
    return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
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
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-slate-2 border-l border-border-subtle z-50 shadow-elev-3 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-2 border-b border-border-subtle px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-iris/10">
              <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Page Guide</h3>
              <p className="text-xs text-white/50">{viewConfig?.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Purpose */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">What This Page Is For</h4>
            <p className="text-sm text-white/85 leading-relaxed">{context.purpose}</p>
          </div>

          {/* Mode Ceiling */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Automation Mode</h4>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${modeConfig.bg} ${modeConfig.border}`}>
              <ModeIcon mode={viewConfig?.modeCeiling || 'manual'} />
              <span className={`text-sm font-medium ${modeConfig.text}`}>{modeConfig.label}</span>
              <span className="text-xs text-white/50 ml-auto">{modeConfig.description}</span>
            </div>
          </div>

          {/* AI Capabilities */}
          {context.aiCapabilities.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">What AI Can Do Here</h4>
              <ul className="space-y-2">
                {context.aiCapabilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <svg className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Manual Required */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">What Requires Your Approval</h4>
            <ul className="space-y-2">
              {context.manualRequired.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <svg className="w-4 h-4 text-white/40 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
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
  aiStatus = 'idle',
}: ContentWorkSurfaceShellProps) {
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);

  const activeViewConfig = VIEW_TABS.find((t) => t.key === activeView);
  const modeConfig = modeTokens[activeViewConfig?.modeCeiling || 'manual'];

  // DS v3 palette tokens (per DS_v3_1_EXPRESSION.md)
  // dark-bg: #0A0A0F (slate-0), dark-card: #13131A (slate-2), dark-border: #1F1F28
  return (
    <div className="min-h-screen bg-slate-0">
      {/* Header - gradient from slightly elevated to transparent */}
      <div className="border-b border-[#1A1A24] bg-gradient-to-b from-slate-1 to-transparent">
        <div className="px-6 pt-6 pb-0">
          <div className="max-w-[1600px] mx-auto">
            {/* Title Row */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                {/* Content Pillar Icon */}
                <div className="p-3 rounded-xl bg-brand-iris/10 ring-1 ring-brand-iris/20 shadow-[0_0_20px_rgba(168,85,247,0.12)]">
                  <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white tracking-tight">Content Hub</h1>
                  <p className="text-sm text-white/50 mt-0.5">
                    Authority-building content orchestration
                  </p>
                </div>

                {/* Mode Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${modeConfig.bg} ${modeConfig.border}`}>
                  <ModeIcon mode={activeViewConfig?.modeCeiling || 'manual'} />
                  <span className={`text-xs font-medium ${modeConfig.text}`}>{modeConfig.label}</span>
                </div>

                {/* AI Status Pill */}
                {aiStatus !== 'idle' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-iris/10 border border-brand-iris/20">
                    <span className={`w-2 h-2 rounded-full ${aiStatus === 'generating' ? 'bg-brand-iris' : 'bg-brand-cyan'} animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]`} />
                    <span className="text-xs font-medium text-brand-iris">
                      {aiStatus === 'generating' ? 'Generating...' : 'Analyzing...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExplainOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Explain
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-brand-iris text-white text-sm font-medium rounded-lg hover:bg-brand-iris/90 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.20)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Brief
                </button>
              </div>
            </div>

            {/* Tab Navigation - DS3 Styling */}
            <div className="flex items-center gap-1 -mb-px relative z-10">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewChange(tab.key);
                  }}
                  className={`group flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative cursor-pointer ${
                    activeView === tab.key
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <span className={activeView === tab.key ? 'text-brand-iris' : 'text-white/40 group-hover:text-white/60'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {activeView === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-iris rounded-t shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Optional Right Rail */}
      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 px-6 py-6 ${showRightRail && !rightRailCollapsed ? 'lg:pr-0' : ''}`}>
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>

        {/* Right Rail (when enabled) */}
        {showRightRail && (
          <div
            className={`
              hidden lg:flex flex-col border-l border-[#1A1A24] bg-slate-0
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
                  <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-[11px] font-medium uppercase tracking-wider [writing-mode:vertical-lr]">Details</span>
                </div>
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A24] bg-gradient-to-r from-slate-1 to-slate-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-iris/50" />
                    <h2 className="text-sm font-semibold text-white tracking-tight">Asset Details</h2>
                  </div>
                  <button
                    onClick={() => setRightRailCollapsed(true)}
                    className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded transition-colors"
                    aria-label="Collapse Details Panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
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
