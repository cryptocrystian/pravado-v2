/**
 * Competitive Intelligence Engine V1 Validators (Sprint S53)
 *
 * Zod schemas for runtime validation of competitive intelligence requests,
 * filters, and data structures.
 */

import { z } from 'zod';

// ============================================================================
// ENUM VALIDATORS
// ============================================================================

export const competitorTierSchema = z.enum(['tier_1', 'tier_2', 'tier_3', 'tier_4']);

export const ciMetricTypeSchema = z.enum([
  'mention_volume',
  'coverage_velocity',
  'sentiment_score',
  'evi_score',
  'journalist_count',
  'outlet_count',
  'tier_distribution',
  'topic_cluster',
  'share_of_voice',
  'estimated_reach',
  'sentiment_stability',
  'journalist_exclusivity',
]);

export const ciInsightCategorySchema = z.enum([
  'advantage',
  'threat',
  'opportunity',
  'trend',
  'anomaly',
  'recommendation',
]);

export const spikeTypeSchema = z.enum([
  'volume_spike',
  'sentiment_shift',
  'journalist_surge',
  'outlet_expansion',
  'topic_emergence',
]);

export const overlapTypeSchema = z.enum([
  'journalist_overlap',
  'outlet_overlap',
  'topic_overlap',
  'audience_overlap',
]);

export const snapshotPeriodSchema = z.enum(['daily', 'weekly', 'monthly']);

// ============================================================================
// NESTED OBJECT VALIDATORS
// ============================================================================

export const socialHandlesSchema = z.object({
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
}).passthrough();

export const ciSentimentDistributionSchema = z.object({
  positive: z.number().int().min(0),
  neutral: z.number().int().min(0),
  negative: z.number().int().min(0),
});

export const ciTierDistributionSchema = z.object({
  tier1: z.number().int().min(0),
  tier2: z.number().int().min(0),
  tier3: z.number().int().min(0),
  tier4: z.number().int().min(0),
  unknown: z.number().int().min(0),
});

export const ciEviComponentsSchema = z.object({
  reachScore: z.number().min(0).max(100),
  sentimentScore: z.number().min(0).max(100),
  tierScore: z.number().min(0).max(100),
  frequencyScore: z.number().min(0).max(100),
});

export const ciTopJournalistSchema = z.object({
  journalistId: z.string().uuid(),
  name: z.string(),
  mentionCount: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1).optional(),
  outletTier: z.number().int().min(1).max(4).optional(),
});

export const ciTopicClusterSchema = z.object({
  topic: z.string(),
  keywords: z.array(z.string()),
  mentionCount: z.number().int().min(0),
  avgSentiment: z.number().min(-1).max(1).optional(),
});

export const overlapEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  mentionCount: z.number().int().min(0).optional(),
  tier: z.number().int().min(1).max(4).optional(),
});

// ============================================================================
// CREATE REQUEST VALIDATORS
// ============================================================================

export const createCompetitorRequestSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().url().optional(),
  tier: competitorTierSchema,
  industry: z.string().max(255).optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).min(1),
  domains: z.array(z.string().url()).optional(),
  socialHandles: socialHandlesSchema.optional(),
});

export const updateCompetitorRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  domain: z.string().url().optional(),
  tier: competitorTierSchema.optional(),
  industry: z.string().max(255).optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  domains: z.array(z.string().url()).optional(),
  socialHandles: socialHandlesSchema.optional(),
  isActive: z.boolean().optional(),
});

