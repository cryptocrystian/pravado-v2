/**
 * Unified Narrative Generator V2 Validators (Sprint S70)
 *
 * Zod schemas for validating unified narrative operations
 */

import { z } from 'zod';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

/**
 * Narrative type enum schema
 */
export const narrativeTypeSchema = z.enum([
  'executive',
  'strategy',
  'investor',
  'crisis',
  'competitive_intelligence',
  'reputation',
  'quarterly_context',
  'talking_points',
  'analyst_brief',
  'internal_alignment_memo',
  'tldr_synthesis',
  'custom',
]);

/**
 * Narrative section type enum schema
 */
export const narrativeSectionTypeSchema = z.enum([
  // Executive Narrative sections
  'executive_summary',
  'strategic_overview',
  'key_achievements',
  'critical_risks',
  'market_position',
  'competitive_landscape',
  'financial_implications',
  'forward_outlook',
  // Strategy Narrative sections
  'strategic_context',
  'opportunity_analysis',
  'threat_assessment',
  'resource_allocation',
  'initiative_priorities',
  'timeline_milestones',
  // Investor Narrative sections
  'investment_thesis',
  'growth_drivers',
  'market_dynamics',
  'competitive_moat',
  'risk_factors',
  'financial_performance',
  'guidance_outlook',
  // Crisis Narrative sections
  'situation_assessment',
  'impact_analysis',
  'response_actions',
  'stakeholder_communications',
  'recovery_timeline',
  'lessons_learned',
  // Competitive Intelligence sections
  'competitor_overview',
  'market_share_analysis',
  'product_comparison',
  'pricing_analysis',
  'strategic_moves',
  'threat_opportunities',
  // Reputation Narrative sections
  'brand_health',
  'sentiment_analysis',
  'media_coverage',
  'stakeholder_perception',
  'reputation_risks',
  'enhancement_opportunities',
  // Quarterly Context sections
  'quarter_highlights',
  'performance_metrics',
  'trend_analysis',
  'variance_explanation',
  'next_quarter_outlook',
  // Generic sections
  'introduction',
  'conclusion',
  'appendix',
  'sources_references',
  'custom',
]);

/**
 * Insight strength enum schema
 */
export const narrativeInsightStrengthSchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'informational',
]);

/**
 * Delta type enum schema
 */
export const deltaTypeSchema = z.enum([
  'improved',
  'declined',
  'unchanged',
  'new_insight',
  'removed_insight',
  'context_shift',
]);

/**
 * Narrative format type enum schema
 */
export const narrativeFormatTypeSchema = z.enum([
  'long_form',
  'executive_brief',
  'bullet_points',
  'structured_report',
  'presentation_ready',
  'email_friendly',
]);

/**
 * Narrative status enum schema
 */
export const narrativeStatusSchema = z.enum([
  'draft',
  'generating',
  'review',
  'approved',
  'published',
  'archived',
]);

/**
 * Source system enum schema
 */
export const narrativeSourceSystemSchema = z.enum([
  'media_briefing',
  'crisis_engine',
  'brand_reputation',
  'brand_alerts',
  'governance',
  'risk_radar',
  'exec_command_center',
  'exec_digest',
  'board_reports',
  'investor_relations',
  'strategic_intelligence',
  'unified_graph',
  'scenario_playbooks',
  'media_monitoring',
  'media_performance',
  'journalist_graph',
  'audience_personas',
  'competitive_intel',
  'content_quality',
  'pr_outreach',
  'custom',
]);

/**
 * Narrative event type enum schema
 */
export const narrativeEventTypeSchema = z.enum([
  'created',
  'updated',
  'generated',
  'section_generated',
  'section_regenerated',
  'section_edited',
  'delta_computed',
  'status_changed',
  'approved',
  'published',
  'archived',
  'exported',
  'shared',
]);

// =============================================================================
// SUPPORTING SCHEMAS
// =============================================================================

/**
 * Audience context schema
 */
export const audienceContextSchema = z.object({
  primaryAudience: z.string().min(1).max(200),
  secondaryAudiences: z.array(z.string().max(200)).optional(),
  knowledgeLevel: z.enum(['executive', 'manager', 'analyst', 'technical']),
  focusAreas: z.array(z.string().max(100)).optional(),
  sensitiveTopics: z.array(z.string().max(100)).optional(),
  preferredTone: z.enum(['formal', 'balanced', 'conversational']).optional(),
  maxLength: z.enum(['brief', 'standard', 'comprehensive']).optional(),
});

/**
 * Generation config schema
 */
