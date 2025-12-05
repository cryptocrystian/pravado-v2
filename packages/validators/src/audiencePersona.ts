/**
 * Audience Persona Validators (Sprint S51)
 * Zod validation schemas for persona builder engine
 */

import { z } from 'zod';

// ========================================
// Enums
// ========================================

export const PersonaTypeSchema = z.enum([
  'primary_audience',
  'secondary_audience',
  'stakeholder',
  'influencer',
]);

export const PersonaStatusSchema = z.enum(['active', 'archived', 'merged']);

export const GenerationMethodSchema = z.enum(['manual', 'llm_assisted', 'auto_extracted']);

export const TraitCategorySchema = z.enum([
  'skill',
  'demographic',
  'psychographic',
  'behavioral',
  'interest',
]);

export const TraitTypeSchema = z.enum([
  'hard_skill',
  'soft_skill',
  'goal',
  'pain_point',
  'motivation',
  'value',
  'preference',
]);

export const InsightTypeSchema = z.enum([
  'content_preference',
  'media_consumption',
  'engagement_pattern',
  'pain_point',
  'opportunity',
]);

export const PersonaInsightCategorySchema = z.enum(['behavioral', 'attitudinal', 'contextual']);

export const PersonaSourceSystemSchema = z.enum([
  'press_release_gen',
  'pr_pitch',
  'media_monitoring',
  'journalist_discovery',
  'content_analysis',
]);

export const SnapshotTypeSchema = z.enum([
  'manual_update',
  'auto_enrichment',
  'score_recalculation',
  'trait_extraction',
  'insight_aggregation',
]);

export const CompanySizeSchema = z.enum(['startup', 'smb', 'enterprise']);

export const SeniorityLevelSchema = z.enum([
  'individual_contributor',
  'manager',
  'director',
  'executive',
  'c_level',
]);

export const ExtractionMethodSchema = z.enum(['manual', 'llm', 'deterministic']);

export const PersonaSourceTypeSchema = z.enum([
  'press_release',
  'pitch',
  'media_mention',
  'content',
  'journalist_interaction',
  'manual',
]);

// ========================================
// Input Schemas
// ========================================

export const CreatePersonaInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  personaType: PersonaTypeSchema,
  role: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
  companySize: CompanySizeSchema.optional(),
  seniorityLevel: SeniorityLevelSchema.optional(),
  location: z.string().max(200).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  customFields: z.record(z.any()).optional(),
  generationMethod: GenerationMethodSchema.optional(),
});

export const UpdatePersonaInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  personaType: PersonaTypeSchema.optional(),
  role: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
  companySize: CompanySizeSchema.optional(),
  seniorityLevel: SeniorityLevelSchema.optional(),
  location: z.string().max(200).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  customFields: z.record(z.any()).optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
  engagementScore: z.number().min(0).max(100).optional(),
  alignmentScore: z.number().min(0).max(100).optional(),
  status: PersonaStatusSchema.optional(),
  isValidated: z.boolean().optional(),
});

export const GenerationContextSchema = z.object({
  sourceType: PersonaSourceTypeSchema,
  sourceId: z.string().uuid().optional(),
  sourceText: z.string().min(10).max(100000),
  additionalContext: z.string().max(5000).optional(),
  personaType: PersonaTypeSchema.optional(),
  suggestedName: z.string().min(1).max(200).optional(),
  extractTraits: z.boolean().optional(),
  extractInsights: z.boolean().optional(),
  llmModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(16000).optional(),
});

export const GeneratePersonaRequestSchema = z.object({
  generationContext: GenerationContextSchema,
});

export const ExtractionInputSchema = z.object({
  personaId: z.string().uuid().optional(),
  sourceType: PersonaSourceTypeSchema,
  sourceId: z.string().uuid().optional(),
  sourceText: z.string().min(10).max(100000),
  extractionType: z.enum(['traits', 'insights', 'both']),
});

