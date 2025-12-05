/**
 * Brand Reputation Intelligence Validators (Sprint S56)
 *
 * Zod schemas for validating brand reputation API requests and data.
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Reputation time window options
 */
export const reputationTimeWindowSchema = z.enum(['24h', '7d', '30d', '90d', 'all']);

/**
 * Reputation component types
 */
export const reputationComponentSchema = z.enum([
  'sentiment',
  'coverage',
  'crisis_impact',
  'competitive_position',
  'engagement',
]);

/**
 * Reputation trend direction
 */
export const reputationTrendDirectionSchema = z.enum(['up', 'down', 'flat']);

/**
 * Alert severity levels
 */
export const reputationAlertSeveritySchema = z.enum(['info', 'warning', 'critical']);

/**
 * Source systems for reputation events
 */
export const reputationSourceSystemSchema = z.enum([
  'media_monitoring',
  'media_alert',
  'media_performance',
  'crisis_incident',
  'competitive_intel',
  'pr_outreach',
  'pr_generator',
  'pr_pitch',
  'journalist_engagement',
  'social_listening',
  'manual_adjustment',
]);

/**
 * Signal types for reputation events
 */
export const reputationSignalTypeSchema = z.enum([
  'sentiment_shift',
  'coverage_spike',
  'coverage_drop',
  'crisis_detected',
  'crisis_resolved',
  'competitor_gain',
  'competitor_loss',
  'engagement_increase',
  'engagement_decrease',
  'media_mention',
  'journalist_response',
  'outreach_success',
  'outreach_failure',
  'alert_triggered',
  'performance_change',
]);

/**
 * Event severity levels
 */
export const reputationEventSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Trend granularity options
 */
export const trendGranularitySchema = z.enum(['hourly', 'daily', 'weekly']);

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Query parameters for reputation dashboard
 */
export const getReputationDashboardQuerySchema = z.object({
  window: reputationTimeWindowSchema.optional().default('30d'),
  includeCompetitors: z
    .string()
    .transform((v) => v === 'true')
    .optional()
    .default('true'),
  includeTrend: z
    .string()
    .transform((v) => v === 'true')
    .optional()
    .default('true'),
  includeEvents: z
    .string()
    .transform((v) => v === 'true')
    .optional()
    .default('false'),
  maxDrivers: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(20))
    .optional()
    .default('5'),
});

/**
 * Query parameters for reputation trend
 */
export const getReputationTrendQuerySchema = z.object({
  window: reputationTimeWindowSchema.default('30d'),
  granularity: trendGranularitySchema.optional().default('daily'),
  includeComponents: z
    .string()
    .transform((v) => v === 'true')
    .optional()
    .default('true'),
});

/**
 * Query parameters for reputation events
 */
export const getReputationEventsQuerySchema = z.object({
  window: reputationTimeWindowSchema.optional(),
  sourceSystem: reputationSourceSystemSchema.optional(),
  component: reputationComponentSchema.optional(),
  severity: reputationEventSeveritySchema.optional(),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20'),
  offset: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(0))
    .optional()
    .default('0'),
});

/**
 * Query parameters for reputation alerts
 */
export const getReputationAlertsQuerySchema = z.object({
  severity: reputationAlertSeveritySchema.optional(),
  isAcknowledged: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  isResolved: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20'),
  offset: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(0))
    .optional()
    .default('0'),
});

// ============================================================================
// BODY SCHEMAS
// ============================================================================

/**
 * Request body for recalculating reputation
 */
export const recalculateReputationBodySchema = z.object({
  window: reputationTimeWindowSchema.default('30d'),
  forceRefresh: z.boolean().optional().default(false),
  includeHistorical: z.boolean().optional().default(false),
});

/**
 * Alert recipient schema
 */
export const alertRecipientSchema = z.object({
  type: z.enum(['email', 'slack', 'webhook']),
  destination: z.string().min(1).max(500),
  severities: z.array(reputationAlertSeveritySchema).min(1),
});

