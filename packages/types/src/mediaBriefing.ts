/**
 * Media Briefing & Executive Talking Points Types (Sprint S54)
 *
 * Type definitions for AI-powered media briefing generation,
 * integrating intelligence from S38-S53 modules.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Types of sections in a media briefing
 */
export enum BriefingSectionType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  KEY_MESSAGES = 'key_messages',
  MEDIA_LANDSCAPE = 'media_landscape',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
  JOURNALIST_INTELLIGENCE = 'journalist_intelligence',
  AUDIENCE_INSIGHTS = 'audience_insights',
  PERFORMANCE_METRICS = 'performance_metrics',
  RECOMMENDED_ACTIONS = 'recommended_actions',
  QA_PREPARATION = 'qa_preparation',
  APPENDIX = 'appendix',
}

/**
 * Categories of talking points
 */
export enum TalkingPointCategory {
  PRIMARY_MESSAGE = 'primary_message',
  SUPPORTING_POINT = 'supporting_point',
  DEFENSIVE_POINT = 'defensive_point',
  BRIDGING_STATEMENT = 'bridging_statement',
  CALL_TO_ACTION = 'call_to_action',
  STAT_HIGHLIGHT = 'stat_highlight',
  QUOTE_SUGGESTION = 'quote_suggestion',
  PIVOT_PHRASE = 'pivot_phrase',
}

/**
 * Insight confidence levels
 */
export type InsightStrength = 'strong' | 'moderate' | 'weak' | 'speculative';

export const InsightStrength = {
  STRONG: 'strong' as const,
  MODERATE: 'moderate' as const,
  WEAK: 'weak' as const,
  SPECULATIVE: 'speculative' as const,
};

/**
 * Briefing format types
 */
export type BriefFormatType =
  | 'full_brief'
  | 'executive_summary'
  | 'talking_points_only'
  | 'media_prep'
  | 'crisis_brief'
  | 'interview_prep';

export const BriefFormatType = {
  FULL_BRIEF: 'full_brief' as const,
  EXECUTIVE_SUMMARY: 'executive_summary' as const,
  TALKING_POINTS_ONLY: 'talking_points_only' as const,
  MEDIA_PREP: 'media_prep' as const,
  CRISIS_BRIEF: 'crisis_brief' as const,
  INTERVIEW_PREP: 'interview_prep' as const,
};

/**
 * Briefing workflow status
 */
export enum BriefingStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  GENERATED = 'generated',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  ARCHIVED = 'archived',
}

/**
 * Source types for briefing references
 */
export enum BriefingSourceType {
  PRESS_RELEASE = 'press_release',
  PITCH = 'pitch',
  MEDIA_MENTION = 'media_mention',
  JOURNALIST_PROFILE = 'journalist_profile',
  MEDIA_LIST = 'media_list',
  AUDIENCE_PERSONA = 'audience_persona',
  COMPETITIVE_INTEL = 'competitive_intel',
  PERFORMANCE_METRIC = 'performance_metric',
  RELATIONSHIP_EVENT = 'relationship_event',
  ENRICHMENT_DATA = 'enrichment_data',
  EXTERNAL_ARTICLE = 'external_article',
  INTERNAL_NOTE = 'internal_note',
}

// ============================================================================
// NESTED TYPES
// ============================================================================

/**
 * Key takeaway structure
 */
export interface BriefingKeyTakeaway {
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  category?: string;
  sourceIds?: string[];
}

/**
 * Generated insight structure
 */
export interface BriefingInsight {
  id: string;
  title: string;
  content: string;
  strength: InsightStrength;
  category: string;
  sourceType: BriefingSourceType;
  sourceId?: string;
  relevanceScore: number;
  actionable: boolean;
  suggestedAction?: string;
}

/**
 * Bullet point structure for sections
 */
export interface SectionBulletPoint {
  text: string;
  subPoints?: string[];
  sourceId?: string;
  importance?: 'high' | 'medium' | 'low';
}

/**
 * Supporting data for sections
 */