export const createCompetitorMentionRequestSchema = z.object({
  competitorId: z.string().uuid(),
  sourceType: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  publishedAt: z.coerce.date(),
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  authorName: z.string().optional(),
  journalistId: z.string().uuid().optional(),
  outletName: z.string().optional(),
  outletTier: z.number().int().min(1).max(4).optional(),
  sentimentScore: z.number().min(-1).max(1).optional(),
  topics: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  estimatedReach: z.number().int().min(0).optional(),
  matchedKeywords: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const createCompetitorInsightRequestSchema = z.object({
  competitorId: z.string().uuid(),
  category: ciInsightCategorySchema,
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  recommendation: z.string().optional(),
  impactScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  priorityScore: z.number().min(0).max(100).optional(),
  supportingMetrics: z.record(z.any()).optional(),
  supportingMentions: z.array(z.string().uuid()).optional(),
  timeWindowStart: z.coerce.date().optional(),
  timeWindowEnd: z.coerce.date().optional(),
  generatedBy: z.enum(['llm', 'rule', 'hybrid']).optional(),
  llmModel: z.string().optional(),
  llmPrompt: z.string().optional(),
});

export const updateCompetitorInsightRequestSchema = z.object({
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
  userFeedback: z.string().optional(),
});

export const generateInsightRequestSchema = z.object({
  competitorId: z.string().uuid(),
  category: ciInsightCategorySchema,
  timeWindowDays: z.number().int().min(1).max(365).optional(),
});

// ============================================================================
// FILTER VALIDATORS
// ============================================================================

export const competitorFiltersSchema = z.object({
  tier: competitorTierSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  industry: z.string().optional(),
  trackedSinceStart: z.coerce.date().optional(),
  trackedSinceEnd: z.coerce.date().optional(),
});

export const competitorMentionFiltersSchema = z.object({
  competitorId: z.string().uuid().optional(),
  sourceType: z.string().optional(),
  publishedStart: z.coerce.date().optional(),
  publishedEnd: z.coerce.date().optional(),
  journalistId: z.string().uuid().optional(),
  outletName: z.string().optional(),
  minSentiment: z.coerce.number().min(-1).max(1).optional(),
  maxSentiment: z.coerce.number().min(-1).max(1).optional(),
  topics: z.array(z.string()).optional(),
});

export const snapshotFiltersSchema = z.object({
  competitorId: z.string().uuid().optional(),
  period: snapshotPeriodSchema.optional(),
  snapshotStart: z.coerce.date().optional(),
  snapshotEnd: z.coerce.date().optional(),
  hasAnomaly: z.coerce.boolean().optional(),
});

export const ciInsightFiltersSchema = z.object({
  competitorId: z.string().uuid().optional(),
  category: ciInsightCategorySchema.optional(),
  isRead: z.coerce.boolean().optional(),
  isDismissed: z.coerce.boolean().optional(),
  minImpactScore: z.coerce.number().min(0).max(100).optional(),
  createdStart: z.coerce.date().optional(),
  createdEnd: z.coerce.date().optional(),
});

export const overlapFiltersSchema = z.object({
  competitorId: z.string().uuid().optional(),
  overlapType: overlapTypeSchema.optional(),
  analyzedStart: z.coerce.date().optional(),
  analyzedEnd: z.coerce.date().optional(),
  minOverlapScore: z.coerce.number().min(0).max(100).optional(),
});

// ============================================================================
// QUERY PARAMETER VALIDATORS
// ============================================================================

export const ciPaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const competitorIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const timeWindowQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  timeWindowDays: z.coerce.number().int().min(1).max(365).optional(),
});

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

export const getCompetitorsQuerySchema = competitorFiltersSchema.merge(ciPaginationQuerySchema);

export const getCompetitorMentionsQuerySchema = competitorMentionFiltersSchema.merge(ciPaginationQuerySchema);

export const getSnapshotsQuerySchema = snapshotFiltersSchema.merge(ciPaginationQuerySchema);

export const getInsightsQuerySchema = ciInsightFiltersSchema.merge(ciPaginationQuerySchema);

export const getOverlapQuerySchema = overlapFiltersSchema.merge(ciPaginationQuerySchema);

export const evaluateCompetitorRequestSchema = z.object({
  competitorId: z.string().uuid(),
  timeWindowDays: z.number().int().min(1).max(365).optional(),
  forceRecompute: z.boolean().optional(),
});

export const comparativeAnalyticsRequestSchema = z.object({
  competitorId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  brandId: z.string().uuid().optional(),
});

export const overlapAnalysisRequestSchema = z.object({
  competitorId: z.string().uuid(),
  overlapType: overlapTypeSchema,
  timeWindowDays: z.number().int().min(1).max(365).optional(),
});
