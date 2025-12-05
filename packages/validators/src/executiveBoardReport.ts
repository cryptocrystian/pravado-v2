/**
 * Executive Board Report Validators (Sprint S63)
 * Board Reporting & Quarterly Executive Pack Generator V1
 *
 * Zod schemas for:
 * - Board report CRUD operations
 * - Section management
 * - Audience management
 * - Generation and publishing
 * - Approval workflow
 */

import { z } from 'zod';

// ============================================================================
// Enum Schemas
// ============================================================================

/**
 * Report format enum
 */
export const execBoardReportFormatSchema = z.enum([
  'quarterly',
  'annual',
  'monthly',
  'board_meeting',
  'investor_update',
  'custom',
]);

/**
 * Report status enum
 */
export const execBoardReportStatusSchema = z.enum([
  'draft',
  'generating',
  'review',
  'approved',
  'published',
  'archived',
]);

/**
 * Section type enum
 */
export const execBoardReportSectionTypeSchema = z.enum([
  'executive_summary',
  'strategic_highlights',
  'kpi_dashboard',
  'financial_overview',
  'market_analysis',
  'risk_assessment',
  'brand_health',
  'media_coverage',
  'operational_updates',
  'talent_updates',
  'technology_updates',
  'sustainability',
  'forward_outlook',
  'action_items',
  'appendix',
]);

/**
 * Section status enum
 */
export const execBoardReportSectionStatusSchema = z.enum([
  'pending',
  'generating',
  'generated',
  'edited',
  'approved',
  'error',
]);

/**
 * Access level enum
 */
export const execBoardReportAccessLevelSchema = z.enum(['view', 'comment', 'approve']);

/**
 * Tone enum
 */
export const execBoardReportToneSchema = z.enum(['professional', 'formal', 'executive']);

/**
 * Target length enum
 */
export const execBoardReportTargetLengthSchema = z.enum(['brief', 'standard', 'comprehensive']);

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Create board report schema
 */
export const createExecBoardReportSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  format: execBoardReportFormatSchema,
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  fiscalQuarter: z.string().max(20).optional().nullable(), // e.g., "Q1 2025"
  fiscalYear: z.number().int().min(2000).max(2100).optional().nullable(),
  sectionTypes: z.array(execBoardReportSectionTypeSchema).optional(),
  templateConfig: z.record(z.unknown()).optional(),
  llmModel: z.string().max(100).optional(),
  tone: execBoardReportToneSchema.optional(),
  targetLength: execBoardReportTargetLengthSchema.optional(),
});

export type CreateExecBoardReportInput = z.infer<typeof createExecBoardReportSchema>;

/**
 * Update board report schema
 */
export const updateExecBoardReportSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  format: execBoardReportFormatSchema.optional(),
  status: execBoardReportStatusSchema.optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  fiscalQuarter: z.string().max(20).nullable().optional(),
  fiscalYear: z.number().int().min(2000).max(2100).nullable().optional(),
  sectionTypes: z.array(execBoardReportSectionTypeSchema).optional(),
  templateConfig: z.record(z.unknown()).optional(),
  llmModel: z.string().max(100).optional(),
  tone: execBoardReportToneSchema.optional(),
  targetLength: execBoardReportTargetLengthSchema.optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateExecBoardReportInput = z.infer<typeof updateExecBoardReportSchema>;

/**
 * Generate board report schema
 */
export const generateExecBoardReportSchema = z.object({
  forceRegenerate: z.boolean().optional(),
  sectionTypes: z.array(execBoardReportSectionTypeSchema).optional(),
  generatePdf: z.boolean().optional(),
  generatePptx: z.boolean().optional(),
});

export type GenerateExecBoardReportInput = z.infer<typeof generateExecBoardReportSchema>;

/**
 * Publish board report schema
 */
export const publishExecBoardReportSchema = z.object({
  notifyAudience: z.boolean().optional(),
  regeneratePdf: z.boolean().optional(),
  regeneratePptx: z.boolean().optional(),
});

export type PublishExecBoardReportInput = z.infer<typeof publishExecBoardReportSchema>;

/**
 * Approve board report schema
 */
export const approveExecBoardReportSchema = z.object({
  comments: z.string().max(2000).optional(),
});

export type ApproveExecBoardReportInput = z.infer<typeof approveExecBoardReportSchema>;

