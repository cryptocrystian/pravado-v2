/**
 * PR Pitch & Outreach Sequence Types (Sprint S39)
 * Types for personalized PR pitches and outreach sequences
 */

// ========================================
// STATUS TYPES
// ========================================

export type PRPitchSequenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type PRPitchContactStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'opened'
  | 'replied'
  | 'bounced'
  | 'opted_out'
  | 'failed';

export type PRPitchStepType = 'email' | 'social_dm' | 'phone' | 'other';

export type PRPitchEventType =
  | 'queued'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'failed';

// ========================================
// SETTINGS TYPES
// ========================================

export interface PRPitchSendWindow {
  startHour: number; // 0-23
  endHour: number; // 0-23
  timezone: string;
}

export interface PRPitchSequenceSettings {
  sendWindow: PRPitchSendWindow;
  followUpDelayDays: number;
  maxAttempts: number;
  excludeWeekends: boolean;
}

// ========================================
// DATABASE RECORD TYPES
// ========================================

export interface PRPitchSequenceRecord {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  press_release_id: string | null;
  status: PRPitchSequenceStatus;
  default_subject: string | null;
  default_preview_text: string | null;
  settings: PRPitchSequenceSettings;
  created_at: string;
  updated_at: string;
}

export interface PRPitchStepRecord {
  id: string;
  org_id: string;
  sequence_id: string;
  position: number;
  step_type: PRPitchStepType;
  subject_template: string | null;
  body_template: string;
  wait_days: number;
  created_at: string;
  updated_at: string;
}

