'use client';

/**
 * PR Work Surface Shell - DS v3.0
 *
 * Main container with tab navigation matching Command Center design language.
 * Premium, AI-first aesthetic with strong visual hierarchy.
 *
 * FEATURES:
 * - Work Surface header block with mode indicator
 * - Explain drawer for page context
 * - DS3 tab styling with pillar accent
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 */

import { useState, type ReactNode } from 'react';
import { modeStyles } from './prWorkSurfaceStyles';
import {
  AmbientAIIndicator,
  type AIPerceptualState,
} from '@/components/ai';
import { ModeSwitcher } from '@/components/shared/ModeSwitcher';

// Tab configuration
export type PRTab = 'inbox' | 'overview' | 'database' | 'pitches' | 'coverage' | 'distribution' | 'settings';

interface TabConfig {
  id: PRTab;
  label: string;
  icon: ReactNode;
  description: string;
  badge?: string;
  modeCeiling: 'manual' | 'copilot' | 'autopilot';
}

const TABS: TabConfig[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    description: 'Your prioritized work queue',
    badge: '6',
    modeCeiling: 'manual',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  {
    id: 'overview',
    label: 'Situation Brief',
    description: 'Intelligence snapshot and signals',
    modeCeiling: 'copilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    id: 'database',
    label: 'Database',
    description: 'Media contacts, relationships, and CRM',
    modeCeiling: 'copilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'pitches',
    label: 'Pitches',
    description: 'Compose, track, and follow up',
    modeCeiling: 'manual',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'coverage',
    label: 'Coverage',
    description: 'Mentions, citations, and outcomes',
    modeCeiling: 'copilot',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    id: 'distribution',
    label: 'Distribution',
    description: 'CiteMind Newsroom and wire',
    modeCeiling: 'manual',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Automation ceilings and preferences',
    modeCeiling: 'manual',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// Page context for "Explain" drawer
const PAGE_CONTEXT: Record<PRTab, { purpose: string; aiCapabilities: string[]; manualRequired: string[] }> = {
  inbox: {
    purpose: 'Your prioritized work queue. Triage and act on the most important PR tasks in order of urgency and impact.',
    aiCapabilities: [
      'Prioritize items by urgency and EVI impact',
      'Suggest follow-up timing windows',
      'Draft response templates (approval required)',
    ],
    manualRequired: [
      'Sending any pitch or follow-up email',
      'Responding to journalist inquiries',
      'Dismissing or snoozing items',
    ],
  },
  overview: {
    purpose: 'Your PR intelligence snapshot. Understand opportunities, risks, and trends at a glance.',
    aiCapabilities: [
      'Generate situation briefs',
      'Detect signals and trends',
      'Surface attention items',
    ],
    manualRequired: [
      'All actions route to Inbox or Command Center',
    ],
  },
  database: {
    purpose: 'CRM-grade media contact management. Build and nurture journalist relationships.',
    aiCapabilities: [
      'Enrich contact data from public sources',
      'Calculate topic currency scores',
      'Suggest relationship health interventions',
    ],
    manualRequired: [
      'Approving data enrichment updates',
      'Editing contact records',
      'Adding new contacts',
    ],
  },
  pitches: {
    purpose: 'Compose, track, and follow up on media pitches. Every outreach is relationship-first.',
    aiCapabilities: [
      'Generate personalized pitch drafts',
      'Calculate personalization scores',
      'Suggest optimal send windows',
    ],
    manualRequired: [
      'Sending all pitches (SYSTEM ENFORCED)',
      'Sending all follow-ups (SYSTEM ENFORCED)',
      'Editing pitch content',
    ],
  },
  coverage: {
    purpose: 'Track media mentions, AI citations, and campaign outcomes.',
    aiCapabilities: [
      'Detect and attribute coverage automatically',
      'Analyze sentiment and extract quotes',
      'Calculate EVI impact from coverage',
    ],
    manualRequired: [
      'Verifying attribution accuracy',
      'Marking coverage as relevant/irrelevant',
    ],
  },
  distribution: {
    purpose: 'Distribute content through CiteMind AEO (default) or traditional wire services.',
    aiCapabilities: [
      'Optimize content for AI ingestion',
      'Generate distribution recommendations',
      'Track syndication and pickup',
    ],
    manualRequired: [
      'Selecting distribution channels',
      'Confirming paid wire sends',
      'CiteMind Audio (SYSTEM ENFORCED manual)',
    ],
  },
  settings: {
    purpose: 'Configure automation ceilings and PR preferences.',
    aiCapabilities: [],
    manualRequired: [
      'All settings changes require manual confirmation',
      'Relationship action ceilings are system-enforced',
    ],
  },
};

// Mode icon component
function ModeIcon({ mode }: { mode: 'manual' | 'copilot' | 'autopilot' }) {
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

// Explain Drawer
interface ExplainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tab: PRTab;
}

function ExplainDrawer({ isOpen, onClose, tab }: ExplainDrawerProps) {
  const context = PAGE_CONTEXT[tab];
  const tabConfig = TABS.find((t) => t.id === tab);
  const modeConfig = modeStyles[tabConfig?.modeCeiling || 'manual'];

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
      <div className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-[#13131A] border-l border-[#1F1F28] z-50 shadow-elev-3 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#13131A] border-b border-[#1F1F28] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-magenta/10">
              <svg className="w-5 h-5 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Page Guide</h3>
              <p className="text-xs text-white/50">{tabConfig?.label}</p>
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
              <ModeIcon mode={tabConfig?.modeCeiling || 'manual'} />
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

interface Props {
  activeTab: PRTab;
  onTabChange: (tab: PRTab) => void;
  children: ReactNode;
  /** Optional AI state for ambient indicator */
  aiState?: AIPerceptualState;
}

export function PRWorkSurfaceShell({ activeTab, onTabChange, children, aiState = 'idle' }: Props) {
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const activeTabConfig = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      {/* Header - full-width shell per Phase 10A width continuity */}
      <div className="border-b border-[#1A1A24] bg-gradient-to-b from-[#0D0D12] to-transparent">
        <div className="px-6 pt-6 pb-0">
          {/* Title Row */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                {/* PR Pillar Icon */}
                <div className="p-3 rounded-xl bg-brand-magenta/10 ring-1 ring-brand-magenta/20 shadow-[0_0_20px_rgba(232,121,249,0.12)]">
                  <svg className="w-6 h-6 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white tracking-tight">PR Intelligence</h1>
                  <p className="text-sm text-white/50 mt-0.5">
                    Relationship-based media orchestration
                  </p>
                </div>

                {/* Mode Switcher - Phase 10A user-controllable mode */}
                <ModeSwitcher
                  pillar="pr"
                  ceiling={activeTabConfig?.modeCeiling}
                />

                {/* Ambient AI State Indicator - per AI_VISUAL_COMMUNICATION_CANON §2 */}
                <AmbientAIIndicator state={aiState} showLabel size="sm" />
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
                  onClick={() => onTabChange('settings')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('pitches')}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-magenta text-white text-sm font-medium rounded-lg hover:bg-brand-magenta/90 transition-colors shadow-[0_0_20px_rgba(232,121,249,0.20)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Pitch
                </button>
              </div>
            </div>

            {/* Tab Navigation - DS3 Styling */}
            <div className="flex items-center gap-1 -mb-px relative z-10">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTabChange(tab.id);
                  }}
                  className={`group flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-brand-magenta' : 'text-white/40 group-hover:text-white/60'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {tab.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      activeTab === tab.id
                        ? 'bg-brand-magenta/20 text-brand-magenta'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-magenta rounded-t shadow-[0_0_8px_rgba(232,121,249,0.5)]" />
                  )}
                </button>
              ))}
            </div>
        </div>
      </div>

      {/* Content Area - full-width shell per Phase 10A width continuity */}
      <div className="px-6 py-6">
        {children}
      </div>

      {/* Explain Drawer */}
      <ExplainDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        tab={activeTab}
      />
    </div>
  );
}
