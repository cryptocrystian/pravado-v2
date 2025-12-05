/**
 * Unified Narrative Generator V2 Types (Sprint S70)
 *
 * Cross-domain synthesis engine types for multi-layer narrative documents.
 * Integrates all intelligence systems (S38-S69) into cohesive narratives.
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Types of narratives that can be generated
 */
export type NarrativeType =
  | 'executive'
  | 'strategy'
  | 'investor'
  | 'crisis'
  | 'competitive_intelligence'
  | 'reputation'
  | 'quarterly_context'
  | 'talking_points'
  | 'analyst_brief'
  | 'internal_alignment_memo'
  | 'tldr_synthesis'
  | 'custom';

/**
 * Types of sections within a narrative
 */
export type NarrativeSectionType =
  // Executive Narrative sections
  | 'executive_summary'
  | 'strategic_overview'
  | 'key_achievements'
  | 'critical_risks'
  | 'market_position'
  | 'competitive_landscape'
  | 'financial_implications'
  | 'forward_outlook'
  // Strategy Narrative sections
  | 'strategic_context'
  | 'opportunity_analysis'
  | 'threat_assessment'
  | 'resource_allocation'
  | 'initiative_priorities'
  | 'timeline_milestones'
  // Investor Narrative sections
  | 'investment_thesis'
  | 'growth_drivers'
  | 'market_dynamics'
  | 'competitive_moat'
  | 'risk_factors'
  | 'financial_performance'
  | 'guidance_outlook'
  // Crisis Narrative sections
  | 'situation_assessment'
  | 'impact_analysis'
  | 'response_actions'
  | 'stakeholder_communications'
  | 'recovery_timeline'
  | 'lessons_learned'
  // Competitive Intelligence sections
  | 'competitor_overview'
  | 'market_share_analysis'
  | 'product_comparison'
  | 'pricing_analysis'
  | 'strategic_moves'
  | 'threat_opportunities'
  // Reputation Narrative sections
  | 'brand_health'
  | 'sentiment_analysis'
  | 'media_coverage'
  | 'stakeholder_perception'
  | 'reputation_risks'
  | 'enhancement_opportunities'
  // Quarterly Context sections
  | 'quarter_highlights'
  | 'performance_metrics'
  | 'trend_analysis'
  | 'variance_explanation'
  | 'next_quarter_outlook'
  // Generic sections
  | 'introduction'
  | 'conclusion'
  | 'appendix'
  | 'sources_references'
  | 'custom';

/**
 * Insight strength/priority levels
 */
export type NarrativeInsightStrength =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

/**
 * Types of deltas between narratives
 */
export type DeltaType =
  | 'improved'
  | 'declined'
  | 'unchanged'
  | 'new_insight'
  | 'removed_insight'
  | 'context_shift';

/**
 * Format types for narrative output
 */
export type NarrativeFormatType =
  | 'long_form'
  | 'executive_brief'
  | 'bullet_points'
  | 'structured_report'
  | 'presentation_ready'
  | 'email_friendly';

/**
 * Narrative workflow status
 */
export type NarrativeStatus =
  | 'draft'
  | 'generating'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived';

/**
 * Source systems for narrative data (S38-S69)
 */
export type NarrativeSourceSystem =
  | 'media_briefing'
  | 'crisis_engine'
  | 'brand_reputation'
  | 'brand_alerts'
  | 'governance'
  | 'risk_radar'
  | 'exec_command_center'
  | 'exec_digest'
  | 'board_reports'
  | 'investor_relations'
  | 'strategic_intelligence'
  | 'unified_graph'
  | 'scenario_playbooks'
  | 'media_monitoring'
  | 'media_performance'
  | 'journalist_graph'
  | 'audience_personas'
  | 'competitive_intel'
  | 'content_quality'
  | 'pr_outreach'
  | 'custom';

/**
 * Audit event types for narrative operations
 */
