/**
 * PR Outreach Validators (Sprint S44)
 * Zod schemas for automated journalist outreach
 */

import { z } from 'zod';

/**
 * Enums
 */
export const outreachRunStatusSchema = z.enum(['running', 'completed', 'failed', 'stopped']);

export const outreachEventTypeSchema = z.enum([
  'sent',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'failed',
]);

export const outreachStopReasonSchema = z.enum([
  'manual_stop',
  'journalist_replied',
  'error',
  'sequence_deleted',
]);

/**
 * Base schemas
 */
export const outreachSequenceSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Metadata
  name: z.string().min(1).max(200),
  description: z.string().nullable(),

  // Targeting
  journalistIds: z.array(z.string().uuid()),
  outletIds: z.array(z.string().uuid()),
  beatFilter: z.array(z.string()).nullable(),
  tierFilter: z.array(z.string()).nullable(),

  // Status
  isActive: z.boolean(),

  // Execution settings
  maxRunsPerDay: z.number().int().min(1).max(1000),
  stopOnReply: z.boolean(),

  // Associated content
  pitchId: z.string().uuid().nullable(),
  pressReleaseId: z.string().uuid().nullable(),

  // Stats
  totalRuns: z.number().int().min(0),
  completedRuns: z.number().int().min(0),
  activeRuns: z.number().int().min(0),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const outreachSequenceStepSchema = z.object({
  id: z.string().uuid(),
  sequenceId: z.string().uuid(),

  // Step configuration
  stepNumber: z.number().int().min(1).max(20),
  delayHours: z.number().int().min(0).max(8760), // Max 1 year

  // Email template
  subjectTemplate: z.string().min(1).max(500),
  bodyTemplate: z.string().min(1).max(50000),

  // Template variables
  templateVariables: z.record(z.unknown()),

  // LLM generation
  useLlmGeneration: z.boolean(),
  llmPrompt: z.string().nullable(),
  llmModel: z.string().nullable(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const outreachRunSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  sequenceId: z.string().uuid(),

  // Target
  journalistId: z.string().uuid(),

  // State
  status: outreachRunStatusSchema,
  currentStepNumber: z.number().int().min(1),

  // Progress tracking
  nextStepAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  stoppedAt: z.date().nullable(),
  stopReason: outreachStopReasonSchema.nullable(),

  // Results
  totalStepsSent: z.number().int().min(0),
  lastSentAt: z.date().nullable(),
  repliedAt: z.date().nullable(),
  replyStepNumber: z.number().int().nullable(),

  // Error tracking
  lastError: z.string().nullable(),
  retryCount: z.number().int().min(0),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const outreachEventSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  runId: z.string().uuid(),
  sequenceId: z.string().uuid(),
  stepId: z.string().uuid(),

  // Event details
  eventType: outreachEventTypeSchema,
  stepNumber: z.number().int().min(1),

  // Email details
  emailSubject: z.string().nullable(),
  emailBody: z.string().nullable(),
  recipientEmail: z.string().email(),

  // Tracking timestamps
  sentAt: z.date().nullable(),
  openedAt: z.date().nullable(),
  clickedAt: z.date().nullable(),
  repliedAt: z.date().nullable(),
  bouncedAt: z.date().nullable(),
  failedAt: z.date().nullable(),

  // Metadata
  metadata: z.record(z.unknown()),

  // Error tracking
  errorMessage: z.string().nullable(),

  // Timestamps
  createdAt: z.date(),
});

/**
 * Input schemas
 */
export const createOutreachSequenceInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  journalistIds: z.array(z.string().uuid()).optional(),
  outletIds: z.array(z.string().uuid()).optional(),
  beatFilter: z.array(z.string()).optional(),
  tierFilter: z.array(z.string()).optional(),
  maxRunsPerDay: z.number().int().min(1).max(1000).optional().default(50),
  stopOnReply: z.boolean().optional().default(true),
  pitchId: z.string().uuid().optional(),
  pressReleaseId: z.string().uuid().optional(),
});

