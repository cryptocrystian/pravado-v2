/**
 * Strategic Intelligence Narrative Engine Validators (Sprint S65)
 * Zod schemas for CEO-level strategic intelligence reports
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const strategicReportFormatSchema = z.enum([
  'quarterly_strategic_review',
  'annual_strategic_assessment',
  'board_strategy_brief',
  'ceo_intelligence_brief',
  'investor_strategy_update',
  'crisis_strategic_response',
  'competitive_strategy_report',
  'custom',
]);

export const strategicReportStatusSchema = z.enum([
  'draft',
  'generating',
  'review',
  'approved',
  'published',
  'archived',
]);

export const strategicSectionTypeSchema = z.enum([
  'executive_summary',
  'strategic_outlook',
  'market_dynamics',
  'competitive_positioning',
  'risk_opportunity_matrix',
  'messaging_alignment',
  'ceo_talking_points',
  'quarter_changes',
  'key_kpis_narrative',
  'prioritized_initiatives',
  'brand_health_overview',
  'crisis_posture',
  'governance_compliance',
  'investor_sentiment',
  'media_performance_summary',
  'strategic_recommendations',
  'appendix',
  'custom',
]);

export const strategicSectionStatusSchema = z.enum([
  'draft',
  'generated',
  'edited',
  'approved',
]);

export const strategicAudienceSchema = z.enum([
  'ceo',
  'c_suite',
  'board',
  'investors',
  'senior_leadership',
  'all_executives',
]);

export const strategicSourceSystemSchema = z.enum([
  'pr_generator',
  'media_monitoring',
  'media_alerts',
  'media_performance',
  'competitive_intel',
  'crisis_engine',
  'brand_reputation',
  'brand_alerts',
  'governance',
  'risk_radar',
  'exec_command_center',
  'exec_digest',
  'board_reports',
  'investor_relations',
  'journalist_graph',
  'media_lists',
  'outreach_engine',
  'custom',
]);

export const strategicEventTypeSchema = z.enum([
  'created',
  'updated',
  'status_changed',
  'section_generated',
  'section_regenerated',
  'section_edited',
  'insights_refreshed',
  'source_added',
  'source_removed',
  'approved',
  'published',
  'archived',
]);

// ============================================================================
// CREATE SCHEMAS
// ============================================================================

export const createStrategicReportSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  format: strategicReportFormatSchema.default('quarterly_strategic_review'),
  audience: strategicAudienceSchema.default('c_suite'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  fiscalQuarter: z.string().max(10).optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  sectionTypes: z.array(strategicSectionTypeSchema).optional().default([
    'executive_summary',
    'strategic_outlook',
    'market_dynamics',
    'competitive_positioning',
    'risk_opportunity_matrix',
    'key_kpis_narrative',
  ]),
  tone: z.enum(['executive', 'formal', 'strategic']).default('executive'),
  targetLength: z.enum(['brief', 'standard', 'comprehensive']).default('comprehensive'),
  includeCharts: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
});

export type CreateStrategicReport = z.infer<typeof createStrategicReportSchema>;

// ============================================================================
// UPDATE SCHEMAS
// ============================================================================

export const updateStrategicReportSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  format: strategicReportFormatSchema.optional(),
  audience: strategicAudienceSchema.optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  fiscalQuarter: z.string().max(10).optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  sectionTypes: z.array(strategicSectionTypeSchema).optional(),
  tone: z.enum(['executive', 'formal', 'strategic']).optional(),
  targetLength: z.enum(['brief', 'standard', 'comprehensive']).optional(),
  includeCharts: z.boolean().optional(),
  includeRecommendations: z.boolean().optional(),
});

export type UpdateStrategicReport = z.infer<typeof updateStrategicReportSchema>;

export const updateStrategicSectionSchema = z.object({
  title: z.string().max(500).optional(),
  contentMd: z.string().optional(),
  contentHtml: z.string().optional(),
  isVisible: z.boolean().optional(),
  chartsConfig: z.array(z.object({
    chartId: z.string(),
    chartType: z.enum(['line', 'bar', 'pie', 'area', 'radar', 'gauge', 'heatmap']),
    title: z.string(),
    description: z.string().optional(),
    dataSource: z.string(),
    config: z.record(z.unknown()),
    data: z.array(z.unknown()).optional(),
  })).optional(),
  dataTables: z.array(z.object({
    tableId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    columns: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['text', 'number', 'percent', 'date', 'currency', 'badge']),
    })),
    data: z.array(z.record(z.unknown())),
  })).optional(),
  sectionMetrics: z.object({
    keyMetrics: z.record(z.union([z.number(), z.string()])).optional(),
    trends: z.array(z.object({
      metric: z.string(),
      direction: z.enum(['up', 'down', 'stable']),
      percentChange: z.number().optional(),
      narrative: z.string().optional(),
    })).optional(),
    comparisons: z.array(z.object({
      metric: z.string(),
      current: z.union([z.number(), z.string()]),
      previous: z.union([z.number(), z.string()]),
      benchmark: z.union([z.number(), z.string()]).optional(),
    })).optional(),
  }).optional(),
});

export type UpdateStrategicSection = z.infer<typeof updateStrategicSectionSchema>;

// ============================================================================
// LIST/QUERY SCHEMAS
// ============================================================================

export const listStrategicReportsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: strategicReportStatusSchema.optional(),
  format: strategicReportFormatSchema.optional(),
  audience: strategicAudienceSchema.optional(),
  fiscalQuarter: z.string().optional(),
  fiscalYear: z.coerce.number().int().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'period_start', 'overall_strategic_score']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListStrategicReportsQuery = z.infer<typeof listStrategicReportsQuerySchema>;

export const listStrategicSourcesQuerySchema = z.object({
  reportId: z.string().uuid().optional(),
  sourceSystem: strategicSourceSystemSchema.optional(),
  isPrimarySource: z.boolean().optional(),
  minRelevanceScore: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListStrategicSourcesQuery = z.infer<typeof listStrategicSourcesQuerySchema>;

export const listStrategicAuditLogsQuerySchema = z.object({
  reportId: z.string().uuid().optional(),
  eventType: strategicEventTypeSchema.optional(),
  userId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  sectionType: strategicSectionTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListStrategicAuditLogsQuery = z.infer<typeof listStrategicAuditLogsQuerySchema>;

// ============================================================================
// GENERATION SCHEMAS
// ============================================================================

export const generateStrategicReportSchema = z.object({
  regenerateSections: z.array(strategicSectionTypeSchema).optional(),
  refreshInsights: z.boolean().default(true),
  includeSources: z.array(strategicSourceSystemSchema).optional(),
  excludeSources: z.array(strategicSourceSystemSchema).optional(),
  customInstructions: z.string().max(2000).optional(),
});

export type GenerateStrategicReport = z.infer<typeof generateStrategicReportSchema>;

export const regenerateStrategicSectionSchema = z.object({
  customPrompt: z.string().max(2000).optional(),
  includeCharts: z.boolean().optional(),
  dataSources: z.array(strategicSourceSystemSchema).optional(),
  maxTokens: z.number().int().min(100).max(8000).optional(),
});

export type RegenerateStrategicSection = z.infer<typeof regenerateStrategicSectionSchema>;

export const refreshInsightsSchema = z.object({
  sourceSystems: z.array(strategicSourceSystemSchema).optional(),
  forceRefresh: z.boolean().optional().default(false),
  updateKpis: z.boolean().optional().default(true),
  updateSummary: z.boolean().optional().default(true),
});

export type RefreshInsights = z.infer<typeof refreshInsightsSchema>;

// ============================================================================
// REORDER SCHEMAS
// ============================================================================

export const reorderStrategicSectionsSchema = z.object({
  sectionOrder: z.array(z.object({
    sectionId: z.string().uuid(),
    orderIndex: z.number().int().min(0),
  })),
});

export type ReorderStrategicSections = z.infer<typeof reorderStrategicSectionsSchema>;

// ============================================================================
// SOURCE MANAGEMENT SCHEMAS
// ============================================================================

export const addStrategicSourceSchema = z.object({
  sourceSystem: strategicSourceSystemSchema,
  sourceId: z.string().optional(),
  sourceType: z.string().max(100).optional(),
  sourceTitle: z.string().max(500).optional(),
  sourceUrl: z.string().url().optional(),
  extractedData: z.record(z.unknown()).optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
  dataQualityScore: z.number().min(0).max(100).optional(),
  isPrimarySource: z.boolean().default(false),
  sectionsUsing: z.array(z.string()).optional(),
});

export type AddStrategicSource = z.infer<typeof addStrategicSourceSchema>;

export const updateStrategicSourceSchema = z.object({
  sourceTitle: z.string().max(500).optional(),
  sourceUrl: z.string().url().optional(),
  extractedData: z.record(z.unknown()).optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
  dataQualityScore: z.number().min(0).max(100).optional(),
  isPrimarySource: z.boolean().optional(),
  sectionsUsing: z.array(z.string()).optional(),
});

export type UpdateStrategicSource = z.infer<typeof updateStrategicSourceSchema>;

// ============================================================================
// WORKFLOW SCHEMAS
// ============================================================================

export const approveStrategicReportSchema = z.object({
  approvalNote: z.string().max(1000).optional(),
});

export type ApproveStrategicReport = z.infer<typeof approveStrategicReportSchema>;

export const publishStrategicReportSchema = z.object({
  generatePdf: z.boolean().optional().default(true),
  generatePptx: z.boolean().optional().default(false),
  notifyRecipients: z.array(z.string().email()).optional(),
  publishNote: z.string().max(1000).optional(),
});

export type PublishStrategicReport = z.infer<typeof publishStrategicReportSchema>;

export const archiveStrategicReportSchema = z.object({
  archiveReason: z.string().max(500).optional(),
});

export type ArchiveStrategicReport = z.infer<typeof archiveStrategicReportSchema>;

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

export const exportStrategicReportSchema = z.object({
  format: z.enum(['pdf', 'pptx', 'docx', 'html']),
  includeSections: z.array(strategicSectionTypeSchema).optional(),
  includeCharts: z.boolean().default(true),
  includeAppendix: z.boolean().default(true),
  brandingOptions: z.object({
    logo: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }).optional(),
});

export type ExportStrategicReport = z.infer<typeof exportStrategicReportSchema>;

// ============================================================================
// COMPARISON SCHEMAS
// ============================================================================

export const comparePeriodsSchema = z.object({
  currentReportId: z.string().uuid(),
  previousReportId: z.string().uuid().optional(),
  metrics: z.array(z.string()).optional(),
});

export type ComparePeriods = z.infer<typeof comparePeriodsSchema>;

// ============================================================================
// PARAM SCHEMAS
// ============================================================================

export const strategicReportIdParamSchema = z.object({
  reportId: z.string().uuid(),
});

export type StrategicReportIdParam = z.infer<typeof strategicReportIdParamSchema>;

export const strategicSectionIdParamSchema = z.object({
  reportId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

export type StrategicSectionIdParam = z.infer<typeof strategicSectionIdParamSchema>;

export const strategicSourceIdParamSchema = z.object({
  reportId: z.string().uuid(),
  sourceId: z.string().uuid(),
});

export type StrategicSourceIdParam = z.infer<typeof strategicSourceIdParamSchema>;