export interface SectionSupportingData {
  metrics?: Record<string, number | string>;
  charts?: Array<{
    type: string;
    title: string;
    data: Record<string, unknown>;
  }>;
  tables?: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }>;
  quotes?: Array<{
    text: string;
    attribution: string;
    source?: string;
  }>;
}

/**
 * Supporting fact for talking points
 */
export interface TalkingPointFact {
  fact: string;
  source?: string;
  date?: string;
  verifiable: boolean;
}

/**
 * Generation configuration
 */
export interface BriefingGenerationConfig {
  tone?: 'professional' | 'conversational' | 'formal' | 'casual';
  focusAreas?: string[];
  excludedTopics?: string[];
  customInstructions?: string;
  maxLength?: number;
  includeCompetitiveAnalysis?: boolean;
  includePerformanceMetrics?: boolean;
  includeAudienceInsights?: boolean;
  sectionsToGenerate?: BriefingSectionType[];
}

/**
 * LLM generation metadata
 */
export interface GenerationMetadata {
  llmModel?: string;
  tokensUsed?: number;
  durationMs?: number;
  promptSnapshot?: string;
  timestamp?: Date;
}

// ============================================================================
// DOMAIN MODELS
// ============================================================================

/**
 * Media Briefing - Core briefing document
 */
export interface MediaBriefing {
  id: string;
  orgId: string;

  // Briefing metadata
  title: string;
  subtitle?: string | null;
  format: BriefFormatType;
  status: BriefingStatus;

  // Context and targeting
  storyId?: string | null;
  journalistIds: string[];
  outletIds: string[];
  personaIds: string[];
  competitorIds: string[];
  pressReleaseIds: string[];

  // Generation configuration
  tone: string;
  focusAreas: string[];
  excludedTopics: string[];
  exclusions?: string[] | null;
  keyMessages?: string[] | null;
  customInstructions?: string | null;

  // Generated content
  executiveSummary?: string | null;
  keyTakeaways: BriefingKeyTakeaway[];
  generatedInsights: BriefingInsight[];

  // Scoring
  confidenceScore?: number | null;
  relevanceScore?: number | null;
  completenessScore?: number | null;

  // LLM metadata
  llmModel?: string | null;
  llmTemperature?: number | null;
  generationTokensUsed?: number | null;
  totalTokensUsed?: number | null;
  generationDurationMs?: number | null;
  lastGeneratedAt?: Date | null;
  generatedAt?: Date | null;

  // User workflow
  createdBy?: string | null;
  reviewedBy?: string | null;
  approvedBy?: string | null;
  reviewedAt?: Date | null;
  approvedAt?: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Relationships (when loaded)
  sections?: BriefingSection[];
  talkingPoints?: TalkingPoint[];
  sources?: SourceReference[];
}

/**
 * Briefing Section - Individual section in a briefing
 */
export interface BriefingSection {
  id: string;
  orgId: string;
  briefingId: string;

  // Section metadata
  sectionType: BriefingSectionType;
  title?: string | null;
  orderIndex: number;

  // Content
  content?: string | null;
  bulletPoints: SectionBulletPoint[];
  supportingData: SectionSupportingData;
  insights?: BriefingInsight[];

  // Source tracking
  sourceIds: string[];
  sourceSummary?: string | null;

  // Generation metadata
  isGenerated: boolean;
  generationPrompt?: string | null;
  llmModel?: string | null;
  tokensUsed?: number | null;
  generationDurationMs?: number | null;

  // User modifications
  isManuallyEdited: boolean;
  originalContent?: string | null;
  editedBy?: string | null;
  editedAt?: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Source Reference - Source used in briefing generation
 */
export interface SourceReference {
  id: string;
  orgId: string;
  briefingId: string;
  sectionId?: string | null;

  // Source identification
  sourceType: BriefingSourceType;
  sourceId?: string | null;
  sourceUrl?: string | null;

  // Source content
  title?: string | null;
  excerpt?: string | null;
  relevanceScore?: number | null;
  insightStrength?: InsightStrength | null;

  // Metadata
  sourceDate?: Date | null;
  authorName?: string | null;
  outletName?: string | null;