export const updateOutreachSequenceInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  journalistIds: z.array(z.string().uuid()).optional(),
  outletIds: z.array(z.string().uuid()).optional(),
  beatFilter: z.array(z.string()).optional(),
  tierFilter: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  maxRunsPerDay: z.number().int().min(1).max(1000).optional(),
  stopOnReply: z.boolean().optional(),
  pitchId: z.string().uuid().optional(),
  pressReleaseId: z.string().uuid().optional(),
});

export const createOutreachStepInputSchema = z.object({
  stepNumber: z.number().int().min(1).max(20),
  delayHours: z.number().int().min(0).max(8760),
  subjectTemplate: z.string().min(1).max(500),
  bodyTemplate: z.string().min(1).max(50000),
  templateVariables: z.record(z.unknown()).optional(),
  useLlmGeneration: z.boolean().optional().default(false),
  llmPrompt: z.string().optional(),
  llmModel: z.string().optional(),
});

export const updateOutreachStepInputSchema = z.object({
  stepNumber: z.number().int().min(1).max(20).optional(),
  delayHours: z.number().int().min(0).max(8760).optional(),
  subjectTemplate: z.string().min(1).max(500).optional(),
  bodyTemplate: z.string().min(1).max(50000).optional(),
  templateVariables: z.record(z.unknown()).optional(),
  useLlmGeneration: z.boolean().optional(),
  llmPrompt: z.string().optional(),
  llmModel: z.string().optional(),
});

export const createOutreachRunInputSchema = z.object({
  sequenceId: z.string().uuid(),
  journalistId: z.string().uuid(),
});

export const updateOutreachRunInputSchema = z.object({
  status: outreachRunStatusSchema.optional(),
  currentStepNumber: z.number().int().min(1).optional(),
  nextStepAt: z.date().optional(),
  completedAt: z.date().optional(),
  stoppedAt: z.date().optional(),
  stopReason: outreachStopReasonSchema.optional(),
  totalStepsSent: z.number().int().min(0).optional(),
  lastSentAt: z.date().optional(),
  repliedAt: z.date().optional(),
  replyStepNumber: z.number().int().optional(),
  lastError: z.string().optional(),
  retryCount: z.number().int().min(0).optional(),
});

export const createOutreachEventInputSchema = z.object({
  runId: z.string().uuid(),
  sequenceId: z.string().uuid(),
  stepId: z.string().uuid(),
  eventType: outreachEventTypeSchema,
  stepNumber: z.number().int().min(1),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  recipientEmail: z.string().email(),
  sentAt: z.date().optional(),
  openedAt: z.date().optional(),
  clickedAt: z.date().optional(),
  repliedAt: z.date().optional(),
  bouncedAt: z.date().optional(),
  failedAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  errorMessage: z.string().optional(),
});

/**
 * Query schemas
 */
