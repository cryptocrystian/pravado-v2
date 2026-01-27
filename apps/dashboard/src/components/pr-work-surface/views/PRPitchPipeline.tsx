'use client';

/**
 * PR Pitch Pipeline V1.1 - DS 3.0
 *
 * Stage-based kanban view of all pitches in progress with follow-up workflow.
 * Safe bulk actions only (generate drafts, queue for review) - NO bulk send.
 *
 * CRITICAL: send_pitch = Manual only (SYSTEM ENFORCED)
 *
 * @see /docs/canon/PR_PITCH_PIPELINE_CONTRACT.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md (V1.1)
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 */

import { useState, useMemo } from 'react';
import type { PitchPipelineItem, PitchPipelineStage, MediaContact, Pitch } from '../types';
import { ImpactStrip } from '../components/ImpactStrip';
import {
  prAccent,
  typography,
  buttonStyles,
} from '../prWorkSurfaceStyles';

// ============================================
// STAGE CONFIG (DS3)
// ============================================

interface StageConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  glowOnActive?: boolean;
}

const STAGE_CONFIG: Record<PitchPipelineStage, StageConfig> = {
  drafting: {
    label: 'Drafting',
    color: 'text-white/60',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/20',
    description: 'Pitches being composed',
  },
  ready_to_send: {
    label: 'Ready to Send',
    color: 'text-semantic-warning',
    bgColor: 'bg-semantic-warning/10',
    borderColor: 'border-semantic-warning/30',
    description: 'Awaiting manual send',
    glowOnActive: true,
  },
  sent: {
    label: 'Sent',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/10',
    borderColor: 'border-brand-cyan/30',
    description: 'Delivered, awaiting response',
  },
  opened: {
    label: 'Opened',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/10',
    borderColor: 'border-brand-iris/30',
    description: 'Email opened by recipient',
  },
  follow_up_due: {
    label: 'Follow-up Due',
    color: 'text-brand-magenta',
    bgColor: 'bg-brand-magenta/10',
    borderColor: 'border-brand-magenta/30',
    description: 'Follow-up window reached',
    glowOnActive: true,
  },
  replied: {
    label: 'Replied',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/10',
    borderColor: 'border-semantic-success/30',
    description: 'Journalist responded',
  },
  won: {
    label: 'Won',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/10',
    borderColor: 'border-semantic-success/30',
    description: 'Coverage obtained',
  },
  lost: {
    label: 'Lost',
    color: 'text-semantic-danger',
    bgColor: 'bg-semantic-danger/10',
    borderColor: 'border-semantic-danger/30',
    description: 'No coverage / declined',
  },
};

// Pipeline stage order for columns (hide lost from main view)
const STAGE_ORDER: PitchPipelineStage[] = [
  'drafting',
  'ready_to_send',
  'sent',
  'opened',
  'follow_up_due',
  'replied',
  'won',
];

// ============================================
// MOCK DATA
// ============================================

const MOCK_CONTACTS: MediaContact[] = [
  {
    id: 'contact-1',
    entityType: 'journalist',
    name: 'Sarah Chen',
    outlet: 'TechCrunch',
    email: 'sarah@techcrunch.com',
    beats: ['AI', 'Marketing Tech'],
    topicCurrency: 85,
    preferredChannels: ['email'],
    relationshipStage: 'warm',
    pitchEligibilityScore: 78,
    tags: [],
  },
  {
    id: 'contact-2',
    entityType: 'journalist',
    name: 'Michael Park',
    outlet: 'VentureBeat',
    email: 'michael@venturebeat.com',
    beats: ['Enterprise', 'SaaS'],
    topicCurrency: 72,
    preferredChannels: ['email'],
    relationshipStage: 'engaged',
    pitchEligibilityScore: 82,
    tags: [],
  },
  {
    id: 'contact-3',
    entityType: 'journalist',
    name: 'Lisa Wong',
    outlet: 'Forbes',
    email: 'lwong@forbes.com',
    beats: ['Marketing', 'CMO'],
    topicCurrency: 68,
    preferredChannels: ['email'],
    relationshipStage: 'warm',
    pitchEligibilityScore: 75,
    tags: [],
  },
];

