/**
 * Sprint S64: Investor Relations Pack & Earnings Narrative Engine Validators
 * Zod schemas for investor relations validation
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Investor pack format schema
 */
export const investorPackFormatSchema = z.enum([
  'quarterly_earnings',
  'annual_review',
  'investor_day',
  'board_update',
  'fundraising_round',
  'custom',
]);

/**
 * Investor pack status schema
 */
export const investorPackStatusSchema = z.enum([
  'draft',
  'generating',
  'review',
  'approved',
  'published',
  'archived',
]);

/**
 * Investor primary audience schema
 */
export const investorPrimaryAudienceSchema = z.enum([
  'board',
  'investors',
  'analysts',
  'internal_execs',
]);

/**
 * Investor section type schema
 */
export const investorSectionTypeSchema = z.enum([
  'executive_summary',
  'highlights',
  'lowlights',
  'kpi_overview',
  'market_context',
  'competition',
  'product_updates',
  'go_to_market',
  'customer_stories',
  'risk_and_mitigations',
  'governance',
  'esg',
  'outlook',
  'appendix',
]);

/**
 * Investor section status schema
 */
export const investorSectionStatusSchema = z.enum([
  'draft',
  'generated',
  'edited',
  'approved',
]);

/**
 * Investor source system schema
 */
export const investorSourceSystemSchema = z.enum([
  'media_performance',
  'board_reports',
  'exec_digest',
  'exec_command_center',
  'risk_radar',
  'governance',
  'brand_reputation',
  'crisis',
  'media_briefings',
  'competitive_intel',
  'persona',
  'journalist_enrichment',
  'journalist_timeline',
  'media_lists',
  'journalist_graph',
  'pr_outreach',
  'media_monitoring',
  'pitch_engine',
  'pr_generator',
  'custom',
]);

/**
 * Investor Q&A category schema
 */
export const investorQnACategorySchema = z.enum([
  'financials',
  'strategy',
  'competition',
  'product',
  'risk',
  'governance',
  'operations',
  'other',
]);

/**
 * Investor event type schema
 */
export const investorEventTypeSchema = z.enum([
  'created',
  'updated',
  'status_changed',
  'section_generated',
  'section_regenerated',
  'section_edited',
  'qna_generated',
  'qna_created',
  'published',
  'archived',
]);

// ============================================================================
// CORE SCHEMAS
// ============================================================================

/**
 * Summary JSON schema
 */
export const investorPackSummaryJsonSchema = z.object({
  revenue: z.number().optional(),
  revenueGrowth: z.number().optional(),
  ebitda: z.number().optional(),
  sentimentScore: z.number().min(0).max(100).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  keyMetrics: z.array(z.object({
    name: z.string(),
    value: z.union([z.number(), z.string()]),
    change: z.number().optional(),
    trend: z.enum(['up', 'down', 'stable']).optional(),
  })).optional(),
  highlightsCount: z.number().int().min(0).optional(),
  lowlightsCount: z.number().int().min(0).optional(),
}).passthrough();

/**
 * Raw LLM JSON schema
 */
export const investorSectionRawLlmJsonSchema = z.object({
  prompt: z.string().optional(),
  response: z.string().optional(),
  model: z.string().optional(),
  tokensUsed: z.number().int().min(0).optional(),
  durationMs: z.number().int().min(0).optional(),
}).passthrough();

/**
 * Q&A source summary JSON schema
 */
export const investorQnASourceSummaryJsonSchema = z.object({
  sources: z.array(z.object({
    system: investorSourceSystemSchema,
    refId: z.string(),
    relevance: z.number().min(0).max(1),
  })).optional(),
  keyDataPoints: z.array(z.string()).optional(),
}).passthrough();

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Create investor pack request schema
 */
