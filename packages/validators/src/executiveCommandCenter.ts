/**
 * Executive Command Center Validators (Sprint S61)
 * Zod schemas for validating executive dashboard inputs and queries
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Time window for dashboard analysis
 */
export const execDashboardTimeWindowSchema = z.enum(['24h', '7d', '30d', '90d']);

/**
 * Primary focus area for dashboard
 */
export const execDashboardPrimaryFocusSchema = z.enum([
  'risk',
  'reputation',
  'growth',
  'governance',
  'mixed',
]);

/**
 * Source system for insights
 */
export const execInsightSourceSystemSchema = z.enum([
  'risk_radar',
  'crisis',
  'reputation',
  'governance',
  'media_performance',
  'competitive_intel',
  'personas',
  'outreach',
  'media_monitoring',
  'press_releases',
  'pitches',
  'media_lists',
  'journalist_discovery',
  'other',
]);

/**
 * Audit action types
 */
export const execDashboardActionTypeSchema = z.enum([
  'created',
  'updated',
  'deleted',
  'viewed',
  'refreshed',
  'narrative_generated',
  'exported',
]);

/**
 * KPI trend direction
 */
export const execKpiTrendDirectionSchema = z.enum(['up', 'down', 'flat']);

/**
 * Insight severity levels
 */
export const execInsightSeveritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);

// ============================================================================
// COMPONENT SCHEMAS
// ============================================================================

/**
 * KPI trend data
 */
export const execKpiTrendSchema = z.object({
  direction: execKpiTrendDirectionSchema,
  change: z.number(),
  previousValue: z.number().nullable(),
  changePercent: z.number().optional(),
});

/**
 * Dashboard filters
 */
export const execDashboardFiltersSchema = z.object({
  sourceSystemsIncluded: z.array(execInsightSourceSystemSchema).optional(),
  sourceSystemsExcluded: z.array(execInsightSourceSystemSchema).optional(),
  severityThreshold: execInsightSeveritySchema.optional(),
  categories: z.array(z.string()).optional(),
  excludeArchived: z.boolean().optional(),
  customDateRange: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
    .optional(),
});

// ============================================================================
// CRUD SCHEMAS
// ============================================================================

/**
 * Schema for creating a new executive dashboard
 */
export const createExecDashboardSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters')
    .optional()
    .default('Executive Dashboard'),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .nullable(),
  timeWindow: execDashboardTimeWindowSchema.optional().default('7d'),
  primaryFocus: execDashboardPrimaryFocusSchema.optional().default('mixed'),
  filters: execDashboardFiltersSchema.optional(),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Schema for updating an executive dashboard
 */
export const updateExecDashboardSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .nullable(),
  timeWindow: execDashboardTimeWindowSchema.optional(),
  primaryFocus: execDashboardPrimaryFocusSchema.optional(),
  filters: execDashboardFiltersSchema.optional(),
  isDefault: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

/**
 * Schema for refreshing a dashboard
 */
export const refreshExecDashboardSchema = z.object({
  timeWindowOverride: execDashboardTimeWindowSchema.optional(),
  primaryFocusOverride: execDashboardPrimaryFocusSchema.optional(),
  regenerateNarrative: z.boolean().optional().default(true),
  forceRefresh: z.boolean().optional().default(false),
});

/**
 * Schema for generating a narrative
 */
export const generateExecNarrativeSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  forceRegenerate: z.boolean().optional().default(false),
  customPromptHint: z
    .string()
    .max(500, 'Custom prompt hint must be at most 500 characters')
    .optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Query parameters for listing dashboards
 */
