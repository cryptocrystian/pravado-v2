/**
 * Media Monitoring & Earned Coverage Validators (Sprint S40)
 * Zod schemas for media monitoring, article tracking, and mention detection validation
 */

import { z } from 'zod';

// ========================================
// ENUM SCHEMAS
// ========================================

export const mentionSentimentSchema = z.enum(['positive', 'neutral', 'negative']);

export const sourceTypeSchema = z.enum(['website', 'rss', 'api']);

export const entityTypeSchema = z.enum(['brand', 'product', 'executive', 'competitor']);

// ========================================
// SOURCE SCHEMAS
// ========================================

export const createSourceSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url().max(2048),
  description: z.string().max(1000).optional(),
  sourceType: sourceTypeSchema.optional().default('website'),
  crawlFrequencyHours: z.number().int().min(1).max(168).optional().default(24), // 1 hour to 1 week
  metadata: z.record(z.unknown()).optional(),
});

export const updateSourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().max(2048).optional(),
  description: z.string().max(1000).optional().nullable(),
  active: z.boolean().optional(),
  sourceType: sourceTypeSchema.optional(),
  crawlFrequencyHours: z.number().int().min(1).max(168).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listSourcesSchema = z.object({
  active: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
});

// ========================================
// ARTICLE SCHEMAS
// ========================================

export const ingestArticleSchema = z.object({
  url: z.string().url().max(2048),
  sourceId: z.string().uuid().optional(),
  title: z.string().max(500).optional(),
  author: z.string().max(255).optional(),
  publishedAt: z.string().datetime().optional(),
  content: z.string().max(100000).optional(), // 100KB max content
});

