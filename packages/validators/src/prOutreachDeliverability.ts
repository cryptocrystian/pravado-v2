/**
 * PR Outreach Deliverability Validators (Sprint S45)
 * Zod schemas for email deliverability and engagement analytics
 */

import { z } from 'zod';

// =============================================
// Enums and Base Types
// =============================================

/**
 * Email send status
 */
export const emailMessageStatusSchema = z.enum([
  'pending',
  'sent',
  'bounced',
  'complained',
  'failed',
]);

/**
 * Email provider types
 */
export const emailProviderSchema = z.enum(['sendgrid', 'mailgun', 'ses', 'stub']);

/**
 * Provider event types
 */
export const providerEventTypeSchema = z.enum([
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained',
  'failed',
]);

// =============================================
// Entity Schemas
// =============================================

/**
 * Email message schema
 */
export const emailMessageSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  runId: z.string().uuid(),
  sequenceId: z.string().uuid(),
  stepNumber: z.number().int().min(1),
  journalistId: z.string().uuid(),
  subject: z.string(),
  bodyHtml: z.string(),
  bodyText: z.string(),
  providerMessageId: z.string().nullable(),
  sendStatus: emailMessageStatusSchema,
  sentAt: z.coerce.date().nullable(),
  deliveredAt: z.coerce.date().nullable(),
  openedAt: z.coerce.date().nullable(),
  clickedAt: z.coerce.date().nullable(),
  bouncedAt: z.coerce.date().nullable(),
  complainedAt: z.coerce.date().nullable(),
  rawEvent: z.record(z.unknown()),
  metadata: z.record(z.unknown()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Engagement metrics schema
 */
export const engagementMetricsSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  journalistId: z.string().uuid(),
  totalSent: z.number().int().min(0),
  totalOpened: z.number().int().min(0),
  totalClicked: z.number().int().min(0),
  totalReplied: z.number().int().min(0),
  totalBounced: z.number().int().min(0),
  totalComplained: z.number().int().min(0),
  engagementScore: z.number().min(0).max(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Deliverability summary schema
 */
export const deliverabilitySummarySchema = z.object({
  totalMessages: z.number().int().min(0),
  totalSent: z.number().int().min(0),
  totalDelivered: z.number().int().min(0),
  totalOpened: z.number().int().min(0),
  totalClicked: z.number().int().min(0),
  totalBounced: z.number().int().min(0),
  totalComplained: z.number().int().min(0),
  totalFailed: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

/**
 * Journalist engagement schema (with journalist details)
 */
export const journalistEngagementSchema = engagementMetricsSchema.extend({
  journalist: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    outlet: z.string().nullable(),
  }),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  replyRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

// =============================================
// Provider Event Schemas
// =============================================

/**
 * SendGrid specific event schema
 */
export const sendgridEventSchema = z.object({
  event: z.string(),
  email: z.string(),
  timestamp: z.number(),
  'smtp-id': z.string(),
  sg_event_id: z.string(),
  sg_message_id: z.string(),
});

/**
 * Mailgun specific event schema
 */
export const mailgunEventSchema = z.object({
  event: z.string(),
  recipient: z.string(),
  timestamp: z.number(),
  'message-id': z.string(),
});

/**
 * AWS SES specific event schema
 */
export const sesEventSchema = z.object({
  eventType: z.string(),
  mail: z.object({
    messageId: z.string(),
    timestamp: z.string(),
    destination: z.array(z.string()),
  }),
});

/**
 * Provider event payload schema (webhook)
 */
export const providerEventPayloadSchema = z.object({
  provider: emailProviderSchema,
  eventType: providerEventTypeSchema,
  messageId: z.string(),
  timestamp: z.coerce.date(),
  recipientEmail: z.string().email(),
  metadata: z.record(z.unknown()).optional(),
  sendgrid: sendgridEventSchema.optional(),
  mailgun: mailgunEventSchema.optional(),
  ses: sesEventSchema.optional(),
});

/**
 * Normalized webhook payload schema
 */
export const webhookPayloadSchema = z.object({
  messageId: z.string(),
  eventType: providerEventTypeSchema,
  timestamp: z.coerce.date(),
  recipientEmail: z.string().email(),
  metadata: z.record(z.unknown()),
});

// =============================================
// Input Schemas
// =============================================

/**
 * Create email message input schema
 */
export const createEmailMessageInputSchema = z.object({
  runId: z.string().uuid(),
  sequenceId: z.string().uuid(),
  stepNumber: z.number().int().min(1),
  journalistId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  providerMessageId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update email message input schema
 */
export const updateEmailMessageInputSchema = z.object({
  providerMessageId: z.string().optional(),
  sendStatus: emailMessageStatusSchema.optional(),
  sentAt: z.coerce.date().optional(),
  deliveredAt: z.coerce.date().optional(),
  openedAt: z.coerce.date().optional(),
  clickedAt: z.coerce.date().optional(),
  bouncedAt: z.coerce.date().optional(),
  complainedAt: z.coerce.date().optional(),
  rawEvent: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update engagement metrics input schema
 */
export const updateEngagementMetricsInputSchema = z.object({
  totalSent: z.number().int().min(0).optional(),
  totalOpened: z.number().int().min(0).optional(),
  totalClicked: z.number().int().min(0).optional(),
  totalReplied: z.number().int().min(0).optional(),
  totalBounced: z.number().int().min(0).optional(),
  totalComplained: z.number().int().min(0).optional(),
  engagementScore: z.number().min(0).max(1).optional(),
});

/**
 * Send email request schema
 */
export const sendEmailRequestSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Provider configuration schema
 */
export const providerConfigSchema = z.object({
  provider: emailProviderSchema,
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  domain: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().min(1).max(100),
});

// =============================================
// Query Schemas
// =============================================

/**
 * List email messages query schema
 */
export const listEmailMessagesQuerySchema = z.object({
  runId: z.string().uuid().optional(),
  sequenceId: z.string().uuid().optional(),
  journalistId: z.string().uuid().optional(),
  sendStatus: emailMessageStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List engagement metrics query schema
 */
export const listEngagementMetricsQuerySchema = z.object({
  minScore: z.coerce.number().min(0).max(1).optional(),
  maxScore: z.coerce.number().min(0).max(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// =============================================
// Response Schemas
// =============================================

/**
 * Email message list response schema
 */
export const emailMessageListResponseSchema = z.object({
  messages: z.array(emailMessageSchema),
  total: z.number().int().min(0),
});

/**
 * Engagement metrics list response schema
 */
export const engagementMetricsListResponseSchema = z.object({
  metrics: z.array(journalistEngagementSchema),
  total: z.number().int().min(0),
});

/**
 * Send email response schema
 */
export const sendEmailResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().nullable(),
  provider: emailProviderSchema,
  error: z.string().optional(),
});

/**
 * Engagement score result schema
 */
export const engagementScoreResultSchema = z.object({
  score: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  replyRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

/**
 * Update engagement metric result schema
 */
export const updateEngagementMetricResultSchema = z.object({
  journalistId: z.string().uuid(),
  previousScore: z.number().min(0).max(1),
  newScore: z.number().min(0).max(1),
  metricsUpdated: z.boolean(),
});

// =============================================
// Webhook Action Schemas
// =============================================

/**
 * Process webhook event input schema
 */
export const processWebhookEventInputSchema = z.object({
  provider: emailProviderSchema,
  payload: z.record(z.unknown()),
  signature: z.string().optional(),
});

/**
 * Process webhook event response schema
 */
export const processWebhookEventResponseSchema = z.object({
  success: z.boolean(),
  processed: z.boolean(),
  messageId: z.string().nullable(),
  error: z.string().optional(),
});

// =============================================
// Type Exports
// =============================================

export type EmailMessageStatus = z.infer<typeof emailMessageStatusSchema>;
export type EmailProvider = z.infer<typeof emailProviderSchema>;
export type ProviderEventType = z.infer<typeof providerEventTypeSchema>;
export type EmailMessage = z.infer<typeof emailMessageSchema>;
export type EngagementMetrics = z.infer<typeof engagementMetricsSchema>;
export type DeliverabilitySummary = z.infer<typeof deliverabilitySummarySchema>;
export type JournalistEngagement = z.infer<typeof journalistEngagementSchema>;
export type ProviderEventPayload = z.infer<typeof providerEventPayloadSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type CreateEmailMessageInput = z.infer<typeof createEmailMessageInputSchema>;
export type UpdateEmailMessageInput = z.infer<typeof updateEmailMessageInputSchema>;
export type UpdateEngagementMetricsInput = z.infer<typeof updateEngagementMetricsInputSchema>;
export type SendEmailRequest = z.infer<typeof sendEmailRequestSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type ListEmailMessagesQuery = z.infer<typeof listEmailMessagesQuerySchema>;
export type ListEngagementMetricsQuery = z.infer<typeof listEngagementMetricsQuerySchema>;
export type EmailMessageListResponse = z.infer<typeof emailMessageListResponseSchema>;
export type EngagementMetricsListResponse = z.infer<typeof engagementMetricsListResponseSchema>;
export type SendEmailResponse = z.infer<typeof sendEmailResponseSchema>;
export type EngagementScoreResult = z.infer<typeof engagementScoreResultSchema>;
export type UpdateEngagementMetricResult = z.infer<typeof updateEngagementMetricResultSchema>;
export type ProcessWebhookEventInput = z.infer<typeof processWebhookEventInputSchema>;
export type ProcessWebhookEventResponse = z.infer<typeof processWebhookEventResponseSchema>;