/**
 * Request body for updating reputation config
 */
export const updateReputationConfigBodySchema = z
  .object({
    weightSentiment: z.number().min(0).max(100).optional(),
    weightCoverage: z.number().min(0).max(100).optional(),
    weightCrisis: z.number().min(0).max(100).optional(),
    weightCompetitive: z.number().min(0).max(100).optional(),
    weightEngagement: z.number().min(0).max(100).optional(),
    thresholdAlertScoreDrop: z.number().min(0).max(100).optional(),
    thresholdCriticalScore: z.number().min(0).max(100).optional(),
    thresholdWarningScore: z.number().min(0).max(100).optional(),
    baselineScore: z.number().min(0).max(100).optional(),
    defaultTimeWindow: reputationTimeWindowSchema.optional(),
    autoRecalculate: z.boolean().optional(),
    recalculateIntervalHours: z.number().int().min(1).max(168).optional(), // Max 1 week
    trackedCompetitorIds: z.array(z.string().uuid()).optional(),
    enableScoreAlerts: z.boolean().optional(),
    alertRecipients: z.array(alertRecipientSchema).optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // If all weights are provided, they should sum to ~100
      const weights = [
        data.weightSentiment,
        data.weightCoverage,
        data.weightCrisis,
        data.weightCompetitive,
        data.weightEngagement,
      ];
      const definedWeights = weights.filter((w) => w !== undefined);
      if (definedWeights.length === 5) {
        const sum = definedWeights.reduce((a, b) => a! + b!, 0)!;
        return sum >= 99.99 && sum <= 100.01;
      }
      return true;
    },
    {
      message: 'Component weights must sum to 100 when all are provided',
    }
  );

/**
 * Request body for creating a manual reputation event
 */
export const createReputationEventBodySchema = z.object({
  signalType: reputationSignalTypeSchema,
  delta: z.number().min(-100).max(100),
  affectedComponent: reputationComponentSchema,
  severity: reputationEventSeveritySchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sourceEntityType: z.string().max(100).optional(),
  sourceEntityId: z.string().uuid().optional(),
  context: z.record(z.unknown()).optional(),
});

/**
 * Request body for acknowledging an alert
 */
export const acknowledgeAlertBodySchema = z.object({
  notes: z.string().max(2000).optional(),
});

/**
 * Request body for resolving an alert
 */
export const resolveAlertBodySchema = z.object({
  resolutionNotes: z.string().min(1).max(2000),
});

// ============================================================================
// PATH PARAMETER SCHEMAS
// ============================================================================

/**
 * Path parameters for snapshot operations
 */
export const snapshotIdParamSchema = z.object({
  snapshotId: z.string().uuid(),
});

/**
 * Path parameters for event operations
 */
export const eventIdParamSchema = z.object({
  eventId: z.string().uuid(),
});

/**
 * Path parameters for alert operations
 */
export const alertIdParamSchema = z.object({
  alertId: z.string().uuid(),
});

// ============================================================================
// DATA VALIDATION SCHEMAS
// ============================================================================

/**
 * Reputation driver schema
 */
