'use client';

/**
 * PR Pitches View (V1.1) - DS 3.0
 *
 * Compose, track, and follow up on pitches with:
 * - Kanban pipeline view (default) + list view toggle
 * - Stage-based visual progression
 * - NO auto-send - all pitches require manual send action
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/PR_PITCH_PIPELINE_CONTRACT.md
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 *
 * OMNI-TRAY INTEGRATION (TODO):
 * - Dispatch event when AI-generated pitch ready for review (approval_required)
 * - Dispatch event when optimal follow-up window reached (action_required)
 * - Dispatch event when pitch reply received (action_required, positive signal)
 * - See: /contracts/examples/omni-tray-pr-events.json
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR, { mutate } from 'swr';

import type { Pitch, PitchStatus, MediaContact } from '../types';

// ============================================
// API TYPES & FETCHER
// ============================================

interface PitchSequenceContact {
  id: string;
  sequenceId: string;
  journalistId: string;
  journalist?: {
    id: string;
    fullName: string;
    primaryEmail: string;
    primaryOutlet: string | null;
    beat: string | null;
    engagementScore: number;
    responsivenessScore: number;
  };
  status: 'queued' | 'sending' | 'sent' | 'opened' | 'replied' | 'bounced' | 'opted_out' | 'failed';
  personalizedSubject: string | null;
  personalizedBody: string | null;
  personalizationScore: number;
  currentStep: number;
  lastEventAt: string | null;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface PitchSequence {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  pressReleaseId: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  defaultSubject: string | null;
  defaultPreviewText: string | null;
  settings: {
    sendWindow?: { startHour: number; endHour: number; timezone: string };
    followUpDelayDays?: number;
    maxAttempts?: number;
    excludeWeekends?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  contacts?: PitchSequenceContact[];
  _count?: { contacts: number };
}

interface PitchSequencesResponse {
  sequences: PitchSequence[];
  total: number;
  limit: number;
  offset: number;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch pitch data');
    throw error;
  }
  return res.json();
};

// Map API sequence contact to UI Pitch format
function mapSequenceContactToPitch(
  contact: PitchSequenceContact,
  sequence: PitchSequence
): Pitch {
  // Map contact status to pitch status
  const statusMap: Record<string, PitchStatus> = {
    queued: 'draft',
    sending: 'scheduled',
    sent: 'sent',
    opened: 'opened',
    replied: 'replied',
    bounced: 'declined',
    opted_out: 'declined',
    failed: 'declined',
  };

  // Map journalist data to MediaContact
  const mediaContact: MediaContact | undefined = contact.journalist
    ? {
        id: contact.journalist.id,
        entityType: 'journalist',
        name: contact.journalist.fullName,
        email: contact.journalist.primaryEmail,
        outlet: contact.journalist.primaryOutlet ?? undefined,
        beats: contact.journalist.beat ? [contact.journalist.beat] : [],
        topicCurrency: Math.round((contact.journalist.responsivenessScore || 0) * 100),
        preferredChannels: ['email'],
        relationshipStage: contact.journalist.engagementScore >= 0.6 ? 'engaged' : contact.journalist.engagementScore >= 0.4 ? 'warm' : 'cold',
        pitchEligibilityScore: Math.round((contact.journalist.responsivenessScore || 0) * 100),
        tags: [],
      }
    : undefined;

  return {
    id: contact.id,
    contactId: contact.journalistId,
    sequenceId: contact.sequenceId, // Required for manual send API
    contact: mediaContact,
    subject: contact.personalizedSubject || sequence.defaultSubject || 'Untitled Pitch',
    body: contact.personalizedBody || '',
    personalizationScore: contact.personalizationScore || 0,
    status: statusMap[contact.status] || 'draft',
    createdAt: contact.createdAt,
    sentAt: contact.sentAt ?? undefined,
    openedAt: contact.openedAt ?? undefined,
    repliedAt: contact.repliedAt ?? undefined,
    followUpCount: contact.currentStep,
  };
}

// ============================================
// TYPES
// ============================================

type ViewMode = 'kanban' | 'list';

interface PipelineStage {
  id: PitchStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

// ============================================
// PIPELINE STAGES CONFIG - DS3
// ============================================

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'draft',
    label: 'Drafting',
    description: 'In progress, not ready',
    color: 'text-white/55',
    bgColor: 'bg-white/10 border-white/20',
  },
  {
    id: 'scheduled',
    label: 'Ready to Send',
    description: 'Approved, awaiting manual send',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/10 border-brand-cyan/20',
  },
  {
    id: 'sent',
    label: 'Sent',
    description: 'Delivered, awaiting response',
    color: 'text-semantic-warning',
    bgColor: 'bg-semantic-warning/10 border-semantic-warning/20',
  },
  {
    id: 'opened',
    label: 'Opened',
    description: 'Recipient engaged',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/10 border-semantic-success/20',
  },
  {
    id: 'replied',
    label: 'Replied',
    description: 'Response received',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/10 border-brand-iris/20',
  },
];

// ============================================
// MOCK DATA
// ============================================

// Mock last interaction data for relationship context
const MOCK_LAST_INTERACTION: Record<string, string> = {
  c1: '3 days ago',
  c2: '15 days ago',
  c3: '1 day ago',
  c4: '4 days ago',
  c5: '21 days ago',
};

// Fixed dates for mock data to avoid hydration mismatches
// Using stable dates instead of Date.now() which differs between server/client
const MOCK_PITCHES: Pitch[] = [
  {
    id: 'p1',
    contactId: 'c1',
    sequenceId: 'seq-mock-001', // Required for manual send API
    contact: {
      id: 'c1',
      entityType: 'journalist',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcrunch.com',
      outlet: 'TechCrunch',
      beats: ['AI', 'Startups'],
      topicCurrency: 92,
      preferredChannels: ['email'],
      relationshipStage: 'warm',
      pitchEligibilityScore: 85,
      tags: [],
    },
    subject: 'AI-Powered PR Platform Launch - Exclusive Story',
    body: 'Hi Sarah, I wanted to reach out about our upcoming launch...',
    personalizationScore: 78,
    status: 'sent',
    createdAt: '2025-01-22T10:00:00Z',
    sentAt: '2025-01-23T10:00:00Z',
    followUpCount: 0,
  },
  {
    id: 'p2',
    contactId: 'c2',
    sequenceId: 'seq-mock-002',
    contact: {
      id: 'c2',
      entityType: 'journalist',
      name: 'Mike Rodriguez',
      outlet: 'Wired',
      beats: ['Enterprise Tech'],
      topicCurrency: 75,
      preferredChannels: ['email'],
      relationshipStage: 'cold',
      pitchEligibilityScore: 62,
      tags: [],
    },
    subject: 'Thought Leadership: Future of Marketing Operations',
    body: 'Hi Mike, Given your recent coverage of enterprise AI...',
    personalizationScore: 85,
    status: 'draft',
    createdAt: '2025-01-24T10:00:00Z',
    followUpCount: 0,
  },
  {
    id: 'p3',
    contactId: 'c3',
    sequenceId: 'seq-mock-003',
    contact: {
      id: 'c3',
      entityType: 'journalist',
      name: 'Emma Wilson',
      outlet: 'Forbes',
      beats: ['MarTech'],
      topicCurrency: 88,
      preferredChannels: ['email'],
      relationshipStage: 'engaged',
      pitchEligibilityScore: 91,
      tags: [],
    },
    subject: 'Re: AI Marketing Platform - Follow Up',
    body: 'Hi Emma, Just following up on my previous email...',
    personalizationScore: 72,
    status: 'opened',
    createdAt: '2025-01-20T10:00:00Z',
    sentAt: '2025-01-21T10:00:00Z',
    openedAt: '2025-01-22T10:00:00Z',
    followUpCount: 1,
  },
  {
    id: 'p4',
    contactId: 'c4',
    sequenceId: 'seq-mock-004',
    contact: {
      id: 'c4',
      entityType: 'journalist',
      name: 'David Park',
      outlet: 'VentureBeat',
      beats: ['AI', 'Startups', 'Enterprise'],
      topicCurrency: 80,
      preferredChannels: ['email'],
      relationshipStage: 'warm',
      pitchEligibilityScore: 78,
      tags: [],
    },
    subject: 'Exclusive: PRAVADO Launches AI-First PR Platform',
    body: 'Hi David, Big news from the MarTech space...',
    personalizationScore: 92,
    status: 'replied',
    createdAt: '2025-01-18T10:00:00Z',
    sentAt: '2025-01-19T10:00:00Z',
    openedAt: '2025-01-20T10:00:00Z',
    repliedAt: '2025-01-21T10:00:00Z',
    followUpCount: 0,
  },
  {
    id: 'p5',
    contactId: 'c5',
    sequenceId: 'seq-mock-005',
    contact: {
      id: 'c5',
      entityType: 'podcast',
      name: 'Marketing AI Show',
      beats: ['AI Marketing'],
      topicCurrency: 85,
      preferredChannels: ['email'],
      relationshipStage: 'cold',
      pitchEligibilityScore: 70,
      tags: [],
    },
    subject: 'Guest Pitch: AI in Modern PR',
    body: 'Hi team, I would love to discuss AI-powered PR on your show...',
    personalizationScore: 68,
    status: 'scheduled',
    createdAt: '2025-01-24T10:00:00Z',
    followUpCount: 0,
  },
];

// ============================================
// BADGE COMPONENTS - DS3
// ============================================

function StatusBadge({ status }: { status: PitchStatus }) {
  const stage = PIPELINE_STAGES.find((s) => s.id === status);
  if (!stage) return null;

  return (
    <span className={`px-2 py-0.5 text-[13px] font-medium rounded-full ${stage.bgColor.replace('/10', '/20')} ${stage.color}`}>
      {stage.label}
    </span>
  );
}

function PersonalizationScore({ score }: { score: number }) {
  const color = score >= 80 ? 'text-semantic-success' : score >= 60 ? 'text-semantic-warning' : 'text-semantic-danger';
  const bgColor = score >= 80 ? 'bg-semantic-success' : score >= 60 ? 'bg-semantic-warning' : 'bg-semantic-danger';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 rounded-full bg-[#1A1A24] overflow-hidden">
        <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[13px] font-medium ${color}`}>{score}</span>
    </div>
  );
}

function RelationshipBadge({ stage }: { stage: string }) {
  const config: Record<string, { color: string; label: string }> = {
    cold: { color: 'bg-white/10 text-white/55', label: 'Cold' },
    warm: { color: 'bg-semantic-warning/15 text-semantic-warning', label: 'Warm' },
    engaged: { color: 'bg-semantic-success/15 text-semantic-success', label: 'Engaged' },
    advocate: { color: 'bg-brand-iris/20 text-brand-iris', label: 'Advocate' },
  };
  const { color, label } = config[stage] || config.cold;
  return <span className={`px-1.5 py-0.5 text-[13px] font-medium rounded ${color}`}>{label}</span>;
}

// ============================================
// KANBAN CARD COMPONENT - DS3
// ============================================

interface KanbanCardProps {
  pitch: Pitch;
  onClick: () => void;
  isSelected: boolean;
}

function KanbanCard({ pitch, onClick, isSelected }: KanbanCardProps) {
  // Calculate days ago on client only to avoid hydration mismatch
  const [daysAgo, setDaysAgo] = useState<number | null>(null);
  const lastInteraction = pitch.contactId ? MOCK_LAST_INTERACTION[pitch.contactId] : null;

  useEffect(() => {
    setDaysAgo(Math.floor((Date.now() - new Date(pitch.createdAt).getTime()) / 86400000));
  }, [pitch.createdAt]);

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all group ${
        isSelected
          ? 'border-brand-iris bg-brand-iris/10 shadow-lg shadow-brand-iris/10'
          : 'border-[#1A1A24] bg-[#0D0D12] hover:border-[#2A2A36] hover:bg-[#13131A]'
      }`}
    >
      {/* Contact */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white">
          {pitch.contact?.name?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{pitch.contact?.name}</div>
          {pitch.contact?.outlet && (
            <div className="text-[13px] text-white/55 truncate">{pitch.contact.outlet}</div>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="text-[13px] text-white/55 line-clamp-2 mb-3">{pitch.subject}</div>

      {/* Footer - Relationship context */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1A1A24]">
        <div className="flex items-center gap-2">
          {pitch.contact?.relationshipStage && <RelationshipBadge stage={pitch.contact.relationshipStage} />}
          {pitch.followUpCount > 0 && (
            <span className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-semantic-warning/15 text-semantic-warning">
              +{pitch.followUpCount}
            </span>
          )}
        </div>
        <div className="text-[13px] text-white/40">{daysAgo !== null ? `${daysAgo}d` : '—'}</div>
      </div>

      {/* Last interaction context */}
      {lastInteraction && (
        <div className="mt-1.5 text-[13px] text-white/30">
          Last contact: {lastInteraction}
        </div>
      )}

      {/* Personalization Score */}
      <div className="mt-2 pt-2 border-t border-[#1A1A24]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-white/55">Personalization</span>
          <PersonalizationScore score={pitch.personalizationScore} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// KANBAN COLUMN COMPONENT - DS3
// ============================================

interface KanbanColumnProps {
  stage: PipelineStage;
  pitches: Pitch[];
  selectedPitchId: string | null;
  onSelectPitch: (pitch: Pitch) => void;
}

function KanbanColumn({ stage, pitches, selectedPitchId, onSelectPitch }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[240px] max-w-[280px]">
      {/* Column Header */}
      <div className={`p-3 rounded-t-xl border-t-2 ${stage.bgColor} border-b-0`} style={{ borderTopColor: stage.color.replace('text-', '').includes('brand') ? 'rgb(var(--brand-iris))' : undefined }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm font-semibold ${stage.color}`}>{stage.label}</h3>
          <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded ${stage.bgColor} ${stage.color}`}>
            {pitches.length}
          </span>
        </div>
        <p className="text-[13px] text-white/55">{stage.description}</p>
      </div>

      {/* Cards Container */}
      <div className="p-2 space-y-2 bg-[#0A0A0F]/50 rounded-b-xl border border-[#1A1A24] border-t-0 min-h-[200px]">
        {pitches.map((pitch) => (
          <KanbanCard
            key={pitch.id}
            pitch={pitch}
            isSelected={selectedPitchId === pitch.id}
            onClick={() => onSelectPitch(pitch)}
          />
        ))}
        {pitches.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-[13px] text-white/55">No pitches</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// LIST ROW COMPONENT - DS3
// ============================================

interface ListRowProps {
  pitch: Pitch;
  onClick: () => void;
  isSelected: boolean;
}

function ListRow({ pitch, onClick, isSelected }: ListRowProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-brand-iris bg-brand-iris/5'
          : 'border-[#1A1A24] bg-[#0D0D12] hover:border-[#2A2A36]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={pitch.status} />
            {pitch.followUpCount > 0 && (
              <span className="px-1.5 py-0.5 text-[13px] font-medium rounded bg-white/10 text-white/55">
                +{pitch.followUpCount} follow-up
              </span>
            )}
          </div>
          <h3 className="font-medium text-white mb-1">{pitch.subject}</h3>
          <div className="flex items-center gap-3 text-sm text-white/55">
            <span>To: {pitch.contact?.name || 'Unknown'}</span>
            {pitch.contact?.outlet && <span className="text-brand-cyan">{pitch.contact.outlet}</span>}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[13px] text-white/55 mb-2">Personalization</div>
          <PersonalizationScore score={pitch.personalizationScore} />
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-3 pt-3 border-t border-[#1A1A24] flex items-center gap-4 text-[13px] text-white/55">
        <span>Created {new Date(pitch.createdAt).toLocaleDateString()}</span>
        {pitch.sentAt && <span>Sent {new Date(pitch.sentAt).toLocaleDateString()}</span>}
        {pitch.openedAt && (
          <span className="text-semantic-success">Opened {new Date(pitch.openedAt).toLocaleDateString()}</span>
        )}
        {pitch.repliedAt && (
          <span className="text-brand-iris">Replied {new Date(pitch.repliedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

// ============================================
// VIEW TOGGLE COMPONENT - DS3
// ============================================

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#13131A] border border-[#1A1A24]">
      <button
        type="button"
        onClick={() => onChange('kanban')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          mode === 'kanban' ? 'bg-brand-iris/20 text-brand-iris' : 'text-white/55 hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        Pipeline
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          mode === 'list' ? 'bg-brand-iris/20 text-brand-iris' : 'text-white/55 hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        List
      </button>
    </div>
  );
}

// ============================================
// TOAST COMPONENT - DS3
// ============================================

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  variant?: 'success' | 'error' | 'info';
}

function Toast({ message, isVisible, onClose, variant = 'success' }: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const variantStyles = {
    success: 'bg-semantic-success/10 border-semantic-success/30 text-semantic-success',
    error: 'bg-semantic-error/10 border-semantic-error/30 text-semantic-error',
    info: 'bg-brand-iris/10 border-brand-iris/30 text-brand-iris',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${variantStyles[variant]} shadow-lg`}>
        {variant === 'success' && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {variant === 'error' && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="text-sm font-medium">{message}</span>
        <button type="button" onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// PITCH DETAIL PANEL - DS3
// ============================================

interface PitchDetailPanelProps {
  pitch: Pitch;
  onClose: () => void;
  onManualSendSuccess: () => void;
}

function PitchDetailPanel({ pitch, onClose, onManualSendSuccess }: PitchDetailPanelProps) {
  const stage = PIPELINE_STAGES.find((s) => s.id === pitch.status);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const handleManualSend = useCallback(async () => {
    if (!pitch.sequenceId || !pitch.contactId) {
      setToast({ message: 'Missing sequence or contact ID', variant: 'error' });
      // Dev-only strict mode logging
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_PRAVADO_STRICT_API === '1') {
        console.error('[Manual Send] Missing required IDs:', { sequenceId: pitch.sequenceId, contactId: pitch.contactId });
      }
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/pr/pitches/manual-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequenceId: pitch.sequenceId,
          contactId: pitch.contactId,
          stepPosition: pitch.followUpCount + 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send pitch');
      }

      // Success: show toast and trigger revalidation
      setToast({ message: 'Pitch recorded as sent', variant: 'success' });

      // Revalidate SWR caches
      await Promise.all([
        mutate('/api/pr/pitches/sequences?limit=100'),
        mutate('/api/pr/inbox'),
      ]);

      // Notify parent of success (will update local state)
      onManualSendSuccess();

      // Dev logging for attribution tracking
      if (process.env.NODE_ENV === 'development') {
        console.log('[Manual Send] Success:', {
          eventId: data.eventId,
          newStatus: data.newStatus,
          eviAttribution: data.eviAttribution,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setToast({ message, variant: 'error' });

      // Dev-only strict mode logging
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_PRAVADO_STRICT_API === '1') {
        console.error('[Manual Send] Error:', message);
      }
    } finally {
      setIsSending(false);
    }
  }, [pitch.sequenceId, pitch.contactId, pitch.followUpCount, onManualSendSuccess]);

  return (
    <div className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-lg bg-[#0D0D12] border-l border-[#1A1A24] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Pitch Details</h2>
              {stage && <span className={`px-2 py-0.5 text-[13px] font-medium rounded-full ${stage.bgColor.replace('/10', '/20')} ${stage.color}`}>{stage.label}</span>}
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

          <div className="space-y-6">
            {/* Contact Info */}
            <div className="p-4 rounded-xl bg-[#0A0A0F] border border-[#1A1A24]">
              <h4 className="text-sm font-medium text-white/55 mb-3">Recipient</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                  {pitch.contact?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-medium text-white">{pitch.contact?.name || 'Unknown'}</div>
                  {pitch.contact?.outlet && <div className="text-sm text-white/55">{pitch.contact.outlet}</div>}
                </div>
              </div>
              {pitch.contact && (
                <div className="mt-3 pt-3 border-t border-[#1A1A24] flex items-center gap-2">
                  <RelationshipBadge stage={pitch.contact.relationshipStage} />
                  <span className="text-[13px] text-white/55">Pitch Score: {pitch.contact.pitchEligibilityScore}</span>
                </div>
              )}
            </div>

            {/* Subject & Body */}
            <div>
              <h4 className="text-sm font-medium text-white/55 mb-2">Subject</h4>
              <p className="text-white font-medium">{pitch.subject}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-white/55 mb-2">Message Preview</h4>
              <div className="p-3 rounded-lg bg-[#13131A] border border-[#1A1A24]">
                <p className="text-sm text-white/55 whitespace-pre-wrap">{pitch.body}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[#13131A]">
                <div className="text-sm text-white/55 mb-1">Personalization</div>
                <div className={`text-2xl font-bold ${pitch.personalizationScore >= 80 ? 'text-semantic-success' : pitch.personalizationScore >= 60 ? 'text-semantic-warning' : 'text-semantic-danger'}`}>
                  {pitch.personalizationScore}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#13131A]">
                <div className="text-sm text-white/55 mb-1">Follow-ups</div>
                <div className="text-2xl font-bold text-white">{pitch.followUpCount}</div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium text-white/55 mb-3">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="text-white/55">Created</span>
                  <span className="text-white">{new Date(pitch.createdAt).toLocaleDateString()}</span>
                </div>
                {pitch.sentAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-semantic-warning" />
                    <span className="text-white/55">Sent</span>
                    <span className="text-white">{new Date(pitch.sentAt).toLocaleDateString()}</span>
                  </div>
                )}
                {pitch.openedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-semantic-success" />
                    <span className="text-white/55">Opened</span>
                    <span className="text-white">{new Date(pitch.openedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {pitch.repliedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-brand-iris" />
                    <span className="text-white/55">Replied</span>
                    <span className="text-white">{new Date(pitch.repliedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#1A1A24] space-y-3">
              {pitch.status === 'draft' && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand-iris rounded-lg hover:bg-brand-iris/90 transition-colors"
                >
                  Continue Editing
                </button>
              )}
              {pitch.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={handleManualSend}
                  disabled={isSending}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand-iris rounded-lg hover:bg-brand-iris/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Now (Manual)'
                  )}
                </button>
              )}
              {(pitch.status === 'sent' || pitch.status === 'opened') && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-sm font-medium text-semantic-warning bg-semantic-warning/10 rounded-lg hover:bg-semantic-warning/20 transition-colors ring-1 ring-semantic-warning/30"
                >
                  Schedule Follow-up
                </button>
              )}
              {pitch.status === 'replied' && (
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-sm font-medium text-semantic-success bg-semantic-success/10 rounded-lg hover:bg-semantic-success/20 transition-colors ring-1 ring-semantic-success/30"
                >
                  View Conversation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ============================================
// NEW PITCH MODAL COMPONENT
// ============================================

interface NewPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function NewPitchModal({ isOpen, onClose, onSuccess }: NewPitchModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create a new pitch sequence
      const response = await fetch('/api/pr/pitches/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subject,
          defaultSubject: subject,
          defaultBody: body,
          contactEmail: contactEmail || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create pitch');
      }

      // Success - revalidate and close
      await mutate('/api/pr/pitches/sequences?limit=100');
      onSuccess();
      onClose();

      // Reset form
      setSubject('');
      setBody('');
      setContactEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0D0D12] border border-[#1A1A24] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A1A24]">
          <div>
            <h2 className="text-lg font-semibold text-white">New Pitch</h2>
            <p className="text-sm text-white/55 mt-1">Create a new pitch draft</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/30 text-semantic-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="pitch-contact" className="block text-sm font-medium text-white/70 mb-2">
              Recipient Email (optional)
            </label>
            <input
              id="pitch-contact"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="journalist@outlet.com"
              className="w-full px-4 py-2.5 bg-[#13131A] border border-[#1A1A24] rounded-lg text-white placeholder:text-white/30 focus:border-brand-iris focus:ring-1 focus:ring-brand-iris outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="pitch-subject" className="block text-sm font-medium text-white/70 mb-2">
              Subject Line *
            </label>
            <input
              id="pitch-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              required
              className="w-full px-4 py-2.5 bg-[#13131A] border border-[#1A1A24] rounded-lg text-white placeholder:text-white/30 focus:border-brand-iris focus:ring-1 focus:ring-brand-iris outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="pitch-body" className="block text-sm font-medium text-white/70 mb-2">
              Pitch Body *
            </label>
            <textarea
              id="pitch-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your pitch message..."
              required
              rows={6}
              className="w-full px-4 py-2.5 bg-[#13131A] border border-[#1A1A24] rounded-lg text-white placeholder:text-white/30 focus:border-brand-iris focus:ring-1 focus:ring-brand-iris outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white/70 bg-[#1A1A24] rounded-lg hover:bg-[#2A2A36] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-iris rounded-lg hover:bg-brand-iris/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Pitch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PRPitches() {
  // Fetch pitch sequences from real API
  const { data: sequencesData, error: pitchesError, isLoading } = useSWR<PitchSequencesResponse>(
    '/api/pr/pitches/sequences?limit=100',
    fetcher,
    { revalidateOnFocus: false }
  );

  // Map API data to UI format, fallback to mock data if no results
  const pitches = useMemo(() => {
    if (sequencesData?.sequences && sequencesData.sequences.length > 0) {
      // Flatten contacts from all sequences into individual pitches
      const allPitches: Pitch[] = [];
      for (const sequence of sequencesData.sequences) {
        if (sequence.contacts) {
          for (const contact of sequence.contacts) {
            allPitches.push(mapSequenceContactToPitch(contact, sequence));
          }
        }
      }
      if (allPitches.length > 0) {
        return allPitches;
      }
    }
    // Fallback to mock data if API returns empty
    return MOCK_PITCHES;
  }, [sequencesData]);

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [listFilter, setListFilter] = useState<PitchStatus | 'all'>('all');
  const [isNewPitchModalOpen, setIsNewPitchModalOpen] = useState(false);

  // Group pitches by stage for kanban view
  const pitchesByStage = useMemo(() => {
    const grouped: Record<PitchStatus, Pitch[]> = {
      draft: [],
      scheduled: [],
      sent: [],
      opened: [],
      replied: [],
      declined: [],
    };
    pitches.forEach((p) => {
      if (grouped[p.status]) {
        grouped[p.status].push(p);
      }
    });
    return grouped;
  }, [pitches]);

  // Filter pitches for list view
  const filteredPitches = useMemo(() => {
    if (listFilter === 'all') return pitches;
    return pitches.filter((p) => p.status === listFilter);
  }, [pitches, listFilter]);

  const statusCounts = useMemo(() => {
    return pitches.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [pitches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Pitch Pipeline</h2>
          <p className="text-[13px] text-white/40 mt-0.5">
            Move pitches forward with intention
            {isLoading && <span className="ml-2 text-brand-iris">Loading...</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <button
            type="button"
            onClick={() => setIsNewPitchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-iris text-white text-sm font-medium rounded-lg hover:bg-brand-iris/90 transition-colors shadow-lg shadow-brand-iris/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Pitch
          </button>
        </div>
      </div>

      {/* Manual Execution Notice */}
      <div className="p-3 rounded-lg bg-brand-cyan/5 border border-brand-cyan/20">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan">MANUAL MODE ENFORCED</span>
          <span className="text-[13px] text-white/55">All pitches require manual send action. No auto-send available.</span>
        </div>
      </div>

      {/* Error State */}
      {pitchesError && (
        <div className="p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/30">
          <div className="flex items-center gap-2 text-semantic-error">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Failed to load pitches from server. Showing demo data.</span>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {PIPELINE_STAGES.filter((s) => s.id !== 'declined').map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              pitches={pitchesByStage[stage.id] || []}
              selectedPitchId={selectedPitch?.id || null}
              onSelectPitch={setSelectedPitch}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1A1A24] pb-px">
            {[
              { id: 'all', label: 'All', count: pitches.length },
              { id: 'draft', label: 'Drafts', count: statusCounts.draft || 0 },
              { id: 'scheduled', label: 'Ready', count: statusCounts.scheduled || 0 },
              { id: 'sent', label: 'Sent', count: statusCounts.sent || 0 },
              { id: 'opened', label: 'Opened', count: statusCounts.opened || 0 },
              { id: 'replied', label: 'Replied', count: statusCounts.replied || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListFilter(tab.id as PitchStatus | 'all')}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  listFilter === tab.id ? 'text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-[13px] text-white/55">({tab.count})</span>
                {listFilter === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-iris rounded-t" />}
              </button>
            ))}
          </div>

          {/* Pitch List */}
          <div className="space-y-3">
            {filteredPitches.map((pitch) => (
              <ListRow
                key={pitch.id}
                pitch={pitch}
                isSelected={selectedPitch?.id === pitch.id}
                onClick={() => setSelectedPitch(pitch)}
              />
            ))}

            {filteredPitches.length === 0 && (
              <div className="p-12 text-center rounded-xl border border-dashed border-[#1A1A24]">
                <svg className="w-12 h-12 mx-auto text-white/55 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-white/55">No pitches matching this filter</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Pitch Detail Panel */}
      {selectedPitch && (
        <PitchDetailPanel
          pitch={selectedPitch}
          onClose={() => setSelectedPitch(null)}
          onManualSendSuccess={() => {
            // Update local pitch status optimistically
            setSelectedPitch((prev) => prev ? { ...prev, status: 'sent', sentAt: new Date().toISOString() } : null);
          }}
        />
      )}

      {/* New Pitch Modal */}
      <NewPitchModal
        isOpen={isNewPitchModalOpen}
        onClose={() => setIsNewPitchModalOpen(false)}
        onSuccess={() => {
          // Modal handles revalidation, just log success
          console.log('[PRPitches] New pitch created successfully');
        }}
      />
    </div>
  );
}