export const createInvestorPackSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  format: investorPackFormatSchema.optional().default('quarterly_earnings'),
  primaryAudience: investorPrimaryAudienceSchema.optional().default('investors'),
  periodStart: z.string().datetime({ offset: true }),
  periodEnd: z.string().datetime({ offset: true }),
  fiscalQuarter: z.string().regex(/^Q[1-4]$/).optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  sectionTypes: z.array(investorSectionTypeSchema).optional(),
  llmModel: z.string().optional().default('gpt-4o'),
  tone: z.enum(['professional', 'formal', 'executive']).optional().default('professional'),
  targetLength: z.enum(['brief', 'standard', 'comprehensive']).optional().default('comprehensive'),
  meta: z.record(z.unknown()).optional().default({}),
});

/**
 * Update investor pack request schema
 */
export const updateInvestorPackSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  format: investorPackFormatSchema.optional(),
  primaryAudience: investorPrimaryAudienceSchema.optional(),
  periodStart: z.string().datetime({ offset: true }).optional(),
  periodEnd: z.string().datetime({ offset: true }).optional(),
  fiscalQuarter: z.string().regex(/^Q[1-4]$/).optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  sectionTypes: z.array(investorSectionTypeSchema).optional(),
  llmModel: z.string().optional(),
  tone: z.enum(['professional', 'formal', 'executive']).optional(),
  targetLength: z.enum(['brief', 'standard', 'comprehensive']).optional(),
  meta: z.record(z.unknown()).optional(),
});

/**
 * List investor packs query schema
 */