  // Usage tracking
  isCited: boolean;
  citationText?: string | null;
  usedInSections: string[];

  // Timestamps
  createdAt: Date;
}

/**
 * Talking Point - Executive talking point
 */
export interface TalkingPoint {
  id: string;
  orgId: string;
  briefingId?: string | null;

  // Talking point content
  category: TalkingPointCategory;
  headline: string;
  content: string;
  supportingFacts: TalkingPointFact[];

  // Context
  targetAudience?: string | null;
  useCase?: string | null;
  contextNotes?: string | null;

  // Related entities
  journalistIds: string[];
  personaIds: string[];
  competitorIds: string[];

  // Scoring
  priorityScore: number;
  confidenceScore?: number | null;
  effectivenessScore?: number | null;

  // Generation metadata
  isGenerated: boolean;
  llmModel?: string | null;
  generationPrompt?: string | null;

  // User workflow
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  isArchived: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Briefing Audit Log Entry
 */
export interface BriefingAuditLogEntry {
  id: string;
  orgId: string;
  briefingId?: string | null;
  sectionId?: string | null;
  talkingPointId?: string | null;

  // User context
  userId: string;

  // Action details
  action: string;
  actionDetails: Record<string, unknown>;

  // LLM details
  llmModel?: string | null;
  promptSnapshot?: string | null;
  tokensInput?: number | null;
  tokensOutput?: number | null;
  totalTokens?: number | null;
  durationMs?: number | null;

  // Response details
  success: boolean;
  errorMessage?: string | null;

