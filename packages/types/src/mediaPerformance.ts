/**
 * Media Performance Analytics Types (Sprint S52)
 * Unified performance intelligence across S38-S50 PR systems
 */

/**
 * ============================================================================
 * ENUMS
 * ============================================================================
 */

export enum MetricType {
  MENTION_VOLUME = 'mention_volume',
  SENTIMENT_SCORE = 'sentiment_score',
  VISIBILITY_INDEX = 'visibility_index',
  JOURNALIST_IMPACT = 'journalist_impact',
  OUTLET_TIER_DISTRIBUTION = 'outlet_tier_distribution',
  CAMPAIGN_VELOCITY = 'campaign_velocity',
  DELIVERABILITY_RATE = 'deliverability_rate',
  ENGAGEMENT_SCORE = 'engagement_score',
  EVI_SCORE = 'evi_score',
  RESONANCE_METRIC = 'resonance_metric',
}

export enum DimensionType {
  BRAND = 'brand',
  CAMPAIGN = 'campaign',
  JOURNALIST = 'journalist',
  OUTLET_TIER = 'outlet_tier',
  TOPIC_CLUSTER = 'topic_cluster',
  TIME_WINDOW = 'time_window',
  GEOGRAPHY = 'geography',
  SENTIMENT_CATEGORY = 'sentiment_category',
}

export enum ScoreType {
  VISIBILITY = 'visibility',
  SENTIMENT_STABILITY = 'sentiment_stability',
  MOMENTUM = 'momentum',
  JOURNALIST_IMPACT = 'journalist_impact',
  EVI = 'evi',
  RESONANCE = 'resonance',
  OVERALL_PERFORMANCE = 'overall_performance',
}

export enum InsightCategory {
  ACHIEVEMENT = 'achievement',
  ANOMALY = 'anomaly',
  RECOMMENDATION = 'recommendation',
  TREND = 'trend',
  RISK = 'risk',
  OPPORTUNITY = 'opportunity',
}

export enum AggregationPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum SentimentCategory {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive',
}

export type TrendDirection = 'up' | 'down' | 'stable';

// For backward compatibility, provide enum-like constants
export const TrendDirection = {
  UP: 'up' as const,
  DOWN: 'down' as const,
  STABLE: 'stable' as const,
};

export enum AnomalyType {
  SPIKE = 'spike',
  DROP = 'drop',
  OUTLIER = 'outlier',
}

/**
 * ============================================================================
 * CORE DOMAIN INTERFACES
 * ============================================================================
 */

export interface MediaPerformanceSnapshot {
  id: string;
  orgId: string;

  // Temporal
  snapshotAt: Date;
  aggregationPeriod: AggregationPeriod;

  // Dimensions (filters/grouping)
  brandId?: string | null;
  campaignId?: string | null;
  journalistId?: string | null;
  outletTier?: string | null;
  topicCluster?: string | null;

  // Volume Metrics
  mentionCount: number;
  articleCount: number;
  journalistCount: number;
  outletCount: number;

  // Sentiment Metrics
  avgSentiment?: number | null;
  sentimentDistribution?: SentimentDistribution | null;
  sentimentStabilityScore?: number | null;

  // Visibility Metrics
  visibilityScore?: number | null;
  estimatedReach?: number | null;
  shareOfVoice?: number | null;

  // Engagement Metrics
  engagementScore?: number | null;
  pitchSuccessRate?: number | null;
  deliverabilityRate?: number | null;

  // Velocity & EVI
  coverageVelocity?: number | null;
  momentumScore?: number | null;
  eviScore?: number | null;
  eviComponents?: EVIComponents | null;

  // Journalist Impact
  journalistImpactScore?: number | null;
  topJournalists?: TopJournalist[] | null;

  // Tier Distribution
  tierDistribution?: TierDistribution | null;

  // Keywords & Topics
  topKeywords?: KeywordWeight[] | null;
  topicClusters?: TopicCluster[] | null;
  entitiesMentioned?: MediaEntityMention[] | null;

