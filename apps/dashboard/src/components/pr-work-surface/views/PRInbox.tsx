'use client';

/**
 * PR Inbox / Work Queue - DS v3.0
 *
 * 3-Panel command cockpit layout:
 * - Left: Section navigation with counts
 * - Middle: Queue items (dense, scannable, keyboard-friendly)
 * - Right: Selected item detail with Impact + Rationale modules
 *
 * This is the daily-driver "triage and execute" page.
 *
 * @see /docs/canon/PR_INBOX_CONTRACT.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 *
 * OMNI-TRAY INTEGRATION (TODO):
 * - Dispatch event when new inbox item added (action_required)
 * - Dispatch event for high-priority journalist inquiries (action_required, urgent)
 * - Dispatch event when approval queue item added (approval_required)
 * - Dispatch event for relationship decay warnings (risk_detected)
 * - See: /contracts/examples/omni-tray-pr-events.json
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import type { InboxItem, InboxItemType, SAGEDimension, Mode } from '../types';
import { priorityStyles, modeStyles, eviDriverStyles } from '../prWorkSurfaceStyles';

// ============================================
// API TYPES & FETCHER
// ============================================

interface InboxResponse {
  items: InboxItem[];
  total: number;
  byType: Record<string, number>;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch inbox data');
    throw error;
  }
  return res.json();
};

// ============================================
// TYPE CONFIGS
// ============================================

interface InboxTypeConfig {
  label: string;
  pluralLabel: string;
  icon: JSX.Element;
  color: string;
  bgColor: string;
  description: string;
}

const INBOX_TYPE_CONFIG: Record<InboxItemType, InboxTypeConfig> = {
  inquiry: {
    label: 'Inquiry',
    pluralLabel: 'Inbound Inquiries',
    description: 'Journalist requests requiring response',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    color: 'text-semantic-warning',
    bgColor: 'bg-semantic-warning/10',
  },
  follow_up_due: {
    label: 'Follow-up',
    pluralLabel: 'Follow-ups Due',
    description: 'Pitches in optimal follow-up window',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/10',
  },
  coverage_triage: {
    label: 'Coverage',
    pluralLabel: 'Coverage Triage',
    description: 'New mentions requiring review',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/10',
  },
  relationship_decay: {
    label: 'Decay',
    pluralLabel: 'Relationship Decay',
    description: 'Contacts losing engagement momentum',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    color: 'text-semantic-danger',
    bgColor: 'bg-semantic-danger/10',
  },
  approval_queue: {
    label: 'Approval',
    pluralLabel: 'Approval Queue',
    description: 'AI drafts awaiting your review',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/10',
  },
  data_hygiene: {
    label: 'Data',
    pluralLabel: 'Data Hygiene',
    description: 'Contact updates and enrichment',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    color: 'text-white/50',
    bgColor: 'bg-white/5',
  },
};

const SAGE_LABELS: Record<SAGEDimension, { label: string; short: string; description: string }> = {
  signal: { label: 'Signal', short: 'S', description: 'Trend detection & newsworthiness' },
  authority: { label: 'Authority', short: 'A', description: 'Credibility & thought leadership' },
  growth: { label: 'Growth', short: 'G', description: 'Relationship building & momentum' },
  exposure: { label: 'Exposure', short: 'E', description: 'Reach & visibility expansion' },
};

// ============================================
// MOCK DATA
// ============================================

// Mock relationship context for inbox items
const MOCK_RELATIONSHIP_CONTEXT: Record<string, { stage: string; lastInteraction: string }> = {
  'contact-sarah': { stage: 'warm', lastInteraction: '2 days ago' },
  'contact-michael': { stage: 'cold', lastInteraction: '12 days ago' },
  'contact-jennifer': { stage: 'engaged', lastInteraction: '75 days ago' },
  'contact-alex': { stage: 'warm', lastInteraction: '8 days ago' },
  'contact-maria': { stage: 'cold', lastInteraction: '30 days ago' },
};

// Copilot reasoning types and labels
type CopilotReasoningType = 'similar_wins' | 'timing_signal' | 'relationship_risk' | 'trending_topic' | 'data_signal';

const COPILOT_REASONING_LABELS: Record<CopilotReasoningType, { label: string; color: string }> = {
  similar_wins: { label: 'Based on Similar Wins', color: 'text-semantic-success' },
  timing_signal: { label: 'Based on Timing Signal', color: 'text-brand-cyan' },
  relationship_risk: { label: 'Based on Relationship Risk', color: 'text-semantic-warning' },
  trending_topic: { label: 'Based on Trending Topic', color: 'text-brand-iris' },
  data_signal: { label: 'Based on Data Signal', color: 'text-white/60' },
};

// Mock copilot reasoning for inbox items
const MOCK_COPILOT_REASONING: Record<string, CopilotReasoningType> = {
  'inbox-1': 'timing_signal',
  'inbox-2': 'timing_signal',
  'inbox-3': 'similar_wins',
  'inbox-4': 'relationship_risk',
  'inbox-5': 'trending_topic',
  'inbox-6': 'data_signal',
};

const MOCK_INBOX_ITEMS: InboxItem[] = [
  {
    id: 'inbox-1',
    type: 'inquiry',
    priority: 'high',
    title: 'TechCrunch inquiry about AI marketing tools',
    description: 'Sarah Chen from TechCrunch is working on a piece about AI marketing platforms and requested comment. Story deadline is end of day.',
    dueAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    urgency: 85,
    risk: 'medium',
    relatedContactId: 'contact-sarah',
    primaryAction: {
      label: 'Draft Response',
      targetRoute: '/app/pr?tab=pitches&compose=true&contactId=contact-sarah&type=inquiry',
    },
    modeCeiling: 'manual',
    sageContributions: [
      { dimension: 'signal', isPrimary: true },
      { dimension: 'authority', isPrimary: false },
    ],
    eviImpact: { driver: 'visibility', direction: 'positive', delta: 8, explanation: 'Tier-1 coverage opportunity' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inbox-2',
    type: 'follow_up_due',
    priority: 'medium',
    title: 'Follow up with Michael Park @ VentureBeat',
    description: 'Pitch sent 5 days ago. Email was opened 3 times but no response. This is the optimal follow-up window (5-7 days). Guardrail: max 2 follow-ups per contact per week.',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    urgency: 65,
    confidence: 72,
    relatedContactId: 'contact-michael',
    relatedPitchId: 'pitch-123',
    primaryAction: {
      label: 'Draft Follow-up',
      targetRoute: '/app/pr?tab=pitches&pitchId=pitch-123&followup=true',
    },
    modeCeiling: 'manual',
    sageContributions: [
      { dimension: 'growth', isPrimary: true },
    ],
    eviImpact: { driver: 'momentum', direction: 'neutral', explanation: 'Maintains pipeline velocity' },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inbox-3',
    type: 'coverage_triage',
    priority: 'medium',
    title: 'New coverage detected: Forbes mention',
    description: 'Your brand was mentioned in "Top 10 Marketing Platforms for 2026" article by Jennifer Wong. Attribution analysis pending—may link to recent pitch.',
    urgency: 50,
    relatedCoverageId: 'coverage-forbes',
    primaryAction: {
      label: 'Review & Attribute',
      targetRoute: '/app/pr?tab=coverage&coverageId=coverage-forbes&triage=true',
    },
    modeCeiling: 'copilot',
    sageContributions: [
      { dimension: 'authority', isPrimary: true },
      { dimension: 'exposure', isPrimary: false },
    ],
    eviImpact: { driver: 'authority', direction: 'positive', delta: 12, explanation: 'Tier-1 publication mention' },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inbox-4',
    type: 'relationship_decay',
    priority: 'low',
    title: 'Relationship decay: Jennifer Liu @ WSJ',
    description: 'No interaction in 75 days. Relationship score dropped from 72 to 58. This warm contact is at risk of going cold. Consider a touch-base or share relevant content.',
    urgency: 35,
    risk: 'low',
    relatedContactId: 'contact-jennifer',
    primaryAction: {
      label: 'View Contact',
      targetRoute: '/app/pr?tab=database&contactId=contact-jennifer&section=ledger',
    },
    modeCeiling: 'manual',
    sageContributions: [
      { dimension: 'growth', isPrimary: true },
    ],
    eviImpact: { driver: 'momentum', direction: 'negative', delta: -5, explanation: 'Relationship momentum declining' },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inbox-5',
    type: 'approval_queue',
    priority: 'medium',
    title: 'Draft pitch ready: AI governance angle',
    description: 'SAGE generated a pitch for Alex Thompson @ Wired based on trending AI governance topic. Personalization score: 78%. This draft requires your review before sending.',
    urgency: 55,
    confidence: 78,
    relatedContactId: 'contact-alex',
    relatedPitchId: 'pitch-draft-456',
    primaryAction: {
      label: 'Review Draft',
      targetRoute: '/app/pr?tab=pitches&pitchId=pitch-draft-456&review=true',
    },
    modeCeiling: 'manual',
    sageContributions: [
      { dimension: 'signal', isPrimary: true },
      { dimension: 'authority', isPrimary: false },
    ],
    eviImpact: { driver: 'visibility', direction: 'positive', delta: 6, explanation: 'Aligned with trending topic' },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inbox-6',
    type: 'data_hygiene',
    priority: 'low',
    title: 'Enrichment: Maria Santos moved outlets',
    description: 'CiteMind detected that Maria Santos moved from Wired to The Verge. Confidence: 92%. Review and approve to update your database.',
    urgency: 20,
    confidence: 92,
    relatedContactId: 'contact-maria',
    primaryAction: {
      label: 'Review Update',
      targetRoute: '/app/pr?tab=database&contactId=contact-maria&enrichment=true',
    },
    modeCeiling: 'copilot',
    sageContributions: [],
    eviImpact: { driver: 'authority', direction: 'neutral', explanation: 'Database accuracy' },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// SECTION NAV COMPONENT (Left Panel)
// ============================================

interface SectionNavProps {
  activeSection: InboxItemType | 'all';
  counts: Record<string, number>;
  onSectionChange: (section: InboxItemType | 'all') => void;
}

function SectionNav({ activeSection, counts, onSectionChange }: SectionNavProps) {
  const sections: (InboxItemType | 'all')[] = [
    'all',
    'inquiry',
    'follow_up_due',
    'approval_queue',
    'coverage_triage',
    'relationship_decay',
    'data_hygiene',
  ];

  return (
    <div className="w-40 shrink-0 bg-[#0D0D12] rounded-xl border border-[#1A1A24] overflow-hidden">
      <div className="p-3 border-b border-[#1A1A24]">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50">Queue Sections</h3>
      </div>
      <div className="p-2 space-y-0.5">
        {sections.map((section) => {
          const count = counts[section] || 0;
          const isActive = activeSection === section;

          if (section === 'all') {
            return (
              <button
                key={section}
                onClick={() => onSectionChange(section)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-brand-magenta/10 text-white ring-1 ring-brand-magenta/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="font-medium">All Items</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  isActive ? 'bg-brand-magenta/20 text-brand-magenta' : 'bg-white/10 text-white/50'
                }`}>
                  {counts.all}
                </span>
              </button>
            );
          }

          const config = INBOX_TYPE_CONFIG[section];
          if (count === 0) return null;

          return (
            <button
              key={section}
              onClick={() => onSectionChange(section)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? `${config.bgColor} text-white ring-1 ring-white/10`
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={isActive ? config.color : 'text-white/40'}>{config.icon}</span>
              <span className="flex-1 text-left truncate">{config.label}</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                isActive ? `${config.bgColor} ${config.color}` : 'bg-white/10 text-white/50'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// QUEUE ITEM COMPONENT (Middle Panel Items)
// ============================================

interface QueueItemProps {
  item: InboxItem;
  isSelected: boolean;
  onClick: () => void;
}

function QueueItem({ item, isSelected, onClick }: QueueItemProps) {
  const typeConfig = INBOX_TYPE_CONFIG[item.type];
  const pConfig = priorityStyles[item.priority];

  // Relationship context lookup
  const relationshipCtx = item.relatedContactId ? MOCK_RELATIONSHIP_CONTEXT[item.relatedContactId] : null;

  // Copilot reasoning lookup
  const copilotReasoningType = MOCK_COPILOT_REASONING[item.id];
  const copilotReasoning = copilotReasoningType ? COPILOT_REASONING_LABELS[copilotReasoningType] : null;

  // Calculate time remaining on client-side only to avoid hydration mismatch
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!item.dueAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTime = () => {
      const diff = new Date(item.dueAt!).getTime() - Date.now();
      if (diff < 0) return 'Overdue';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return '<1h';
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}d`;
    };

    // Set initial value on mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      setTimeRemaining(calculateTime());
    }

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(calculateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [item.dueAt]);

  // Relationship stage styling
  const stageStyle = (stage: string) => {
    const styles: Record<string, string> = {
      cold: 'text-white/40',
      warm: 'text-semantic-warning',
      engaged: 'text-semantic-success',
    };
    return styles[stage] || 'text-white/40';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all group ${
        isSelected
          ? 'bg-brand-magenta/10 ring-1 ring-brand-magenta/40'
          : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Priority indicator */}
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${pConfig.dot}`} />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className={`text-sm font-medium line-clamp-1 ${
            isSelected ? 'text-white' : 'text-white/85 group-hover:text-white'
          }`}>
            {item.title}
          </h4>

          {/* Meta row - DS 3.0: minimum 13px for semantic content */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`flex items-center gap-1 text-[13px] font-medium ${typeConfig.color}`}>
              {typeConfig.icon}
              {typeConfig.label}
            </span>
            {timeRemaining && (
              <span className={`text-[13px] font-medium ${
                timeRemaining === 'Overdue' ? 'text-semantic-danger' : 'text-white/50'
              }`}>
                {timeRemaining}
              </span>
            )}
            {item.eviImpact?.delta && (
              <span className={`text-[13px] font-medium ${
                item.eviImpact.direction === 'positive' ? 'text-semantic-success' :
                item.eviImpact.direction === 'negative' ? 'text-semantic-danger' : 'text-white/50'
              }`}>
                {item.eviImpact.direction === 'positive' ? '+' : ''}{item.eviImpact.delta} EVI
              </span>
            )}
          </div>

          {/* Relationship context - compact inline */}
          {relationshipCtx && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[13px] text-white/40">
              <span className={stageStyle(relationshipCtx.stage)}>{relationshipCtx.stage}</span>
              <span>·</span>
              <span>{relationshipCtx.lastInteraction}</span>
            </div>
          )}

          {/* Copilot reasoning label - visible in queue list */}
          {copilotReasoning && (
            <div className={`mt-1.5 text-[13px] font-medium ${copilotReasoning.color}`}>
              {copilotReasoning.label}
            </div>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 shrink-0 mt-1 transition-colors ${
            isSelected ? 'text-brand-magenta' : 'text-white/20 group-hover:text-white/40'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ============================================
// DETAIL PANEL COMPONENT (Right Panel)
// ============================================

// Mock relationship timeline events for demo
const MOCK_TIMELINE_EVENTS = [
  { type: 'pitch_sent', label: 'Pitch sent', date: '5 days ago' },
  { type: 'email_opened', label: 'Email opened (3x)', date: '4 days ago' },
  { type: 'link_clicked', label: 'Link clicked', date: '3 days ago' },
];

interface DetailPanelProps {
  item: InboxItem;
  onPrimaryAction: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
  onOpenContact: () => void;
  onAddNote: () => void;
}

function DetailPanel({ item, onPrimaryAction, onSnooze, onDismiss, onOpenContact, onAddNote }: DetailPanelProps) {
  const typeConfig = INBOX_TYPE_CONFIG[item.type];
  const pConfig = priorityStyles[item.priority];
  const mConfig = modeStyles[item.modeCeiling];

  // Copilot reasoning lookup
  const copilotReasoningType = MOCK_COPILOT_REASONING[item.id];
  const copilotReasoning = copilotReasoningType ? COPILOT_REASONING_LABELS[copilotReasoningType] : null;

  // Calculate time remaining on client-side only to avoid hydration mismatch
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!item.dueAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTime = () => {
      const diff = new Date(item.dueAt!).getTime() - Date.now();
      if (diff < 0) return 'Overdue';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return 'Less than 1 hour';
      if (hours < 24) return `${hours} hours`;
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    };

    setTimeRemaining(calculateTime());

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(calculateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [item.dueAt]);

  // Generate "Why this matters now" explanation
  const whyThisMatters = useMemo(() => {
    const primarySage = item.sageContributions?.find(c => c.isPrimary);
    const sageName = primarySage ? SAGE_LABELS[primarySage.dimension].label : 'Relevance';
    const eviDriver = item.eviImpact?.driver || 'momentum';
    const action = item.primaryAction.label.toLowerCase();

    if (item.eviImpact?.direction === 'positive') {
      return `${sageName} detected → ${item.eviImpact.delta ? `+${item.eviImpact.delta}` : 'positive'} ${eviDriver} impact → ${action} recommended`;
    } else if (item.eviImpact?.direction === 'negative') {
      return `${sageName} alert → ${item.eviImpact.delta || ''} ${eviDriver} risk → ${action} to mitigate`;
    }
    return `${sageName} signal → ${eviDriver} opportunity → ${action} to capitalize`;
  }, [item]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1A1A24]">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase border ${typeConfig.bgColor} ${typeConfig.color} border-transparent`}>
            {typeConfig.icon}
            {typeConfig.label}
          </span>
          <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}>
            {pConfig.label}
          </span>
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium uppercase border ${mConfig.bg} ${mConfig.text} ${mConfig.border}`}>
            <ModeIcon mode={item.modeCeiling} />
            {mConfig.label}
          </span>
        </div>
        <h2 className="text-base font-semibold text-white leading-tight">{item.title}</h2>
        {timeRemaining && (
          <p className={`text-[13px] mt-1 ${timeRemaining === 'Overdue' ? 'text-semantic-danger font-medium' : 'text-white/50'}`}>
            {timeRemaining === 'Overdue' ? 'Overdue' : `Due in ${timeRemaining}`}
          </p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Why This Matters Now - Prominent */}
        <div className="p-3 rounded-lg bg-brand-magenta/5 border border-brand-magenta/20">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-magenta/70">Why This Matters Now</h3>
            {/* Copilot Reasoning Label - visible without hover */}
            {copilotReasoning && (
              <span className={`text-[13px] font-medium ${copilotReasoning.color}`}>
                {copilotReasoning.label}
              </span>
            )}
          </div>
          <p className="text-sm text-white/85 leading-relaxed">{whyThisMatters}</p>
        </div>

        {/* Context */}
        <div className="p-3 rounded-lg bg-[#111116] border border-[#1A1A24]">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">Context</h3>
          <p className="text-sm text-white/70 leading-relaxed">{item.description}</p>
        </div>

        {/* EVI Impact + SAGE Rationale Combined Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* EVI Impact Module */}
          {item.eviImpact && (
            <div className="p-3 rounded-lg bg-[#111116] border border-[#1A1A24]">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">EVI Impact</h3>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${eviDriverStyles[item.eviImpact.driver as keyof typeof eviDriverStyles]?.bg || 'bg-white/5'}`}>
                  <span className={`text-lg font-bold ${
                    item.eviImpact.direction === 'positive' ? 'text-semantic-success' :
                    item.eviImpact.direction === 'negative' ? 'text-semantic-danger' : 'text-white/50'
                  }`}>
                    {item.eviImpact.direction === 'positive' ? '↑' :
                     item.eviImpact.direction === 'negative' ? '↓' : '→'}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[13px] font-semibold capitalize ${eviDriverStyles[item.eviImpact.driver as keyof typeof eviDriverStyles]?.text || 'text-white'}`}>
                      {item.eviImpact.driver}
                    </span>
                    {item.eviImpact.delta && (
                      <span className={`text-[13px] font-bold ${
                        item.eviImpact.delta > 0 ? 'text-semantic-success' : 'text-semantic-danger'
                      }`}>
                        {item.eviImpact.delta > 0 ? '+' : ''}{item.eviImpact.delta}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAGE Rationale Module */}
          {item.sageContributions && item.sageContributions.length > 0 && (
            <div className="p-3 rounded-lg bg-[#111116] border border-[#1A1A24]">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">SAGE Signal</h3>
              <div className="flex gap-1.5">
                {item.sageContributions.map((contrib) => {
                  const sage = SAGE_LABELS[contrib.dimension];
                  return (
                    <div
                      key={contrib.dimension}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                        contrib.isPrimary ? 'bg-brand-magenta/10 ring-1 ring-brand-magenta/30' : 'bg-white/5'
                      }`}
                      title={sage.description}
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                        contrib.isPrimary ? 'bg-brand-magenta/20 text-brand-magenta' : 'bg-white/10 text-white/50'
                      }`}>
                        {sage.short}
                      </span>
                      <span className="text-[13px] font-medium text-white/80">{sage.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Relationship Timeline Preview */}
        {item.relatedContactId && (
          <div className="p-3 rounded-lg bg-[#111116] border border-[#1A1A24]">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Relationship Timeline</h3>
            <div className="relative pl-3">
              <div className="absolute left-0.5 top-0 bottom-0 w-px bg-[#1A1A24]" />
              <div className="space-y-2">
                {MOCK_TIMELINE_EVENTS.slice(0, 3).map((event, idx) => (
                  <div key={idx} className="relative flex items-center gap-2">
                    <div className={`absolute -left-[9px] w-2 h-2 rounded-full ${idx === 0 ? 'bg-brand-magenta' : 'bg-[#2A2A36]'}`} />
                    <span className="text-[13px] text-white/70">{event.label}</span>
                    <span className="text-[13px] text-white/40 ml-auto">{event.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confidence (if available) */}
        {item.confidence && (
          <div className="p-3 rounded-lg bg-[#111116] border border-[#1A1A24]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/50">AI Confidence</h3>
              <span className="text-[13px] font-bold text-white">{item.confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1A1A24] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  item.confidence >= 80 ? 'bg-semantic-success' :
                  item.confidence >= 60 ? 'bg-semantic-warning' : 'bg-semantic-danger'
                }`}
                style={{ width: `${item.confidence}%` }}
              />
            </div>
          </div>
        )}

        {/* Related Entities (chips) */}
        <div className="flex flex-wrap gap-2">
          {item.relatedContactId && (
            <button
              onClick={onOpenContact}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111116] border border-[#1A1A24] hover:border-[#2A2A36] text-[13px] text-white/70 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Contact
            </button>
          )}
          {item.relatedPitchId && (
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111116] border border-[#1A1A24] hover:border-[#2A2A36] text-[13px] text-white/70 hover:text-white transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Pitch
            </button>
          )}
          {item.relatedCoverageId && (
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111116] border border-[#1A1A24] hover:border-[#2A2A36] text-[13px] text-white/70 hover:text-white transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Coverage
            </button>
          )}
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="p-3 border-t border-[#1A1A24] bg-[#0D0D12]">
        <div className="flex items-center gap-3">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={onPrimaryAction}
            className="flex-1 px-4 py-2 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta/90 transition-all shadow-[0_0_16px_rgba(232,121,249,0.15)]"
          >
            {item.primaryAction.label}
          </button>

          {/* Secondary actions - text only */}
          <div className="flex items-center gap-1 text-[13px]">
            <button
              type="button"
              onClick={onOpenContact}
              className="px-2 py-1.5 text-white/50 hover:text-white transition-colors"
            >
              Open contact
            </button>
            <span className="text-white/20">·</span>
            <button
              type="button"
              onClick={onAddNote}
              className="px-2 py-1.5 text-white/50 hover:text-white transition-colors"
            >
              Add note
            </button>
          </div>
        </div>

        {/* Tertiary actions - de-emphasized */}
        <div className="flex items-center justify-end gap-3 mt-2 text-[13px]">
          <button
            type="button"
            onClick={onSnooze}
            className="text-white/35 hover:text-white/60 transition-colors"
          >
            Snooze
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-white/35 hover:text-white/60 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// Mode icon helper
function ModeIcon({ mode }: { mode: Mode }) {
  if (mode === 'manual') {
    return (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  }
  if (mode === 'copilot') {
    return (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

// ============================================
// EMPTY STATES
// ============================================

function EmptyDetailPanel() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-brand-magenta/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-magenta/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">Select an item</h3>
        <p className="text-[13px] text-white/50">Choose from the queue to see details and take action</p>
      </div>
    </div>
  );
}

function InboxZeroState() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-semantic-success/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Inbox Zero!</h3>
        <p className="text-sm text-white/50 max-w-xs mx-auto">
          All caught up. Check back later for new items requiring your attention.
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PRInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch inbox items from real API
  const { data: inboxData, error: inboxError, isLoading } = useSWR<InboxResponse>(
    '/api/pr/inbox',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 } // Refresh every minute
  );

  // Use real data with fallback to mock data if API returns empty or errors
  const items = useMemo(() => {
    if (inboxData?.items && inboxData.items.length > 0) {
      return inboxData.items;
    }
    // Fallback to mock data if API returns empty
    return MOCK_INBOX_ITEMS;
  }, [inboxData]);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return searchParams?.get('item') || null;
  });
  const [activeSection, setActiveSection] = useState<InboxItemType | 'all'>('all');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentItems = filteredItems;
        const currentIndex = currentItems.findIndex(item => item.id === selectedId);
        let newIndex: number;

        if (e.key === 'ArrowDown') {
          newIndex = currentIndex < currentItems.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : currentItems.length - 1;
        }

        if (currentItems[newIndex]) {
          handleSelectItem(currentItems[newIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Selected item
  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedId) || null;
  }, [items, selectedId]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const filtered = activeSection === 'all'
      ? items
      : items.filter(item => item.type === activeSection);

    // Sort by priority then urgency
    return [...filtered].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.urgency - a.urgency;
    });
  }, [items, activeSection]);

  // Counts
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: items.length };
    items.forEach(item => {
      result[item.type] = (result[item.type] || 0) + 1;
    });
    return result;
  }, [items]);

  const criticalCount = items.filter(i => i.priority === 'critical').length;
  const highCount = items.filter(i => i.priority === 'high').length;

  // Handlers
  const handleSelectItem = useCallback((id: string) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('item', id);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (selectedItem) {
      router.push(selectedItem.primaryAction.targetRoute);
    }
  }, [router, selectedItem]);

  const handleSnooze = useCallback(() => {
    console.log('Snooze:', selectedId);
  }, [selectedId]);

  const handleDismiss = useCallback(() => {
    console.log('Dismiss:', selectedId);
    setSelectedId(null);
  }, [selectedId]);

  const handleOpenContact = useCallback(() => {
    if (selectedItem?.relatedContactId) {
      router.push(`/app/pr?tab=database&contactId=${selectedItem.relatedContactId}`);
    }
  }, [router, selectedItem]);

  const handleAddNote = useCallback(() => {
    console.log('Add note:', selectedId);
  }, [selectedId]);

  if (items.length === 0) {
    return <InboxZeroState />;
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px]">
      {/* Stats Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Work Queue</h2>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-white/10 text-white/70">
            {isLoading ? 'Loading...' : `${items.length} items`}
          </span>
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-semantic-danger/15 text-semantic-danger">
              {criticalCount} critical
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-semantic-warning/15 text-semantic-warning">
              {highCount} high
            </span>
          )}
        </div>
        <p className="text-[13px] text-white/40">Use ↑↓ to navigate</p>
      </div>

      {/* Error State */}
      {inboxError && (
        <div className="mb-4 p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/30">
          <div className="flex items-center gap-2 text-semantic-error">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Failed to load inbox from server. Showing demo data.</span>
          </div>
        </div>
      )}

      {/* Primary Outcome */}
      <p className="text-[13px] text-white/40 mb-4">Your highest-impact PR actions right now</p>

      {/* 3-Panel Layout */}
      <div className="flex gap-4 h-[calc(100%-40px)]">
        {/* Left: Section Navigation */}
        <SectionNav
          activeSection={activeSection}
          counts={counts}
          onSectionChange={setActiveSection}
        />

        {/* Middle: Queue List */}
        <div className="w-80 shrink-0 bg-[#0D0D12] rounded-xl border border-[#1A1A24] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#1A1A24] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              {activeSection === 'all' ? 'All Items' : INBOX_TYPE_CONFIG[activeSection].pluralLabel}
            </span>
            <span className="text-[10px] text-white/40">{filteredItems.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredItems.map(item => (
              <QueueItem
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onClick={() => handleSelectItem(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="flex-1 bg-[#0D0D12] rounded-xl border border-[#1A1A24] overflow-hidden">
          {selectedItem ? (
            <DetailPanel
              item={selectedItem}
              onPrimaryAction={handlePrimaryAction}
              onSnooze={handleSnooze}
              onDismiss={handleDismiss}
              onOpenContact={handleOpenContact}
              onAddNote={handleAddNote}
            />
          ) : (
            <EmptyDetailPanel />
          )}
        </div>
      </div>
    </div>
  );
}