export const narrativeGenerationConfigSchema = z.object({
  // Content preferences
  includeDataVisualizations: z.boolean().optional(),
  includeSourceCitations: z.boolean().optional(),
  includeConfidenceScores: z.boolean().optional(),
  includeRecommendations: z.boolean().optional(),

  // Section preferences
  requiredSections: z.array(narrativeSectionTypeSchema).optional(),
  optionalSections: z.array(narrativeSectionTypeSchema).optional(),
  excludedSections: z.array(narrativeSectionTypeSchema).optional(),

  // Tone and style
  writingStyle: z.enum(['analytical', 'narrative', 'action_oriented']).optional(),
  sentimentBias: z.enum(['neutral', 'optimistic', 'conservative']).optional(),

  // LLM settings
  preferredModel: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokensPerSection: z.number().int().positive().max(10000).optional(),

  // Cross-system settings
  minimumSourceSystems: z.number().int().min(1).max(20).optional(),
  prioritySourceSystems: z.array(narrativeSourceSystemSchema).optional(),
  requireCrossSystemValidation: z.boolean().optional(),
});

/**
 * Narrative insight schema
 */
export const narrativeInsightSchema = z.object({
  id: z.string().uuid().optional(),
  sourceSystem: narrativeSourceSystemSchema,
  sourceRecordId: z.string().uuid().optional(),
  insightType: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  strength: narrativeInsightStrengthSchema,
  confidenceScore: z.number().min(0).max(1),
  supportingData: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
  tags: z.array(z.string().max(50)).optional(),
});

/**
 * Cross-system pattern schema
 */
export const crossSystemPatternSchema = z.object({
  id: z.string().uuid().optional(),
  patternType: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  involvedSystems: z.array(narrativeSourceSystemSchema).min(2),
  correlationStrength: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1),
  supportingInsights: z.array(z.string()).optional(),
  implications: z.array(z.string().max(1000)).optional(),
  recommendations: z.array(z.string().max(1000)).optional(),
});

/**
 * Contradiction detected schema
 */
export const contradictionDetectedSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  systems: z.array(
    z.object({
      system: narrativeSourceSystemSchema,
      assertion: z.string().min(1).max(2000),
      sourceRecordId: z.string().uuid().optional(),
    })
  ).min(2),
  severity: narrativeInsightStrengthSchema,
  resolutionSuggestion: z.string().max(2000).optional(),
  needsHumanReview: z.boolean(),
});

/**
 * Risk cluster schema
 */
export const riskClusterSchema = z.object({
  id: z.string().uuid().optional(),
  clusterName: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  riskLevel: narrativeInsightStrengthSchema,
  involvedSystems: z.array(narrativeSourceSystemSchema),
  risks: z.array(
    z.object({
      riskId: z.string(),
      title: z.string().max(500),
      sourceSystem: narrativeSourceSystemSchema,
      impact: z.string().max(1000),
    })
  ),
  mitigationSuggestions: z.array(z.string().max(1000)).optional(),
  monitoringRecommendations: z.array(z.string().max(1000)).optional(),
});

/**
 * Data correlation schema
 */
export const dataCorrelationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  metrics: z.array(
    z.object({
      metricName: z.string().max(200),
      sourceSystem: narrativeSourceSystemSchema,
      value: z.number(),
      unit: z.string().max(50).optional(),
    })
  ).min(2),
  correlationType: z.enum(['positive', 'negative', 'complex']),
  correlationStrength: z.number().min(0).max(1),
  businessImplication: z.string().max(2000).optional(),
});

/**
 * Section source reference schema
 */
export const sectionSourceReferenceSchema = z.object({
  id: z.string().uuid().optional(),
  sourceSystem: narrativeSourceSystemSchema,
  sourceRecordId: z.string().uuid(),
  sourceRecordType: z.string().max(100).optional(),
  title: z.string().min(1).max(500),
  summary: z.string().max(2000).optional(),
  url: z.string().url().optional(),
  date: z.string().datetime().optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
});

/**
 * Visualization schema
 */
export const narrativeVisualizationSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['chart', 'table', 'timeline', 'comparison', 'heatmap', 'gauge']),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  dataSource: narrativeSourceSystemSchema,
  config: z.record(z.unknown()),
  data: z.array(z.unknown()),
});

// =============================================================================
// CRUD SCHEMAS
// =============================================================================

/**
 * Create narrative input schema
 */