export const AddTraitRequestSchema = z.object({
  traitCategory: TraitCategorySchema,
  traitType: TraitTypeSchema,
  traitName: z.string().min(1).max(200),
  traitValue: z.string().max(1000).optional(),
  traitStrength: z.number().min(0).max(1).optional(),
  sourceType: PersonaSourceTypeSchema.optional(),
  sourceId: z.string().uuid().optional(),
  extractionMethod: ExtractionMethodSchema.optional(),
  contextSnippet: z.string().max(2000).optional(),
  isPrimary: z.boolean().optional(),
});

export const AddInsightRequestSchema = z.object({
  insightType: InsightTypeSchema,
  insightCategory: PersonaInsightCategorySchema.optional(),
  insightTitle: z.string().min(1).max(300),
  insightDescription: z.string().max(2000).optional(),
  insightData: z.record(z.any()).optional(),
  sourceSystem: PersonaSourceSystemSchema,
  sourceId: z.string().uuid().optional(),
  sourceReference: z.string().max(500).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  impactScore: z.number().min(0).max(1).optional(),
  isActionable: z.boolean().optional(),
  supportingEvidence: z.array(z.any()).optional(),
});

export const ComparePersonasRequestSchema = z.object({
  personaId1: z.string().uuid(),
  personaId2: z.string().uuid(),
});

export const MergePersonasRequestSchema = z.object({
  sourcePersonaId: z.string().uuid(),
  targetPersonaId: z.string().uuid(),
  mergeTraits: z.boolean(),
  mergeInsights: z.boolean(),
  archiveSource: z.boolean(),
});

// ========================================
// Query Schemas
// ========================================

export const PersonasQuerySchema = z.object({
  personaType: z.array(PersonaTypeSchema).optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  seniorityLevel: z.array(SeniorityLevelSchema).optional(),
  minRelevanceScore: z.number().min(0).max(100).optional(),
  minEngagementScore: z.number().min(0).max(100).optional(),
  minAlignmentScore: z.number().min(0).max(100).optional(),
  minOverallScore: z.number().min(0).max(100).optional(),
  status: z.array(PersonaStatusSchema).optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
  sortBy: z
    .enum([
      'created_at',
      'updated_at',
      'overall_score',
      'relevance_score',
      'engagement_score',
      'alignment_score',
      'name',
    ])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const PersonaInsightsQuerySchema = z.object({
  insightType: z.array(InsightTypeSchema).optional(),
  insightCategory: z.array(PersonaInsightCategorySchema).optional(),
  sourceSystem: z.array(PersonaSourceSystemSchema).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  minImpact: z.number().min(0).max(1).optional(),
  isActionable: z.boolean().optional(),
  sortBy: z.enum(['created_at', 'observed_at', 'confidence_score', 'impact_score']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const PersonaHistoryQuerySchema = z.object({
  snapshotType: z.array(SnapshotTypeSchema).optional(),
  minChangeMagnitude: z.number().min(0).max(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['created_at', 'change_magnitude']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const PersonaTrendsQuerySchema = z.object({
  daysBack: z.number().int().min(7).max(365).optional(),
  includeTraits: z.boolean().optional(),
  includeInsights: z.boolean().optional(),
});

// ========================================
// Type Inference
// ========================================

export type CreatePersonaInput = z.infer<typeof CreatePersonaInputSchema>;
export type UpdatePersonaInput = z.infer<typeof UpdatePersonaInputSchema>;
export type GenerationContext = z.infer<typeof GenerationContextSchema>;
export type GeneratePersonaRequest = z.infer<typeof GeneratePersonaRequestSchema>;
export type ExtractionInput = z.infer<typeof ExtractionInputSchema>;
export type AddTraitRequest = z.infer<typeof AddTraitRequestSchema>;
export type AddInsightRequest = z.infer<typeof AddInsightRequestSchema>;
export type ComparePersonasRequest = z.infer<typeof ComparePersonasRequestSchema>;
export type MergePersonasRequest = z.infer<typeof MergePersonasRequestSchema>;
export type PersonasQuery = z.infer<typeof PersonasQuerySchema>;
export type PersonaInsightsQuery = z.infer<typeof PersonaInsightsQuerySchema>;
export type PersonaHistoryQuery = z.infer<typeof PersonaHistoryQuerySchema>;
export type PersonaTrendsQuery = z.infer<typeof PersonaTrendsQuerySchema>;
