/**
 * Brand Reputation Alerts & Executive Reporting Validators (Sprint S57)
 *
 * Zod schemas for validating brand reputation alerts, events, and reports API requests.
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Alert delivery channel enum
 */
export const reputationAlertChannelSchema = z.enum([
  'in_app',
  'email',
  'slack',
  'webhook',
]);

/**
 * Alert event status enum
 */
export const reputationAlertStatusSchema = z.enum([
  'new',
  'acknowledged',
  'muted',
  'resolved',
]);

/**
 * Report frequency enum
 */
export const reputationReportFrequencySchema = z.enum([
  'ad_hoc',
  'weekly',
  'monthly',
  'quarterly',
]);

/**
 * Report format enum
 */
export const reputationReportFormatSchema = z.enum([
  'executive_summary',
  'detailed',
]);

/**
 * Report status enum
 */
export const reputationReportStatusSchema = z.enum([
  'draft',
  'generating',
  'generated',
  'published',
]);

/**
 * Report section type enum
 */
export const reputationReportSectionTypeSchema = z.enum([
  'overview',
  'highlights',
  'risks',
  'opportunities',
  'competitors',
  'recommendations',
  'events_timeline',
]);

/**
 * Component key enum for component-level thresholds
 */
export const reputationComponentKeySchema = z.enum([
  'sentiment',
  'coverage',
  'crisis_impact',
  'competitive_position',
  'engagement',
]);

// ============================================================================
// NOTIFICATION CONFIG SCHEMA
// ============================================================================

/**
 * Notification configuration schema
 */
export const alertNotificationConfigSchema = z.object({
  emailAddresses: z.array(z.string().email()).optional(),
  slackWebhookUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  webhookHeaders: z.record(z.string()).optional(),
  includeDetails: z.boolean().optional(),
  customMessage: z.string().max(1000).optional(),
});

// ============================================================================
// ALERT RULE SCHEMAS
// ============================================================================

/**
 * Score threshold validation (0-100)
 */
const scoreThresholdSchema = z.number().min(0).max(100);

/**
 * Delta score threshold validation (can be negative or positive)
 */
const deltaThresholdSchema = z.number().min(-100).max(100);

/**
 * Create alert rule input schema
 */
export const createReputationAlertRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional().default(true),
  channel: reputationAlertChannelSchema.optional().default('in_app'),

  // Overall score thresholds
  minOverallScore: scoreThresholdSchema.optional(),
  maxOverallScore: scoreThresholdSchema.optional(),

  // Delta thresholds
  minDeltaOverallScore: deltaThresholdSchema.optional(),
  maxDeltaOverallScore: deltaThresholdSchema.optional(),

  // Component thresholds
  componentKey: reputationComponentKeySchema.optional(),
  minComponentScore: scoreThresholdSchema.optional(),

  // Competitor gap thresholds
  competitorSlug: z.string().max(100).optional(),
  minCompetitorGap: deltaThresholdSchema.optional(),
  maxCompetitorGap: deltaThresholdSchema.optional(),

  // Crisis integration
  minIncidentSeverity: z.number().int().min(1).max(5).optional(),
  linkCrisisIncidents: z.boolean().optional().default(false),

  // Timing controls
  timeWindowMinutes: z.number().int().min(1).max(10080).optional().default(60), // Max 1 week
  cooldownMinutes: z.number().int().min(0).max(10080).optional().default(60),

  // Notification config
  notificationConfig: alertNotificationConfigSchema.optional(),
}).refine(
  (data) => {
    // If both min and max overall score are provided, min should be <= max
    if (data.minOverallScore !== undefined && data.maxOverallScore !== undefined) {
      return data.minOverallScore <= data.maxOverallScore;
    }
    return true;
  },
  {
    message: 'minOverallScore must be less than or equal to maxOverallScore',
    path: ['minOverallScore'],
  }
).refine(
  (data) => {
    // If both min and max delta are provided, min should be <= max
    if (data.minDeltaOverallScore !== undefined && data.maxDeltaOverallScore !== undefined) {
      return data.minDeltaOverallScore <= data.maxDeltaOverallScore;
    }
    return true;
  },
  {
    message: 'minDeltaOverallScore must be less than or equal to maxDeltaOverallScore',
    path: ['minDeltaOverallScore'],
  }
).refine(
  (data) => {
    // If both min and max competitor gap are provided, min should be <= max
    if (data.minCompetitorGap !== undefined && data.maxCompetitorGap !== undefined) {
      return data.minCompetitorGap <= data.maxCompetitorGap;
    }
    return true;
  },
  {
    message: 'minCompetitorGap must be less than or equal to maxCompetitorGap',
    path: ['minCompetitorGap'],
  }
);

/**
 * Update alert rule input schema
 */
