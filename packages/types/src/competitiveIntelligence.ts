/**
 * Competitive Intelligence Engine V1 Types (Sprint S53)
 *
 * Type definitions for competitor tracking, comparative analytics,
 * overlap analysis, and strategic insights generation.
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum CompetitorTier {
  TIER_1 = 'tier_1', // Direct competitors (same market, similar scale)
  TIER_2 = 'tier_2', // Secondary competitors (adjacent market)
  TIER_3 = 'tier_3', // Emerging competitors (smaller but growing)
  TIER_4 = 'tier_4', // Distant competitors (different market, tangential)
}

export enum CIMetricType {
  MENTION_VOLUME = 'mention_volume',
  COVERAGE_VELOCITY = 'coverage_velocity',
  SENTIMENT_SCORE = 'sentiment_score',
  EVI_SCORE = 'evi_score',
  JOURNALIST_COUNT = 'journalist_count',
  OUTLET_COUNT = 'outlet_count',
  TIER_DISTRIBUTION = 'tier_distribution',
  TOPIC_CLUSTER = 'topic_cluster',
  SHARE_OF_VOICE = 'share_of_voice',
  ESTIMATED_REACH = 'estimated_reach',
  SENTIMENT_STABILITY = 'sentiment_stability',
  JOURNALIST_EXCLUSIVITY = 'journalist_exclusivity',
}

export enum CIInsightCategory {
  ADVANTAGE = 'advantage', // Areas where user brand is winning
  THREAT = 'threat', // Areas where competitor is winning
  OPPORTUNITY = 'opportunity', // Gaps to exploit
  TREND = 'trend', // Emerging patterns
  ANOMALY = 'anomaly', // Unusual activity
  RECOMMENDATION = 'recommendation', // Strategic suggestions
}

export enum SpikeType {
  VOLUME_SPIKE = 'volume_spike',
  SENTIMENT_SHIFT = 'sentiment_shift',
  JOURNALIST_SURGE = 'journalist_surge',
  OUTLET_EXPANSION = 'outlet_expansion',
  TOPIC_EMERGENCE = 'topic_emergence',
}

export enum OverlapType {
  JOURNALIST_OVERLAP = 'journalist_overlap',
  OUTLET_OVERLAP = 'outlet_overlap',
  TOPIC_OVERLAP = 'topic_overlap',
  AUDIENCE_OVERLAP = 'audience_overlap',
}

export enum SnapshotPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// ============================================================================
// NESTED TYPES (for JSONB fields)
// ============================================================================

export interface SocialHandles {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  [key: string]: string | undefined;
}

export interface CISentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface CITierDistribution {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  unknown: number;
}

export interface CIEVIComponents {
  reachScore: number;
  sentimentScore: number;
  tierScore: number;
  frequencyScore: number;
}

export interface CITopJournalist {
  journalistId: string;
  name: string;
  mentionCount: number;
  avgSentiment?: number;
  outletTier?: number;
}

export interface CITopicCluster {
  topic: string;
  keywords: string[];
  mentionCount: number;
  avgSentiment?: number;
}

export interface CISentimentTrend {
  current: number;
  previous: number;
  change: number;
  changePct?: number;
  direction: 'improving' | 'declining' | 'stable' | 'unknown';
  stabilityScore: number;
}

export interface OverlapEntity {
  id: string;
  name: string;
  mentionCount?: number;
  tier?: number;
}

export interface OverlapEntities {
  shared: OverlapEntity[];
  brandExclusive: OverlapEntity[];
  competitorExclusive: OverlapEntity[];
}

// ============================================================================
// DOMAIN MODELS
// ============================================================================

/**
 * Competitor Profile
 */
export interface Competitor {
  id: string;
  orgId: string;

  // Competitor Identity
  name: string;
  domain?: string | null;
  tier: CompetitorTier;
  industry?: string | null;
  description?: string | null;

  // Tracking Configuration
  keywords: string[];
  domains: string[];
  socialHandles?: SocialHandles | null;

  // Metadata
  isActive: boolean;
  trackedSince: Date;
  lastAnalyzedAt?: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual Competitor Mention
 */
export interface CompetitorMention {
  id: string;
  orgId: string;
  competitorId: string;

  // Source Information
  sourceType: string;
  sourceUrl?: string | null;
  publishedAt: Date;

  // Content
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;

  // Metadata
  authorName?: string | null;
  journalistId?: string | null;
  outletName?: string | null;
  outletTier?: number | null;

  // Analysis
  sentimentScore?: number | null;
  topics: string[];
  keywords: string[];
  estimatedReach?: number | null;

