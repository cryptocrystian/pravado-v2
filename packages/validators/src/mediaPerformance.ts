/**
 * Media Performance Analytics Validators (Sprint S52)
 * Zod schemas for runtime validation of media performance inputs
 */

import { z } from 'zod';
import {
  MetricType,
  DimensionType,
  ScoreType,
  InsightCategory,
  AggregationPeriod,
  SentimentCategory,
  TrendDirection,
  AnomalyType,
} from '@pravado/types';

/**
 * ============================================================================
 * ENUM VALIDATORS
 * ============================================================================
 */

export const metricTypeSchema = z.nativeEnum(MetricType);
export const dimensionTypeSchema = z.nativeEnum(DimensionType);
export const scoreTypeSchema = z.nativeEnum(ScoreType);
export const insightCategorySchema = z.nativeEnum(InsightCategory);
export const aggregationPeriodSchema = z.nativeEnum(AggregationPeriod);
export const sentimentCategorySchema = z.nativeEnum(SentimentCategory);
export const trendDirectionSchema = z.nativeEnum(TrendDirection);
export const anomalyTypeSchema = z.nativeEnum(AnomalyType);

/**
 * ============================================================================
 * NESTED OBJECT VALIDATORS
 * ============================================================================
 */

export const sentimentDistributionSchema = z.object({
  veryNegative: z.number().min(0),
  negative: z.number().min(0),
  neutral: z.number().min(0),
  positive: z.number().min(0),
  veryPositive: z.number().min(0),
});

export const eviComponentsSchema = z.object({
  reachScore: z.number().min(0).max(100),
  sentimentScore: z.number().min(0).max(100),
  tierScore: z.number().min(0).max(100),
  frequencyScore: z.number().min(0).max(100),
});

export const topJournalistSchema = z.object({
  journalistId: z.string().uuid(),
  journalistName: z.string(),
  mentionCount: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1),
  impactScore: z.number().min(0).max(100),
  outletTier: z.string().optional(),
});

export const tierDistributionSchema = z.object({
  tier1: z.number().min(0),
  tier2: z.number().min(0),
  tier3: z.number().min(0),
  tier4: z.number().min(0),
  unknown: z.number().min(0),
});

export const keywordWeightSchema = z.object({
  keyword: z.string(),
  weight: z.number().min(0).max(1),
  frequency: z.number().int().min(1),
});

export const topicClusterSchema = z.object({
  clusterId: z.string(),
  clusterName: z.string(),
  mentionCount: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1).optional(),
  keywords: z.array(z.string()),
});

export const entityMentionSchema = z.object({
  entityType: z.string(),
  entityName: z.string(),
  mentionCount: z.number().int().min(0),
  sentiment: z.number().min(-1).max(1).optional(),
});

/**
 * ============================================================================
 * QUERY/FILTER VALIDATORS
 * ============================================================================
 */

export const mediaPerformanceFiltersSchema = z.object({
  brandId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  journalistId: z.string().uuid().optional(),
  outletTier: z.string().optional(),
  topicCluster: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  aggregationPeriod: aggregationPeriodSchema.optional(),
  hasAnomaly: z.boolean().optional(),
  minEviScore: z.number().min(0).max(100).optional(),
  minVisibilityScore: z.number().min(0).max(100).optional(),
});