export type NarrativeEventType =
  | 'created'
  | 'updated'
  | 'generated'
  | 'section_generated'
  | 'section_regenerated'
  | 'section_edited'
  | 'delta_computed'
  | 'status_changed'
  | 'approved'
  | 'published'
  | 'archived'
  | 'exported'
  | 'shared';

// =============================================================================
// CORE INTERFACES
// =============================================================================

/**
 * Key insight extracted from source systems
 */
export interface NarrativeInsight {
  id: string;
  sourceSystem: NarrativeSourceSystem;
  sourceRecordId?: string;
  insightType: string;
  title: string;
  description: string;
  strength: NarrativeInsightStrength;
  confidenceScore: number;
  supportingData?: Record<string, unknown>;
  timestamp?: Date;
  tags?: string[];
}

/**
 * Cross-system pattern detected
 */
export interface CrossSystemPattern {
  id: string;
  patternType: string;
  title: string;
  description: string;
  involvedSystems: NarrativeSourceSystem[];
  correlationStrength: number;
  confidenceScore: number;
  supportingInsights: string[];
  implications?: string[];
  recommendations?: string[];
}

/**
 * Contradiction detected between systems
 */
export interface ContradictionDetected {
  id: string;
  title: string;
  description: string;
  systems: Array<{
    system: NarrativeSourceSystem;
    assertion: string;
    sourceRecordId?: string;
  }>;
  severity: NarrativeInsightStrength;
  resolutionSuggestion?: string;
  needsHumanReview: boolean;
}

/**
 * Risk cluster grouping related risks
 */
export interface RiskCluster {
  id: string;
  clusterName: string;
  description: string;
  riskLevel: NarrativeInsightStrength;
  involvedSystems: NarrativeSourceSystem[];
  risks: Array<{
    riskId: string;
    title: string;
    sourceSystem: NarrativeSourceSystem;
    impact: string;
  }>;
  mitigationSuggestions?: string[];
  monitoringRecommendations?: string[];
}

/**
 * Correlation between data points
 */
export interface DataCorrelation {
  id: string;
  title: string;
  description: string;
  metrics: Array<{
    metricName: string;
    sourceSystem: NarrativeSourceSystem;
    value: number;
    unit?: string;
  }>;
  correlationType: 'positive' | 'negative' | 'complex';
  correlationStrength: number;
  businessImplication?: string;
}

/**
 * Audience context for narrative targeting
 */
export interface AudienceContext {
  primaryAudience: string;
  secondaryAudiences?: string[];
  knowledgeLevel: 'executive' | 'manager' | 'analyst' | 'technical';
  focusAreas?: string[];
  sensitiveTopics?: string[];
  preferredTone?: 'formal' | 'balanced' | 'conversational';
  maxLength?: 'brief' | 'standard' | 'comprehensive';
}

/**
 * Generation configuration for narratives
 */
export interface NarrativeGenerationConfig {
  // Content preferences
  includeDataVisualizations?: boolean;
  includeSourceCitations?: boolean;
  includeConfidenceScores?: boolean;
  includeRecommendations?: boolean;

  // Section preferences
  requiredSections?: NarrativeSectionType[];
  optionalSections?: NarrativeSectionType[];
  excludedSections?: NarrativeSectionType[];

  // Tone and style
  writingStyle?: 'analytical' | 'narrative' | 'action_oriented';
  sentimentBias?: 'neutral' | 'optimistic' | 'conservative';

  // LLM settings
  preferredModel?: string;
  temperature?: number;
  maxTokensPerSection?: number;

  // Cross-system settings
  minimumSourceSystems?: number;
  prioritySourceSystems?: NarrativeSourceSystem[];
  requireCrossSystemValidation?: boolean;
}

/**
 * Export format tracking
 */
export interface NarrativeExportFormat {
  format: 'pdf' | 'docx' | 'pptx' | 'html' | 'md' | 'json';
  exportedAt: Date;
  exportedBy?: string;
  fileUrl?: string;
  fileSize?: number;
}

// =============================================================================
// MAIN ENTITY INTERFACES
// =============================================================================

/**
 * Main unified narrative entity
 */
export interface UnifiedNarrative {
  id: string;
  orgId: string;