export const listOutreachSequencesQuerySchema = z.object({
  isActive: z.boolean().optional(),
  pitchId: z.string().uuid().optional(),
  pressReleaseId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const listOutreachRunsQuerySchema = z.object({
  sequenceId: z.string().uuid().optional(),
  journalistId: z.string().uuid().optional(),
  status: outreachRunStatusSchema.optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const listOutreachEventsQuerySchema = z.object({
  runId: z.string().uuid().optional(),
  sequenceId: z.string().uuid().optional(),
  eventType: outreachEventTypeSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Action schemas
 */
export const startSequenceRunsInputSchema = z.object({
  sequenceId: z.string().uuid(),
  journalistIds: z.array(z.string().uuid()).optional(),
  dryRun: z.boolean().optional().default(false),
});

export const stopRunInputSchema = z.object({
  runId: z.string().uuid(),
  reason: outreachStopReasonSchema,
});

export const advanceRunInputSchema = z.object({
  runId: z.string().uuid(),
  forceAdvance: z.boolean().optional().default(false),
});

/**
 * S98: Direct pitch sending schema
 * For sending individual pitches to journalists
 */
export const sendPitchInputSchema = z.object({
  journalistId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1).max(100000),
  bodyText: z.string().optional(),
  pitchId: z.string().uuid().optional(),
  articleId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const sendPitchResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().nullable(),
  provider: z.string(),
  sentAt: z.date().nullable(),
  error: z.string().optional(),
});

/**
 * Response schemas
 */
export const outreachSequenceListResponseSchema = z.object({
  sequences: z.array(outreachSequenceSchema),
  total: z.number().int().min(0),
});

export const outreachRunListResponseSchema = z.object({
  runs: z.array(outreachRunSchema),
  total: z.number().int().min(0),
});

export const outreachEventListResponseSchema = z.object({
  events: z.array(outreachEventSchema),
  total: z.number().int().min(0),
});

/**
 * Extended schemas
 */
export const outreachSequenceWithStepsSchema = outreachSequenceSchema.extend({
  steps: z.array(outreachSequenceStepSchema),
});

export const outreachRunWithDetailsSchema = outreachRunSchema.extend({
  sequence: outreachSequenceSchema,
  journalist: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    outlet: z.string().nullable(),
  }),
  events: z.array(outreachEventSchema),
});

export const outreachStatsSchema = z.object({
  totalSequences: z.number().int().min(0),
  activeSequences: z.number().int().min(0),
  totalRuns: z.number().int().min(0),
  activeRuns: z.number().int().min(0),
  completedRuns: z.number().int().min(0),
  totalEmailsSent: z.number().int().min(0),
  totalOpens: z.number().int().min(0),
  totalClicks: z.number().int().min(0),
  totalReplies: z.number().int().min(0),
});

export const generatedEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  variables: z.record(z.unknown()),
});

export const targetingPreviewSchema = z.object({
  matchingJournalists: z.number().int().min(0),
  journalistIds: z.array(z.string().uuid()),
  summary: z.string(),
});

/**
 * Webhook schema
 */
export const outreachWebhookPayloadSchema = z.object({
  eventType: outreachEventTypeSchema,
  runId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Type inference
 */
export type OutreachSequenceInput = z.infer<typeof outreachSequenceSchema>;
export type CreateOutreachSequenceInput = z.infer<typeof createOutreachSequenceInputSchema>;
export type UpdateOutreachSequenceInput = z.infer<typeof updateOutreachSequenceInputSchema>;

export type OutreachSequenceStepInput = z.infer<typeof outreachSequenceStepSchema>;
export type CreateOutreachStepInput = z.infer<typeof createOutreachStepInputSchema>;
export type UpdateOutreachStepInput = z.infer<typeof updateOutreachStepInputSchema>;

export type OutreachRunInput = z.infer<typeof outreachRunSchema>;
export type CreateOutreachRunInput = z.infer<typeof createOutreachRunInputSchema>;
export type UpdateOutreachRunInput = z.infer<typeof updateOutreachRunInputSchema>;

export type OutreachEventInput = z.infer<typeof outreachEventSchema>;
export type CreateOutreachEventInput = z.infer<typeof createOutreachEventInputSchema>;

export type ListOutreachSequencesQuery = z.infer<typeof listOutreachSequencesQuerySchema>;
export type ListOutreachRunsQuery = z.infer<typeof listOutreachRunsQuerySchema>;
export type ListOutreachEventsQuery = z.infer<typeof listOutreachEventsQuerySchema>;

export type StartSequenceRunsInput = z.infer<typeof startSequenceRunsInputSchema>;
export type StopRunInput = z.infer<typeof stopRunInputSchema>;
export type AdvanceRunInput = z.infer<typeof advanceRunInputSchema>;

export type SendPitchInput = z.infer<typeof sendPitchInputSchema>;
export type SendPitchResponse = z.infer<typeof sendPitchResponseSchema>;

export type OutreachWebhookPayload = z.infer<typeof outreachWebhookPayloadSchema>;
