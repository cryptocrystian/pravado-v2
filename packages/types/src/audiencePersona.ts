/**
 * Audience Persona Types (Sprint S51)
 * TypeScript types for persona builder engine
 */

// ========================================
// Enums
// ========================================

export type PersonaType = 'primary_audience' | 'secondary_audience' | 'stakeholder' | 'influencer';

export type PersonaStatus = 'active' | 'archived' | 'merged';

export type GenerationMethod = 'manual' | 'llm_assisted' | 'auto_extracted';

export type TraitCategory = 'skill' | 'demographic' | 'psychographic' | 'behavioral' | 'interest';

export type TraitType =
  | 'hard_skill'
  | 'soft_skill'
  | 'goal'
  | 'pain_point'
  | 'motivation'
  | 'value'
  | 'preference'
  | 'demographic'
  | 'role'
  | 'industry';

export type InsightType =
  | 'content_preference'
  | 'media_consumption'
  | 'engagement_pattern'
  | 'pain_point'
  | 'opportunity';

export type PersonaInsightCategory = 'behavioral' | 'attitudinal' | 'contextual';

export type PersonaSourceSystem =
  | 'press_release_gen'
  | 'pr_pitch'
  | 'media_monitoring'
  | 'journalist_discovery'
  | 'content_analysis';

export type SnapshotType =
  | 'manual_update'
  | 'auto_enrichment'
  | 'score_recalculation'
  | 'trait_extraction'
  | 'insight_aggregation';

export type CompanySize = 'startup' | 'smb' | 'enterprise';

export type SeniorityLevel =
  | 'individual_contributor'
  | 'manager'
  | 'director'
  | 'executive'
  | 'c_level';

export type ExtractionMethod = 'manual' | 'llm' | 'deterministic';

export type PersonaSourceType =
  | 'press_release'
  | 'pitch'
  | 'media_mention'
  | 'content'
  | 'journalist_interaction'
  | 'manual';

// ========================================
// Core Interfaces
// ========================================

export interface AudiencePersona {
  id: string;
  orgId: string;

  // Identity
  name: string;
  description?: string;
  personaType: PersonaType;

  // Demographics
  role?: string; // Job title
  industry?: string;
  companySize?: CompanySize;
  seniorityLevel?: SeniorityLevel;
  location?: string;

  // Metadata
  tags: string[];
  customFields: Record<string, any>;

  // Scoring
  relevanceScore: number; // 0-100, how relevant to org's messaging
  engagementScore: number; // 0-100, predicted engagement level
  alignmentScore: number; // 0-100, alignment with brand values
  overallScore: number; // 0-100, weighted composite score

  // Source Tracking
  generationMethod: GenerationMethod;
  llmModel?: string;
  sourceCount: number; // Number of insights aggregated
  lastEnrichedAt?: Date;