const MOCK_PITCHES: Pitch[] = [
  {
    id: 'pitch-1',
    contactId: 'contact-1',
    subject: 'Exclusive: AI Marketing Platform Metrics',
    body: 'Hi Sarah...',
    personalizationScore: 85,
    status: 'draft',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    followUpCount: 0,
  },
  {
    id: 'pitch-2',
    contactId: 'contact-2',
    subject: 'Enterprise PR Intelligence Data',
    body: 'Hi Michael...',
    personalizationScore: 78,
    status: 'sent',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    sentAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    openedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    followUpCount: 0,
  },
  {
    id: 'pitch-3',
    contactId: 'contact-3',
    subject: 'CMO Guide to AI Citation',
    body: 'Hi Lisa...',
    personalizationScore: 82,
    status: 'scheduled',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    followUpCount: 0,
  },
];

const MOCK_PIPELINE_ITEMS: PitchPipelineItem[] = [
  {
    id: 'pipe-1',
    pitchId: 'pitch-1',
    pitch: MOCK_PITCHES[0],
    contact: MOCK_CONTACTS[0],
    stage: 'drafting',
    stageEnteredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    followUpCount: 0,
    maxFollowUps: 2,
    daysSinceLastActivity: 2,
    isOverdue: false,
    sageContributions: [{ dimension: 'signal', isPrimary: true }],
    eviImpact: { driver: 'visibility', direction: 'positive' },
  },
  {
    id: 'pipe-2',
    pitchId: 'pitch-2',
    pitch: MOCK_PITCHES[1],
    contact: MOCK_CONTACTS[1],
    stage: 'opened',
    stageEnteredAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    followUpWindow: {
      opensAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      closesAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      suggestedTemplates: ['gentle_nudge', 'added_value'],
    },
    followUpCount: 0,
    maxFollowUps: 2,
    daysSinceLastActivity: 3,
    isOverdue: false,
    sageContributions: [{ dimension: 'growth', isPrimary: true }],
    eviImpact: { driver: 'momentum', direction: 'neutral' },
  },
  {
    id: 'pipe-3',
    pitchId: 'pitch-3',
    pitch: MOCK_PITCHES[2],
    contact: MOCK_CONTACTS[2],
    stage: 'ready_to_send',
    stageEnteredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    followUpCount: 0,
    maxFollowUps: 2,
    daysSinceLastActivity: 1,
    isOverdue: false,
    sageContributions: [{ dimension: 'authority', isPrimary: true }],
    eviImpact: { driver: 'authority', direction: 'positive' },
  },
  {
    id: 'pipe-4',
    pitchId: 'pitch-4',
    pitch: { ...MOCK_PITCHES[0], id: 'pitch-4', subject: 'AI Trends Follow-up' },
    contact: MOCK_CONTACTS[0],
    stage: 'follow_up_due',
    stageEnteredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    followUpWindow: {
      opensAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      closesAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      suggestedTemplates: ['gentle_nudge'],
    },
    followUpCount: 1,
    maxFollowUps: 2,
    daysSinceLastActivity: 7,
    isOverdue: true,
    sageContributions: [{ dimension: 'growth', isPrimary: true }],
    eviImpact: { driver: 'momentum', direction: 'negative' },
  },
  {
    id: 'pipe-5',
    pitchId: 'pitch-5',
    pitch: { ...MOCK_PITCHES[1], id: 'pitch-5', status: 'replied', subject: 'Enterprise Feature Request' },
    contact: MOCK_CONTACTS[1],
    stage: 'replied',
    stageEnteredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    followUpCount: 0,
    maxFollowUps: 2,
    daysSinceLastActivity: 1,
    isOverdue: false,
    sageContributions: [
      { dimension: 'authority', isPrimary: true },
      { dimension: 'exposure', isPrimary: false },
    ],
    eviImpact: { driver: 'visibility', direction: 'positive' },
  },
  {
    id: 'pipe-6',
    pitchId: 'pitch-6',
    pitch: { ...MOCK_PITCHES[2], id: 'pitch-6', status: 'sent', subject: 'Q4 Marketing Report' },
    contact: MOCK_CONTACTS[2],
    stage: 'sent',
    stageEnteredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    followUpCount: 0,
    maxFollowUps: 2,
    daysSinceLastActivity: 2,
    isOverdue: false,
    sageContributions: [{ dimension: 'signal', isPrimary: true }],
    eviImpact: { driver: 'visibility', direction: 'neutral' },
  },
];