export const createNarrativeSchema = z.object({
  title: z.string().min(1).max(500),
  subtitle: z.string().max(1000).optional(),
  narrativeType: narrativeTypeSchema,
  format: narrativeFormatTypeSchema.optional().default('long_form'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  fiscalQuarter: z.string().max(10).optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  targetAudience: z.string().max(200).optional(),
  audienceContext: audienceContextSchema.optional(),
  generationConfig: narrativeGenerationConfigSchema.optional(),
  sourceSystems: z.array(narrativeSourceSystemSchema).optional(),
  excludedSystems: z.array(narrativeSourceSystemSchema).optional(),
  tags: z.array(z.string().max(50)).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update narrative input schema
 */
export const updateNarrativeSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  subtitle: z.string().max(1000).optional(),
  format: narrativeFormatTypeSchema.optional(),
  status: narrativeStatusSchema.optional(),
  targetAudience: z.string().max(200).optional(),
  audienceContext: audienceContextSchema.optional(),
  generationConfig: narrativeGenerationConfigSchema.optional(),
  sourceSystems: z.array(narrativeSourceSystemSchema).optional(),
  excludedSystems: z.array(narrativeSourceSystemSchema).optional(),
  executiveSummary: z.string().max(50000).optional(),
  tldrSynthesis: z.string().max(5000).optional(),
  threeSentenceSummary: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Generate narrative input schema
 */
export const generateNarrativeSchema = z.object({
  regenerateSections: z.boolean().optional().default(false),
  regenerateInsights: z.boolean().optional().default(false),
  regenerateSummaries: z.boolean().optional().default(false),
  forceRefresh: z.boolean().optional().default(false),
  specificSections: z.array(narrativeSectionTypeSchema).optional(),
  customPrompt: z.string().max(5000).optional(),
});

/**
 * Regenerate section input schema
 */
export const regenerateNarrativeSectionSchema = z.object({
  customPrompt: z.string().max(5000).optional(),
  additionalContext: z.string().max(10000).optional(),
  preserveKeyPoints: z.boolean().optional().default(false),
});

/**
 * Update section input schema
 */
export const updateNarrativeSectionSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  contentMd: z.string().max(100000).optional(),
  keyPoints: z.array(z.string().max(1000)).optional(),
  supportingData: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Compute delta input schema
 */
export const computeDeltaSchema = z.object({
  previousNarrativeId: z.string().uuid(),
  includeDetailedAnalysis: z.boolean().optional().default(true),
  focusAreas: z.array(z.string().max(100)).optional(),
});

/**
 * Add section input schema
 */
export const addSectionSchema = z.object({
  sectionType: narrativeSectionTypeSchema,
  title: z.string().min(1).max(500),
  sortOrder: z.number().int().min(0).optional(),
  contentMd: z.string().max(100000).optional(),
  keyPoints: z.array(z.string().max(1000)).optional(),
  generateContent: z.boolean().optional().default(true),
  customPrompt: z.string().max(5000).optional(),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * List narratives query schema
 */
export const listNarrativesQuerySchema = z.object({
  narrativeType: narrativeTypeSchema.optional(),
  status: narrativeStatusSchema.optional(),
  format: narrativeFormatTypeSchema.optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  fiscalYear: z.coerce.number().int().min(2000).max(2100).optional(),
  fiscalQuarter: z.string().max(10).optional(),
  sourceSystems: z.array(narrativeSourceSystemSchema).optional(),
  tags: z.array(z.string().max(50)).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'period_start', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Get insights query schema
 */
export const getNarrativeInsightsQuerySchema = z.object({
  sourceSystem: narrativeSourceSystemSchema.optional(),
  strength: narrativeInsightStrengthSchema.optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List sections query schema
 */
export const listSectionsQuerySchema = z.object({
  sectionType: narrativeSectionTypeSchema.optional(),
  isGenerated: z.boolean().optional(),
  isEdited: z.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List sources query schema
 */
export const listNarrativeSourcesQuerySchema = z.object({
  sourceSystem: narrativeSourceSystemSchema.optional(),
  isPrimarySource: z.boolean().optional(),
  sectionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List diffs query schema
 */
export const listDiffsQuerySchema = z.object({
  diffType: deltaTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List audit logs query schema
 */
export const listAuditLogsQuerySchema = z.object({
  narrativeId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  eventType: narrativeEventTypeSchema.optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// =============================================================================
// WORKFLOW SCHEMAS
// =============================================================================

/**
 * Approve narrative schema
 */
export const approveNarrativeSchema = z.object({
  approvalNote: z.string().max(2000).optional(),
});

/**
 * Publish narrative schema
 */
export const publishNarrativeSchema = z.object({
  publishNote: z.string().max(2000).optional(),
  notifyRecipients: z.array(z.string().email()).optional(),
  generateExports: z.array(z.enum(['pdf', 'docx', 'pptx', 'html', 'md'])).optional(),
});

/**
 * Archive narrative schema
 */
export const archiveNarrativeSchema = z.object({
  archiveReason: z.string().max(2000).optional(),
});

/**
 * Export narrative schema
 */
export const exportNarrativeSchema = z.object({
  format: z.enum(['pdf', 'docx', 'pptx', 'html', 'md', 'json']),
  includeSections: z.array(narrativeSectionTypeSchema).optional(),
  excludeSections: z.array(narrativeSectionTypeSchema).optional(),
  includeMetadata: z.boolean().optional().default(false),
  includeSources: z.boolean().optional().default(true),
});

/**
 * Share narrative schema
 */
export const shareNarrativeSchema = z.object({
  recipients: z.array(z.string().email()).min(1),
  message: z.string().max(2000).optional(),
  includeAttachment: z.boolean().optional().default(false),
  attachmentFormat: z.enum(['pdf', 'docx', 'html']).optional(),
  expiresAt: z.string().datetime().optional(),
});

// =============================================================================
// PARAM SCHEMAS
// =============================================================================

/**
 * Narrative ID param schema
 */
export const narrativeIdParamSchema = z.object({
  narrativeId: z.string().uuid(),
});

/**
 * Section ID param schema
 */
export const narrativeSectionIdParamSchema = z.object({
  sectionId: z.string().uuid(),
});

/**
 * Source ID param schema
 */
export const sourceIdParamSchema = z.object({
  sourceId: z.string().uuid(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type NarrativeType = z.infer<typeof narrativeTypeSchema>;
export type NarrativeSectionType = z.infer<typeof narrativeSectionTypeSchema>;
export type NarrativeInsightStrength = z.infer<typeof narrativeInsightStrengthSchema>;
export type DeltaType = z.infer<typeof deltaTypeSchema>;
export type NarrativeFormatType = z.infer<typeof narrativeFormatTypeSchema>;
export type NarrativeStatus = z.infer<typeof narrativeStatusSchema>;
export type NarrativeSourceSystem = z.infer<typeof narrativeSourceSystemSchema>;
export type NarrativeEventType = z.infer<typeof narrativeEventTypeSchema>;

export type AudienceContext = z.infer<typeof audienceContextSchema>;
export type NarrativeGenerationConfig = z.infer<typeof narrativeGenerationConfigSchema>;
export type NarrativeInsight = z.infer<typeof narrativeInsightSchema>;
export type CrossSystemPattern = z.infer<typeof crossSystemPatternSchema>;
export type ContradictionDetected = z.infer<typeof contradictionDetectedSchema>;
export type RiskCluster = z.infer<typeof riskClusterSchema>;
export type DataCorrelation = z.infer<typeof dataCorrelationSchema>;
export type SectionSourceReference = z.infer<typeof sectionSourceReferenceSchema>;
export type NarrativeVisualization = z.infer<typeof narrativeVisualizationSchema>;

export type CreateNarrative = z.infer<typeof createNarrativeSchema>;
export type UpdateNarrative = z.infer<typeof updateNarrativeSchema>;
export type GenerateNarrative = z.infer<typeof generateNarrativeSchema>;
export type RegenerateNarrativeSection = z.infer<typeof regenerateNarrativeSectionSchema>;
export type UpdateNarrativeSection = z.infer<typeof updateNarrativeSectionSchema>;
export type ComputeDelta = z.infer<typeof computeDeltaSchema>;
export type AddNarrativeSection = z.infer<typeof addSectionSchema>;

export type ListNarrativesQuery = z.infer<typeof listNarrativesQuerySchema>;
export type GetNarrativeInsightsQuery = z.infer<typeof getNarrativeInsightsQuerySchema>;
export type ListNarrativeSectionsQuery = z.infer<typeof listSectionsQuerySchema>;
export type ListNarrativeSourcesQuery = z.infer<typeof listNarrativeSourcesQuerySchema>;
export type ListNarrativeDiffsQuery = z.infer<typeof listDiffsQuerySchema>;
export type ListNarrativeAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

export type ApproveNarrative = z.infer<typeof approveNarrativeSchema>;
export type PublishNarrative = z.infer<typeof publishNarrativeSchema>;
export type ArchiveNarrative = z.infer<typeof archiveNarrativeSchema>;
export type ExportNarrative = z.infer<typeof exportNarrativeSchema>;
export type ShareNarrative = z.infer<typeof shareNarrativeSchema>;
