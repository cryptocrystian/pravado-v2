'use client';

/**
 * SEO/AEO Work Surface Shell
 *
 * Main container with tab navigation for the SEO pillar.
 * Pillar color: brand-cyan (#00D9FF)
 *
 * Tabs are mode-aware per SEO_AEO_PILLAR_CANON.md §6.5:
 * - Manual/Copilot: Overview | AEO | Technical | Intelligence
 * - Autopilot: Overview | Exceptions
 *
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md §5
 */

import { useState, type ReactNode } from 'react';
import type { SEOView, AutomationMode } from './types';
import { ImpactStrip } from '@/components/shared/ImpactStrip';

// ============================================
// TYPES
// ============================================

export interface SEOWorkSurfaceShellProps {
  children: ReactNode;
  activeView: SEOView;
  onViewChange: (view: SEOView) => void;
  mode?: AutomationMode;
  aiStatus?: 'idle' | 'analyzing' | 'generating';
}

// ============================================
// VIEW TAB CONFIG
// ============================================

interface ViewTabConfig {
  key: SEOView;
  label: string;
  icon: ReactNode;
  modes: AutomationMode[]; // which modes show this tab
}

const VIEW_TABS: ViewTabConfig[] = [
  {
    key: 'overview',
    label: 'Overview',
    modes: ['manual', 'copilot', 'autopilot'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'aeo',
    label: 'AEO',
    modes: ['manual', 'copilot'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    key: 'technical',
    label: 'Technical',
    modes: ['manual', 'copilot'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    modes: ['manual', 'copilot'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    key: 'exceptions',
    label: 'Exceptions',
    modes: ['autopilot'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

// ============================================
// PAGE CONTEXT FOR EXPLAIN DRAWER
// ============================================

const PAGE_CONTEXT: Record<SEOView, { purpose: string; aiCapabilities: string[]; manualRequired: string[] }> = {
  overview: {
    purpose: 'Monitor your brand\'s visibility across traditional search, AI engines, and Share of Model. See three-layer health at a glance.',
    aiCapabilities: [
      'Prioritize actions by AEO impact',
      'Calculate Share of Model trends',
      'Detect competitive movements',
    ],
    manualRequired: [
      'Executing technical fixes',
      'Approving schema deployments',
    ],
  },
  aeo: {
    purpose: 'Manage AI Engine Optimization across your content. Track AEO scores, schema status, and citation activity per asset.',
    aiCapabilities: [
      'Generate schema recommendations',
      'Identify entity gaps',
      'Track AI surface citations',
    ],
    manualRequired: [
      'Deploying schema changes to production',
      'Approving content modifications',
    ],
  },
  technical: {
    purpose: 'Full technical SEO audit with AEO bridge impact on every finding. Fix issues that affect both traditional search and AI visibility.',
    aiCapabilities: [
      'Prioritize by AEO impact',
      'Auto-generate fix suggestions',
      'Monitor after deployment',
    ],
    manualRequired: [
      'Deploying technical fixes',
      'Approving schema modifications',
    ],
  },
  intelligence: {
    purpose: 'Deep competitive intelligence, citation tracking, narrative drift detection, and topic cluster health monitoring.',
    aiCapabilities: [
      'Monitor AI citations in real-time',
      'Detect narrative drift',
      'Track competitor Share of Model',
    ],
    manualRequired: [
      'Acting on competitive insights',
      'Initiating correction campaigns',
    ],
  },
  exceptions: {
    purpose: 'Items requiring your attention while AI handles routine SEO/AEO operations autonomously.',
    aiCapabilities: [
      'Execute routine schema deployments',
      'Run citation scans',
      'Send IndexNow pings',
    ],
    manualRequired: [
      'Resolving exceptions',
      'Approving non-standard operations',
    ],
  },
};

// ============================================
// EXPLAIN DRAWER
// ============================================

function ExplainDrawer({ isOpen, onClose, view }: { isOpen: boolean; onClose: () => void; view: SEOView }) {
  const context = PAGE_CONTEXT[view];
  const viewConfig = VIEW_TABS.find((t) => t.key === view);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-0/80 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />
      <div className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-slate-2 border-l border-slate-4 z-50 shadow-elev-3 overflow-y-auto">
        <div className="sticky top-0 bg-slate-2 border-b border-slate-4 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-cyan/10">
              <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/95">Page Guide</h3>
              <p className="text-xs text-white/50">{viewConfig?.label}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">What This Page Is For</h4>
            <p className="text-sm text-white/85 leading-relaxed">{context.purpose}</p>
          </div>
          {context.aiCapabilities.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">What AI Can Do Here</h4>
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
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">What Requires Your Approval</h4>
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

export function SEOWorkSurfaceShell({
  children,
  activeView,
  onViewChange,
  mode = 'manual',
  aiStatus = 'idle',
}: SEOWorkSurfaceShellProps) {
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  const visibleTabs = VIEW_TABS.filter((tab) => tab.modes.includes(mode));

  return (
    <div className="h-screen bg-slate-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border-subtle bg-gradient-to-b from-slate-1 to-transparent">
        <div className="px-6 pt-6 pb-0">
          {/* Title Row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* SEO Pillar Icon */}
              <div className="p-3 rounded-xl bg-brand-cyan/10 ring-1 ring-brand-cyan/20 shadow-[0_0_20px_rgba(0,217,255,0.12)]">
                <svg className="w-6 h-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white/95 tracking-tight">SEO / AEO Command</h1>
                <p className="text-[13px] text-white/55 mt-1">
                  Search visibility and AI engine optimization
                </p>
              </div>

              {/* AI Status Pill */}
              {aiStatus !== 'idle' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20">
                  <span className={`w-2 h-2 rounded-full ${aiStatus === 'generating' ? 'bg-brand-iris' : 'bg-brand-cyan'} animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]`} />
                  <span className="text-xs font-medium text-brand-cyan">
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white/90 hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Explain
              </button>
            </div>
          </div>

          {/* Tab Navigation — mode-aware */}
          <div className="flex items-center gap-1 -mb-px relative z-10">
            {visibleTabs.map((tab) => (
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
                    ? 'text-white/90'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <span className={activeView === tab.key ? 'text-brand-cyan' : 'text-white/40 group-hover:text-white/60'}>
                  {tab.icon}
                </span>
                {tab.label}
                {activeView === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-t shadow-[0_0_8px_rgba(0,217,255,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ImpactStrip */}
      <ImpactStrip
        sageTag="AEO readiness gap: schema coverage 42%"
        eviScore={62.7}
        eviDelta={2.3}
        pillar="seo"
      />

      {/* Content Area */}
      <div className="flex-1 min-h-0 px-6 py-4 overflow-y-auto">
        {children}
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