  // Matching Info
  matchedKeywords: string[];
  confidenceScore?: number | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Competitor Metrics Snapshot (time-series rollup)
 */
export interface CompetitorMetricsSnapshot {
  id: string;
  orgId: string;
  competitorId: string;

  // Snapshot Metadata
  snapshotAt: Date;
  period: SnapshotPeriod;

  // Volume Metrics
  mentionCount: number;
  articleCount: number;
  journalistCount: number;
  outletCount: number;

  // Sentiment Metrics
  avgSentiment?: number | null;
  sentimentDistribution?: CISentimentDistribution | null;
  sentimentStabilityScore?: number | null;

  // Visibility Metrics
  visibilityScore?: number | null;
  estimatedReach?: number | null;
  shareOfVoice?: number | null;

  // EVI Metrics
  eviScore?: number | null;
  eviComponents?: CIEVIComponents | null;

  // Tier Distribution
  tierDistribution?: CITierDistribution | null;

  // Journalist Relationships
  topJournalists?: CITopJournalist[] | null;
  journalistExclusivityScore?: number | null;

  // Topic Analysis
  topTopics: string[];
  topicClusters?: CITopicCluster[] | null;

  // Comparative Metrics (vs user's brand)
  mentionVolumeDifferential?: number | null;
  sentimentDifferential?: number | null;
  eviDifferential?: number | null;
  coverageVelocityDifferential?: number | null;

  // Anomaly Detection
  hasAnomaly: boolean;
  anomalyType?: SpikeType | null;
  anomalyMagnitude?: number | null;
  anomalyDescription?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Competitor Insight (LLM-generated or rule-based)
 */
export interface CompetitorInsight {
  id: string;
  orgId: string;
  competitorId: string;

  // Insight Metadata
  category: CIInsightCategory;
  title: string;
  description: string;
  recommendation?: string | null;

  // Scoring
  impactScore: number;
  confidenceScore: number;
  priorityScore?: number | null;

  // Supporting Data
  supportingMetrics?: Record<string, any> | null;
  supportingMentions?: string[] | null;
  timeWindowStart?: Date | null;
  timeWindowEnd?: Date | null;

  // LLM Generation
  generatedBy: 'llm' | 'rule' | 'hybrid';
  llmModel?: string | null;
  llmPrompt?: string | null;

  // User Interaction
  isRead: boolean;
  isDismissed: boolean;
  userFeedback?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Competitor Overlap Analysis
 */
export interface CompetitorOverlap {
  id: string;
  orgId: string;
  competitorId: string;

  // Overlap Metadata
  overlapType: OverlapType;
  analyzedAt: Date;
  timeWindowDays: number;

  // Overlap Scoring
  overlapScore: number;
  exclusivityScore?: number | null;

  // Overlap Details
  sharedEntities: OverlapEntity[];
  brandExclusiveEntities?: OverlapEntity[] | null;
  competitorExclusiveEntities?: OverlapEntity[] | null;

  // Counts
  sharedCount: number;
  brandExclusiveCount: number;
  competitorExclusiveCount: number;
  totalEntities: number;