  // Narrative metadata
  title: string;
  subtitle?: string;
  narrativeType: NarrativeType;
  format: NarrativeFormatType;
  status: NarrativeStatus;

  // Period context
  periodStart: Date;
  periodEnd: Date;
  fiscalQuarter?: string;
  fiscalYear?: number;

  // Target audience
  targetAudience?: string;
  audienceContext?: AudienceContext;

  // Generation parameters
  generationConfig?: NarrativeGenerationConfig;
  sourceSystems: NarrativeSourceSystem[];
  excludedSystems?: NarrativeSourceSystem[];

  // Generated content
  executiveSummary?: string;
  tldrSynthesis?: string;
  threeSentenceSummary?: string;

  // Aggregated insights
  keyInsights?: NarrativeInsight[];
  crossSystemPatterns?: CrossSystemPattern[];
  contradictionsDetected?: ContradictionDetected[];
  riskClusters?: RiskCluster[];
  correlations?: DataCorrelation[];

  // Metrics and scores
  overallSentimentScore?: number;
  confidenceScore?: number;
  coverageCompleteness?: number;
  insightDensity?: number;

  // Delta tracking
  previousNarrativeId?: string;
  deltaSummary?: string;
  deltaJson?: NarrativeDeltaData;

  // LLM metadata
  llmModel?: string;
  llmVersion?: string;
  totalTokensUsed?: number;
  generationDurationMs?: number;

  // Workflow
  generatedAt?: Date;
  generatedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  publishedAt?: Date;
  publishedBy?: string;

  // Export tracking
  exportFormats?: NarrativeExportFormat[];
  lastExportedAt?: Date;

  // Tags and metadata
  tags?: string[];
  metadata?: Record<string, unknown>;

  // Audit timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Narrative section entity
 */
export interface UnifiedNarrativeSection {
  id: string;
  narrativeId: string;

  // Section metadata
  sectionType: NarrativeSectionType;
  title: string;
  sortOrder: number;

  // Content
  contentMd?: string;
  contentHtml?: string;
  contentPlain?: string;

  // Structured data
  keyPoints?: string[];
  supportingData?: Record<string, unknown>;
  visualizations?: NarrativeVisualization[];

  // Source attribution
  sourceSystems?: NarrativeSourceSystem[];
  sourceReferences?: SectionSourceReference[];

  // Insights
  sectionInsights?: NarrativeInsight[];
  insightStrength?: NarrativeInsightStrength;

  // Generation metadata
  isGenerated?: boolean;
  isEdited?: boolean;
  generationPrompt?: string;
  llmModel?: string;
  tokensUsed?: number;

  // Confidence and quality
  confidenceScore?: number;
  qualityScore?: number;

  // Audit
  generatedAt?: Date;
  lastEditedAt?: Date;
  editedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Visualization embedded in a section
 */
export interface NarrativeVisualization {
  id: string;
  type: 'chart' | 'table' | 'timeline' | 'comparison' | 'heatmap' | 'gauge';
  title: string;
  description?: string;
  dataSource: NarrativeSourceSystem;
  config: Record<string, unknown>;
  data: unknown[];
}

/**
 * Source reference within a section
 */
export interface SectionSourceReference {
  id: string;
  sourceSystem: NarrativeSourceSystem;
  sourceRecordId: string;
  sourceRecordType?: string;
  title: string;
  summary?: string;
  url?: string;
  date?: Date;
  relevanceScore?: number;
}

/**
 * Source record used in narrative generation
 */
export interface UnifiedNarrativeSource {
  id: string;
  narrativeId: string;
  sectionId?: string;

  // Source identification
  sourceSystem: NarrativeSourceSystem;
  sourceRecordId: string;
  sourceRecordType?: string;

  // Source metadata
  sourceTitle?: string;
  sourceSummary?: string;
  sourceDate?: Date;

  // Relevance and usage
  relevanceScore?: number;
  confidenceScore?: number;
  isPrimarySource?: boolean;
  usageContext?: string;