// ============================================
// PIPELINE CARD COMPONENT (DS3)
// ============================================

interface PipelineCardProps {
  item: PitchPipelineItem;
  onAction: (item: PitchPipelineItem, action: string) => void;
}

function PipelineCard({ item, onAction }: PipelineCardProps) {
  const stageConfig = STAGE_CONFIG[item.stage];

  const getPrimaryCTA = () => {
    switch (item.stage) {
      case 'drafting':
        return { label: 'Edit', action: 'edit', style: 'secondary' };
      case 'ready_to_send':
        return { label: 'Send', action: 'send', style: 'primary' };
      case 'sent':
        return { label: 'View', action: 'view', style: 'secondary' };
      case 'opened':
        return { label: 'Draft Follow-up', action: 'follow_up', style: 'secondary' };
      case 'follow_up_due':
        return { label: 'Send Follow-up', action: 'follow_up', style: 'primary' };
      case 'replied':
        return { label: 'Continue', action: 'continue', style: 'success' };
      case 'won':
        return { label: 'View Coverage', action: 'view_coverage', style: 'success' };
      case 'lost':
        return { label: 'Archive', action: 'archive', style: 'secondary' };
      default:
        return { label: 'View', action: 'view', style: 'secondary' };
    }
  };

  const cta = getPrimaryCTA();

  const ctaStyles = {
    primary: 'bg-brand-magenta text-white hover:bg-brand-magenta/90 shadow-[0_0_12px_rgba(232,121,249,0.25)]',
    secondary: 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10',
    success: 'bg-semantic-success/20 text-semantic-success hover:bg-semantic-success/30 border border-semantic-success/30',
  };

  return (
    <div className={`p-3 rounded-xl bg-[#0D0D12] border ${stageConfig.borderColor} hover:border-[#2A2A36] transition-all duration-200 ${item.isOverdue ? 'ring-1 ring-semantic-danger/30' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${stageConfig.bgColor} ${stageConfig.color}`}>
          {item.contact.outlet}
        </span>
        <span className="text-[10px] text-white/50">
          {item.daysSinceLastActivity}d {item.isOverdue && <span className="text-semantic-danger font-medium">(Overdue)</span>}
        </span>
      </div>

      {/* Contact */}
      <div className="text-sm font-medium text-white mb-1 truncate">
        {item.contact.name}
      </div>

      {/* Subject */}
      <div className="text-xs text-white/55 truncate mb-3">
        {item.pitch.subject}
      </div>

      {/* Impact Strip */}
      <div className="mb-3 p-2 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
        <ImpactStrip
          sageContributions={item.sageContributions}
          eviImpact={item.eviImpact}
          mode="manual"
          compact
        />
      </div>

      {/* Follow-up indicator */}
      {item.followUpWindow && (
        <div className="mb-3 flex items-center gap-2 text-[11px]">
          <span className="text-white/50">Follow-up:</span>
          <span className="text-brand-magenta font-medium">{item.followUpCount}/{item.maxFollowUps}</span>
          {item.followUpWindow.suggestedTemplates && (
            <span className="text-white/40">
              ({item.followUpWindow.suggestedTemplates[0]?.replace('_', ' ')})
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAction(item, cta.action)}
          className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${ctaStyles[cta.style as keyof typeof ctaStyles]}`}
        >
          {cta.label}
        </button>
        <button
          type="button"
          onClick={() => onAction(item, 'more')}
          className="px-2 py-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// STAGE COLUMN COMPONENT (DS3)
// ============================================

interface StageColumnProps {
  stage: PitchPipelineStage;
  items: PitchPipelineItem[];
  onAction: (item: PitchPipelineItem, action: string) => void;
}

function StageColumn({ stage, items, onAction }: StageColumnProps) {
  const config = STAGE_CONFIG[stage];
  const hasActiveItems = items.length > 0;

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className={`mb-3 p-3 rounded-xl border ${config.borderColor} ${config.bgColor} ${hasActiveItems && config.glowOnActive ? 'shadow-[0_0_16px_rgba(232,121,249,0.15)]' : ''}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#0A0A0F] ${config.color}`}>
            {items.length}
          </span>
        </div>
        <p className="text-[11px] text-white/50 mt-1">{config.description}</p>
      </div>

      {/* Cards */}
      <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {items.map((item) => (
          <PipelineCard key={item.id} item={item} onAction={onAction} />
        ))}
        {items.length === 0 && (
          <div className="p-6 text-center border border-dashed border-[#1A1A24] rounded-xl">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#0D0D12] flex items-center justify-center">
              <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-xs text-white/40">No pitches</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPOSE DRAWER COMPONENT (DS3)
// ============================================

interface ComposeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialContact?: MediaContact;
}

function ComposeDrawer({ isOpen, onClose, initialContact }: ComposeDrawerProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0D0D12] border-l border-[#1A1A24] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#1A1A24]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${prAccent.bg} flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${prAccent.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h2 className={typography.titleMedium}>Compose Pitch</h2>
                <p className="text-xs text-white/55 mt-0.5">Manual send required</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/55 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Recipient */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2 block">To</label>
            <div className="px-4 py-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24]">
              {initialContact ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-magenta/15 flex items-center justify-center text-brand-magenta text-sm font-medium">
                    {initialContact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{initialContact.name}</div>
                    <div className="text-xs text-white/50">{initialContact.outlet}</div>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="w-full px-4 py-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white placeholder:text-white/40 focus:outline-none focus:border-brand-magenta/50 transition-colors"
            />
          </div>

          {/* Body */}
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2 block">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your pitch..."
              rows={12}
              className="w-full px-4 py-3 rounded-lg bg-[#0A0A0F] border border-[#1A1A24] text-white placeholder:text-white/40 focus:outline-none focus:border-brand-magenta/50 transition-colors resize-none"
            />
          </div>

          {/* AI Suggestions */}
          <div className="p-4 rounded-xl bg-brand-iris/5 border border-brand-iris/20">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs font-medium text-brand-iris">SAGE Suggestions</span>
            </div>
            <div className="space-y-2">
              <button type="button" className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Generate personalized opening
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Add topic-relevant hook
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Improve call-to-action
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1A1A24]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span>Personalization: <span className="text-brand-magenta font-medium">--</span></span>
              <span>Topic Currency: <span className="text-semantic-success font-medium">85%</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white/70 bg-white/5 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors"
            >
              Save Draft
            </button>
            <button
              type="button"
              className={buttonStyles.primary}
            >
              Move to Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PIPELINE COMPONENT
// ============================================

type ViewMode = 'column' | 'table';

export function PRPitchPipeline() {
  const [items] = useState<PitchPipelineItem[]>(MOCK_PIPELINE_ITEMS);
  const [viewMode, setViewMode] = useState<ViewMode>('column');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Group items by stage
  const groupedItems = useMemo(() => {
    const groups: Record<PitchPipelineStage, PitchPipelineItem[]> = {
      drafting: [],
      ready_to_send: [],
      sent: [],
      opened: [],
      follow_up_due: [],
      replied: [],
      won: [],
      lost: [],
    };

    items.forEach((item) => {
      groups[item.stage].push(item);
    });

    return groups;
  }, [items]);

  const handleAction = (item: PitchPipelineItem, action: string) => {
    console.log('Pipeline action:', action, item.id);
    // Route to appropriate screen based on action
  };

  const handleBulkAction = (action: string) => {
    if (selectedItems.size === 0) return;
    console.log('Bulk action:', action, Array.from(selectedItems));
    // Implement safe bulk actions
  };

  // Counts
  const totalActive = items.filter((i) => !['won', 'lost'].includes(i.stage)).length;
  const overdueCount = items.filter((i) => i.isOverdue).length;
  const readyToSendCount = groupedItems.ready_to_send.length;
  const followUpDueCount = groupedItems.follow_up_due.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h3 className={typography.titleLarge}>Pitch Pipeline</h3>
            {/* Quick Stats */}
            <div className="flex items-center gap-2">
              {readyToSendCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/30">
                  {readyToSendCount} ready
                </span>
              )}
              {followUpDueCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/30">
                  {followUpDueCount} follow-up
                </span>
              )}
              {overdueCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/30">
                  {overdueCount} overdue
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-white/55 mt-1">
            {totalActive} active pitches in pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-[#0D0D12] border border-[#1A1A24] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('column')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'column' ? 'bg-brand-magenta text-white' : 'text-white/55 hover:text-white'}`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'table' ? 'bg-brand-magenta text-white' : 'text-white/55 hover:text-white'}`}
            >
              List
            </button>
          </div>

          {/* New Pitch */}
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className={buttonStyles.primary}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Pitch
          </button>
        </div>
      </div>

      {/* Safe Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
          <span className="text-sm text-white/70"><span className="font-medium text-white">{selectedItems.size}</span> selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction('generate_drafts')}
              className="px-3 py-1.5 text-xs font-medium bg-white/5 text-white/70 rounded-lg hover:text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              Generate Drafts
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('queue_review')}
              className="px-3 py-1.5 text-xs font-medium bg-white/5 text-white/70 rounded-lg hover:text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              Queue for Review
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('export')}
              className="px-3 py-1.5 text-xs font-medium bg-white/5 text-white/70 rounded-lg hover:text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              Export
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSelectedItems(new Set())}
            className="ml-auto text-xs text-white/50 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Column View */}
      {viewMode === 'column' && (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {STAGE_ORDER.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              items={groupedItems[stage]}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-hidden rounded-xl border border-[#1A1A24]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0D0D12]">
                <th className="w-8 px-3 py-3">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(items.map((i) => i.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                    className="rounded border-[#2A2A36] bg-[#0A0A0F]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Contact</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Subject</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Stage</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Days</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Impact</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A24]">
              {items.map((item) => {
                const stageConfig = STAGE_CONFIG[item.stage];
                return (
                  <tr key={item.id} className="bg-[#0A0A0F] hover:bg-[#111116] transition-colors">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          const next = new Set(selectedItems);
                          if (e.target.checked) {
                            next.add(item.id);
                          } else {
                            next.delete(item.id);
                          }
                          setSelectedItems(next);
                        }}
                        className="rounded border-[#2A2A36] bg-[#0A0A0F]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{item.contact.name}</div>
                      <div className="text-xs text-white/50">{item.contact.outlet}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/55 max-w-xs truncate">
                      {item.pitch.subject}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-[11px] font-medium rounded border ${stageConfig.bgColor} ${stageConfig.color} ${stageConfig.borderColor}`}>
                        {stageConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/55">
                      {item.daysSinceLastActivity}d
                      {item.isOverdue && <span className="text-semantic-danger ml-1 font-medium">!</span>}
                    </td>
                    <td className="px-4 py-3">
                      <ImpactStrip
                        sageContributions={item.sageContributions}
                        eviImpact={item.eviImpact}
                        mode="manual"
                        compact
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleAction(item, 'view')}
                        className="px-3 py-1.5 text-xs font-medium text-brand-magenta hover:text-white hover:bg-brand-magenta/15 rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No bulk send warning (DS3) */}
      <div className="p-4 rounded-xl bg-semantic-warning/5 border border-semantic-warning/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-semantic-warning/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-semantic-warning">Relationship-First Approach</h4>
            <p className="text-xs text-white/55 mt-1">
              All pitch sends require individual action to maintain relationship quality. Bulk send is not available by design.
              <span className="text-white/70 ml-1">send_pitch = Manual only (System Enforced)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Compose Drawer */}
      <ComposeDrawer
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </div>
  );
}
