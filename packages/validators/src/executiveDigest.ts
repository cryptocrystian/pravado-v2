/**
 * Executive Digest Validators (Sprint S62)
 * Automated Strategic Briefs & Exec Weekly Digest Generator V1
 *
 * Zod schemas for:
 * - Digest CRUD operations
 * - Generation and delivery
 * - Recipients management
 * - Section ordering
 */

import { z } from 'zod';

// ============================================================================
// Enum Schemas
// ============================================================================

/**
 * Delivery period enum
 */
export const execDigestDeliveryPeriodSchema = z.enum(['weekly', 'monthly']);

/**
 * Time window enum
 */
export const execDigestTimeWindowSchema = z.enum(['7d', '30d']);

/**
 * Section type enum
 */
export const execDigestSectionTypeSchema = z.enum([
  'executive_summary',
  'key_kpis',
  'key_insights',
  'risk_summary',
  'reputation_summary',
  'competitive_summary',
  'media_performance',
  'crisis_status',
  'governance_highlights',
  'action_recommendations',
  'custom',
]);

/**
 * Delivery status enum
 */
export const execDigestDeliveryStatusSchema = z.enum([
  'pending',
  'sending',
  'success',
  'partial_success',
  'error',
]);

/**
 * Action type enum
 */
export const execDigestActionTypeSchema = z.enum([
  'created',
  'updated',
  'deleted',
  'generated',
  'delivered',
  'recipient_added',
  'recipient_removed',
  'sections_reordered',
  'pdf_generated',
  'scheduled',
]);

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Create digest schema
 */
export const createExecDigestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  deliveryPeriod: execDigestDeliveryPeriodSchema.optional(),
  timeWindow: execDigestTimeWindowSchema.optional(),
  scheduleDayOfWeek: z.number().int().min(0).max(6).optional(), // 0=Sunday, 6=Saturday
  scheduleHour: z.number().int().min(0).max(23).optional(),
  scheduleTimezone: z.string().max(100).optional(),
  includeRecommendations: z.boolean().optional(),
  includeKpis: z.boolean().optional(),
  includeInsights: z.boolean().optional(),
  includeRiskSummary: z.boolean().optional(),
  includeReputationSummary: z.boolean().optional(),
  includeCompetitiveSummary: z.boolean().optional(),
  includeMediaPerformance: z.boolean().optional(),
  includeCrisisStatus: z.boolean().optional(),
  includeGovernance: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateExecDigestInput = z.infer<typeof createExecDigestSchema>;

/**
 * Update digest schema
 */
export const updateExecDigestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  deliveryPeriod: execDigestDeliveryPeriodSchema.optional(),
  timeWindow: execDigestTimeWindowSchema.optional(),
  scheduleDayOfWeek: z.number().int().min(0).max(6).optional(),
  scheduleHour: z.number().int().min(0).max(23).optional(),
  scheduleTimezone: z.string().max(100).optional(),
  includeRecommendations: z.boolean().optional(),
  includeKpis: z.boolean().optional(),
  includeInsights: z.boolean().optional(),
  includeRiskSummary: z.boolean().optional(),
  includeReputationSummary: z.boolean().optional(),
  includeCompetitiveSummary: z.boolean().optional(),
  includeMediaPerformance: z.boolean().optional(),
  includeCrisisStatus: z.boolean().optional(),
  includeGovernance: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateExecDigestInput = z.infer<typeof updateExecDigestSchema>;

/**
 * Generate digest schema
 */
export const generateExecDigestSchema = z.object({
  timeWindowOverride: execDigestTimeWindowSchema.optional(),
  forceRegenerate: z.boolean().optional(),
  generatePdf: z.boolean().optional(),
  includeSections: z.array(execDigestSectionTypeSchema).optional(),
});

export type GenerateExecDigestInput = z.infer<typeof generateExecDigestSchema>;

/**
 * Deliver digest schema
 */
