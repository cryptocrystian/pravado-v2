/**
 * PR Outreach Engine Types (Sprint S44)
 * Type definitions for automated journalist outreach
 */

/**
 * Outreach run status
 */
export type OutreachRunStatus = 'running' | 'completed' | 'failed' | 'stopped';

/**
 * Outreach event types
 */
export type OutreachEventType = 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';

/**
 * Stop reasons for outreach runs
 */
export type OutreachStopReason = 'manual_stop' | 'journalist_replied' | 'error' | 'sequence_deleted';

/**
 * Outreach sequence
 */
export interface OutreachSequence {
  id: string;
  orgId: string;

  // Metadata
  name: string;
  description: string | null;

  // Targeting
  journalistIds: string[];
  outletIds: string[];
  beatFilter: string[] | null;
  tierFilter: string[] | null;

  // Status
  isActive: boolean;

  // Execution settings
  maxRunsPerDay: number;
  stopOnReply: boolean;

  // Associated content
  pitchId: string | null;
  pressReleaseId: string | null;

  // Stats
  totalRuns: number;
  completedRuns: number;
  activeRuns: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Outreach sequence step
 */
export interface OutreachSequenceStep {
  id: string;
  sequenceId: string;

  // Step configuration
  stepNumber: number;
  delayHours: number;

  // Email template
  subjectTemplate: string;
  bodyTemplate: string;

  // Template variables
  templateVariables: Record<string, unknown>;

  // LLM generation
  useLlmGeneration: boolean;
  llmPrompt: string | null;
  llmModel: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Outreach run
 */
export interface OutreachRun {
  id: string;
  orgId: string;
  sequenceId: string;

  // Target
  journalistId: string;

  // State
  status: OutreachRunStatus;
  currentStepNumber: number;

  // Progress tracking
  nextStepAt: Date | null;
  completedAt: Date | null;
  stoppedAt: Date | null;
  stopReason: OutreachStopReason | null;

  // Results
  totalStepsSent: number;
  lastSentAt: Date | null;
  repliedAt: Date | null;
  replyStepNumber: number | null;

  // Error tracking
  lastError: string | null;
  retryCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Outreach event
 */
export interface OutreachEvent {
  id: string;
  orgId: string;
  runId: string;
  sequenceId: string;
  stepId: string;

  // Event details
  eventType: OutreachEventType;
  stepNumber: number;

  // Email details
  emailSubject: string | null;
  emailBody: string | null;
  recipientEmail: string;

  // Tracking timestamps
  sentAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  repliedAt: Date | null;
  bouncedAt: Date | null;
  failedAt: Date | null;

  // Metadata
  metadata: Record<string, unknown>;

  // Error tracking
  errorMessage: string | null;

  // Timestamps
  createdAt: Date;
}

/**
 * Input types for creating/updating sequences
 */
export interface CreateOutreachSequenceInput {
  name: string;
  description?: string;
  journalistIds?: string[];
  outletIds?: string[];
  beatFilter?: string[];
  tierFilter?: string[];
  maxRunsPerDay?: number;
  stopOnReply?: boolean;
  pitchId?: string;
  pressReleaseId?: string;
}

export interface UpdateOutreachSequenceInput {
  name?: string;
  description?: string;
  journalistIds?: string[];
  outletIds?: string[];
  beatFilter?: string[];
  tierFilter?: string[];
  isActive?: boolean;
  maxRunsPerDay?: number;
  stopOnReply?: boolean;
  pitchId?: string;
  pressReleaseId?: string;
}

/**
 * Input types for sequence steps
 */
export interface CreateOutreachStepInput {
  stepNumber: number;
  delayHours: number;
  subjectTemplate: string;
  bodyTemplate: string;
  templateVariables?: Record<string, unknown>;
  useLlmGeneration?: boolean;
  llmPrompt?: string;
  llmModel?: string;
}

export interface UpdateOutreachStepInput {
  stepNumber?: number;
  delayHours?: number;
  subjectTemplate?: string;
  bodyTemplate?: string;
  templateVariables?: Record<string, unknown>;
  useLlmGeneration?: boolean;
  llmPrompt?: string;
  llmModel?: string;
}

/**
 * Input types for runs
 */
export interface CreateOutreachRunInput {
  sequenceId: string;
  journalistId: string;
}

export interface UpdateOutreachRunInput {
  status?: OutreachRunStatus;
  currentStepNumber?: number;
  nextStepAt?: Date;
  completedAt?: Date;
  stoppedAt?: Date;
  stopReason?: OutreachStopReason;
  totalStepsSent?: number;
  lastSentAt?: Date;
  repliedAt?: Date;
  replyStepNumber?: number;
  lastError?: string;
  retryCount?: number;
}

/**
 * Input types for events
 */
export interface CreateOutreachEventInput {
  runId: string;
  sequenceId: string;
  stepId: string;
  eventType: OutreachEventType;
  stepNumber: number;
  emailSubject?: string;
  emailBody?: string;
  recipientEmail: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
  bouncedAt?: Date;
  failedAt?: Date;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Query parameters
 */
export interface ListOutreachSequencesQuery {
  isActive?: boolean;
  pitchId?: string;
  pressReleaseId?: string;
  limit?: number;
  offset?: number;
}

export interface ListOutreachRunsQuery {
  sequenceId?: string;
  journalistId?: string;
  status?: OutreachRunStatus;
  limit?: number;
  offset?: number;
}

export interface ListOutreachEventsQuery {
  runId?: string;
  sequenceId?: string;
  eventType?: OutreachEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Response types
 */
export interface OutreachSequenceListResponse {
  sequences: OutreachSequence[];
  total: number;
}

export interface OutreachRunListResponse {
  runs: OutreachRun[];
  total: number;
}

export interface OutreachEventListResponse {
  events: OutreachEvent[];
  total: number;
}

/**
 * Sequence with steps (for editor)
 */
export interface OutreachSequenceWithSteps extends OutreachSequence {
  steps: OutreachSequenceStep[];
}

/**
 * Run with related data (for detail view)
 */
export interface OutreachRunWithDetails extends OutreachRun {
  sequence: OutreachSequence;
  journalist: {
    id: string;
    name: string;
    email: string;
    outlet: string | null;
  };
  events: OutreachEvent[];
}

/**
 * Stats for overview
 */
export interface OutreachStats {
  totalSequences: number;
  activeSequences: number;
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  totalEmailsSent: number;
  totalOpens: number;
  totalClicks: number;
  totalReplies: number;
}

/**
 * Email generation result
 */
export interface GeneratedEmail {
  subject: string;
  body: string;
  variables: Record<string, unknown>;
}

/**
 * Targeting preview (how many journalists match criteria)
 */
export interface TargetingPreview {
  matchingJournalists: number;
  journalistIds: string[];
  summary: string;
}

/**
 * Action inputs
 */
export interface StartSequenceRunsInput {
  sequenceId: string;
  journalistIds?: string[]; // If not provided, use sequence targeting
  dryRun?: boolean; // Preview without starting
}

export interface StopRunInput {
  runId: string;
  reason: OutreachStopReason;
}

export interface AdvanceRunInput {
  runId: string;
  forceAdvance?: boolean; // Skip delay check
}

/**
 * Webhook payload for email events
 */
export interface OutreachWebhookPayload {
  eventType: OutreachEventType;
  runId: string;
  eventId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