  // Status
  status: PersonaStatus;
  isValidated: boolean;
  mergedIntoId?: string;

  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudiencePersonaTrait {
  id: string;
  orgId: string;
  personaId: string;

  // Trait Classification
  traitCategory: TraitCategory;
  traitType: TraitType;

  // Trait Data
  traitName: string;
  traitValue?: string;
  traitStrength: number; // 0-1, confidence/importance

  // Source Attribution
  sourceType?: PersonaSourceType;
  sourceId?: string;
  extractionMethod: ExtractionMethod;
  extractionConfidence?: number; // 0-1

  // Context
  contextSnippet?: string;
  metadata: Record<string, any>;

  // Status
  isVerified: boolean;
  isPrimary: boolean;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface AudiencePersonaInsight {
  id: string;
  orgId: string;
  personaId: string;

  // Insight Classification
  insightType: InsightType;
  insightCategory?: PersonaInsightCategory;

  // Insight Data
  insightTitle: string;
  insightDescription?: string;
  insightData: Record<string, any>;

  // Display Aliases (for UI convenience)
  title?: string; // Alias for insightTitle
  description?: string; // Alias for insightDescription
  evidence?: Array<Record<string, any>>; // Alias for supportingEvidence
  recommendedActions?: string[]; // Suggested actions based on insight

  // Source Attribution
  sourceSystem: PersonaSourceSystem;
  sourceId?: string;
  sourceReference?: string;

  // Confidence & Impact
  confidenceScore: number; // 0-1
  impactScore: number; // 0-1
  freshnessScore: number; // 0-1

  // Temporal Context
  observedAt?: Date;
  validUntil?: Date;

  // Evidence
  supportingEvidence: Array<Record<string, any>>;
  evidenceCount: number;

  // Status
  isValidated: boolean;
  isActionable: boolean;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface AudiencePersonaHistory {
  id: string;
  orgId: string;
  personaId: string;

  // Snapshot Data
  snapshotType: SnapshotType;
  snapshotData: Record<string, any>;
  snapshotAt?: Date;

  // Change Tracking
  changedFields: string[];
  changeSummary?: string;
  changeMagnitude: number; // 0-1

  // Scores Snapshot
  previousRelevanceScore?: number;
  newRelevanceScore?: number;
  previousEngagementScore?: number;
  newEngagementScore?: number;
  previousAlignmentScore?: number;
  newAlignmentScore?: number;
  previousOverallScore?: number;
  newOverallScore?: number;

  // Context
  triggerEvent?: string;
  triggerSource?: string;
  triggeredBy?: string;
  changeDescription?: string;
  previousSnapshot?: {
    relevanceScore?: number;
    engagementScore?: number;
    alignmentScore?: number;
    overallScore?: number;
  };

  // Metadata
  metadata: Record<string, any>;

  // Audit
  createdBy?: string;
  createdAt: Date;
}

// ========================================
// Scoring & Comparison
// ========================================

export interface AlignmentScore {
  relevance: number; // 0-100
  engagement: number; // 0-100
  alignment: number; // 0-100
  overall: number; // 0-100
}

export interface PersonaComparisonResult {
  persona1: AudiencePersona;
  persona2: AudiencePersona;

  similarityScore: number; // 0-100

  // Score comparison
  scoreDifferences: {
    relevance: number;
    engagement: number;
    alignment: number;
    overall: number;
  };

  // Trait comparison
  commonTraits: Array<{
    traitName: string;
    traitCategory: TraitCategory;
    strength1: number;
    strength2: number;
  }>;
  uniqueTraits1: AudiencePersonaTrait[];
  uniqueTraits2: AudiencePersonaTrait[];

  // Insight comparison
  commonInsights: number;
  uniqueInsights1: number;
  uniqueInsights2: number;

  // Recommendations
  mergeRecommendation: boolean;
  mergeSuggestion?: string;
}

export interface TraitDistribution {
  traitCategory: TraitCategory;
  traitCount: number;
  avgStrength: number;
  verifiedCount: number;
}

export interface InsightSummary {
  sourceSystem: PersonaSourceSystem;
  insightCount: number;
  avgConfidence: number;
  avgImpact: number;
  actionableCount: number;
}

export interface PersonaTrend {
  snapshotDate: string; // Date string
  relevanceScore: number;
  engagementScore: number;
  alignmentScore: number;
  overallScore: number;
  traitCount: number;
  insightCount: number;
}

// ========================================
// Generation & Extraction
// ========================================

export interface GenerationContext {
  // Source material
  sourceType: PersonaSourceType;
  sourceId?: string;
  sourceText: string;
  additionalContext?: string;

  // Generation parameters
  personaType?: PersonaType;
  suggestedName?: string;
  extractTraits?: boolean;
  extractInsights?: boolean;

  // LLM settings
  llmModel?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ExtractionInput {
  personaId?: string; // If updating existing persona
  sourceType: PersonaSourceType;
  sourceId?: string;
  sourceText: string;
  extractionType: 'traits' | 'insights' | 'both';
}

export interface ExtractionResult {
  traits: Array<{
    traitCategory: TraitCategory;
    traitType: TraitType;
    traitName: string;
    traitValue?: string;
    traitStrength: number;
    extractionConfidence: number;
    contextSnippet?: string;
  }>;
  insights: Array<{
    insightType: InsightType;
    insightCategory?: PersonaInsightCategory;
    insightTitle: string;
    insightDescription?: string;
    insightData: Record<string, any>;
    confidenceScore: number;
    impactScore: number;
    supportingEvidence: any[];
  }>;
  extractionMethod: ExtractionMethod;
  llmModel?: string;
  extractionMetadata: Record<string, any>;
}

// ========================================
// API Request/Response Types
// ========================================

export interface CreatePersonaInput {
  name: string;
  description?: string;
  personaType: PersonaType;
  role?: string;
  industry?: string;
  companySize?: CompanySize;
  seniorityLevel?: SeniorityLevel;
  location?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  generationMethod?: GenerationMethod;
}

export interface UpdatePersonaInput {
  name?: string;
  description?: string;
  personaType?: PersonaType;
  role?: string;
  industry?: string;
  companySize?: CompanySize;
  seniorityLevel?: SeniorityLevel;
  location?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  relevanceScore?: number;
  engagementScore?: number;
  alignmentScore?: number;
  status?: PersonaStatus;
  isValidated?: boolean;
}

export interface GeneratePersonaRequest {
  generationContext: GenerationContext;
}

export interface GeneratePersonaResponse {
  persona: AudiencePersona;
  traits: AudiencePersonaTrait[];
  insights: AudiencePersonaInsight[];
  extraction: ExtractionResult;
  message: string;
}

export interface PersonasQuery {
  personaType?: PersonaType[];
  role?: string;
  industry?: string;
  seniorityLevel?: SeniorityLevel[];
  minRelevanceScore?: number;
  minEngagementScore?: number;
  minAlignmentScore?: number;
  minOverallScore?: number;
  status?: PersonaStatus[];
  tags?: string[];
  searchQuery?: string;
  sortBy?:
    | 'created_at'
    | 'updated_at'
    | 'overall_score'
    | 'relevance_score'
    | 'engagement_score'
    | 'alignment_score'
    | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PersonasListResponse {
  personas: AudiencePersona[];
  total: number;
  hasMore: boolean;
}

export interface PersonaDetailResponse {
  persona: AudiencePersona;
  traits: AudiencePersonaTrait[];
  traitDistribution: TraitDistribution[];
  insights: AudiencePersonaInsight[];
  insightSummary: InsightSummary[];
  recentHistory: AudiencePersonaHistory[];
}

export interface PersonaInsightsResponse {
  insights: AudiencePersonaInsight[];
  total: number;
  bySourceSystem: InsightSummary[];
  hasMore: boolean;
}

export interface PersonaHistoryResponse {
  history: AudiencePersonaHistory[];
  total: number;
  hasMore: boolean;
}

export interface ComparePersonasRequest {
  personaId1: string;
  personaId2: string;
}

export interface ComparePersonasResponse {
  comparison: PersonaComparisonResult;
}

export interface MergePersonasRequest {
  sourcePersonaId: string; // Persona to merge from
  targetPersonaId: string; // Persona to merge into
  mergeTraits: boolean;
  mergeInsights: boolean;
  archiveSource: boolean;
}

export interface MergePersonasResponse {
  mergedPersona: AudiencePersona;
  traitsAdded: number;
  insightsAdded: number;
  message: string;
}

export interface AddTraitRequest {
  traitCategory: TraitCategory;
  traitType: TraitType;
  traitName: string;
  traitValue?: string;
  traitStrength?: number;
  sourceType?: PersonaSourceType;
  sourceId?: string;
  extractionMethod?: ExtractionMethod;
  contextSnippet?: string;
  isPrimary?: boolean;
}

export interface AddInsightRequest {
  insightType: InsightType;
  insightCategory?: PersonaInsightCategory;
  insightTitle: string;
  insightDescription?: string;
  insightData?: Record<string, any>;
  sourceSystem: PersonaSourceSystem;
  sourceId?: string;
  sourceReference?: string;
  confidenceScore?: number;
  impactScore?: number;
  isActionable?: boolean;
  supportingEvidence?: any[];
}

export interface PersonaTrendsResponse {
  trends: PersonaTrend[];
  dimensions: string[];
  summary: {
    relevanceChange: number; // % change
    engagementChange: number;
    alignmentChange: number;
    overallChange: number;
    traitGrowth: number;
    insightGrowth: number;
  };
}