export const listExecDashboardsSchema = z.object({
  includeArchived: z.boolean().optional().default(false),
  primaryFocus: execDashboardPrimaryFocusSchema.optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Query parameters for listing insights
 */
export const listExecInsightsSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  sourceSystem: execInsightSourceSystemSchema.optional(),
  category: z.string().max(100).optional(),
  isTopInsight: z.boolean().optional(),
  isRisk: z.boolean().optional(),
  isOpportunity: z.boolean().optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Query parameters for listing KPIs
 */
export const listExecKpisSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  category: z.string().max(100).optional(),
  sourceSystem: execInsightSourceSystemSchema.optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Query parameters for listing narratives
 */
export const listExecNarrativesSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  limit: z.number().int().min(1).max(20).optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Query parameters for audit log
 */
export const listExecAuditLogSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID').optional(),
  actionType: execDashboardActionTypeSchema.optional(),
  userId: z.string().uuid('User ID must be a valid UUID').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

// ============================================================================
// INSIGHT SCHEMAS
// ============================================================================

/**
 * Schema for creating an insight
 */
export const createExecInsightSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  sourceSystem: execInsightSourceSystemSchema,
  insightType: z.string().min(1).max(100),
  severityOrImpact: z.number().min(0).max(100).default(0),
  category: z.string().max(100).optional().nullable(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be at most 500 characters'),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .nullable(),
  linkUrl: z.string().url('Link URL must be valid').optional().nullable(),
  linkedEntityType: z.string().max(100).optional().nullable(),
  linkedEntityId: z.string().uuid().optional().nullable(),
  isTopInsight: z.boolean().optional().default(false),
  isOpportunity: z.boolean().optional().default(false),
  isRisk: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
  meta: z.record(z.unknown()).optional(),
});

/**
 * Schema for batch creating insights
 */
export const batchCreateExecInsightsSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  insights: z.array(createExecInsightSchema.omit({ dashboardId: true })),
});

// ============================================================================
// KPI SCHEMAS
// ============================================================================

/**
 * Schema for creating a KPI
 */
export const createExecKpiSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  metricKey: z.string().min(1).max(100),
  metricLabel: z.string().min(1).max(255),
  metricValue: z.number(),
  metricUnit: z.string().max(50).optional().nullable(),
  metricTrend: execKpiTrendSchema.optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
  category: z.string().max(100).optional().nullable(),
  sourceSystem: execInsightSourceSystemSchema.optional().nullable(),
  meta: z.record(z.unknown()).optional(),
});

/**
 * Schema for batch creating KPIs
 */
export const batchCreateExecKpisSchema = z.object({
  dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
  kpis: z.array(createExecKpiSchema.omit({ dashboardId: true })),
});

// ============================================================================
// PATH PARAMETER SCHEMAS
// ============================================================================

/**
 * Dashboard ID path parameter
 */
export const execDashboardIdParamSchema = z.object({
  id: z.string().uuid('Dashboard ID must be a valid UUID'),
});

/**
 * Insight ID path parameter
 */
export const execInsightIdParamSchema = z.object({
  id: z.string().uuid('Insight ID must be a valid UUID'),
});

/**
 * KPI ID path parameter
 */
export const execKpiIdParamSchema = z.object({
  id: z.string().uuid('KPI ID must be a valid UUID'),
});

/**
 * Narrative ID path parameter
 */
export const execNarrativeIdParamSchema = z.object({
  id: z.string().uuid('Narrative ID must be a valid UUID'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateExecDashboardInput = z.infer<typeof createExecDashboardSchema>;
export type UpdateExecDashboardInput = z.infer<typeof updateExecDashboardSchema>;
export type RefreshExecDashboardInput = z.infer<typeof refreshExecDashboardSchema>;
export type GenerateExecNarrativeInput = z.infer<typeof generateExecNarrativeSchema>;
export type ListExecDashboardsInput = z.infer<typeof listExecDashboardsSchema>;
export type ListExecInsightsInput = z.infer<typeof listExecInsightsSchema>;
export type ListExecKpisInput = z.infer<typeof listExecKpisSchema>;
export type ListExecNarrativesInput = z.infer<typeof listExecNarrativesSchema>;
export type ListExecAuditLogInput = z.infer<typeof listExecAuditLogSchema>;
export type CreateExecInsightInput = z.infer<typeof createExecInsightSchema>;
export type CreateExecKpiInput = z.infer<typeof createExecKpiSchema>;
export type ExecDashboardFiltersInput = z.infer<typeof execDashboardFiltersSchema>;
export type ExecKpiTrendInput = z.infer<typeof execKpiTrendSchema>;
