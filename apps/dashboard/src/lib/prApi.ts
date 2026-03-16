/**
 * PR Pillar — Client API layer + shape adapters
 * Wires frontend pages to /api/pr/* routes.
 * No server-only imports — safe for 'use client' pages.
 */

import type {
  Journalist,
  PitchItem,
  PitchStage,
  CoverageRow,
  PRActionItem,
  Sentiment,
} from '@/components/pr/pr-mock-data';

// ============================================
// API SHAPE TYPES (match backend responses)
// ============================================

export interface JournalistProfile {
  id: string;
  orgId: string;
  fullName: string;
  primaryEmail: string;
  secondaryEmails: string[];
  primaryOutlet: string | null;
  beat: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  engagementScore: number;
  responsivenessScore: number;
  relevanceScore: number;
  lastActivityAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PitchSequence {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  defaultSubject: string | null;
  defaultPreviewText: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InboxItem {
  id: string;
  type: 'inquiry' | 'follow_up_due' | 'coverage_triage' | 'relationship_decay' | 'approval_queue' | 'data_hygiene';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueAt?: string;
  urgency: number;
  confidence?: number;
  risk?: 'none' | 'low' | 'medium' | 'high';
  relatedContactId?: string;
  relatedPitchId?: string;
  primaryAction: {
    label: string;
    targetRoute: string;
  };
  modeCeiling: 'manual' | 'copilot' | 'autopilot';
  createdAt: string;
}

export interface EarnedMention {
  id: string;
  org_id: string;
  headline?: string | null;
  title?: string | null;
  outlet_name?: string | null;
  source_domain?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  sentiment?: string | null;
  estimated_reach?: number | null;
  metadata: Record<string, unknown>;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

export async function fetchJournalists(params?: {
  q?: string;
  outlet?: string;
  beat?: string;
  limit?: number;
  offset?: number;
}): Promise<{ profiles: JournalistProfile[]; total: number; limit: number; offset: number }> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.outlet) sp.set('outlet', params.outlet);
  if (params?.beat) sp.set('beat', params.beat);
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.offset) sp.set('offset', String(params.offset));

  const qs = sp.toString();
  const res = await fetch(`/api/pr/journalists${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch journalists (${res.status})`);
  }
  return res.json();
}

export async function createJournalist(input: {
  fullName: string;
  primaryEmail: string;
  primaryOutlet?: string;
  beat?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<JournalistProfile> {
  const res = await fetch('/api/pr/journalists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to create journalist (${res.status})`);
  }
  return res.json();
}

export async function fetchPitchSequences(): Promise<{ sequences: PitchSequence[]; total: number }> {
  const res = await fetch('/api/pr/pitches/sequences?limit=50');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch pitch sequences (${res.status})`);
  }
  return res.json();
}

export async function fetchCoverage(): Promise<{ rows: EarnedMention[]; total: number }> {
  const res = await fetch('/api/pr/coverage?limit=50');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch coverage (${res.status})`);
  }
  return res.json();
}