export const reputationDriverSchema = z.object({
  id: z.string(),
  type: z.enum(['positive', 'negative']),
  title: z.string(),
  description: z.string(),
  impact: z.number(),
  impactPercentage: z.number(),
  component: reputationComponentSchema,
  sourceSystem: reputationSourceSystemSchema,
  sourceEntityType: z.string().optional(),
  sourceEntityId: z.string().optional(),
  occurredAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Component factor schema
 */
export const componentFactorSchema = z.object({
  name: z.string(),
  impact: z.number(),
  description: z.string(),
  sourceSystem: reputationSourceSystemSchema.optional(),
  sourceEntityId: z.string().optional(),
});

/**
 * Component score schema
 */
export const componentScoreSchema = z.object({
  component: reputationComponentSchema,
  score: z.number().min(0).max(100),
  previousScore: z.number().min(0).max(100).optional(),
  delta: z.number().optional(),
  weight: z.number().min(0).max(100),
  contribution: z.number(),
  trend: reputationTrendDirectionSchema,
  factors: z.array(componentFactorSchema),
});

/**
 * Competitor comparison schema
 */
export const competitorComparisonSchema = z.object({
  competitorId: z.string(),
  competitorName: z.string(),
  competitorScore: z.number().min(0).max(100),
  competitorTrend: reputationTrendDirectionSchema,
  brandScore: z.number().min(0).max(100),
  scoreDelta: z.number(),
  rank: z.number().int().min(1),
  previousRank: z.number().int().min(1).optional(),
  rankChange: z.number().int(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  componentComparison: z.array(
    z.object({
      component: reputationComponentSchema,
      brandScore: z.number().min(0).max(100),
      competitorScore: z.number().min(0).max(100),
      delta: z.number(),
    })
  ),
});

/**
 * Trend point schema
 */
export const trendPointSchema = z.object({
  timestamp: z.string(),
  overallScore: z.number().min(0).max(100),
  components: z.object({
    sentiment: z.number().min(0).max(100),
    coverage: z.number().min(0).max(100),
    crisisImpact: z.number().min(0).max(100),
    competitivePosition: z.number().min(0).max(100),
    engagement: z.number().min(0).max(100),
  }),
  events: z.number().int().min(0),
  crisisActive: z.boolean(),
});

/**
 * Score breakdown schema
 */
export const scoreBreakdownSchema = z.object({
  overall: z.number().min(0).max(100),
  sentiment: z.number().min(0).max(100),
  coverage: z.number().min(0).max(100),
  crisisImpact: z.number().min(0).max(100),
  competitivePosition: z.number().min(0).max(100),
  engagement: z.number().min(0).max(100),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ReputationTimeWindowInput = z.input<typeof reputationTimeWindowSchema>;
export type ReputationTimeWindowOutput = z.output<typeof reputationTimeWindowSchema>;

export type GetReputationDashboardQueryInput = z.input<typeof getReputationDashboardQuerySchema>;
export type GetReputationDashboardQueryOutput = z.output<typeof getReputationDashboardQuerySchema>;

export type GetReputationTrendQueryInput = z.input<typeof getReputationTrendQuerySchema>;
export type GetReputationTrendQueryOutput = z.output<typeof getReputationTrendQuerySchema>;

export type GetReputationEventsQueryInput = z.input<typeof getReputationEventsQuerySchema>;
export type GetReputationEventsQueryOutput = z.output<typeof getReputationEventsQuerySchema>;

export type GetReputationAlertsQueryInput = z.input<typeof getReputationAlertsQuerySchema>;
export type GetReputationAlertsQueryOutput = z.output<typeof getReputationAlertsQuerySchema>;

export type RecalculateReputationBodyInput = z.input<typeof recalculateReputationBodySchema>;
export type RecalculateReputationBodyOutput = z.output<typeof recalculateReputationBodySchema>;

export type UpdateReputationConfigBodyInput = z.input<typeof updateReputationConfigBodySchema>;
export type UpdateReputationConfigBodyOutput = z.output<typeof updateReputationConfigBodySchema>;

export type CreateReputationEventBodyInput = z.input<typeof createReputationEventBodySchema>;
export type CreateReputationEventBodyOutput = z.output<typeof createReputationEventBodySchema>;

export type AcknowledgeAlertBodyInput = z.input<typeof acknowledgeAlertBodySchema>;
export type AcknowledgeAlertBodyOutput = z.output<typeof acknowledgeAlertBodySchema>;

export type ResolveAlertBodyInput = z.input<typeof resolveAlertBodySchema>;
export type ResolveAlertBodyOutput = z.output<typeof resolveAlertBodySchema>;