/**
 * Add audience member schema
 */
export const addExecBoardReportAudienceSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(200).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  accessLevel: execBoardReportAccessLevelSchema.optional(),
});

export type AddExecBoardReportAudienceInput = z.infer<typeof addExecBoardReportAudienceSchema>;

/**
 * Update audience member schema
 */
export const updateExecBoardReportAudienceSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  accessLevel: execBoardReportAccessLevelSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateExecBoardReportAudienceInput = z.infer<typeof updateExecBoardReportAudienceSchema>;

/**
 * Update section schema
 */
export const updateExecBoardReportSectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  summary: z.string().max(500).nullable().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateExecBoardReportSectionInput = z.infer<typeof updateExecBoardReportSectionSchema>;

/**
 * Update section order schema
 */
export const updateExecBoardReportSectionOrderSchema = z.object({
  sections: z.array(
    z.object({
      sectionId: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

export type UpdateExecBoardReportSectionOrderInput = z.infer<typeof updateExecBoardReportSectionOrderSchema>;

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * List board reports query schema
 */
export const listExecBoardReportsSchema = z.object({
  format: execBoardReportFormatSchema.optional(),
  status: execBoardReportStatusSchema.optional(),
  fiscalYear: z.coerce.number().int().min(2000).max(2100).optional(),
  fiscalQuarter: z.string().max(20).optional(),
  includeArchived: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'periodStart', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type ListExecBoardReportsQuery = z.infer<typeof listExecBoardReportsSchema>;

/**
 * List sections query schema
 */
export const listExecBoardReportSectionsSchema = z.object({
  sectionType: execBoardReportSectionTypeSchema.optional(),
  status: execBoardReportSectionStatusSchema.optional(),
  isVisible: z.coerce.boolean().optional(),
});

export type ListExecBoardReportSectionsQuery = z.infer<typeof listExecBoardReportSectionsSchema>;

/**
 * List audience query schema
 */
export const listExecBoardReportAudienceSchema = z.object({
  activeOnly: z.coerce.boolean().optional(),
  accessLevel: execBoardReportAccessLevelSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ListExecBoardReportAudienceQuery = z.infer<typeof listExecBoardReportAudienceSchema>;

/**
 * List audit logs query schema
 */
export const listExecBoardReportAuditLogsSchema = z.object({
  action: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ListExecBoardReportAuditLogsQuery = z.infer<typeof listExecBoardReportAuditLogsSchema>;

// ============================================================================
// Parameter Schemas
// ============================================================================

/**
 * Report ID parameter schema
 */
export const execBoardReportIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ExecBoardReportIdParam = z.infer<typeof execBoardReportIdParamSchema>;

/**
 * Section ID parameter schema
 */
export const execBoardReportSectionIdParamSchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
});

export type ExecBoardReportSectionIdParam = z.infer<typeof execBoardReportSectionIdParamSchema>;

/**
 * Audience ID parameter schema
 */
export const execBoardReportAudienceIdParamSchema = z.object({
  id: z.string().uuid(),
  audienceId: z.string().uuid(),
});

export type ExecBoardReportAudienceIdParam = z.infer<typeof execBoardReportAudienceIdParamSchema>;

// ============================================================================
// Data Schemas
// ============================================================================

/**
 * KPI snapshot schema
 */
export const execBoardReportKpiSnapshotSchema = z.object({
  name: z.string(),
  value: z.union([z.number(), z.string()]),
  previousValue: z.union([z.number(), z.string()]).nullable().optional(),
  change: z.number().nullable().optional(),
  changePercent: z.number().nullable().optional(),
  trend: z.enum(['up', 'down', 'stable']),
  unit: z.string().nullable().optional(),
  source: z.string(),
});

export type ExecBoardReportKpiSnapshot = z.infer<typeof execBoardReportKpiSnapshotSchema>;

/**
 * Strategic insight schema
 */
export const execBoardReportInsightSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  impact: z.enum(['high', 'medium', 'low']),
  source: z.string(),
  recommendations: z.array(z.string()),
});

export type ExecBoardReportInsight = z.infer<typeof execBoardReportInsightSchema>;

// ============================================================================
// Full Entity Schemas (for response validation)
// ============================================================================

/**
 * Board report schema
 */
export const execBoardReportSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  format: execBoardReportFormatSchema,
  status: execBoardReportStatusSchema,
  periodStart: z.string(),
  periodEnd: z.string(),
  fiscalQuarter: z.string().nullable(),
  fiscalYear: z.number().nullable(),
  templateConfig: z.record(z.unknown()),
  sectionTypes: z.array(execBoardReportSectionTypeSchema),
  llmModel: z.string(),
  tone: execBoardReportToneSchema,
  targetLength: execBoardReportTargetLengthSchema,
  pdfStoragePath: z.string().nullable(),
  pptxStoragePath: z.string().nullable(),
  htmlContent: z.string().nullable(),
  createdBy: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  approvedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
  generationStartedAt: z.string().nullable(),
  generationCompletedAt: z.string().nullable(),
  generationDurationMs: z.number().nullable(),
  totalTokensUsed: z.number(),
  generationError: z.string().nullable(),
  dataSourcesUsed: z.record(z.unknown()),
  isArchived: z.boolean(),
  archivedAt: z.string().nullable(),
  archivedBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExecBoardReport = z.infer<typeof execBoardReportSchema>;

/**
 * Section schema
 */
export const execBoardReportSectionSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  orgId: z.string().uuid(),
  sectionType: execBoardReportSectionTypeSchema,
  title: z.string(),
  sortOrder: z.number(),
  content: z.string().nullable(),
  contentHtml: z.string().nullable(),
  summary: z.string().nullable(),
  status: execBoardReportSectionStatusSchema,
  modelName: z.string().nullable(),
  promptUsed: z.string().nullable(),
  tokensUsed: z.number().nullable(),
  generationDurationMs: z.number().nullable(),
  generationError: z.string().nullable(),
  sourceData: z.record(z.unknown()),
  isVisible: z.boolean(),
  isEditable: z.boolean(),
  editedBy: z.string().nullable(),
  editedAt: z.string().nullable(),
  originalContent: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExecBoardReportSection = z.infer<typeof execBoardReportSectionSchema>;

/**
 * Source schema
 */
export const execBoardReportSourceSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  sectionId: z.string().nullable(),
  orgId: z.string().uuid(),
  sourceSystem: z.string(),
  sourceSprint: z.string().nullable(),
  sourceTable: z.string().nullable(),
  sourceRecordIds: z.array(z.string()),
  dataSnapshot: z.record(z.unknown()),
  dataFetchedAt: z.string(),
  createdAt: z.string(),
});

export type ExecBoardReportSource = z.infer<typeof execBoardReportSourceSchema>;

/**
 * Audience member schema
 */
export const execBoardReportAudienceSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().nullable(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.string().nullable(),
  accessLevel: execBoardReportAccessLevelSchema,
  isActive: z.boolean(),
  lastSentAt: z.string().nullable(),
  lastViewedAt: z.string().nullable(),
  viewCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExecBoardReportAudience = z.infer<typeof execBoardReportAudienceSchema>;

/**
 * Audit log schema
 */
export const execBoardReportAuditLogSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  orgId: z.string().uuid(),
  action: z.string(),
  actorId: z.string().nullable(),
  actorEmail: z.string().nullable(),
  changes: z.record(z.unknown()),
  sectionId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});

export type ExecBoardReportAuditLog = z.infer<typeof execBoardReportAuditLogSchema>;

/**
 * Board report with counts schema
 */
export const execBoardReportWithCountsSchema = execBoardReportSchema.extend({
  sectionCount: z.number(),
  audienceCount: z.number(),
  completedSectionCount: z.number(),
});

export type ExecBoardReportWithCounts = z.infer<typeof execBoardReportWithCountsSchema>;

/**
 * Board report statistics schema
 */
export const execBoardReportStatsSchema = z.object({
  totalReports: z.number(),
  draftReports: z.number(),
  publishedReports: z.number(),
  archivedReports: z.number(),
  reportsByFormat: z.record(execBoardReportFormatSchema, z.number()),
  reportsByStatus: z.record(execBoardReportStatusSchema, z.number()),
  totalAudienceMembers: z.number(),
  totalSectionsGenerated: z.number(),
  averageGenerationTimeMs: z.number(),
  totalTokensUsed: z.number(),
  reportsThisQuarter: z.number(),
  lastPublishedAt: z.string().nullable(),
});

export type ExecBoardReportStats = z.infer<typeof execBoardReportStatsSchema>;