export const dimensionFiltersSchema = z.object({
  dimensionType: dimensionTypeSchema.optional(),
  dimensionValue: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const scoreFiltersSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  scoreType: scoreTypeSchema.optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const insightFiltersSchema = z.object({
  category: insightCategorySchema.optional(),
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
  minImpactScore: z.number().min(0).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * ============================================================================
 * CREATE REQUEST VALIDATORS
 * ============================================================================
 */

export const createSnapshotRequestSchema = z.object({
  snapshotAt: z.coerce.date(),
  aggregationPeriod: aggregationPeriodSchema,
  brandId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  journalistId: z.string().uuid().optional(),
  outletTier: z.string().optional(),
  topicCluster: z.string().optional(),
  metrics: z.object({
    mentionCount: z.number().int().min(0),
    articleCount: z.number().int().min(0),
    journalistCount: z.number().int().min(0),
    outletCount: z.number().int().min(0),
    avgSentiment: z.number().min(-1).max(1).optional(),
    sentimentDistribution: sentimentDistributionSchema.optional(),
    visibilityScore: z.number().min(0).max(100).optional(),
    estimatedReach: z.number().int().min(0).optional(),
    shareOfVoice: z.number().min(0).max(100).optional(),
    engagementScore: z.number().min(0).max(100).optional(),
    pitchSuccessRate: z.number().min(0).max(100).optional(),
    deliverabilityRate: z.number().min(0).max(100).optional(),
    coverageVelocity: z.number().min(0).optional(),
    momentumScore: z.number().min(0).max(100).optional(),
    eviScore: z.number().min(0).max(100).optional(),
    eviComponents: eviComponentsSchema.optional(),
    topJournalists: z.array(topJournalistSchema).optional(),
    tierDistribution: tierDistributionSchema.optional(),
    topKeywords: z.array(keywordWeightSchema).optional(),
    topicClusters: z.array(topicClusterSchema).optional(),
    entitiesMentioned: z.array(entityMentionSchema).optional(),
  }),
});

export const createDimensionRequestSchema = z.object({
  dimensionType: dimensionTypeSchema,
  dimensionValue: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  metrics: z.object({
    totalMentions: z.number().int().min(0),
    uniqueJournalists: z.number().int().min(0),
    uniqueOutlets: z.number().int().min(0),
    avgSentiment: z.number().min(-1).max(1).optional(),
    totalReach: z.number().int().min(0).optional(),
    avgVisibilityScore: z.number().min(0).max(100).optional(),
    avgEngagementScore: z.number().min(0).max(100).optional(),
  }),
  rollupData: z.record(z.any()).optional(),
});

export const createScoreRequestSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  scoreType: scoreTypeSchema,
  scoreValue: z.number().min(0).max(100),
  scoreComponents: z.record(z.any()).optional(),
  windowStartDate: z.coerce.date(),
  windowEndDate: z.coerce.date(),
  metadata: z.record(z.any()).optional(),
});

export const createInsightRequestSchema = z.object({
  category: insightCategorySchema,
  title: z.string().min(1).max(255),
  summary: z.string().min(1),
  recommendation: z.string().optional(),
  generatedByLlm: z.boolean().default(false),
  llmModel: z.string().optional(),
  llmPromptVersion: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
  timeWindowStart: z.coerce.date().optional(),
  timeWindowEnd: z.coerce.date().optional(),
  impactScore: z.number().min(0).max(100).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  supportingData: z.record(z.any()).optional(),
});

export const updateInsightRequestSchema = z.object({
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
});

/**
 * ============================================================================
 * CALCULATION PARAM VALIDATORS
 * ============================================================================
 */

export const calculateVisibilityScoreParamsSchema = z.object({
  estimatedReach: z.number().int().min(0),
  tierDistribution: tierDistributionSchema,
  mentionCount: z.number().int().min(0),
  shareOfVoice: z.number().min(0).max(100),
});

export const calculateSentimentTrendParamsSchema = z.object({
  orgId: z.string().uuid(),
  entityType: z.string().min(1),
  entityId: z.string(),
  windowDays: z.number().int().min(1).max(365).default(30),
});

export const calculateJournalistImpactParamsSchema = z.object({
  journalistId: z.string().uuid(),
  orgId: z.string().uuid(),
  windowDays: z.number().int().min(1).max(365).default(90),
});

export const calculateEVIScoreParamsSchema = z.object({
  estimatedReach: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1),
  tierDistribution: tierDistributionSchema,
  mentionCount: z.number().int().min(0),
});

export const detectAnomalyParamsSchema = z.object({
  currentValue: z.number(),
  historicalAvg: z.number(),
  historicalStdDev: z.number().min(0),
  thresholdSigma: z.number().positive().default(2.0),
});

/**
 * ============================================================================
 * COMPOSITE VALIDATORS
 * ============================================================================
 */

export const getTrendRequestSchema = z.object({
  metric: metricTypeSchema,
  filters: mediaPerformanceFiltersSchema.optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

export const getAnomaliesRequestSchema = z.object({
  filters: mediaPerformanceFiltersSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const getOverviewRequestSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  brandId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
});
