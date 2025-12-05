/**
 * Media Briefing & Executive Talking Points Validators (Sprint S54)
 *
 * Zod schemas for runtime validation of media briefing requests,
 * filters, and data structures.
 */

import { z } from 'zod';

// ============================================================================
// ENUM VALIDATORS
// ============================================================================

export const briefingSectionTypeSchema = z.enum([
  'executive_summary',
  'key_messages',
  'media_landscape',
  'competitive_analysis',
  'journalist_intelligence',
  'audience_insights',
  'performance_metrics',
  'recommended_actions',
  'qa_preparation',
  'appendix',
]);

export const talkingPointCategorySchema = z.enum([
  'primary_message',
  'supporting_point',
  'defensive_point',
  'bridging_statement',
  'call_to_action',
  'stat_highlight',
  'quote_suggestion',
  'pivot_phrase',
]);

export const insightStrengthSchema = z.enum([
  'strong',
  'moderate',
  'weak',
  'speculative',
]);

export const briefFormatTypeSchema = z.enum([
  'full_brief',
  'executive_summary',
  'talking_points_only',
  'media_prep',
  'crisis_brief',
  'interview_prep',
]);

export const briefingStatusSchema = z.enum([
  'draft',
  'generating',
  'generated',
  'reviewed',
  'approved',
  'archived',
]);

export const briefingSourceTypeSchema = z.enum([
  'press_release',
  'pitch',
  'media_mention',
  'journalist_profile',
  'media_list',
  'audience_persona',
  'competitive_intel',
  'performance_metric',
  'relationship_event',
  'enrichment_data',
  'external_article',
  'internal_note',
]);

export const briefingToneSchema = z.enum([
  'professional',
  'conversational',
  'formal',
  'casual',
]);

export const importanceLevelSchema = z.enum(['high', 'medium', 'low']);

// ============================================================================
// NESTED OBJECT VALIDATORS
// ============================================================================

/**
 * Key takeaway structure
 */
export const briefingKeyTakeawaySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  importance: importanceLevelSchema,
  category: z.string().max(100).optional(),
  sourceIds: z.array(z.string().uuid()).optional(),
});

/**
 * Briefing insight structure
 */
export const briefingInsightSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  strength: insightStrengthSchema,
  category: z.string().max(100),
  sourceType: briefingSourceTypeSchema,
  sourceId: z.string().uuid().optional(),
  relevanceScore: z.number().min(0).max(100),
  actionable: z.boolean(),
  suggestedAction: z.string().optional(),
});

/**
 * Section bullet point structure
 */
export const sectionBulletPointSchema = z.object({
  text: z.string().min(1),
  subPoints: z.array(z.string()).optional(),
  sourceId: z.string().uuid().optional(),
  importance: importanceLevelSchema.optional(),
});

/**
 * Chart data structure
 */
export const chartDataSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  data: z.record(z.unknown()),
});

/**
 * Table data structure
 */