export const listArticlesSchema = z.object({
  sourceId: z.string().uuid().optional(),
  minRelevance: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).max(1).optional()),
  keyword: z.string().max(255).optional(),
  author: z.string().max(255).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  sortBy: z.enum(['published_at', 'relevance_score', 'created_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ========================================
// MENTION SCHEMAS
// ========================================

export const detectMentionsInputSchema = z.object({
  articleId: z.string().uuid(),
  entities: z.array(z.string().min(1).max(255)).min(1).max(50),
  detectCompetitors: z.boolean().optional().default(false),
});

export const listMentionsSchema = z.object({
  articleId: z.string().uuid().optional(),
  entity: z.string().max(255).optional(),
  entityType: entityTypeSchema.optional(),
  sentiment: mentionSentimentSchema.optional(),
  minConfidence: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).max(1).optional()),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  sortBy: z.enum(['created_at', 'confidence']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
export type ListSourcesQuery = z.infer<typeof listSourcesSchema>;
export type IngestArticleInput = z.infer<typeof ingestArticleSchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesSchema>;
export type DetectMentionsInput = z.infer<typeof detectMentionsInputSchema>;
export type ListMentionsQuery = z.infer<typeof listMentionsSchema>;

// ========================================
// RSS & CRAWLER VALIDATORS (Sprint S41)
// ========================================

/**
 * Create RSS feed input schema
 */
export const createRSSFeedSchema = z.object({
  url: z.string().url('Invalid URL format'),
  sourceId: z.string().uuid().optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  fetchFrequencyHours: z.number().int().min(1).max(168).optional().default(6),
  metadata: z.record(z.unknown()).optional().default({}),
});

/**
 * Update RSS feed input schema
 */
export const updateRSSFeedSchema = z.object({
  url: z.string().url('Invalid URL format').optional(),
  sourceId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(500).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  active: z.boolean().optional(),
  fetchFrequencyHours: z.number().int().min(1).max(168).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * List RSS feeds query schema
 */
export const listRSSFeedsSchema = z.object({
  sourceId: z.string().uuid().optional(),
  active: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('50'),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional()
    .default('0'),
});

/**
 * Create crawl job input schema
 */
export const createCrawlJobSchema = z.object({
  url: z.string().url('Invalid URL format'),
  sourceId: z.string().uuid().optional(),
  feedId: z.string().uuid().optional(),
  title: z.string().max(500).optional(),
  publishedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

/**
 * List crawl jobs query schema
 */
export const listCrawlJobsSchema = z.object({
  feedId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  status: z.enum(['queued', 'running', 'success', 'failed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('50'),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional()
    .default('0'),
  sortBy: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Manual RSS fetch trigger schema
 */
export const triggerRSSFetchSchema = z.object({
  feedIds: z.array(z.string().uuid()).optional(),
});

// ========================================
// TYPE EXPORTS (RSS & CRAWLER)
// ========================================

export type CreateRSSFeedInput = z.infer<typeof createRSSFeedSchema>;
export type UpdateRSSFeedInput = z.infer<typeof updateRSSFeedSchema>;
export type ListRSSFeedsQuery = z.infer<typeof listRSSFeedsSchema>;
export type CreateCrawlJobInput = z.infer<typeof createCrawlJobSchema>;
export type ListCrawlJobsQuery = z.infer<typeof listCrawlJobsSchema>;
export type TriggerRSSFetchInput = z.infer<typeof triggerRSSFetchSchema>;

// ========================================
// MEDIA ALERTS VALIDATORS (Sprint S43)
// ========================================

/**
 * Alert type enum schema
 */
export const mediaAlertTypeSchema = z.enum([
  'mention_match',
  'volume_spike',
  'sentiment_shift',
  'tier_coverage',
]);

/**
 * Alert severity enum schema
 */
export const mediaAlertSeveritySchema = z.enum(['info', 'warning', 'critical']);

/**
 * Create media alert rule input schema
 */
export const createMediaAlertRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional().default(true),
  alertType: mediaAlertTypeSchema,

  // Filter fields (all optional, used depending on alert_type)
  brandTerms: z.array(z.string().min(1).max(255)).max(50).optional(),
  competitorTerms: z.array(z.string().min(1).max(255)).max(50).optional(),
  journalistIds: z.array(z.string().uuid()).max(100).optional(),
  outletIds: z.array(z.string().uuid()).max(100).optional(),
  minSentiment: z.number().min(-1).max(1).optional(),
  maxSentiment: z.number().min(-1).max(1).optional(),
  minMentions: z.number().int().min(1).max(1000).optional(),
  timeWindowMinutes: z.number().int().min(1).max(10080).optional(), // Max 1 week
  minRelevance: z.number().min(0).max(100).optional(),
});

/**
 * Update media alert rule input schema
 */
export const updateMediaAlertRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  alertType: mediaAlertTypeSchema.optional(),

  // Filter fields
  brandTerms: z.array(z.string().min(1).max(255)).max(50).nullable().optional(),
  competitorTerms: z.array(z.string().min(1).max(255)).max(50).nullable().optional(),
  journalistIds: z.array(z.string().uuid()).max(100).nullable().optional(),
  outletIds: z.array(z.string().uuid()).max(100).nullable().optional(),
  minSentiment: z.number().min(-1).max(1).nullable().optional(),
  maxSentiment: z.number().min(-1).max(1).nullable().optional(),
  minMentions: z.number().int().min(1).max(1000).nullable().optional(),
  timeWindowMinutes: z.number().int().min(1).max(10080).nullable().optional(),
  minRelevance: z.number().min(0).max(100).nullable().optional(),
});

/**
 * List media alert rules query schema
 */
export const listMediaAlertRulesQuerySchema = z.object({
  alertType: mediaAlertTypeSchema.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  sortBy: z.enum(['created_at', 'name', 'last_triggered_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * List media alert events query schema
 */
export const listMediaAlertEventsQuerySchema = z.object({
  ruleId: z.string().uuid().optional(),
  alertType: mediaAlertTypeSchema.optional(),
  severity: mediaAlertSeveritySchema.optional(),
  isRead: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  sortBy: z.enum(['triggered_at', 'severity']).optional().default('triggered_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Mark alert events as read schema
 */
export const markAlertEventsReadSchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1).max(100),
  isRead: z.boolean().default(true),
});

// ========================================
// TYPE EXPORTS (MEDIA ALERTS)
// ========================================

export type CreateMediaAlertRuleInput = z.infer<typeof createMediaAlertRuleSchema>;
export type UpdateMediaAlertRuleInput = z.infer<typeof updateMediaAlertRuleSchema>;
export type ListMediaAlertRulesQuery = z.infer<typeof listMediaAlertRulesQuerySchema>;
export type ListMediaAlertEventsQuery = z.infer<typeof listMediaAlertEventsQuerySchema>;
export type MarkAlertEventsReadInput = z.infer<typeof markAlertEventsReadSchema>;