export interface PRPitchContactRecord {
  id: string;
  org_id: string;
  sequence_id: string;
  journalist_id: string;
  status: PRPitchContactStatus;
  current_step_position: number;
  last_event_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PRPitchEventRecord {
  id: string;
  org_id: string;
  contact_id: string;
  step_position: number;
  event_type: PRPitchEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

// ========================================
// APPLICATION TYPES
// ========================================

export interface PRPitchSequence {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  pressReleaseId: string | null;
  status: PRPitchSequenceStatus;
  defaultSubject: string | null;
  defaultPreviewText: string | null;
  settings: PRPitchSequenceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PRPitchStep {
  id: string;
  orgId: string;
  sequenceId: string;
  position: number;
  stepType: PRPitchStepType;
  subjectTemplate: string | null;
  bodyTemplate: string;
  waitDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PRPitchContact {
  id: string;
  orgId: string;
  sequenceId: string;
  journalistId: string;
  status: PRPitchContactStatus;
  currentStepPosition: number;
  lastEventAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PRPitchEvent {
  id: string;
  orgId: string;
  contactId: string;
  stepPosition: number;
  eventType: PRPitchEventType;
  payload: Record<string, unknown>;
  createdAt: Date;
}

// ========================================
// COMPOSITE TYPES
// ========================================

export interface PRPitchSequenceWithSteps extends PRPitchSequence {
  steps: PRPitchStep[];
  stats?: PRPitchSequenceStats;
}

export interface PRPitchSequenceStats {
  totalContacts: number;
  queuedCount: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  bouncedCount: number;
  failedCount: number;
}

export interface PRPitchContactWithJournalist extends PRPitchContact {
  journalist: {
    id: string;
    name: string;
    email: string | null;
    beat: string | null;
    outlet: string | null;
    tier: string | null;
  };
  events?: PRPitchEvent[];
}

// ========================================
// INPUT TYPES (DTOs)
// ========================================

export interface CreatePRPitchSequenceInput {
  name: string;
  pressReleaseId?: string;
  defaultSubject?: string;
  defaultPreviewText?: string;
  settings?: Partial<PRPitchSequenceSettings>;
  steps?: CreatePRPitchStepInput[];
}

export interface UpdatePRPitchSequenceInput {
  name?: string;
  pressReleaseId?: string | null;
  status?: PRPitchSequenceStatus;
  defaultSubject?: string;
  defaultPreviewText?: string;
  settings?: Partial<PRPitchSequenceSettings>;
  steps?: UpdatePRPitchStepInput[];
}

export interface CreatePRPitchStepInput {
  position: number;
  stepType?: PRPitchStepType;
  subjectTemplate?: string;
  bodyTemplate: string;
  waitDays?: number;
}

export interface UpdatePRPitchStepInput {
  id?: string; // If provided, update existing; otherwise create new
  position: number;
  stepType?: PRPitchStepType;
  subjectTemplate?: string;
  bodyTemplate: string;
  waitDays?: number;
}

export interface AttachContactsInput {
  journalistIds: string[];
}

// ========================================
// PITCH GENERATION TYPES
// ========================================

export interface GeneratePitchPreviewInput {
  sequenceId: string;
  journalistId: string;
  stepPosition?: number;
  customContext?: string;
}

export interface GeneratedPitchPreview {
  sequenceId: string;
  journalistId: string;
  stepPosition: number;
  subject: string;
  body: string;
  personalizationScore: number;
  suggestions: PitchSuggestion[];
  generatedAt: Date;
}

export interface PitchSuggestion {
  type: 'subject' | 'opening' | 'hook' | 'cta' | 'personalization';
  original: string;
  suggested: string;
  reason: string;
}

// ========================================
// CONTEXT ASSEMBLY TYPES
// ========================================

export interface PRPitchContext {
  // Press release context
  pressRelease: {
    id: string;
    headline: string;
    angle: string | null;
    body: string | null;
    keyPoints: string[];
    newsType: string | null;
  } | null;

  // Journalist context
  journalist: {
    id: string;
    name: string;
    email: string | null;
    beat: string | null;
    outlet: string | null;
    outletTier: string | null;
    location: string | null;
    bio: string | null;
    recentTopics: string[];
  };

  // Organization context
  organization: {
    id: string;
    name: string;
    industry: string | null;
    description: string | null;
  };

  // Personality (from S11)
  personality: {
    tone: string;
    voiceAttributes: string[];
  } | null;

  // Recent interactions (from S10 memory)
  recentInteractions: {
    type: string;
    date: string;
    summary: string;
  }[];
}

// ========================================
// QUERY TYPES
// ========================================

export interface ListPRPitchSequencesQuery {
  status?: PRPitchSequenceStatus | PRPitchSequenceStatus[];
  pressReleaseId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface ListPRPitchContactsQuery {
  status?: PRPitchContactStatus | PRPitchContactStatus[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'lastEventAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface PRPitchSequenceListResponse {
  sequences: PRPitchSequence[];
  total: number;
  limit: number;
  offset: number;
}

export interface PRPitchContactListResponse {
  contacts: PRPitchContactWithJournalist[];
  total: number;
  limit: number;
  offset: number;
}

// ========================================
// TRANSFORMER FUNCTIONS
// ========================================

export function transformPRPitchSequenceRecord(record: PRPitchSequenceRecord): PRPitchSequence {
  return {
    id: record.id,
    orgId: record.org_id,
    userId: record.user_id,
    name: record.name,
    pressReleaseId: record.press_release_id,
    status: record.status,
    defaultSubject: record.default_subject,
    defaultPreviewText: record.default_preview_text,
    settings: record.settings,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformPRPitchStepRecord(record: PRPitchStepRecord): PRPitchStep {
  return {
    id: record.id,
    orgId: record.org_id,
    sequenceId: record.sequence_id,
    position: record.position,
    stepType: record.step_type,
    subjectTemplate: record.subject_template,
    bodyTemplate: record.body_template,
    waitDays: record.wait_days,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformPRPitchContactRecord(record: PRPitchContactRecord): PRPitchContact {
  return {
    id: record.id,
    orgId: record.org_id,
    sequenceId: record.sequence_id,
    journalistId: record.journalist_id,
    status: record.status,
    currentStepPosition: record.current_step_position,
    lastEventAt: record.last_event_at ? new Date(record.last_event_at) : null,
    metadata: record.metadata,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformPRPitchEventRecord(record: PRPitchEventRecord): PRPitchEvent {
  return {
    id: record.id,
    orgId: record.org_id,
    contactId: record.contact_id,
    stepPosition: record.step_position,
    eventType: record.event_type,
    payload: record.payload,
    createdAt: new Date(record.created_at),
  };
}