export const tableDataSchema = z.object({
  title: z.string().min(1),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

/**
 * Quote structure
 */
export const quoteSchema = z.object({
  text: z.string().min(1),
  attribution: z.string().min(1),
  source: z.string().optional(),
});

/**
 * Section supporting data structure
 */
export const sectionSupportingDataSchema = z.object({
  metrics: z.record(z.union([z.number(), z.string()])).optional(),
  charts: z.array(chartDataSchema).optional(),
  tables: z.array(tableDataSchema).optional(),
  quotes: z.array(quoteSchema).optional(),
});

/**
 * Talking point supporting fact
 */
export const talkingPointFactSchema = z.object({
  fact: z.string().min(1),
  source: z.string().optional(),
  date: z.string().optional(),
  verifiable: z.boolean(),
});

/**
 * Generation metadata
 */
export const generationMetadataSchema = z.object({
  llmModel: z.string().optional(),
  tokensUsed: z.number().int().min(0).optional(),
  durationMs: z.number().int().min(0).optional(),
  promptSnapshot: z.string().optional(),
  timestamp: z.coerce.date().optional(),
});

// ============================================================================
// CREATE REQUEST VALIDATORS
// ============================================================================

/**
 * Create Briefing Request
 */
export const createBriefingRequestSchema = z.object({
  title: z.string().min(1).max(500),
  subtitle: z.string().max(500).optional(),
  format: briefFormatTypeSchema.optional(),
  storyId: z.string().uuid().optional(),
  journalistIds: z.array(z.string().uuid()).optional(),
  outletIds: z.array(z.string().uuid()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
  competitorIds: z.array(z.string().uuid()).optional(),
  tone: z.string().max(100).optional(),
  focusAreas: z.array(z.string()).optional(),
  excludedTopics: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
});

/**
 * Update Briefing Request
 */
export const updateBriefingRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  subtitle: z.string().max(500).optional(),
  format: briefFormatTypeSchema.optional(),
  status: briefingStatusSchema.optional(),
  storyId: z.string().uuid().optional(),
  journalistIds: z.array(z.string().uuid()).optional(),
  outletIds: z.array(z.string().uuid()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
  competitorIds: z.array(z.string().uuid()).optional(),
  tone: z.string().max(100).optional(),
  focusAreas: z.array(z.string()).optional(),
  excludedTopics: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
  executiveSummary: z.string().optional(),
});

/**
 * Generate Briefing Request
 */
export const generateBriefingRequestSchema = z.object({
  briefingId: z.string().uuid(),
  sectionsToGenerate: z.array(briefingSectionTypeSchema).optional(),
  regenerateExisting: z.boolean().optional(),
  includeCompetitiveAnalysis: z.boolean().optional(),
  includePerformanceMetrics: z.boolean().optional(),
  includeAudienceInsights: z.boolean().optional(),
  maxTokensPerSection: z.number().int().min(100).max(4000).optional(),
});

/**
 * Regenerate Section Request
 */
export const regenerateSectionRequestSchema = z.object({
  briefingId: z.string().uuid(),
  sectionId: z.string().uuid(),
  customInstructions: z.string().optional(),
  preserveManualEdits: z.boolean().optional(),
});

/**
 * Create Talking Point Request
 */
export const createTalkingPointRequestSchema = z.object({
  briefingId: z.string().uuid().optional(),
  category: talkingPointCategorySchema,
  headline: z.string().min(1).max(300),
  content: z.string().min(1),
  supportingFacts: z.array(talkingPointFactSchema).optional(),
  targetAudience: z.string().max(255).optional(),
  useCase: z.string().max(255).optional(),
  contextNotes: z.string().optional(),
  journalistIds: z.array(z.string().uuid()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
  competitorIds: z.array(z.string().uuid()).optional(),
  priorityScore: z.number().int().min(1).max(100).optional(),
});

/**
 * Update Talking Point Request
 */
export const updateTalkingPointRequestSchema = z.object({
  category: talkingPointCategorySchema.optional(),
  headline: z.string().min(1).max(300).optional(),
  content: z.string().min(1).optional(),
  supportingFacts: z.array(talkingPointFactSchema).optional(),
  targetAudience: z.string().max(255).optional(),
  useCase: z.string().max(255).optional(),
  contextNotes: z.string().optional(),
  journalistIds: z.array(z.string().uuid()).optional(),
  personaIds: z.array(z.string().uuid()).optional(),
  competitorIds: z.array(z.string().uuid()).optional(),
  priorityScore: z.number().int().min(1).max(100).optional(),
  isApproved: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

/**
 * Generate Talking Points Request
 */
export const generateTalkingPointsRequestSchema = z.object({
  briefingId: z.string().uuid(),
  categories: z.array(talkingPointCategorySchema).optional(),
  count: z.number().int().min(1).max(20).optional(),
  focusAreas: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
});

/**
 * Update Section Request
 */
export const updateSectionRequestSchema = z.object({
  title: z.string().max(300).optional(),
  content: z.string().optional(),
  bulletPoints: z.array(sectionBulletPointSchema).optional(),
  supportingData: sectionSupportingDataSchema.optional(),
});

/**
 * Create Source Reference Request
 */
export const createSourceReferenceRequestSchema = z.object({
  briefingId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  sourceType: briefingSourceTypeSchema,
  sourceId: z.string().uuid().optional(),
  sourceUrl: z.string().url().optional(),
  title: z.string().max(500).optional(),
  excerpt: z.string().optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
  insightStrength: insightStrengthSchema.optional(),
  sourceDate: z.coerce.date().optional(),
  authorName: z.string().max(255).optional(),
  outletName: z.string().max(255).optional(),
});

/**
 * Approve Briefing Request
 */
export const approveBriefingRequestSchema = z.object({
  briefingId: z.string().uuid(),
  approverNotes: z.string().optional(),
});

/**
 * Review Briefing Request
 */
export const reviewBriefingRequestSchema = z.object({
  briefingId: z.string().uuid(),
  reviewerNotes: z.string().optional(),
});

// ============================================================================
// FILTER VALIDATORS
// ============================================================================

/**
 * Briefing Filters
 */
export const briefingFiltersSchema = z.object({
  format: briefFormatTypeSchema.optional(),
  status: briefingStatusSchema.optional(),
  storyId: z.string().uuid().optional(),
  journalistId: z.string().uuid().optional(),
  personaId: z.string().uuid().optional(),
  competitorId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  createdStart: z.coerce.date().optional(),
  createdEnd: z.coerce.date().optional(),
  searchQuery: z.string().max(500).optional(),
});

/**
 * Talking Point Filters
 */
export const talkingPointFiltersSchema = z.object({
  briefingId: z.string().uuid().optional(),
  category: talkingPointCategorySchema.optional(),
  isApproved: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  minPriority: z.coerce.number().int().min(1).max(100).optional(),
  journalistId: z.string().uuid().optional(),
  personaId: z.string().uuid().optional(),
  competitorId: z.string().uuid().optional(),
  searchQuery: z.string().max(500).optional(),
});

/**
 * Briefing Insight Filters
 */
export const briefingInsightFiltersSchema = z.object({
  briefingId: z.string().uuid().optional(),
  sourceType: briefingSourceTypeSchema.optional(),
  strength: insightStrengthSchema.optional(),
  actionable: z.coerce.boolean().optional(),
  minRelevance: z.coerce.number().min(0).max(100).optional(),
});

/**
 * Source Reference Filters
 */
export const sourceReferenceFiltersSchema = z.object({
  briefingId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  sourceType: briefingSourceTypeSchema.optional(),
  isCited: z.coerce.boolean().optional(),
  minRelevance: z.coerce.number().min(0).max(100).optional(),
});

/**
 * Audit Log Filters
 */
export const auditLogFiltersSchema = z.object({
  briefingId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  success: z.coerce.boolean().optional(),
  createdStart: z.coerce.date().optional(),
  createdEnd: z.coerce.date().optional(),
});

// ============================================================================
// QUERY PARAMETER VALIDATORS
// ============================================================================

/**
 * Pagination query parameters
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Briefing ID parameter
 */
export const briefingIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Section ID parameter
 */
export const sectionIdParamSchema = z.object({
  briefingId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

/**
 * Talking Point ID parameter
 */
export const talkingPointIdParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

/**
 * Get Briefings Query (filters + pagination)
 */
export const getBriefingsQuerySchema = briefingFiltersSchema.merge(paginationQuerySchema);

/**
 * Get Talking Points Query (filters + pagination)
 */
export const getTalkingPointsQuerySchema = talkingPointFiltersSchema.merge(paginationQuerySchema);

/**
 * Get Insights Query (filters + pagination)
 */
export const getBriefingInsightsQuerySchema = briefingInsightFiltersSchema.merge(paginationQuerySchema);

/**
 * Get Source References Query (filters + pagination)
 */
export const getSourceReferencesQuerySchema = sourceReferenceFiltersSchema.merge(paginationQuerySchema);

/**
 * Get Audit Log Query (filters + pagination)
 */
export const getAuditLogQuerySchema = auditLogFiltersSchema.merge(paginationQuerySchema);

// ============================================================================
// INTELLIGENCE CONTEXT VALIDATORS
// ============================================================================

/**
 * Press Release context item
 */
export const pressReleaseContextSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  publishedAt: z.coerce.date().optional(),
});

/**
 * Pitch context item
 */
export const pitchContextSchema = z.object({
  id: z.string().uuid(),
  subject: z.string(),
  content: z.string(),
  status: z.string(),
});

/**
 * Media Mention context item
 */
export const mediaMentionContextSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  excerpt: z.string(),
  sentiment: z.number().min(-1).max(1),
  outletName: z.string(),
  publishedAt: z.coerce.date(),
});

/**
 * Journalist Profile context item
 */
export const journalistProfileContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  outlet: z.string(),
  beats: z.array(z.string()),
  recentCoverage: z.array(z.string()),
});

/**
 * Persona context item
 */
export const personaContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  interests: z.array(z.string()),
  painPoints: z.array(z.string()),
});