  // Timestamps
  createdAt: Date;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Create Briefing Request
 */
export interface CreateBriefingRequest {
  title: string;
  subtitle?: string;
  format?: BriefFormatType;
  storyId?: string;
  journalistIds?: string[];
  outletIds?: string[];
  personaIds?: string[];
  competitorIds?: string[];
  tone?: string;
  focusAreas?: string[];
  excludedTopics?: string[];
  customInstructions?: string;
}

/**
 * Update Briefing Request
 */
export interface UpdateBriefingRequest {
  title?: string;
  subtitle?: string | null;
  format?: BriefFormatType;
  status?: BriefingStatus;
  storyId?: string | null;
  journalistIds?: string[];
  outletIds?: string[];
  personaIds?: string[];
  competitorIds?: string[];
  tone?: string;
  focusAreas?: string[];
  excludedTopics?: string[];
  customInstructions?: string | null;
  executiveSummary?: string | null;
}

/**
 * Generate Briefing Request
 */
export interface GenerateBriefingRequest {
  briefingId: string;
  sectionsToGenerate?: BriefingSectionType[];
  regenerateExisting?: boolean;
  includeCompetitiveAnalysis?: boolean;
  includePerformanceMetrics?: boolean;
  includeAudienceInsights?: boolean;
  maxTokensPerSection?: number;
}

/**
 * Regenerate Section Request
 */
export interface RegenerateSectionRequest {
  briefingId: string;
  sectionId: string;
  customInstructions?: string;
  preserveManualEdits?: boolean;
}

/**
 * Create Talking Point Request
 */
export interface CreateTalkingPointRequest {
  briefingId?: string;
  category: TalkingPointCategory;
  headline: string;
  content: string;
  supportingFacts?: TalkingPointFact[];
  targetAudience?: string;
  useCase?: string;
  contextNotes?: string;
  journalistIds?: string[];
  personaIds?: string[];
  competitorIds?: string[];
  priorityScore?: number;
}

/**
 * Update Talking Point Request
 */
export interface UpdateTalkingPointRequest {
  category?: TalkingPointCategory;
  headline?: string;
  content?: string;
  supportingFacts?: TalkingPointFact[];
  targetAudience?: string;
  useCase?: string;
  contextNotes?: string;
  journalistIds?: string[];
  personaIds?: string[];
  competitorIds?: string[];
  priorityScore?: number;
  isApproved?: boolean;
  isArchived?: boolean;
}

/**
 * Generate Talking Points Request
 */
export interface GenerateTalkingPointsRequest {
  briefingId: string;
  categories?: TalkingPointCategory[];
  /** Single category filter (alternative to categories array) */
  category?: TalkingPointCategory;
  count?: number;
  focusAreas?: string[];
  customInstructions?: string;
}

/**
 * Update Section Request
 */
export interface UpdateSectionRequest {
  title?: string;
  content?: string;
  bulletPoints?: SectionBulletPoint[];
  supportingData?: SectionSupportingData;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Briefing Filters
 */
export interface BriefingFilters {
  format?: BriefFormatType | BriefFormatType[];
  status?: BriefingStatus | BriefingStatus[];
  storyId?: string;
  journalistId?: string;
  personaId?: string;
  competitorId?: string;
  createdBy?: string;
  createdStart?: Date;
  createdEnd?: Date;
  searchQuery?: string;
}

/**
 * Talking Point Filters
 */
export interface TalkingPointFilters {
  briefingId?: string;
  category?: TalkingPointCategory;
  isApproved?: boolean;
  isArchived?: boolean;
  minPriority?: number;
  journalistId?: string;
  personaId?: string;
  competitorId?: string;
  searchQuery?: string;
}

/**
 * Insight Filters
 */
export interface BriefingInsightFilters {
  briefingId?: string;
  sourceType?: BriefingSourceType;
  strength?: InsightStrength;
  actionable?: boolean;
  minRelevance?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Get Briefings Response
 */
export interface GetBriefingsResponse {
  briefings: MediaBriefing[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get Talking Points Response
 */
export interface GetTalkingPointsResponse {
  talkingPoints: TalkingPoint[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get Insights Response
 */
export interface GetBriefingInsightsResponse {
  insights: BriefingInsight[];
  total: number;
  bySource: Record<BriefingSourceType, number>;
  byStrength: Record<InsightStrength, number>;
}

/**
 * Briefing Generation Response
 */
export interface BriefingGenerationResponse {
  briefing: MediaBriefing;
  sectionsGenerated: number;
  tokensUsed: number;
  durationMs: number;
  warnings?: string[];
}

/**
 * Section Regeneration Response
 */
export interface SectionRegenerationResponse {
  section: BriefingSection;
  tokensUsed: number;
  durationMs: number;
  previousContent?: string;
}

/**
 * Talking Points Generation Response
 */
export interface TalkingPointsGenerationResponse {
  talkingPoints: TalkingPoint[];
  tokensUsed: number;
  durationMs: number;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Intelligence context from prior sprints
 */
export interface BriefingIntelligenceContext {
  // S38: PR Generator
  pressReleases?: Array<{
    id: string;
    title: string;
    content: string;
    publishedAt?: Date;
  }>;

  // S39: Pitch Engine
  pitches?: Array<{
    id: string;
    subject: string;
    content: string;
    status: string;
  }>;

  // S40-43: Media Monitoring
  mediaMentions?: Array<{
    id: string;
    title: string;
    excerpt: string;
    sentiment: number;
    outletName: string;
    publishedAt: Date;
  }>;

  // S44: Outreach
  outreachHistory?: Array<{
    journalistId: string;
    lastContactAt: Date;
    responseRate: number;
  }>;

  // S46: Journalist Graph
  journalistProfiles?: Array<{
    id: string;
    name: string;
    outlet: string;
    beats: string[];
    recentCoverage: string[];
  }>;

  // S47: Media Lists
  mediaLists?: Array<{
    id: string;
    name: string;
    journalistCount: number;
  }>;

  // S49: Relationship Timeline
  relationshipEvents?: Array<{
    journalistId: string;
    eventType: string;
    description: string;
    date: Date;
  }>;

  // S50: Enrichment
  enrichmentData?: Array<{
    journalistId: string;
    socialProfiles: Record<string, string>;
    recentArticles: string[];
  }>;

  // S51: Persona Builder
  personas?: Array<{
    id: string;
    name: string;
    role: string;
    interests: string[];
    painPoints: string[];
  }>;

  // S52: Media Performance
  performanceMetrics?: {
    mentionVolume: number;
    avgSentiment: number;
    eviScore: number;
    shareOfVoice: number;
    topJournalists: Array<{ name: string; mentionCount: number }>;
  };

  // S53: Competitive Intelligence
  competitorIntel?: Array<{
    id: string;
    name: string;
    tier: string;
    recentMentions: number;
    avgSentiment: number;
    advantageAreas: string[];
    threatAreas: string[];
  }>;
}

/**
 * Assembled context for LLM generation
 */
export interface AssembledBriefingContext {
  briefing: MediaBriefing;
  intelligence: BriefingIntelligenceContext;
  focusAreas: string[];
  tone: string;
  maxLength?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Briefing summary for list views
 */
export interface BriefingSummary {
  id: string;
  title: string;
  format: BriefFormatType;
  status: BriefingStatus;
  sectionsCount: number;
  talkingPointsCount: number;
  confidenceScore?: number;
  createdAt: Date;
  lastGeneratedAt?: Date;
}

/**
 * Section type configuration
 */
export interface SectionTypeConfig {
  type: BriefingSectionType;
  label: string;
  description: string;
  defaultOrder: number;
  requiredSources: BriefingSourceType[];
  optional: boolean;
}

/**
 * Default section configurations
 */
export const SECTION_TYPE_CONFIGS: SectionTypeConfig[] = [
  {
    type: BriefingSectionType.EXECUTIVE_SUMMARY,
    label: 'Executive Summary',
    description: 'High-level overview and key points',
    defaultOrder: 0,
    requiredSources: [],
    optional: false,
  },
  {
    type: BriefingSectionType.KEY_MESSAGES,
    label: 'Key Messages',
    description: 'Core messaging and talking points',
    defaultOrder: 1,
    requiredSources: [BriefingSourceType.PRESS_RELEASE, BriefingSourceType.PITCH],
    optional: false,
  },
  {
    type: BriefingSectionType.MEDIA_LANDSCAPE,
    label: 'Media Landscape',
    description: 'Current media environment and trends',
    defaultOrder: 2,
    requiredSources: [BriefingSourceType.MEDIA_MENTION],
    optional: false,
  },
  {
    type: BriefingSectionType.COMPETITIVE_ANALYSIS,
    label: 'Competitive Analysis',
    description: 'Competitor positioning and intelligence',
    defaultOrder: 3,
    requiredSources: [BriefingSourceType.COMPETITIVE_INTEL],
    optional: true,
  },
  {
    type: BriefingSectionType.JOURNALIST_INTELLIGENCE,
    label: 'Journalist Intelligence',
    description: 'Key journalist profiles and relationships',
    defaultOrder: 4,
    requiredSources: [BriefingSourceType.JOURNALIST_PROFILE, BriefingSourceType.RELATIONSHIP_EVENT],
    optional: true,
  },
  {
    type: BriefingSectionType.AUDIENCE_INSIGHTS,
    label: 'Audience Insights',
    description: 'Target audience analysis and personas',
    defaultOrder: 5,
    requiredSources: [BriefingSourceType.AUDIENCE_PERSONA],
    optional: true,
  },
  {
    type: BriefingSectionType.PERFORMANCE_METRICS,
    label: 'Performance Metrics',
    description: 'Recent media performance data',
    defaultOrder: 6,
    requiredSources: [BriefingSourceType.PERFORMANCE_METRIC],
    optional: true,
  },
  {
    type: BriefingSectionType.RECOMMENDED_ACTIONS,
    label: 'Recommended Actions',
    description: 'Strategic recommendations and next steps',
    defaultOrder: 7,
    requiredSources: [],
    optional: false,
  },
  {
    type: BriefingSectionType.QA_PREPARATION,
    label: 'Q&A Preparation',
    description: 'Anticipated questions and responses',
    defaultOrder: 8,
    requiredSources: [],
    optional: true,
  },
  {
    type: BriefingSectionType.APPENDIX,
    label: 'Appendix',
    description: 'Supporting materials and references',
    defaultOrder: 9,
    requiredSources: [],
    optional: true,
  },
];