  // Anomalies
  hasAnomaly: boolean;
  anomalyType?: string | null;
  anomalyMagnitude?: number | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface MediaPerformanceDimension {
  id: string;
  orgId: string;

  // Dimension
  dimensionType: DimensionType;
  dimensionValue: string;

  // Time Window
  startDate: Date;
  endDate: Date;

  // Aggregated Metrics
  totalMentions: number;
  uniqueJournalists: number;
  uniqueOutlets: number;
  avgSentiment?: number | null;
  totalReach?: number | null;
  avgVisibilityScore?: number | null;
  avgEngagementScore?: number | null;

  // Rollup Data
  rollupData?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export interface MediaPerformanceScore {
  id: string;
  orgId: string;

  // Entity
  entityType: string;
  entityId: string;

  // Score
  scoreType: ScoreType;
  scoreValue: number;
  scoreComponents?: Record<string, any> | null;

  // Time Window
  calculatedAt: Date;
  windowStartDate: Date;
  windowEndDate: Date;

  // Metadata
  metadata?: Record<string, any> | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface MediaPerformanceInsight {
  id: string;
  orgId: string;

  // Insight
  category: InsightCategory;
  title: string;
  summary: string;
  recommendation?: string | null;

  // LLM Generation
  generatedByLlm: boolean;
  llmModel?: string | null;
  llmPromptVersion?: string | null;

  // Context
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  timeWindowStart?: Date | null;
  timeWindowEnd?: Date | null;

  // Metrics
  impactScore?: number | null;
  confidenceScore?: number | null;
  supportingData?: Record<string, any> | null;

  // Status
  isRead: boolean;
  isDismissed: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * ============================================================================
 * NESTED TYPES
 * ============================================================================
 */

export interface SentimentDistribution {
  veryNegative: number;
  negative: number;
  neutral: number;
  positive: number;
  veryPositive: number;
}

export interface EVIComponents {
  reachScore: number;
  sentimentScore: number;
  tierScore: number;
  frequencyScore: number;
}

export interface TopJournalist {
  journalistId: string;
  journalistName: string;
  mentionCount: number;
  avgSentiment: number;
  impactScore: number;
  outletTier?: string;
}

export interface TierDistribution {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  unknown: number;
}

export interface KeywordWeight {
  keyword: string;
  weight: number;
  frequency: number;
}

export interface TopicCluster {
  clusterId: string;
  clusterName: string;
  mentionCount: number;
  avgSentiment?: number;
  keywords: string[];
}

export interface MediaEntityMention {
  entityType: string;
  entityName: string;
  mentionCount: number;
  sentiment?: number;
}

export interface SentimentTrend {
  changePct: number;
  stabilityScore: number;
  trendDirection: TrendDirection;
  currentSentiment: number;
  previousSentiment: number;
}

export interface AnomalyDetection {
  hasAnomaly: boolean;
  anomalyType?: AnomalyType;
  magnitude: number;
  zScore: number;
}

/**
 * ============================================================================
 * QUERY/FILTER TYPES
 * ============================================================================
 */

export interface MediaPerformanceFilters {
  brandId?: string;
  campaignId?: string;
  journalistId?: string;
  outletTier?: string;
  topicCluster?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  aggregationPeriod?: AggregationPeriod;
  hasAnomaly?: boolean;
  minEviScore?: number;
  minVisibilityScore?: number;
}

export interface DimensionFilters {
  dimensionType?: DimensionType;
  dimensionValue?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface ScoreFilters {
  entityType?: string;
  entityId?: string;
  scoreType?: ScoreType;
  minScore?: number;
  maxScore?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface InsightFilters {
  category?: InsightCategory;
  isRead?: boolean;
  isDismissed?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  minImpactScore?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * ============================================================================
 * API REQUEST TYPES
 * ============================================================================
 */

export interface CreateSnapshotRequest {
  snapshotAt: Date | string;
  aggregationPeriod: AggregationPeriod;
  brandId?: string;
  campaignId?: string;
  journalistId?: string;
  outletTier?: string;
  topicCluster?: string;
  metrics: {
    mentionCount: number;
    articleCount: number;
    journalistCount: number;
    outletCount: number;
    avgSentiment?: number;
    sentimentDistribution?: SentimentDistribution;
    visibilityScore?: number;
    estimatedReach?: number;
    shareOfVoice?: number;
    engagementScore?: number;
    pitchSuccessRate?: number;
    deliverabilityRate?: number;
    coverageVelocity?: number;
    momentumScore?: number;
    eviScore?: number;
    eviComponents?: EVIComponents;
    topJournalists?: TopJournalist[];
    tierDistribution?: TierDistribution;
    topKeywords?: KeywordWeight[];
    topicClusters?: TopicCluster[];
    entitiesMentioned?: MediaEntityMention[];
  };
}

export interface CreateDimensionRequest {
  dimensionType: DimensionType;
  dimensionValue: string;
  startDate: Date | string;
  endDate: Date | string;
  metrics: {
    totalMentions: number;
    uniqueJournalists: number;
    uniqueOutlets: number;
    avgSentiment?: number;
    totalReach?: number;
    avgVisibilityScore?: number;
    avgEngagementScore?: number;
  };
  rollupData?: Record<string, any>;
}

export interface CreateScoreRequest {
  entityType: string;
  entityId: string;
  scoreType: ScoreType;
  scoreValue: number;
  scoreComponents?: Record<string, any>;
  windowStartDate: Date | string;
  windowEndDate: Date | string;
  metadata?: Record<string, any>;
}

export interface CreateInsightRequest {
  category: InsightCategory;
  title: string;
  summary: string;
  recommendation?: string;
  generatedByLlm?: boolean;
  llmModel?: string;
  llmPromptVersion?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  timeWindowStart?: Date | string;
  timeWindowEnd?: Date | string;
  impactScore?: number;
  confidenceScore?: number;
  supportingData?: Record<string, any>;
}

export interface UpdateInsightRequest {
  isRead?: boolean;
  isDismissed?: boolean;
}

/**
 * ============================================================================
 * API RESPONSE TYPES
 * ============================================================================
 */

export interface GetSnapshotsResponse {
  snapshots: MediaPerformanceSnapshot[];
  total: number;
}

export interface GetDimensionsResponse {
  dimensions: MediaPerformanceDimension[];
  total: number;
}

export interface GetScoresResponse {
  scores: MediaPerformanceScore[];
  total: number;
}

export interface GetInsightsResponse {
  insights: MediaPerformanceInsight[];
  total: number;
  unreadCount: number;
}

export interface GetTrendResponse {
  metric: MetricType;
  dataPoints: TrendDataPoint[];
  summary: {
    currentValue: number;
    previousValue: number;
    changePct: number;
    trendDirection: TrendDirection;
    avgValue: number;
    maxValue: number;
    minValue: number;
  };
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface GetAnomaliesResponse {
  anomalies: AnomalySnapshot[];
  total: number;
}

export interface AnomalySnapshot {
  snapshot: MediaPerformanceSnapshot;
  anomalyDetails: AnomalyDetection;
  context: {
    historicalAvg: number;
    historicalStdDev: number;
    threshold: number;
  };
}

export interface GetOverviewResponse {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalMentions: number;
    totalArticles: number;
    totalJournalists: number;
    totalOutlets: number;
    avgSentiment: number;
    estimatedReach: number;
    avgVisibilityScore: number;
    avgEviScore: number;
  };
  trends: {
    mentionsTrend: number;
    sentimentTrend: number;
    visibilityTrend: number;
    eviTrend: number;
  };
  topPerformers: {
    campaigns: TopPerformer[];
    journalists: TopPerformer[];
    topics: TopPerformer[];
  };
  insights: MediaPerformanceInsight[];
}

export interface TopPerformer {
  id: string;
  name: string;
  value: number;
  metric: string;
  change?: number;
}

/**
 * ============================================================================
 * HELPER TYPES
 * ============================================================================
 */

export interface CalculateVisibilityScoreParams {
  estimatedReach: number;
  tierDistribution: TierDistribution;
  mentionCount: number;
  shareOfVoice: number;
}

export interface CalculateSentimentTrendParams {
  orgId: string;
  entityType: string;
  entityId: string;
  windowDays?: number;
}

export interface CalculateJournalistImpactParams {
  journalistId: string;
  orgId: string;
  windowDays?: number;
}

export interface CalculateEVIScoreParams {
  estimatedReach: number;
  avgSentiment: number;
  tierDistribution: TierDistribution;
  mentionCount: number;
}

export interface DetectAnomalyParams {
  currentValue: number;
  historicalAvg: number;
  historicalStdDev: number;
  thresholdSigma?: number;
}

export interface ScoreWeights {
  reach: number;
  sentiment: number;
  tier: number;
  frequency: number;
}

export interface PerformanceMetrics {
  volume: number;
  sentiment: number;
  visibility: number;
  engagement: number;
  momentum: number;
  evi: number;
}
