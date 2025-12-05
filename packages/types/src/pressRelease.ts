/**
 * Press Release Types (Sprint S38)
 * Types for AI-generated press release engine
 */

// ============================================================================
// Status Types
// ============================================================================

export type PRReleaseStatus = 'draft' | 'generating' | 'complete' | 'failed';

// ============================================================================
// Database Record Types (snake_case for DB mapping)
// ============================================================================

export interface PRGeneratedReleaseRecord {
  id: string;
  org_id: string;
  user_id: string;
  status: PRReleaseStatus;
  input_json: PRGenerationInput;
  headline: string | null;
  subheadline: string | null;
  angle: string | null;
  angle_options: PRAngleOption[];
  body: string | null;
  dateline: string | null;
  quote_1: string | null;
  quote_1_attribution: string | null;
  quote_2: string | null;
  quote_2_attribution: string | null;
  boilerplate: string | null;
  seo_summary_json: PRSEOSummary;
  optimization_history: PROptimizationEntry[];
  readability_score: number | null;
  keyword_density: Record<string, number>;
  distribution_notes: string | null;
  target_outlets: string[];
  embeddings: number[] | null;
  generation_run_id: string | null;
  personality_id: string | null;
  word_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PRHeadlineVariantRecord {
  id: string;
  release_id: string;
  headline: string;
  score: number;
  seo_score: number;
  virality_score: number;
  readability_score: number;
  is_selected: boolean;
  created_at: string;
}

export interface PRAngleOptionRecord {
  id: string;
  release_id: string;
  angle_title: string;
  angle_description: string | null;
  newsworthiness_score: number;
  uniqueness_score: number;
  relevance_score: number;
  total_score: number;
  is_selected: boolean;
  created_at: string;
}

// ============================================================================
// Application Types (camelCase)
// ============================================================================

export interface PRGeneratedRelease {
  id: string;
  orgId: string;
  userId: string;
  status: PRReleaseStatus;
  input: PRGenerationInput;
  headline: string | null;
  subheadline: string | null;
  angle: string | null;
  angleOptions: PRAngleOption[];
  body: string | null;
  dateline: string | null;
  quote1: string | null;
  quote1Attribution: string | null;
  quote2: string | null;
  quote2Attribution: string | null;
  boilerplate: string | null;
  seoSummary: PRSEOSummary;
  optimizationHistory: PROptimizationEntry[];
  readabilityScore: number | null;
  keywordDensity: Record<string, number>;
  distributionNotes: string | null;
  targetOutlets: string[];
  generationRunId: string | null;
  personalityId: string | null;
  wordCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PRHeadlineVariant {
  id: string;
  releaseId: string;
  headline: string;
  score: number;
  seoScore: number;
  viralityScore: number;
  readabilityScore: number;
  isSelected: boolean;
  createdAt: string;
}

export interface PRAngleOption {
  id?: string;
  releaseId?: string;
  angleTitle: string;
  angleDescription: string | null;
  newsworthinessScore: number;
  uniquenessScore: number;
  relevanceScore: number;
  totalScore: number;
  isSelected: boolean;
  createdAt?: string;
}

// ============================================================================
// Input Types
// ============================================================================

export interface PRGenerationInput {
  // Core news information
  newsType: PRNewsType;
  announcement: string;
  companyName: string;
  companyDescription?: string;

  // Optional context
  targetKeywords?: string[];
  targetAudience?: string;
  tone?: PRTone;
  industry?: string;

  // Quotes and attributions
  spokespersonName?: string;
  spokespersonTitle?: string;
  secondarySpokesperson?: string;
  secondarySpokespersonTitle?: string;

  // Additional context
  additionalContext?: string;
  competitorMentions?: string[];
  dataPoints?: PRDataPoint[];