  // Extracted insights
  extractedInsights?: NarrativeInsight[];
  extractedData?: Record<string, unknown>;

  // Audit
  createdAt: Date;
}

/**
 * Delta data between narratives
 */
export interface NarrativeDeltaData {
  sentimentDelta?: number;
  confidenceDelta?: number;
  sectionsAdded: string[];
  sectionsRemoved: string[];
  sectionsModified: string[];
  newInsights: NarrativeInsight[];
  removedInsights: NarrativeInsight[];
  changedInsights: Array<{
    insightId: string;
    previousValue: string;
    newValue: string;
    changeType: 'improved' | 'declined' | 'modified';
  }>;
  riskChanges: Array<{
    riskId: string;
    previousLevel: NarrativeInsightStrength;
    newLevel: NarrativeInsightStrength;
  }>;
  patternChanges: Array<{
    patternId: string;
    changeType: 'new' | 'removed' | 'strengthened' | 'weakened';
  }>;
}

/**
 * Narrative diff entity
 */
export interface UnifiedNarrativeDiff {
  id: string;
  orgId: string;

  // Comparison references
  currentNarrativeId: string;
  previousNarrativeId: string;

  // Diff metadata
  diffType: DeltaType;
  diffSummary?: string;

  // Detailed changes
  changes: Array<{
    field: string;
    previousValue: unknown;
    newValue: unknown;
    changeType: string;
  }>;

  // Score changes
  sentimentDelta?: number;
  confidenceDelta?: number;

  // Section-level changes
  sectionsAdded?: Array<{ sectionType: NarrativeSectionType; title: string }>;
  sectionsRemoved?: Array<{ sectionType: NarrativeSectionType; title: string }>;
  sectionsModified?: Array<{
    sectionType: NarrativeSectionType;
    title: string;
    changesSummary: string;
  }>;

  // Insight changes
  newInsights?: NarrativeInsight[];
  removedInsights?: NarrativeInsight[];
  changedInsights?: Array<{
    insightId: string;
    title: string;
    changeDescription: string;
  }>;

  // Risk and pattern changes
  riskChanges?: Array<{
    riskId: string;
    title: string;
    previousLevel: NarrativeInsightStrength;
    newLevel: NarrativeInsightStrength;
  }>;
  patternChanges?: Array<{
    patternId: string;
    title: string;
    changeType: string;
  }>;

  // Context shift analysis
  contextShiftSummary?: string;
  contextShiftFactors?: string[];

  // LLM metadata
  llmModel?: string;
  tokensUsed?: number;

  // Audit
  computedAt: Date;
  computedBy?: string;

  createdAt: Date;
}

/**
 * Audit log entry
 */
export interface UnifiedNarrativeAuditLog {
  id: string;
  orgId: string;
  narrativeId?: string;
  sectionId?: string;

  // Event details
  eventType: NarrativeEventType;
  eventDescription?: string;

  // Actor
  userId?: string;
  userEmail?: string;

  // Change tracking
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  changes?: Record<string, unknown>;

  // Context
  ipAddress?: string;
  userAgent?: string;