export const deliverExecDigestSchema = z.object({
  recipientIds: z.array(z.string().uuid()).optional(),
  regeneratePdf: z.boolean().optional(),
  testMode: z.boolean().optional(),
});

export type DeliverExecDigestInput = z.infer<typeof deliverExecDigestSchema>;

/**
 * Add recipient schema
 */
export const addExecDigestRecipientSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(200).optional(),
  role: z.string().max(100).optional(),
  includePdf: z.boolean().optional(),
  includeInlineSummary: z.boolean().optional(),
});

export type AddExecDigestRecipientInput = z.infer<typeof addExecDigestRecipientSchema>;

/**
 * Update recipient schema
 */
export const updateExecDigestRecipientSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  includePdf: z.boolean().optional(),
  includeInlineSummary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateExecDigestRecipientInput = z.infer<typeof updateExecDigestRecipientSchema>;

/**
 * Section order update schema
 */
export const updateSectionOrderSchema = z.object({
  sections: z.array(
    z.object({
      sectionId: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

export type UpdateSectionOrderInput = z.infer<typeof updateSectionOrderSchema>;

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * List digests query schema
 */
export const listExecDigestsSchema = z.object({
  includeArchived: z.coerce.boolean().optional(),
  deliveryPeriod: execDigestDeliveryPeriodSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ListExecDigestsQuery = z.infer<typeof listExecDigestsSchema>;

/**
 * List recipients query schema
 */
export const listExecDigestRecipientsSchema = z.object({
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ListExecDigestRecipientsQuery = z.infer<typeof listExecDigestRecipientsSchema>;

/**
 * List delivery logs query schema
 */
export const listExecDigestDeliveryLogsSchema = z.object({
  status: execDigestDeliveryStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ListExecDigestDeliveryLogsQuery = z.infer<typeof listExecDigestDeliveryLogsSchema>;

/**
 * List sections query schema
 */
export const listExecDigestSectionsSchema = z.object({
  sectionType: execDigestSectionTypeSchema.optional(),
  isVisible: z.coerce.boolean().optional(),
});

export type ListExecDigestSectionsQuery = z.infer<typeof listExecDigestSectionsSchema>;

// ============================================================================
// Parameter Schemas
// ============================================================================

/**
 * Digest ID parameter schema
 */
export const execDigestIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ExecDigestIdParam = z.infer<typeof execDigestIdParamSchema>;

/**
 * Recipient ID parameter schema
 */
export const execDigestRecipientIdParamSchema = z.object({
  id: z.string().uuid(),
  recipientId: z.string().uuid(),
});

export type ExecDigestRecipientIdParam = z.infer<typeof execDigestRecipientIdParamSchema>;

// ============================================================================
// Data Schemas
// ============================================================================

/**
 * KPI snapshot schema
 */
export const execDigestKpiSnapshotSchema = z.object({
  metricKey: z.string(),
  metricLabel: z.string(),
  metricValue: z.number(),
  metricUnit: z.string().optional(),
  trend: z
    .object({
      direction: z.enum(['up', 'down', 'flat']),
      changePercent: z.number().optional(),
      periodLabel: z.string().optional(),
    })
    .optional(),
  category: z.string().optional(),
  sourceSystem: z.string().optional(),
});

export type ExecDigestKpiSnapshot = z.infer<typeof execDigestKpiSnapshotSchema>;

/**
 * Insight snapshot schema
 */
export const execDigestInsightSnapshotSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  sourceSystem: z.string(),
  severityOrImpact: z.number(),
  isRisk: z.boolean(),
  isOpportunity: z.boolean(),
  category: z.string().optional(),
});

export type ExecDigestInsightSnapshot = z.infer<typeof execDigestInsightSnapshotSchema>;

/**
 * Summary schema
 */
export const execDigestSummarySchema = z.object({
  generatedAt: z.string().optional(),
  timeWindow: execDigestTimeWindowSchema.optional(),
  totalKpis: z.number().optional(),
  totalInsights: z.number().optional(),
  riskScore: z.number().optional(),
  reputationScore: z.number().optional(),
  sentimentScore: z.number().optional(),
  topRiskCount: z.number().optional(),
  topOpportunityCount: z.number().optional(),
  systemsContributing: z.array(z.string()).optional(),
  narrative: z.string().optional(),
});

export type ExecDigestSummary = z.infer<typeof execDigestSummarySchema>;

/**
 * Recipient result schema
 */
export const execDigestRecipientResultSchema = z.object({
  recipientId: z.string(),
  email: z.string(),
  status: z.enum(['success', 'error']),
  errorMessage: z.string().optional(),
  sentAt: z.string().optional(),
});

export type ExecDigestRecipientResult = z.infer<typeof execDigestRecipientResultSchema>;

// ============================================================================
// Full Entity Schemas (for response validation)
// ============================================================================

/**
 * Digest schema
 */
export const execDigestSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  deliveryPeriod: execDigestDeliveryPeriodSchema,
  timeWindow: execDigestTimeWindowSchema,
  scheduleDayOfWeek: z.number(),
  scheduleHour: z.number(),
  scheduleTimezone: z.string(),
  nextDeliveryAt: z.string().nullable(),
  lastDeliveredAt: z.string().nullable(),
  includeRecommendations: z.boolean(),
  includeKpis: z.boolean(),
  includeInsights: z.boolean(),
  includeRiskSummary: z.boolean(),
  includeReputationSummary: z.boolean(),
  includeCompetitiveSummary: z.boolean(),
  includeMediaPerformance: z.boolean(),
  includeCrisisStatus: z.boolean(),
  includeGovernance: z.boolean(),
  summary: execDigestSummarySchema,
  kpiSnapshot: z.array(execDigestKpiSnapshotSchema),
  insightsSnapshot: z.array(execDigestInsightSnapshotSchema),
  pdfStoragePath: z.string().nullable(),
  pdfGeneratedAt: z.string().nullable(),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExecDigest = z.infer<typeof execDigestSchema>;

/**
 * Section schema
 */
export const execDigestSectionSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  digestId: z.string().uuid(),
  sectionType: execDigestSectionTypeSchema,
  title: z.string(),
  content: z.string(),
  sortOrder: z.number(),
  modelName: z.string().nullable(),
  tokensUsed: z.number().nullable(),
  generationDurationMs: z.number().nullable(),
  isVisible: z.boolean(),
  meta: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExecDigestSection = z.infer<typeof execDigestSectionSchema>;

/**
 * Recipient schema
 */
export const execDigestRecipientSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  digestId: z.string().uuid(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.string().nullable(),
  isValidated: z.boolean(),
  validatedAt: z.string().nullable(),
  isActive: z.boolean(),
  includePdf: z.boolean(),
  includeInlineSummary: z.boolean(),
  meta: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExecDigestRecipient = z.infer<typeof execDigestRecipientSchema>;

/**
 * Delivery log schema
 */
export const execDigestDeliveryLogSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  digestId: z.string().uuid(),
  deliveryPeriod: execDigestDeliveryPeriodSchema,
  timeWindow: execDigestTimeWindowSchema,
  scheduledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  status: execDigestDeliveryStatusSchema,
  errorMessage: z.string().nullable(),
  recipientsCount: z.number(),
  successfulDeliveries: z.number(),
  failedDeliveries: z.number(),
  pdfStoragePath: z.string().nullable(),
  pdfSizeBytes: z.number().nullable(),
  metadata: z.record(z.unknown()),
  recipientResults: z.array(execDigestRecipientResultSchema),
  createdAt: z.string(),
});

export type ExecDigestDeliveryLog = z.infer<typeof execDigestDeliveryLogSchema>;

/**
 * Audit log schema
 */
export const execDigestAuditLogSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().nullable(),
  digestId: z.string().nullable(),
  actionType: execDigestActionTypeSchema,
  description: z.string(),
  metadata: z.record(z.unknown()),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});

export type ExecDigestAuditLog = z.infer<typeof execDigestAuditLogSchema>;
