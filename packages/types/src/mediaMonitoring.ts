/**
 * Media Monitoring & Earned Coverage Types (Sprint S40)
 * Types for media monitoring, article tracking, and earned mention detection
 */

// ========================================
// ENUMS / STATUS TYPES
// ========================================

export type MentionSentiment = 'positive' | 'neutral' | 'negative';

export type SourceType = 'website' | 'rss' | 'api';

export type EntityType = 'brand' | 'product' | 'executive' | 'competitor';

// ========================================
// DATABASE RECORD TYPES
// ========================================

export interface MediaMonitoringSourceRecord {
  id: string;
  org_id: string;
  name: string;
  url: string;
  description: string | null;
  active: boolean;
  source_type: SourceType;
  crawl_frequency_hours: number;
  last_crawled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MediaMonitoringArticleRecord {
  id: string;
  org_id: string;
  source_id: string | null;
  url: string;
  title: string;
  author: string | null;
  published_at: string | null;
  content: string | null;
  summary: string | null;
  embeddings: number[] | null; // vector(1536)
  relevance_score: number;
  keywords: string[];
  domain_authority: number;
  word_count: number;
  language: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EarnedMentionRecord {
  id: string;
  org_id: string;
  article_id: string;
  journalist_id: string | null;
  entity: string;
  entity_type: EntityType;
  snippet: string | null;
  context: string | null;
  sentiment: MentionSentiment;
  confidence: number;
  is_primary_mention: boolean;
  position_in_article: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ========================================
// DOMAIN TYPES (Transformed)
// ========================================

export interface MediaMonitoringSource {
  id: string;
  orgId: string;
  name: string;
  url: string;
  description: string | null;
  active: boolean;
  sourceType: SourceType;
  crawlFrequencyHours: number;
  lastCrawledAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaMonitoringArticle {
  id: string;
  orgId: string;
  sourceId: string | null;
  url: string;
  title: string;
  author: string | null;
  publishedAt: Date | null;
  content: string | null;
  summary: string | null;
  embeddings: number[] | null;
  relevanceScore: number;
  keywords: string[];
  domainAuthority: number;
  wordCount: number;
  language: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EarnedMention {
  id: string;
  orgId: string;
  articleId: string;
  journalistId: string | null;
  entity: string;
  entityType: EntityType;
  snippet: string | null;
  context: string | null;
  sentiment: MentionSentiment;
  confidence: number;
  isPrimaryMention: boolean;
  positionInArticle: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ========================================
// JOINED TYPES
// ========================================

export interface ArticleWithSource extends MediaMonitoringArticle {
  source: MediaMonitoringSource | null;
}

export interface ArticleWithMentions extends MediaMonitoringArticle {
  source: MediaMonitoringSource | null;
  mentions: EarnedMention[];
}

export interface MentionWithArticle extends EarnedMention {
  article: MediaMonitoringArticle;
}

export interface MentionWithJournalist extends EarnedMention {
  journalist: {
    id: string;
    name: string;
    email: string | null;
    beat: string | null;
    outlet: string | null;
  } | null;
}

// ========================================
// INPUT TYPES
// ========================================

export interface CreateSourceInput {
  name: string;
  url: string;
  description?: string;
  sourceType?: SourceType;
  crawlFrequencyHours?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateSourceInput {
  name?: string;
  url?: string;
  description?: string | null;
  active?: boolean;
  sourceType?: SourceType;
  crawlFrequencyHours?: number;
  metadata?: Record<string, unknown>;
}

export interface IngestArticleInput {
  url: string;
  sourceId?: string;
  title?: string;
  author?: string;
  publishedAt?: string;
  content?: string;
}

export interface DetectMentionsInput {
  articleId: string;
  entities: string[]; // brand names, product names, executive names to detect
  detectCompetitors?: boolean;
}

// ========================================
// QUERY TYPES
// ========================================

export interface ListSourcesQuery {
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListArticlesQuery {
  sourceId?: string;
  minRelevance?: number;
  keyword?: string;
  author?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'published_at' | 'relevance_score' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface ListMentionsQuery {
  articleId?: string;
  entity?: string;
  entityType?: EntityType;
  sentiment?: MentionSentiment;
  minConfidence?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'confidence';
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// RESPONSE TYPES
// ========================================

export interface SourceListResponse {
  sources: MediaMonitoringSource[];
  total: number;
  limit: number;
  offset: number;
}

export interface ArticleListResponse {
  articles: ArticleWithSource[];
  total: number;
  limit: number;
  offset: number;
}

export interface MentionListResponse {
  mentions: MentionWithArticle[];
  total: number;
  limit: number;
  offset: number;
}

// ========================================
// RESULT TYPES
// ========================================

export interface ArticleIngestionResult {
  article: MediaMonitoringArticle;
  extracted: {
    title: string;
    author: string | null;
    publishedAt: Date | null;
    content: string;
    summary: string;
    keywords: string[];
    wordCount: number;
  };
  embeddings: {
    generated: boolean;
    dimensions: number;
  };
}

export interface DetectMentionsResult {
  articleId: string;
  mentions: EarnedMention[];
  stats: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    primaryMentions: number;
  };
}

export interface JournalistMatchResult {
  journalistId: string;
  name: string;
  email: string | null;
  beat: string | null;
  outlet: string | null;
  matchScore: number;
  matchReason: string;
}

export interface MediaMonitoringStats {
  totalSources: number;
  activeSources: number;
  totalArticles: number;
  articlesThisWeek: number;
  totalMentions: number;
  mentionsThisWeek: number;
  positiveMentions: number;
  neutralMentions: number;
  negativeMentions: number;
  avgRelevance: number;
}

// ========================================
// TRANSFORM FUNCTIONS
// ========================================

export function transformSourceRecord(record: MediaMonitoringSourceRecord): MediaMonitoringSource {
  return {
    id: record.id,
    orgId: record.org_id,
    name: record.name,
    url: record.url,
    description: record.description,
    active: record.active,
    sourceType: record.source_type,
    crawlFrequencyHours: record.crawl_frequency_hours,
    lastCrawledAt: record.last_crawled_at ? new Date(record.last_crawled_at) : null,
    metadata: record.metadata,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformArticleRecord(record: MediaMonitoringArticleRecord): MediaMonitoringArticle {
  return {
    id: record.id,
    orgId: record.org_id,
    sourceId: record.source_id,
    url: record.url,
    title: record.title,
    author: record.author,
    publishedAt: record.published_at ? new Date(record.published_at) : null,
    content: record.content,
    summary: record.summary,
    embeddings: record.embeddings,
    relevanceScore: record.relevance_score,
    keywords: record.keywords || [],
    domainAuthority: record.domain_authority,
    wordCount: record.word_count,
    language: record.language,
    metadata: record.metadata,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformMentionRecord(record: EarnedMentionRecord): EarnedMention {
  return {
    id: record.id,
    orgId: record.org_id,
    articleId: record.article_id,
    journalistId: record.journalist_id,
    entity: record.entity,
    entityType: record.entity_type,
    snippet: record.snippet,
    context: record.context,
    sentiment: record.sentiment,
    confidence: record.confidence,
    isPrimaryMention: record.is_primary_mention,
    positionInArticle: record.position_in_article,
    metadata: record.metadata,
    createdAt: new Date(record.created_at),
  };
}

// ========================================
// RSS & CRAWLER TYPES (Sprint S41)
// ========================================

export type CrawlJobStatus = 'queued' | 'running' | 'success' | 'failed';

// ========================================
// DATABASE RECORD TYPES (RSS & CRAWLER)
// ========================================

export interface MediaRSSFeedRecord {
  id: string;
  org_id: string;
  source_id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  active: boolean;
  fetch_frequency_hours: number;
  last_fetched_at: string | null;
  last_fetch_error: string | null;
  articles_found: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MediaCrawlJobRecord {
  id: string;
  org_id: string;
  source_id: string | null;
  feed_id: string | null;
  url: string;
  title: string | null;
  published_at: string | null;
  status: CrawlJobStatus;
  run_count: number;
  error: string | null;
  result_article_id: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ========================================
// DOMAIN TYPES (RSS & CRAWLER)
// ========================================

export interface MediaRSSFeed {
  id: string;
  orgId: string;
  sourceId: string | null;
  url: string;
  title: string | null;
  description: string | null;
  active: boolean;
  fetchFrequencyHours: number;
  lastFetchedAt: Date | null;
  lastFetchError: string | null;
  articlesFound: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaCrawlJob {
  id: string;
  orgId: string;
  sourceId: string | null;
  feedId: string | null;
  url: string;
  title: string | null;
  publishedAt: Date | null;
  status: CrawlJobStatus;
  runCount: number;
  error: string | null;
  resultArticleId: string | null;
  processingStartedAt: Date | null;
  processingCompletedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// JOINED TYPES (RSS & CRAWLER)
// ========================================

export interface RSSFeedWithSource extends MediaRSSFeed {
  source: MediaMonitoringSource | null;
}

export interface CrawlJobWithFeed extends MediaCrawlJob {
  feed: MediaRSSFeed | null;
}

export interface CrawlJobWithArticle extends MediaCrawlJob {
  article: MediaMonitoringArticle | null;
}

// ========================================
// INPUT TYPES (RSS & CRAWLER)
// ========================================

export interface CreateRSSFeedInput {
  url: string;
  sourceId?: string;
  title?: string;
  description?: string;
  fetchFrequencyHours?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateRSSFeedInput {
  url?: string;
  sourceId?: string | null;
  title?: string | null;
  description?: string | null;
  active?: boolean;
  fetchFrequencyHours?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateCrawlJobInput {
  url: string;
  sourceId?: string;
  feedId?: string;
  title?: string;
  publishedAt?: string;
  metadata?: Record<string, unknown>;
}

// ========================================
// QUERY TYPES (RSS & CRAWLER)
// ========================================

export interface ListRSSFeedsQuery {
  sourceId?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListCrawlJobsQuery {
  feedId?: string;
  sourceId?: string;
  status?: CrawlJobStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// RESPONSE TYPES (RSS & CRAWLER)
// ========================================

export interface RSSFeedListResponse {
  feeds: RSSFeedWithSource[];
  total: number;
  limit: number;
  offset: number;
}

export interface CrawlJobListResponse {
  jobs: CrawlJobWithFeed[];
  total: number;
  limit: number;
  offset: number;
}

// ========================================
// RESULT TYPES (RSS & CRAWLER)
// ========================================

export interface RSSArticleItem {
  title: string;
  link: string;
  publishedAt: Date | null;
  description: string | null;
  author: string | null;
  guid: string | null;
}

export interface RSSIngestionResult {
  feed: MediaRSSFeed;
  articles: RSSArticleItem[];
  jobsCreated: number;
  errors: string[];
}

export interface CrawlJobResult {
  job: MediaCrawlJob;
  article: MediaMonitoringArticle | null;
  success: boolean;
  error: string | null;
}

export interface RSSFeedStats {
  totalFeeds: number;
  activeFeeds: number;
  totalJobs: number;
  queuedJobs: number;
  runningJobs: number;
  successJobs: number;
  failedJobs: number;
  articlesDiscovered: number;
}

// ========================================
// TRANSFORM FUNCTIONS (RSS & CRAWLER)
// ========================================

export function transformRSSFeedRecord(record: MediaRSSFeedRecord): MediaRSSFeed {
  return {
    id: record.id,
    orgId: record.org_id,
    sourceId: record.source_id,
    url: record.url,
    title: record.title,
    description: record.description,
    active: record.active,
    fetchFrequencyHours: record.fetch_frequency_hours,
    lastFetchedAt: record.last_fetched_at ? new Date(record.last_fetched_at) : null,
    lastFetchError: record.last_fetch_error,
    articlesFound: record.articles_found,
    metadata: record.metadata,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformCrawlJobRecord(record: MediaCrawlJobRecord): MediaCrawlJob {
  return {
    id: record.id,
    orgId: record.org_id,
    sourceId: record.source_id,
    feedId: record.feed_id,
    url: record.url,
    title: record.title,
    publishedAt: record.published_at ? new Date(record.published_at) : null,
    status: record.status,
    runCount: record.run_count,
    error: record.error,
    resultArticleId: record.result_article_id,
    processingStartedAt: record.processing_started_at
      ? new Date(record.processing_started_at)
      : null,
    processingCompletedAt: record.processing_completed_at
      ? new Date(record.processing_completed_at)
      : null,
    metadata: record.metadata,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

// ========================================
// MEDIA ALERTS & SMART SIGNALS (SPRINT S43)
// ========================================

// Alert type enum
export type MediaAlertType =
  | 'mention_match'
  | 'volume_spike'
  | 'sentiment_shift'
  | 'tier_coverage';

export const MEDIA_ALERT_TYPES: readonly MediaAlertType[] = [
  'mention_match',
  'volume_spike',
  'sentiment_shift',
  'tier_coverage',
] as const;

// Alert severity enum
export type MediaAlertSeverity = 'info' | 'warning' | 'critical';

export const MEDIA_ALERT_SEVERITIES: readonly MediaAlertSeverity[] = [
  'info',
  'warning',
  'critical',
] as const;

// ========================================
// DATABASE RECORD TYPES (ALERTS)
// ========================================

export interface MediaAlertRuleRecord {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  alert_type: MediaAlertType;
  brand_terms: string[] | null;
  competitor_terms: string[] | null;
  journalist_ids: string[] | null;
  outlet_ids: string[] | null;
  min_sentiment: number | null;
  max_sentiment: number | null;
  min_mentions: number | null;
  time_window_minutes: number | null;
  min_relevance: number | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAlertEventRecord {
  id: string;
  org_id: string;
  rule_id: string;
  triggered_at: string;
  alert_type: MediaAlertType;
  severity: MediaAlertSeverity;
  article_id: string | null;
  mention_id: string | null;
  journalist_id: string | null;
  outlet_id: string | null;
  summary: string;
  details: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// DOMAIN TYPES (ALERTS)
// ========================================

export interface MediaAlertRule {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  alertType: MediaAlertType;
  brandTerms: string[] | null;
  competitorTerms: string[] | null;
  journalistIds: string[] | null;
  outletIds: string[] | null;
  minSentiment: number | null;
  maxSentiment: number | null;
  minMentions: number | null;
  timeWindowMinutes: number | null;
  minRelevance: number | null;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAlertEvent {
  id: string;
  orgId: string;
  ruleId: string;
  triggeredAt: Date;
  alertType: MediaAlertType;
  severity: MediaAlertSeverity;
  articleId: string | null;
  mentionId: string | null;
  journalistId: string | null;
  outletId: string | null;
  summary: string;
  details: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// JOINED TYPES (ALERTS)
// ========================================

export interface MediaAlertEventWithContext extends MediaAlertEvent {
  ruleName: string;
  article: MediaMonitoringArticle | null;
  mention: EarnedMention | null;
  source: MediaMonitoringSource | null;
  /** Alias for id for backwards compatibility */
  eventId?: string;
}

export interface MediaAlertRuleSummary extends MediaAlertRule {
  totalEvents: number;
  unreadEvents: number;
  lastEventAt: Date | null;
}

// ========================================
// INPUT TYPES (ALERTS)
// ========================================

export interface CreateMediaAlertRuleInput {
  name: string;
  description?: string;
  isActive?: boolean;
  alertType: MediaAlertType;
  brandTerms?: string[];
  competitorTerms?: string[];
  journalistIds?: string[];
  outletIds?: string[];
  minSentiment?: number;
  maxSentiment?: number;
  minMentions?: number;
  timeWindowMinutes?: number;
  minRelevance?: number;
}

export interface UpdateMediaAlertRuleInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  alertType?: MediaAlertType; // Allow changing alert type
  brandTerms?: string[] | null;
  competitorTerms?: string[] | null;
  journalistIds?: string[] | null;
  outletIds?: string[] | null;
  minSentiment?: number | null;
  maxSentiment?: number | null;
  minMentions?: number | null;
  timeWindowMinutes?: number | null;
  minRelevance?: number | null;
}

// ========================================
// QUERY TYPES (ALERTS)
// ========================================

export interface ListMediaAlertRulesQuery {
  alertType?: MediaAlertType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'name' | 'last_triggered_at';
  sortOrder?: 'asc' | 'desc';
}

export interface ListMediaAlertEventsQuery {
  ruleId?: string;
  alertType?: MediaAlertType;
  severity?: MediaAlertSeverity;
  isRead?: boolean;
  startDate?: string; // ISO datetime
  endDate?: string; // ISO datetime
  limit?: number;
  offset?: number;
  sortBy?: 'triggered_at' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

export interface MarkAlertEventsReadInput {
  eventIds: string[];
  isRead: boolean;
}

// ========================================
// RESPONSE TYPES (ALERTS)
// ========================================

export interface MediaAlertRuleListResponse {
  rules: MediaAlertRule[]; // Basic list returns full rules
  total: number;
  limit: number;
  offset: number;
}

export interface MediaAlertEventListResponse {
  events: MediaAlertEvent[]; // Basic list returns full events
  total: number;
  limit: number;
  offset: number;
}

export interface MediaAlertSignalsOverview {
  stats: {
    totalRules: number;
    activeRules: number;
    totalEvents: number;
    unreadEvents: number;
    criticalEvents24h: number;
    warningEvents24h: number;
    infoEvents24h: number;
  };
  recentEvents: MediaAlertEventWithContext[]; // Context needed for signals overview
  topAlertTypes: Array<{
    alertType: MediaAlertType;
    count: number;
  }>;
}

// ========================================
// TRANSFORM FUNCTIONS (ALERTS)
// ========================================

export function transformMediaAlertRuleRecord(record: MediaAlertRuleRecord): MediaAlertRule {
  return {
    id: record.id,
    orgId: record.org_id,
    name: record.name,
    description: record.description,
    isActive: record.is_active,
    alertType: record.alert_type,
    brandTerms: record.brand_terms,
    competitorTerms: record.competitor_terms,
    journalistIds: record.journalist_ids,
    outletIds: record.outlet_ids,
    minSentiment: record.min_sentiment,
    maxSentiment: record.max_sentiment,
    minMentions: record.min_mentions,
    timeWindowMinutes: record.time_window_minutes,
    minRelevance: record.min_relevance,
    lastTriggeredAt: record.last_triggered_at ? new Date(record.last_triggered_at) : null,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformMediaAlertEventRecord(record: MediaAlertEventRecord): MediaAlertEvent {
  return {
    id: record.id,
    orgId: record.org_id,
    ruleId: record.rule_id,
    triggeredAt: new Date(record.triggered_at),
    alertType: record.alert_type,
    severity: record.severity,
    articleId: record.article_id,
    mentionId: record.mention_id,
    journalistId: record.journalist_id,
    outletId: record.outlet_id,
    summary: record.summary,
    details: record.details,
    isRead: record.is_read,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}