/**
 * Competitor Intelligence context item
 */
export const competitorIntelContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tier: z.string(),
  recentMentions: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1),
  advantageAreas: z.array(z.string()),
  threatAreas: z.array(z.string()),
});

/**
 * Full Intelligence Context
 */
export const briefingIntelligenceContextSchema = z.object({
  pressReleases: z.array(pressReleaseContextSchema).optional(),
  pitches: z.array(pitchContextSchema).optional(),
  mediaMentions: z.array(mediaMentionContextSchema).optional(),
  journalistProfiles: z.array(journalistProfileContextSchema).optional(),
  personas: z.array(personaContextSchema).optional(),
  competitorIntel: z.array(competitorIntelContextSchema).optional(),
  performanceMetrics: z.object({
    mentionVolume: z.number().int().min(0),
    avgSentiment: z.number().min(-1).max(1),
    eviScore: z.number().min(0).max(100),
    shareOfVoice: z.number().min(0).max(100),
    topJournalists: z.array(z.object({
      name: z.string(),
      mentionCount: z.number().int().min(0),
    })),
  }).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BriefingSectionTypeValue = z.infer<typeof briefingSectionTypeSchema>;
export type TalkingPointCategoryValue = z.infer<typeof talkingPointCategorySchema>;
export type InsightStrengthValue = z.infer<typeof insightStrengthSchema>;
export type BriefFormatTypeValue = z.infer<typeof briefFormatTypeSchema>;
export type BriefingStatusValue = z.infer<typeof briefingStatusSchema>;
export type BriefingSourceTypeValue = z.infer<typeof briefingSourceTypeSchema>;

export type CreateBriefingInput = z.infer<typeof createBriefingRequestSchema>;
export type UpdateBriefingInput = z.infer<typeof updateBriefingRequestSchema>;
export type GenerateBriefingInput = z.infer<typeof generateBriefingRequestSchema>;
export type RegenerateSectionInput = z.infer<typeof regenerateSectionRequestSchema>;
export type CreateTalkingPointInput = z.infer<typeof createTalkingPointRequestSchema>;
export type UpdateTalkingPointInput = z.infer<typeof updateTalkingPointRequestSchema>;
export type GenerateTalkingPointsInput = z.infer<typeof generateTalkingPointsRequestSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionRequestSchema>;
export type CreateSourceReferenceInput = z.infer<typeof createSourceReferenceRequestSchema>;

export type BriefingFiltersInput = z.infer<typeof briefingFiltersSchema>;
export type TalkingPointFiltersInput = z.infer<typeof talkingPointFiltersSchema>;
export type BriefingInsightFiltersInput = z.infer<typeof briefingInsightFiltersSchema>;
export type SourceReferenceFiltersInput = z.infer<typeof sourceReferenceFiltersSchema>;
export type AuditLogFiltersInput = z.infer<typeof auditLogFiltersSchema>;
