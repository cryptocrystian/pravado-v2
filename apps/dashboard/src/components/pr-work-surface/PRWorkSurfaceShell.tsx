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
import { ImpactStrip } from '@/components/shared/ImpactStrip';
import { CommandCenterTopbar } from '@/components/command-center/CommandCenterTopbar';
import {
  Tray,
  SquaresFour,
  Archive,
  EnvelopeSimple,
  Newspaper,
  ShareNetwork,
  GearSix,
  Info,
  X,
  Plus,
  CheckCircle,
  Lock,
  User,
  Lightning,
} from '@phosphor-icons/react';

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
      <Tray weight="regular" className="w-4 h-4" />
    ),
  },
  {
    id: 'overview',
    label: 'Situation Brief',
    description: 'Intelligence snapshot and signals',
    modeCeiling: 'copilot',
    icon: (
      <SquaresFour weight="regular" className="w-4 h-4" />
    ),
  },
  {
    id: 'database',
    label: 'Database',
    description: 'Media contacts, relationships, and CRM',
    modeCeiling: 'copilot',
    icon: (
      <Archive weight="regular" className="w-4 h-4" />
    ),
  },
  {
    id: 'pitches',
    label: 'Pitches',
    description: 'Compose, track, and follow up',
    modeCeiling: 'manual',
    icon: (
      <EnvelopeSimple weight="regular" className="w-4 h-4" />
    ),
  },
  {
    id: 'coverage',
    label: 'Coverage',
    description: 'Mentions, citations, and outcomes',
    modeCeiling: 'copilot',
    icon: (
      <Newspaper weight="regular" className="w-4 h-4" />
    ),
  },
  {
    id: 'distribution',
    label: 'Distribution',
    description: 'CiteMind Newsroom and wire',
    modeCeiling: 'manual',
    icon: (
      <ShareNetwork weight="regular" className="w-4 h-4" />
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Automation ceilings and preferences',
    modeCeiling: 'manual',
    icon: (
      <GearSix weight="regular" className="w-4 h-4" />
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
      <Lock weight="regular" className="w-3.5 h-3.5" />
    );
  }
  if (mode === 'copilot') {
    return (
      <User weight="regular" className="w-3.5 h-3.5" />
    );
  }
  return (
    <Lightning weight="regular" className="w-3.5 h-3.5" />
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
        className="fixed inset-0 bg-page/70 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-slate-2 border-l border-slate-4 z-50 shadow-elev-3 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-2 border-b border-slate-4 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-magenta/10">
              <Info weight="regular" className="w-5 h-5 text-brand-magenta" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/95">Page Guide</h3>
              <p className="text-xs text-white/50">{tabConfig?.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X weight="regular" className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Purpose */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">What This Page Is For</h4>
            <p className="text-sm text-white/85 leading-relaxed">{context.purpose}</p>
          </div>

          {/* Mode Ceiling */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">Automation Mode</h4>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${modeConfig.bg} ${modeConfig.border}`}>
              <ModeIcon mode={tabConfig?.modeCeiling || 'manual'} />
              <span className={`text-sm font-medium ${modeConfig.text}`}>{modeConfig.label}</span>
              <span className="text-xs text-white/50 ml-auto">{modeConfig.description}</span>
            </div>
          </div>

          {/* AI Capabilities */}
          {context.aiCapabilities.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">What AI Can Do Here</h4>
              <ul className="space-y-2">
                {context.aiCapabilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle weight="regular" className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Manual Required */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">What Requires Your Approval</h4>
            <ul className="space-y-2">
              {context.manualRequired.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <Lock weight="regular" className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
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
    <div className="min-h-screen bg-slate-0">
      {/* Global topbar navigation — same as CC/Calendar/Analytics */}
      <CommandCenterTopbar />

      {/* Header */}
      {/* Header - full-width shell per Phase 10A width continuity */}
      <div className="border-b border-border-subtle bg-gradient-to-b from-slate-1 to-transparent">
        <div className="px-6 pt-6 pb-0">
          {/* Title Row */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                {/* PR Pillar Icon */}
                <div className="p-3 rounded-xl bg-brand-magenta/10 ring-1 ring-brand-magenta/20 shadow-[0_0_20px_rgba(232,121,249,0.12)]">
                  <Newspaper weight="regular" className="w-6 h-6 text-brand-magenta" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white/95 tracking-tight">PR Intelligence</h1>
                  <p className="text-[13px] text-white/55 mt-1">
                    Relationship-based media orchestration
                  </p>
                </div>

                {/* Ambient AI State Indicator - per AI_VISUAL_COMMUNICATION_CANON §2 */}
                <AmbientAIIndicator state={aiState} showLabel size="sm" />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExplainOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white/90 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Info weight="regular" className="w-4 h-4" />
                  Explain
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('settings')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white/90 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <GearSix weight="regular" className="w-4 h-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('pitches')}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-magenta text-white/90 text-sm font-medium rounded-lg hover:bg-brand-magenta/90 transition-colors shadow-[0_0_20px_rgba(232,121,249,0.20)]"
                >
                  <Plus weight="regular" className="w-4 h-4" />
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
                      ? 'text-white/95'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-brand-magenta' : 'text-white/40 group-hover:text-white/60'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {tab.badge && (
                    <span className={`px-1.5 py-0.5 text-[13px] font-semibold rounded-full ${
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

      {/* ImpactStrip — SAGE tag + EVI + Mode switcher */}
      <ImpactStrip
        sageTag="PR relationship signals: journalist engagement trending"
        eviScore={52.8}
        eviDelta={2.3}
        pillar="pr"
        ceiling={activeTabConfig?.modeCeiling}
      />

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