export const updateReputationAlertRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  channel: reputationAlertChannelSchema.optional(),

  // Overall score thresholds (nullable to allow clearing)
  minOverallScore: scoreThresholdSchema.nullable().optional(),
  maxOverallScore: scoreThresholdSchema.nullable().optional(),

  // Delta thresholds
  minDeltaOverallScore: deltaThresholdSchema.nullable().optional(),
  maxDeltaOverallScore: deltaThresholdSchema.nullable().optional(),

  // Component thresholds
  componentKey: reputationComponentKeySchema.nullable().optional(),
  minComponentScore: scoreThresholdSchema.nullable().optional(),

  // Competitor gap thresholds
  competitorSlug: z.string().max(100).nullable().optional(),
  minCompetitorGap: deltaThresholdSchema.nullable().optional(),
  maxCompetitorGap: deltaThresholdSchema.nullable().optional(),

  // Crisis integration
  minIncidentSeverity: z.number().int().min(1).max(5).nullable().optional(),
  linkCrisisIncidents: z.boolean().optional(),

  // Timing controls
  timeWindowMinutes: z.number().int().min(1).max(10080).optional(),
  cooldownMinutes: z.number().int().min(0).max(10080).optional(),

  // Notification config
  notificationConfig: alertNotificationConfigSchema.nullable().optional(),
});

/**
 * List alert rules query schema
 */
export const listReputationAlertRulesQuerySchema = z.object({
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  channel: reputationAlertChannelSchema.optional(),
  limit: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number().int().min(1).max(100).optional().default(20)
  ),
  offset: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number().int().min(0).optional().default(0)
  ),
  sortBy: z.enum(['name', 'createdAt', 'lastTriggeredAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// ALERT EVENT SCHEMAS
// ============================================================================

/**
 * List alert events query schema
 */
export const listReputationAlertEventsQuerySchema = z.object({
  status: reputationAlertStatusSchema.optional(),
  ruleId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number().int().min(1).max(100).optional().default(20)
  ),
  offset: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number().int().min(0).optional().default(0)
  ),
  sortBy: z.enum(['triggeredAt', 'status', 'overallScoreAfter']).optional().default('triggeredAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Acknowledge alert event input schema
 */
export const acknowledgeReputationAlertEventSchema = z.object({
  notes: z.string().max(2000).optional(),
});

/**
 * Resolve alert event input schema
 */
export const resolveReputationAlertEventSchema = z.object({
  resolutionNotes: z.string().min(1).max(2000),
});

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

/**
 * Report recipient schema
 */
export const reportRecipientSchema = z.object({
  channel: reputationAlertChannelSchema,
  target: z.string().min(1).max(500),
  recipientName: z.string().max(200).optional(),
  isPrimary: z.boolean().optional().default(false),
});

/**
 * Create report input schema
 */
export const createReputationReportSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  reportPeriodStart: z.string().datetime(),
  reportPeriodEnd: z.string().datetime(),
  frequency: reputationReportFrequencySchema.optional().default('ad_hoc'),
  format: reputationReportFormatSchema.optional().default('executive_summary'),
  recipients: z.array(reportRecipientSchema).optional(),
}).refine(
  (data) => new Date(data.reportPeriodStart) < new Date(data.reportPeriodEnd),
  {
    message: 'reportPeriodStart must be before reportPeriodEnd',
    path: ['reportPeriodStart'],
  }
);

/**
 * Generate report input schema (for ad hoc generation)
 */
export const generateReputationReportSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  reportPeriodStart: z.string().datetime(),
  reportPeriodEnd: z.string().datetime(),
  frequency: reputationReportFrequencySchema.optional().default('ad_hoc'),
  format: reputationReportFormatSchema.optional().default('executive_summary'),
  includeCompetitors: z.boolean().optional().default(true),
  includeCrisisData: z.boolean().optional().default(true),
  includeMediaMetrics: z.boolean().optional().default(true),
  recipients: z.array(reportRecipientSchema).optional(),
}).refine(
  (data) => new Date(data.reportPeriodStart) < new Date(data.reportPeriodEnd),
  {
    message: 'reportPeriodStart must be before reportPeriodEnd',
    path: ['reportPeriodStart'],
  }
);

/**
 * Regenerate report section input schema
 */
export const regenerateReputationReportSectionSchema = z.object({
  additionalContext: z.string().max(2000).optional(),
  tone: z.enum(['formal', 'conversational', 'executive']).optional().default('executive'),
  maxLength: z.number().int().min(100).max(10000).optional(),
});

/**
 * List reports query schema
 */