  // Advantage Analysis
  advantageScore?: number | null;
  advantageDescription?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Create Competitor Request
 */
export interface CreateCompetitorRequest {
  name: string;
  domain?: string;
  tier: CompetitorTier;
  industry?: string;
  description?: string;
  keywords: string[];
  domains?: string[];
  socialHandles?: SocialHandles;
}

/**
 * Update Competitor Request
 */
export interface UpdateCompetitorRequest {
  name?: string;
  domain?: string;
  tier?: CompetitorTier;
  industry?: string;
  description?: string;
  keywords?: string[];
  domains?: string[];
  socialHandles?: SocialHandles;
  isActive?: boolean;
}

/**
 * Create Competitor Mention Request
 */
export interface CreateCompetitorMentionRequest {
  competitorId: string;
  sourceType: string;
  sourceUrl?: string;
  publishedAt: Date;
  title?: string;
  content?: string;
  excerpt?: string;
  authorName?: string;
  journalistId?: string;
  outletName?: string;
  outletTier?: number;
  sentimentScore?: number;
  topics?: string[];
  keywords?: string[];
  estimatedReach?: number;
  matchedKeywords: string[];
  confidenceScore?: number;
}

/**
 * Create Competitor Insight Request
 */
export interface CreateCompetitorInsightRequest {
  competitorId: string;
  category: CIInsightCategory;
  title: string;
  description: string;
  recommendation?: string;
  impactScore: number;
  confidenceScore: number;
  priorityScore?: number;
  supportingMetrics?: Record<string, any>;
  supportingMentions?: string[];
  timeWindowStart?: Date;
  timeWindowEnd?: Date;
  generatedBy?: 'llm' | 'rule' | 'hybrid';
  llmModel?: string;
  llmPrompt?: string;
}

/**
 * Update Competitor Insight Request
 */
export interface UpdateCompetitorInsightRequest {
  isRead?: boolean;
  isDismissed?: boolean;
  userFeedback?: string;
}

/**
 * Generate Insight Request
 */
export interface GenerateInsightRequest {
  competitorId: string;
  category: CIInsightCategory;
  timeWindowDays?: number;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface CompetitorFilters {
  tier?: CompetitorTier;
  isActive?: boolean;
  industry?: string;
  trackedSinceStart?: Date;
  trackedSinceEnd?: Date;
}

export interface CompetitorMentionFilters {
  competitorId?: string;
  sourceType?: string;
  publishedStart?: Date;
  publishedEnd?: Date;
  journalistId?: string;
  outletName?: string;
  minSentiment?: number;
  maxSentiment?: number;
  topics?: string[];
}

export interface SnapshotFilters {
  competitorId?: string;
  period?: SnapshotPeriod;
  snapshotStart?: Date;
  snapshotEnd?: Date;
  hasAnomaly?: boolean;
}

export interface CIInsightFilters {
  competitorId?: string;
  category?: CIInsightCategory;
  isRead?: boolean;
  isDismissed?: boolean;
  minImpactScore?: number;
  createdStart?: Date;
  createdEnd?: Date;
}

export interface OverlapFilters {
  competitorId?: string;
  overlapType?: OverlapType;
  analyzedStart?: Date;
  analyzedEnd?: Date;
  minOverlapScore?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface GetCompetitorsResponse {
  competitors: Competitor[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetCompetitorMentionsResponse {
  mentions: CompetitorMention[];
  total: number;
  limit: number;
  offset: number;
}

export interface CIGetSnapshotsResponse {
  snapshots: CompetitorMetricsSnapshot[];
  total: number;
  limit: number;
  offset: number;
}

export interface CIGetInsightsResponse {
  insights: CompetitorInsight[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
}

export interface GetOverlapResponse {
  overlaps: CompetitorOverlap[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Competitor Metrics Summary
 */
export interface CompetitorMetricsSummary {
  competitorId: string;
  competitorName: string;
  tier: CompetitorTier;

  // Latest Metrics
  latestSnapshot?: CompetitorMetricsSnapshot | null;

  // Period Aggregates
  periodStart: Date;
  periodEnd: Date;
  totalMentions: number;
  avgSentiment?: number;
  totalReach?: number;
  avgEviScore?: number;

  // Comparative Metrics
  mentionVolumeDifferential?: number;
  sentimentDifferential?: number;
  eviDifferential?: number;

  // Trends
  sentimentTrend?: CISentimentTrend;
  volumeTrend?: {
    current: number;
    previous: number;
    change: number;
    changePct?: number;
    direction: 'up' | 'down' | 'stable';
  };

  // Anomalies
  recentAnomalies: number;
}

/**
 * Comparative Analytics Response
 */
export interface ComparativeAnalyticsResponse {
  brandMetrics: {
    mentionVolume: number;
    avgSentiment: number;
    eviScore: number;
    visibilityScore: number;
    journalistCount: number;
    outletCount: number;
  };
  competitorMetrics: {
    competitorId: string;
    competitorName: string;
    mentionVolume: number;
    avgSentiment: number;
    eviScore: number;
    visibilityScore: number;
    journalistCount: number;
    outletCount: number;
  };
  differentials: {
    mentionVolume: number; // Brand - Competitor
    sentiment: number;
    evi: number;
    visibility: number;
    journalists: number;
    outlets: number;
  };
  advantageScore: number; // -100 to 100
  advantageAreas: string[];
  threatAreas: string[];
}

/**
 * Overlap Analysis Response
 */
export interface OverlapAnalysisResponse {
  overlapType: OverlapType;
  overlapScore: number;
  exclusivityScore: number;

  shared: OverlapEntity[];
  brandExclusive: OverlapEntity[];
  competitorExclusive: OverlapEntity[];

  sharedCount: number;
  brandExclusiveCount: number;
  competitorExclusiveCount: number;
  totalEntities: number;

  advantageScore: number;
  recommendation: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type CompetitorStatus = 'active' | 'inactive' | 'paused';

export interface CompetitorSummary {
  id: string;
  name: string;
  tier: CompetitorTier;
  isActive: boolean;
  mentionCount: number;
  avgSentiment?: number;
  lastMentionAt?: Date;
}

export interface MentionSummary {
  date: Date;
  count: number;
  avgSentiment?: number;
}

export interface CITrendDataPoint {
  date: Date;
  value: number;
  label?: string;
}