  // Timestamps
  createdAt: Date;
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request to create a new narrative
 */
export interface CreateNarrativeInput {
  title: string;
  subtitle?: string;
  narrativeType: NarrativeType;
  format?: NarrativeFormatType;
  periodStart: string;
  periodEnd: string;
  fiscalQuarter?: string;
  fiscalYear?: number;
  targetAudience?: string;
  audienceContext?: AudienceContext;
  generationConfig?: NarrativeGenerationConfig;
  sourceSystems?: NarrativeSourceSystem[];
  excludedSystems?: NarrativeSourceSystem[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Request to update a narrative
 */
export interface UpdateNarrativeInput {
  title?: string;
  subtitle?: string;
  format?: NarrativeFormatType;
  status?: NarrativeStatus;
  targetAudience?: string;
  audienceContext?: AudienceContext;
  generationConfig?: NarrativeGenerationConfig;
  sourceSystems?: NarrativeSourceSystem[];
  excludedSystems?: NarrativeSourceSystem[];
  executiveSummary?: string;
  tldrSynthesis?: string;
  threeSentenceSummary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Request to generate a narrative
 */
export interface UnifiedGenerateNarrativeInput {
  regenerateSections?: boolean;
  regenerateInsights?: boolean;
  regenerateSummaries?: boolean;
  forceRefresh?: boolean;
  specificSections?: NarrativeSectionType[];
  customPrompt?: string;
}

/**
 * Request to regenerate a section
 */
export interface UnifiedRegenerateSectionInput {
  customPrompt?: string;
  additionalContext?: string;
  preserveKeyPoints?: boolean;
}

/**
 * Request to update a section
 */
export interface UnifiedUpdateSectionInput {
  title?: string;
  contentMd?: string;
  keyPoints?: string[];
  supportingData?: Record<string, unknown>;
  sortOrder?: number;
}

/**
 * Request to compute delta between narratives
 */
export interface ComputeDeltaInput {
  previousNarrativeId: string;
  includeDetailedAnalysis?: boolean;
  focusAreas?: string[];
}

/**
 * Query parameters for listing narratives
 */
export interface ListNarrativesQuery {
  narrativeType?: NarrativeType;
  status?: NarrativeStatus;
  format?: NarrativeFormatType;
  periodStart?: string;
  periodEnd?: string;
  fiscalYear?: number;
  fiscalQuarter?: string;
  sourceSystems?: NarrativeSourceSystem[];
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'period_start' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for getting insights
 */
export interface GetInsightsQuery {
  sourceSystem?: NarrativeSourceSystem;
  strength?: NarrativeInsightStrength;
  periodStart?: string;
  periodEnd?: string;
  limit?: number;
  offset?: number;
}

/**
 * Response for listing narratives
 */
export interface ListNarrativesResponse {
  narratives: UnifiedNarrative[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response for narrative generation
 */
export interface GenerateNarrativeResponse {
  narrative: UnifiedNarrative;
  sections: UnifiedNarrativeSection[];
  sources: UnifiedNarrativeSource[];
  insights: NarrativeInsight[];
  tokensUsed: number;
  generationDurationMs: number;
}

/**
 * Response for delta computation
 */
export interface ComputeDeltaResponse {
  diff: UnifiedNarrativeDiff;
  summary: string;
  highlights: string[];
  tokensUsed: number;
}

/**
 * Response for listing insights
 */
export interface ListInsightsResponse {
  insights: NarrativeInsight[];
  total: number;
  limit: number;
  offset: number;
  bySystem: Record<NarrativeSourceSystem, number>;
  byStrength: Record<NarrativeInsightStrength, number>;
}

/**
 * Response for getting a narrative with sections
 */
export interface NarrativeWithSections {
  narrative: UnifiedNarrative;
  sections: UnifiedNarrativeSection[];
  sources: UnifiedNarrativeSource[];
}

/**
 * Stats for narratives
 */
export interface NarrativeStats {
  totalNarratives: number;
  byType: Record<NarrativeType, number>;
  byStatus: Record<NarrativeStatus, number>;
  byFormat: Record<NarrativeFormatType, number>;
  avgTokensUsed: number;
  avgGenerationTime: number;
  totalInsights: number;
  insightsByStrength: Record<NarrativeInsightStrength, number>;
  recentNarratives: UnifiedNarrative[];
}

// =============================================================================
// CROSS-SYSTEM CONTEXT TYPES
// =============================================================================

/**
 * Context from a single source system
 */
export interface SourceSystemContext {
  system: NarrativeSourceSystem;
  lastUpdated?: Date;
  dataQuality: 'high' | 'medium' | 'low' | 'unavailable';
  recordCount: number;
  keyMetrics?: Record<string, number>;
  topInsights?: NarrativeInsight[];
  alerts?: Array<{
    level: NarrativeInsightStrength;
    message: string;
    timestamp: Date;
  }>;
  summary?: string;
}

/**
 * Aggregated context from all source systems
 */
export interface AggregatedSourceContext {
  periodStart: Date;
  periodEnd: Date;
  systemContexts: SourceSystemContext[];
  availableSystems: NarrativeSourceSystem[];
  unavailableSystems: NarrativeSourceSystem[];
  totalRecords: number;
  overallDataQuality: 'high' | 'medium' | 'low';
  crossSystemInsights: NarrativeInsight[];
  crossSystemPatterns: CrossSystemPattern[];
  contradictions: ContradictionDetected[];
  riskClusters: RiskCluster[];
  correlations: DataCorrelation[];
}

/**
 * Source record metadata for context building
 */
export interface SourceRecordMetadata {
  system: NarrativeSourceSystem;
  recordId: string;
  recordType: string;
  title: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  relevanceScore: number;
  extractedInsights: NarrativeInsight[];
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

/**
 * Section template for narrative generation
 */
export interface NarrativeSectionTemplate {
  sectionType: NarrativeSectionType;
  title: string;
  description: string;
  requiredForTypes: NarrativeType[];
  optionalForTypes: NarrativeType[];
  defaultSortOrder: number;
  promptTemplate: string;
  requiredSourceSystems?: NarrativeSourceSystem[];
  suggestedSourceSystems?: NarrativeSourceSystem[];
}

/**
 * Narrative type template
 */
export interface NarrativeTypeTemplate {
  narrativeType: NarrativeType;
  name: string;
  description: string;
  defaultFormat: NarrativeFormatType;
  defaultSections: NarrativeSectionType[];
  optionalSections: NarrativeSectionType[];
  requiredSourceSystems: NarrativeSourceSystem[];
  suggestedSourceSystems: NarrativeSourceSystem[];
  audienceGuidelines: string;
  toneGuidelines: string;
  lengthGuidelines: {
    brief: { minWords: number; maxWords: number };
    standard: { minWords: number; maxWords: number };
    comprehensive: { minWords: number; maxWords: number };
  };
}

// =============================================================================
// LABEL CONSTANTS
// =============================================================================

/**
 * Display labels for narrative types
 */
export const NARRATIVE_TYPE_LABELS: Record<NarrativeType, string> = {
  executive: 'Executive Narrative',
  strategy: 'Strategy Narrative',
  investor: 'Investor Narrative',
  crisis: 'Crisis Narrative',
  competitive_intelligence: 'Competitive Intelligence Narrative',
  reputation: 'Reputation Narrative',
  quarterly_context: 'Quarterly Context Sheet',
  talking_points: 'Talking Points',
  analyst_brief: 'Analyst Brief',
  internal_alignment_memo: 'Internal Alignment Memo',
  tldr_synthesis: 'TL;DR Synthesis',
  custom: 'Custom Narrative',
};

/**
 * Display labels for narrative section types
 */
export const NARRATIVE_SECTION_TYPE_LABELS: Record<NarrativeSectionType, string> = {
  // Executive Narrative sections
  executive_summary: 'Executive Summary',
  strategic_overview: 'Strategic Overview',
  key_achievements: 'Key Achievements',
  critical_risks: 'Critical Risks',
  market_position: 'Market Position',
  competitive_landscape: 'Competitive Landscape',
  financial_implications: 'Financial Implications',
  forward_outlook: 'Forward Outlook',
  // Strategy Narrative sections
  strategic_context: 'Strategic Context',
  opportunity_analysis: 'Opportunity Analysis',
  threat_assessment: 'Threat Assessment',
  resource_allocation: 'Resource Allocation',
  initiative_priorities: 'Initiative Priorities',
  timeline_milestones: 'Timeline & Milestones',
  // Investor Narrative sections
  investment_thesis: 'Investment Thesis',
  growth_drivers: 'Growth Drivers',
  market_dynamics: 'Market Dynamics',
  competitive_moat: 'Competitive Moat',
  risk_factors: 'Risk Factors',
  financial_performance: 'Financial Performance',
  guidance_outlook: 'Guidance & Outlook',
  // Crisis Narrative sections
  situation_assessment: 'Situation Assessment',
  impact_analysis: 'Impact Analysis',
  response_actions: 'Response Actions',
  stakeholder_communications: 'Stakeholder Communications',
  recovery_timeline: 'Recovery Timeline',
  lessons_learned: 'Lessons Learned',
  // Competitive Intelligence sections
  competitor_overview: 'Competitor Overview',
  market_share_analysis: 'Market Share Analysis',
  product_comparison: 'Product Comparison',
  pricing_analysis: 'Pricing Analysis',
  strategic_moves: 'Strategic Moves',
  threat_opportunities: 'Threats & Opportunities',
  // Reputation Narrative sections
  brand_health: 'Brand Health',
  sentiment_analysis: 'Sentiment Analysis',
  media_coverage: 'Media Coverage',
  stakeholder_perception: 'Stakeholder Perception',
  reputation_risks: 'Reputation Risks',
  enhancement_opportunities: 'Enhancement Opportunities',
  // Quarterly Context sections
  quarter_highlights: 'Quarter Highlights',
  performance_metrics: 'Performance Metrics',
  trend_analysis: 'Trend Analysis',
  variance_explanation: 'Variance Explanation',
  next_quarter_outlook: 'Next Quarter Outlook',
  // Generic sections
  introduction: 'Introduction',
  conclusion: 'Conclusion',
  appendix: 'Appendix',
  sources_references: 'Sources & References',
  custom: 'Custom Section',
};

/**
 * Display labels for insight strength
 */
export const NARRATIVE_INSIGHT_STRENGTH_LABELS: Record<NarrativeInsightStrength, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  informational: 'Informational',
};

/**
 * Display labels for delta types
 */
export const DELTA_TYPE_LABELS: Record<DeltaType, string> = {
  improved: 'Improved',
  declined: 'Declined',
  unchanged: 'Unchanged',
  new_insight: 'New Insight',
  removed_insight: 'Removed Insight',
  context_shift: 'Context Shift',
};

/**
 * Display labels for narrative format types
 */
export const NARRATIVE_FORMAT_LABELS: Record<NarrativeFormatType, string> = {
  long_form: 'Long Form',
  executive_brief: 'Executive Brief',
  bullet_points: 'Bullet Points',
  structured_report: 'Structured Report',
  presentation_ready: 'Presentation Ready',
  email_friendly: 'Email Friendly',
};

/**
 * Display labels for narrative status
 */
export const NARRATIVE_STATUS_LABELS: Record<NarrativeStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  review: 'In Review',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
};

/**
 * Display labels for source systems
 */
export const NARRATIVE_SOURCE_SYSTEM_LABELS: Record<NarrativeSourceSystem, string> = {
  media_briefing: 'Media Briefing',
  crisis_engine: 'Crisis Engine',
  brand_reputation: 'Brand Reputation',
  brand_alerts: 'Brand Alerts',
  governance: 'Governance',
  risk_radar: 'Risk Radar',
  exec_command_center: 'Executive Command Center',
  exec_digest: 'Executive Digest',
  board_reports: 'Board Reports',
  investor_relations: 'Investor Relations',
  strategic_intelligence: 'Strategic Intelligence',
  unified_graph: 'Unified Graph',
  scenario_playbooks: 'Scenario Playbooks',
  media_monitoring: 'Media Monitoring',
  media_performance: 'Media Performance',
  journalist_graph: 'Journalist Graph',
  audience_personas: 'Audience Personas',
  competitive_intel: 'Competitive Intelligence',
  content_quality: 'Content Quality',
  pr_outreach: 'PR Outreach',
  custom: 'Custom',
};

/**
 * Display labels for event types
 */
export const NARRATIVE_EVENT_TYPE_LABELS: Record<NarrativeEventType, string> = {
  created: 'Created',
  updated: 'Updated',
  generated: 'Generated',
  section_generated: 'Section Generated',
  section_regenerated: 'Section Regenerated',
  section_edited: 'Section Edited',
  delta_computed: 'Delta Computed',
  status_changed: 'Status Changed',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
  exported: 'Exported',
  shared: 'Shared',
};