export const listReputationReportsQuerySchema = z.object({
  status: reputationReportStatusSchema.optional(),
  frequency: reputationReportFrequencySchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number().int().min(1).max(100).optional().default(20)
  ),
  offset: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number().int().min(0).optional().default(0)
  ),
  sortBy: z.enum(['createdAt', 'reportPeriodStart', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// INSIGHTS SCHEMAS
// ============================================================================

/**
 * Get reputation insights query schema
 */
export const getReputationInsightsQuerySchema = z.object({
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  includeCompetitors: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional().default(true)
  ),
  includeCrisisData: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional().default(true)
  ),
  maxDrivers: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number().int().min(1).max(10).optional().default(3)
  ),
});

// ============================================================================
// PATH PARAMETER SCHEMAS
// ============================================================================

/**
 * Alert Rule ID path parameter schema
 */
export const alertRuleIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Alert Event ID path parameter schema
 */
export const alertEventIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Reputation Report ID path parameter schema
 */
export const reputationReportIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Reputation Report Section ID path parameter schema (used with report ID)
 */
export const reputationSectionIdParamSchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Enum types
export type ReputationAlertChannelInput = z.input<typeof reputationAlertChannelSchema>;
export type ReputationAlertChannelOutput = z.output<typeof reputationAlertChannelSchema>;

export type ReputationAlertStatusInput = z.input<typeof reputationAlertStatusSchema>;
export type ReputationAlertStatusOutput = z.output<typeof reputationAlertStatusSchema>;

export type ReputationReportFrequencyInput = z.input<typeof reputationReportFrequencySchema>;
export type ReputationReportFrequencyOutput = z.output<typeof reputationReportFrequencySchema>;

export type ReputationReportFormatInput = z.input<typeof reputationReportFormatSchema>;
export type ReputationReportFormatOutput = z.output<typeof reputationReportFormatSchema>;

export type ReputationReportStatusInput = z.input<typeof reputationReportStatusSchema>;
export type ReputationReportStatusOutput = z.output<typeof reputationReportStatusSchema>;

export type ReputationReportSectionTypeInput = z.input<typeof reputationReportSectionTypeSchema>;
export type ReputationReportSectionTypeOutput = z.output<typeof reputationReportSectionTypeSchema>;

export type ReputationComponentKeyInput = z.input<typeof reputationComponentKeySchema>;
export type ReputationComponentKeyOutput = z.output<typeof reputationComponentKeySchema>;

// Rule types
export type CreateReputationAlertRuleInput = z.input<typeof createReputationAlertRuleSchema>;
export type CreateReputationAlertRuleOutput = z.output<typeof createReputationAlertRuleSchema>;

export type UpdateReputationAlertRuleInput = z.input<typeof updateReputationAlertRuleSchema>;
export type UpdateReputationAlertRuleOutput = z.output<typeof updateReputationAlertRuleSchema>;

export type ListReputationAlertRulesQueryInput = z.input<typeof listReputationAlertRulesQuerySchema>;
export type ListReputationAlertRulesQueryOutput = z.output<typeof listReputationAlertRulesQuerySchema>;

// Event types
export type ListReputationAlertEventsQueryInput = z.input<typeof listReputationAlertEventsQuerySchema>;
export type ListReputationAlertEventsQueryOutput = z.output<typeof listReputationAlertEventsQuerySchema>;

export type AcknowledgeReputationAlertEventInput = z.input<typeof acknowledgeReputationAlertEventSchema>;
export type AcknowledgeReputationAlertEventOutput = z.output<typeof acknowledgeReputationAlertEventSchema>;

export type ResolveReputationAlertEventInput = z.input<typeof resolveReputationAlertEventSchema>;
export type ResolveReputationAlertEventOutput = z.output<typeof resolveReputationAlertEventSchema>;

// Report types
export type CreateReputationReportInput = z.input<typeof createReputationReportSchema>;
export type CreateReputationReportOutput = z.output<typeof createReputationReportSchema>;

export type GenerateReputationReportInput = z.input<typeof generateReputationReportSchema>;
export type GenerateReputationReportOutput = z.output<typeof generateReputationReportSchema>;

export type RegenerateReputationReportSectionInput = z.input<typeof regenerateReputationReportSectionSchema>;
export type RegenerateReputationReportSectionOutput = z.output<typeof regenerateReputationReportSectionSchema>;

export type ListReputationReportsQueryInput = z.input<typeof listReputationReportsQuerySchema>;
export type ListReputationReportsQueryOutput = z.output<typeof listReputationReportsQuerySchema>;

// Insights types
export type GetReputationInsightsQueryInput = z.input<typeof getReputationInsightsQuerySchema>;
export type GetReputationInsightsQueryOutput = z.output<typeof getReputationInsightsQuerySchema>;

// Notification config type
export type AlertNotificationConfigInput = z.input<typeof alertNotificationConfigSchema>;
export type AlertNotificationConfigOutput = z.output<typeof alertNotificationConfigSchema>;

// Recipient type
export type ReportRecipientInput = z.input<typeof reportRecipientSchema>;
export type ReportRecipientOutput = z.output<typeof reportRecipientSchema>;