export async function fetchInbox(): Promise<{ items: InboxItem[]; total: number; byType: Record<string, number> }> {
  const res = await fetch('/api/pr/inbox');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch inbox (${res.status})`);
  }
  return res.json();
}

// ============================================
// ADAPTERS
// ============================================

export function adaptProfileToJournalist(profile: JournalistProfile): Journalist {
  const meta = profile.metadata || {};

  // Initials: first letter of each word, max 2
  const nameParts = profile.fullName.trim().split(/\s+/);
  const initials = nameParts
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  // Beats: metadata.beats array > comma-split beat field > empty
  let beats: string[] = [];
  if (Array.isArray(meta.beats)) {
    beats = meta.beats as string[];
  } else if (profile.beat) {
    beats = profile.beat.split(',').map((b) => b.trim()).filter(Boolean);
  }

  // Relationship from engagementScore
  let relationship: Journalist['relationship'] = 'new';
  if (profile.engagementScore >= 0.7) relationship = 'warm';
  else if (profile.engagementScore >= 0.4) relationship = 'neutral';
  else if (profile.engagementScore > 0) relationship = 'cold';

  // AI citation from relevanceScore
  let aiCitation: Journalist['aiCitation'] = 'low';
  if (profile.relevanceScore >= 0.7) aiCitation = 'high';
  else if (profile.relevanceScore >= 0.4) aiCitation = 'medium';

  // Relationship stats (only if there's activity)
  let relationshipStats: Journalist['relationshipStats'] = undefined;
  if (profile.lastActivityAt) {
    relationshipStats = {
      lastContact: formatRelativeDate(profile.lastActivityAt),
      totalInteractions: (meta.interaction_count as number) ?? 1,
      coverageReceived: (meta.coverage_count as number) ?? 0,
      warmthScore: Math.round(profile.engagementScore * 100),
      owner: (meta.owner as string) ?? 'You',
    };
  }

  return {
    id: profile.id,
    name: profile.fullName,
    initials,
    email: profile.primaryEmail,
    publication: profile.primaryOutlet ?? 'Unknown',
    jobTitle: (meta.jobTitle as string) ?? '',
    beats,
    aiCitation,
    relationship,
    socialTwitter: profile.twitterHandle ?? undefined,
    socialLinkedin: !!profile.linkedinUrl,
    verified: (meta.verified as boolean) ?? false,
    relationshipStats,
    // These fields stay undefined — not available from list endpoint
    citationStats: undefined,
    recentArticles: undefined,
    activityTimeline: undefined,
    notes: undefined,
    sageReason: undefined,
  };
}

export function adaptSequenceToPitchItem(seq: PitchSequence): PitchItem {
  const meta = (seq.settings ?? {}) as Record<string, unknown>;

  // Map sequence status → PitchStage
  const stageMap: Record<string, PitchStage> = {
    draft: 'drafts',
    active: 'awaiting_send',
    sent: 'sent',
    completed: 'closed',
    paused: 'closed',
    archived: 'closed',
  };

  return {
    id: seq.id,
    title: seq.name,
    journalistName: (meta.journalistName as string) ?? 'Unassigned',
    publication: (meta.publication as string) ?? '—',
    priority: ((meta.priority as string) ?? 'medium') as PitchItem['priority'],
    aeoTarget: (meta.aeoTarget as string) ?? 'Est. impact TBD',
    created: formatShortDate(seq.createdAt),
    stage: stageMap[seq.status] ?? 'drafts',
    beats: (meta.beats as string[]) ?? [],
  };
}

export function adaptMentionToCoverageRow(mention: EarnedMention): CoverageRow {
  const meta = mention.metadata || {};

  return {
    id: mention.id,
    headline: mention.headline ?? mention.title ?? 'Untitled',
    publication: mention.outlet_name ?? mention.source_domain ?? 'Unknown',
    reporter: mention.author_name ?? 'Unknown',
    date: mention.published_at ? formatShortDate(mention.published_at) : '—',
    reach: formatReach(meta.reach as string | number | undefined ?? mention.estimated_reach),
    sentiment: (mention.sentiment as Sentiment) ?? 'neutral',
    eviImpact: (meta.evi_impact as string) ?? 'Pending',
    isPending: !meta.evi_impact,
  };
}

const inboxIconMap: Record<string, string> = {
  inquiry: 'EnvelopeOpen',
  follow_up_due: 'Bell',
  coverage_triage: 'Newspaper',
  relationship_decay: 'ChartBar',
  approval_queue: 'FileText',
  data_hygiene: 'Lightning',
};

export function adaptInboxToPRAction(item: InboxItem): PRActionItem {
  return {
    id: item.id,
    priority: item.priority,
    iconName: inboxIconMap[item.type] ?? 'FileText',
    title: item.title,
    description: item.description,
    primaryCta: item.primaryAction.label,
    secondaryCta: 'Dismiss',
    dismissible: true,
    journalistId: item.relatedContactId ?? undefined,
  };
}

// ============================================
// HELPERS
// ============================================

export function formatRelativeDate(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;

  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function formatShortDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatReach(value: string | number | null | undefined): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