  // Preferences
  preferredAngle?: string;
  personalityId?: string;
  maxLength?: number;
}

export type PRNewsType =
  | 'product_launch'
  | 'company_milestone'
  | 'partnership'
  | 'acquisition'
  | 'funding'
  | 'executive_hire'
  | 'award'
  | 'event'
  | 'research'
  | 'other';

export type PRTone =
  | 'formal'
  | 'professional'
  | 'conversational'
  | 'authoritative'
  | 'enthusiastic';

export interface PRDataPoint {
  label: string;
  value: string;
  source?: string;
}

// ============================================================================
// Generation Context Types
// ============================================================================

export interface PRGenerationContext {
  input: PRGenerationInput;
  seoKeywords: string[];
  seoOpportunities: PRSEOOpportunity[];
  companyFootprint: PRCompanyFootprint;
  personality: PRPersonalityContext | null;
  industryTrends: string[];
  competitorContext: string[];
}

export interface PRSEOOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  relevance: number;
}

export interface PRCompanyFootprint {
  name: string;
  description: string;
  industry: string;
  keyProducts: string[];
  recentNews: string[];
  boilerplate: string;
}

export interface PRPersonalityContext {
  id: string;
  name: string;
  tone: string;
  voiceAttributes: string[];
  writingStyle: string;
}

// ============================================================================
// Angle Finder Types
// ============================================================================

export interface PRAngleFinderResult {
  angles: PRAngleOption[];
  selectedAngle: PRAngleOption;
  reasoning: string;
}

// ============================================================================
// Headline Generation Types
// ============================================================================

export interface PRHeadlineGenerationResult {
  variants: PRHeadlineVariant[];
  selectedHeadline: PRHeadlineVariant;
  reasoning: string;
}

export interface PRHeadlineScoringCriteria {
  seoWeight: number;
  viralityWeight: number;
  readabilityWeight: number;
  clarityWeight: number;
}

// ============================================================================
// Draft Generation Types
// ============================================================================

export interface PRDraftResult {
  headline: string;
  subheadline: string;
  dateline: string;
  body: string;
  paragraphs: string[];
  quote1: string;
  quote1Attribution: string;
  quote2: string;
  quote2Attribution: string;
  boilerplate: string;
  wordCount: number;
}

// ============================================================================
// SEO & Optimization Types
// ============================================================================

export interface PRSEOSummary {
  primaryKeyword: string | null;
  secondaryKeywords: string[];
  keywordDensity: Record<string, number>;
  readabilityGrade: string | null;
  readabilityScore: number | null;
  sentenceCount: number;
  avgSentenceLength: number;
  passiveVoiceCount: number;
  suggestions: PRSEOSuggestion[];
}

export interface PRSEOSuggestion {
  type: 'keyword' | 'readability' | 'structure' | 'length';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PROptimizationEntry {
  timestamp: string;
  type: 'seo' | 'readability' | 'tone' | 'structure';
  changes: string[];
  beforeScore: number;
  afterScore: number;
}

export interface PROptimizationResult {
  release: PRGeneratedRelease;
  changes: PROptimizationEntry;
  seoSummary: PRSEOSummary;
}

// ============================================================================
// Similarity Search Types
// ============================================================================

export interface PRSimilarRelease {
  id: string;
  headline: string | null;
  angle: string | null;
  status: PRReleaseStatus;
  similarity: number;
  createdAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PRGenerationResponse {
  id: string;
  status: PRReleaseStatus;
  generationRunId: string | null;
}

export interface PRListResponse {
  releases: PRGeneratedRelease[];
  total: number;
  hasMore: boolean;
}

export interface PRDetailResponse {
  release: PRGeneratedRelease;
  headlineVariants: PRHeadlineVariant[];
  angleOptions: PRAngleOption[];
}

export interface PRSimilarityResponse {
  similar: PRSimilarRelease[];
  total: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface PRListFilters {
  status?: PRReleaseStatus;
  startDate?: string;
  endDate?: string;
  newsType?: PRNewsType;
  limit?: number;
  offset?: number;
}