export const listInvestorPacksQuerySchema = z.object({
  status: z.union([
    investorPackStatusSchema,
    z.array(investorPackStatusSchema),
  ]).optional(),
  format: z.union([
    investorPackFormatSchema,
    z.array(investorPackFormatSchema),
  ]).optional(),
  primaryAudience: investorPrimaryAudienceSchema.optional(),
  fiscalYear: z.coerce.number().int().min(2000).max(2100).optional(),
  fiscalQuarter: z.string().regex(/^Q[1-4]$/).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Generate pack content request schema
 */
export const generateInvestorPackSchema = z.object({
  regenerateSections: z.array(investorSectionTypeSchema).optional(),
  sourceOverrides: z.record(investorSourceSystemSchema, z.boolean()).optional(),
});

/**
 * Update section request schema
 */
export const updateInvestorSectionSchema = z.object({
  contentMd: z.string().optional(),
  title: z.string().min(1).max(255).optional(),
  isVisible: z.boolean().optional(),
});

/**
 * Regenerate section request schema
 */
export const regenerateInvestorSectionSchema = z.object({
  customPrompt: z.string().max(2000).optional(),
  sourceOverrides: z.record(investorSourceSystemSchema, z.boolean()).optional(),
});

/**
 * Reorder sections request schema
 */
export const reorderInvestorSectionsSchema = z.object({
  sectionOrder: z.array(z.object({
    sectionId: z.string().uuid(),
    orderIndex: z.number().int().min(0),
  })).min(1),
});

/**
 * Create Q&A request schema
 */
export const createInvestorQnASchema = z.object({
  packId: z.string().uuid().optional(),
  question: z.string().min(1).max(1000),
  answerMd: z.string().min(1).max(10000),
  category: investorQnACategorySchema.optional().default('other'),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  confidence: z.number().int().min(0).max(100).optional().default(80),
});

/**
 * Update Q&A request schema
 */
export const updateInvestorQnASchema = z.object({
  question: z.string().min(1).max(1000).optional(),
  answerMd: z.string().min(1).max(10000).optional(),
  category: investorQnACategorySchema.optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  status: z.enum(['draft', 'approved', 'archived']).optional(),
});

/**
 * Generate Q&A request schema
 */
export const generateInvestorQnASchema = z.object({
  packId: z.string().uuid(),
  categories: z.array(investorQnACategorySchema).optional(),
  count: z.number().int().min(1).max(20).optional().default(5),
  customContext: z.string().max(5000).optional(),
});

/**
 * List Q&A query schema
 */
export const listInvestorQnAQuerySchema = z.object({
  packId: z.string().uuid().optional(),
  category: z.union([
    investorQnACategorySchema,
    z.array(investorQnACategorySchema),
  ]).optional(),
  status: z.enum(['draft', 'approved', 'archived']).optional(),
  minConfidence: z.coerce.number().int().min(0).max(100).optional(),
  searchTerm: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Approve pack request schema
 */
export const approveInvestorPackSchema = z.object({
  notes: z.string().max(1000).optional(),
});

/**
 * Publish pack request schema
 */
export const publishInvestorPackSchema = z.object({
  generatePdf: z.boolean().optional().default(true),
  generatePptx: z.boolean().optional().default(false),
});

/**
 * Archive pack request schema
 */
export const archiveInvestorPackSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * List audit log query schema
 */
export const listInvestorAuditLogQuerySchema = z.object({
  packId: z.string().uuid().optional(),
  eventType: z.union([
    investorEventTypeSchema,
    z.array(investorEventTypeSchema),
  ]).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// PARAM SCHEMAS
// ============================================================================

/**
 * Pack ID param schema
 */
export const investorPackIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Section ID param schema
 */
export const investorSectionIdParamSchema = z.object({
  sectionId: z.string().uuid(),
});

/**
 * Q&A ID param schema
 */
export const investorQnAIdParamSchema = z.object({
  qnaId: z.string().uuid(),
});

/**
 * Pack and section param schema
 */
export const investorPackSectionParamSchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
});

// ============================================================================
// DATABASE RECORD SCHEMAS
// ============================================================================

/**
 * Investor pack database record schema (snake_case)
 */
export const investorPackRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  format: investorPackFormatSchema,
  status: investorPackStatusSchema,
  primary_audience: investorPrimaryAudienceSchema,
  period_start: z.string(),
  period_end: z.string(),
  fiscal_quarter: z.string().nullable(),
  fiscal_year: z.number().int().nullable(),
  summary_json: investorPackSummaryJsonSchema,
  section_types: z.array(investorSectionTypeSchema),
  llm_model: z.string(),
  tone: z.string(),
  target_length: z.string(),
  pdf_storage_path: z.string().nullable(),
  pptx_storage_path: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  reviewed_by: z.string().uuid().nullable(),
  approved_by: z.string().uuid().nullable(),
  reviewed_at: z.string().nullable(),
  approved_at: z.string().nullable(),
  published_at: z.string().nullable(),
  generation_started_at: z.string().nullable(),
  generation_completed_at: z.string().nullable(),
  generation_duration_ms: z.number().int().nullable(),
  total_tokens_used: z.number().int(),
  generation_error: z.string().nullable(),
  meta: z.record(z.unknown()),
  is_archived: z.boolean(),
  archived_at: z.string().nullable(),
  archived_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Investor pack section database record schema (snake_case)
 */
export const investorPackSectionRecordSchema = z.object({
  id: z.string().uuid(),
  pack_id: z.string().uuid(),
  org_id: z.string().uuid(),
  section_type: investorSectionTypeSchema,
  title: z.string(),
  order_index: z.number().int(),
  content_md: z.string().nullable(),
  content_html: z.string().nullable(),
  summary: z.string().nullable(),
  status: investorSectionStatusSchema,
  raw_llm_json: investorSectionRawLlmJsonSchema,
  source_data: z.record(z.unknown()),
  is_visible: z.boolean(),
  edited_by: z.string().uuid().nullable(),
  edited_at: z.string().nullable(),
  original_content: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Investor pack source database record schema (snake_case)
 */
export const investorPackSourceRecordSchema = z.object({
  id: z.string().uuid(),
  pack_id: z.string().uuid(),
  org_id: z.string().uuid(),
  section_id: z.string().uuid().nullable(),
  source_system: investorSourceSystemSchema,
  source_ref_id: z.string().nullable(),
  source_sprint: z.string().nullable(),
  weight: z.number(),
  relevance_score: z.number().nullable(),
  data_snapshot: z.record(z.unknown()),
  data_fetched_at: z.string(),
  meta: z.record(z.unknown()),
  created_at: z.string(),
});

/**
 * Investor Q&A database record schema (snake_case)
 */
export const investorQnARecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  pack_id: z.string().uuid().nullable(),
  question: z.string(),
  answer_md: z.string(),
  answer_html: z.string().nullable(),
  category: investorQnACategorySchema,
  tags: z.array(z.string()),
  confidence: z.number().int(),
  is_llm_generated: z.boolean(),
  source_summary_json: investorQnASourceSummaryJsonSchema,
  times_used: z.number().int(),
  last_used_at: z.string().nullable(),
  status: z.string(),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Investor pack audit log database record schema (snake_case)
 */
export const investorPackAuditLogRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  pack_id: z.string().uuid().nullable(),
  user_id: z.string().uuid().nullable(),
  user_email: z.string().nullable(),
  event_type: investorEventTypeSchema,
  details_json: z.record(z.unknown()),
  model: z.string().nullable(),
  tokens_used: z.number().int().nullable(),
  duration_ms: z.number().int().nullable(),
  section_id: z.string().uuid().nullable(),
  qna_id: z.string().uuid().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type InvestorPackFormat = z.infer<typeof investorPackFormatSchema>;
export type InvestorPackStatus = z.infer<typeof investorPackStatusSchema>;
export type InvestorPrimaryAudience = z.infer<typeof investorPrimaryAudienceSchema>;
export type InvestorSectionType = z.infer<typeof investorSectionTypeSchema>;
export type InvestorSectionStatus = z.infer<typeof investorSectionStatusSchema>;
export type InvestorSourceSystem = z.infer<typeof investorSourceSystemSchema>;
export type InvestorQnACategory = z.infer<typeof investorQnACategorySchema>;
export type InvestorEventType = z.infer<typeof investorEventTypeSchema>;

export type InvestorPackSummaryJson = z.infer<typeof investorPackSummaryJsonSchema>;
export type InvestorSectionRawLlmJson = z.infer<typeof investorSectionRawLlmJsonSchema>;
export type InvestorQnASourceSummaryJson = z.infer<typeof investorQnASourceSummaryJsonSchema>;

export type CreateInvestorPack = z.infer<typeof createInvestorPackSchema>;
export type UpdateInvestorPack = z.infer<typeof updateInvestorPackSchema>;
export type ListInvestorPacksQuery = z.infer<typeof listInvestorPacksQuerySchema>;
export type GenerateInvestorPack = z.infer<typeof generateInvestorPackSchema>;
export type UpdateInvestorSection = z.infer<typeof updateInvestorSectionSchema>;
export type RegenerateInvestorSection = z.infer<typeof regenerateInvestorSectionSchema>;
export type ReorderInvestorSections = z.infer<typeof reorderInvestorSectionsSchema>;
export type CreateInvestorQnA = z.infer<typeof createInvestorQnASchema>;
export type UpdateInvestorQnA = z.infer<typeof updateInvestorQnASchema>;
export type GenerateInvestorQnA = z.infer<typeof generateInvestorQnASchema>;
export type ListInvestorQnAQuery = z.infer<typeof listInvestorQnAQuerySchema>;
export type ApproveInvestorPack = z.infer<typeof approveInvestorPackSchema>;
export type PublishInvestorPack = z.infer<typeof publishInvestorPackSchema>;
export type ArchiveInvestorPack = z.infer<typeof archiveInvestorPackSchema>;
export type ListInvestorAuditLogQuery = z.infer<typeof listInvestorAuditLogQuerySchema>;

export type InvestorPackIdParam = z.infer<typeof investorPackIdParamSchema>;
export type InvestorSectionIdParam = z.infer<typeof investorSectionIdParamSchema>;
export type InvestorQnAIdParam = z.infer<typeof investorQnAIdParamSchema>;
export type InvestorPackSectionParam = z.infer<typeof investorPackSectionParamSchema>;

export type InvestorPackRecord = z.infer<typeof investorPackRecordSchema>;
export type InvestorPackSectionRecord = z.infer<typeof investorPackSectionRecordSchema>;
export type InvestorPackSourceRecord = z.infer<typeof investorPackSourceRecordSchema>;
export type InvestorQnARecord = z.infer<typeof investorQnARecordSchema>;
export type InvestorPackAuditLogRecord = z.infer<typeof investorPackAuditLogRecordSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default sections for a format
 */
export function getDefaultSectionsForFormat(format: InvestorPackFormat): InvestorSectionType[] {
  switch (format) {
    case 'quarterly_earnings':
      return [
        'executive_summary',
        'highlights',
        'lowlights',
        'kpi_overview',
        'market_context',
        'competition',
        'risk_and_mitigations',
        'outlook',
      ];
    case 'annual_review':
      return [
        'executive_summary',
        'highlights',
        'lowlights',
        'kpi_overview',
        'market_context',
        'competition',
        'product_updates',
        'go_to_market',
        'customer_stories',
        'risk_and_mitigations',
        'governance',
        'esg',
        'outlook',
      ];
    case 'investor_day':
      return [
        'executive_summary',
        'highlights',
        'kpi_overview',
        'market_context',
        'competition',
        'product_updates',
        'go_to_market',
        'outlook',
      ];
    case 'board_update':
      return [
        'executive_summary',
        'highlights',
        'lowlights',
        'kpi_overview',
        'risk_and_mitigations',
        'governance',
        'outlook',
      ];
    case 'fundraising_round':
      return [
        'executive_summary',
        'highlights',
        'market_context',
        'competition',
        'product_updates',
        'go_to_market',
        'customer_stories',
        'outlook',
      ];
    case 'custom':
    default:
      return [
        'executive_summary',
        'highlights',
        'lowlights',
        'outlook',
      ];
  }
}

/**
 * Get section type label
 */
export function getSectionTypeLabel(sectionType: InvestorSectionType): string {
  const labels: Record<InvestorSectionType, string> = {
    executive_summary: 'Executive Summary',
    highlights: 'Key Highlights',
    lowlights: 'Challenges & Learnings',
    kpi_overview: 'KPI Dashboard',
    market_context: 'Market Environment',
    competition: 'Competitive Landscape',
    product_updates: 'Product & Technology',
    go_to_market: 'Go-to-Market Strategy',
    customer_stories: 'Customer Success',
    risk_and_mitigations: 'Risk Analysis',
    governance: 'Governance & Compliance',
    esg: 'ESG & Sustainability',
    outlook: 'Forward Outlook',
    appendix: 'Appendix',
  };
  return labels[sectionType] || sectionType;
}

/**
 * Get format label
 */
export function getFormatLabel(format: InvestorPackFormat): string {
  const labels: Record<InvestorPackFormat, string> = {
    quarterly_earnings: 'Quarterly Earnings',
    annual_review: 'Annual Review',
    investor_day: 'Investor Day',
    board_update: 'Board Update',
    fundraising_round: 'Fundraising Materials',
    custom: 'Custom Format',
  };
  return labels[format] || format;
}

/**
 * Get status label
 */
export function getStatusLabel(status: InvestorPackStatus): string {
  const labels: Record<InvestorPackStatus, string> = {
    draft: 'Draft',
    generating: 'Generating',
    review: 'In Review',
    approved: 'Approved',
    published: 'Published',
    archived: 'Archived',
  };
  return labels[status] || status;
}

/**
 * Get audience label
 */
export function getAudienceLabel(audience: InvestorPrimaryAudience): string {
  const labels: Record<InvestorPrimaryAudience, string> = {
    board: 'Board of Directors',
    investors: 'Institutional Investors',
    analysts: 'Financial Analysts',
    internal_execs: 'Internal Executives',
  };
  return labels[audience] || audience;
}

/**
 * Get Q&A category label
 */
export function getQnACategoryLabel(category: InvestorQnACategory): string {
  const labels: Record<InvestorQnACategory, string> = {
    financials: 'Financial Questions',
    strategy: 'Strategic Direction',
    competition: 'Competitive Positioning',
    product: 'Product & Technology',
    risk: 'Risk Factors',
    governance: 'Governance & Compliance',
    operations: 'Operational Matters',
    other: 'Other Questions',
  };
  return labels[category] || category;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: InvestorPackStatus): string {
  const colors: Record<InvestorPackStatus, string> = {
    draft: 'yellow',
    generating: 'blue',
    review: 'indigo',
    approved: 'green',
    published: 'green',
    archived: 'gray',
  };
  return colors[status] || 'gray';
}
