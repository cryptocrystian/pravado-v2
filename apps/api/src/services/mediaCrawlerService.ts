/**
 * Media Crawler Service (Sprint S41)
 * Automated media ingestion pipeline with RSS feeds and crawl jobs
 *
 * Features:
 * - RSS feed management
 * - RSS XML parsing (stub)
 * - Crawl job queue management
 * - HTML content extraction (stub)
 * - Integration with S40 ingestion pipeline
 * - Retry logic with exponential backoff
 */

import type {
  CreateCrawlJobInput,
  CreateRSSFeedInput,
  CrawlJobListResponse,
  CrawlJobResult,
  CrawlJobStatus,
  CrawlJobWithFeed,
  ListCrawlJobsQuery,
  ListRSSFeedsQuery,
  MediaCrawlJob,
  MediaCrawlJobRecord,
  MediaRSSFeed,
  MediaRSSFeedRecord,
  RSSArticleItem,
  RSSFeedListResponse,
  RSSFeedStats,
  RSSFeedWithSource,
  RSSIngestionResult,
  UpdateRSSFeedInput,
} from '@pravado/types';
import {
  transformCrawlJobRecord,
  transformRSSFeedRecord,
  transformSourceRecord,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { MediaMonitoringService } from './mediaMonitoringService';

// ========================================
// SERVICE CONFIGURATION
// ========================================

export interface MediaCrawlerConfig {
  supabase: SupabaseClient;
  monitoringService: MediaMonitoringService;
  maxRetries?: number;
  retryDelayMs?: number;
  debugMode?: boolean;
}

// ========================================
// MEDIA CRAWLER SERVICE
// ========================================

export class MediaCrawlerService {
  private readonly supabase: SupabaseClient;
  private readonly monitoringService: MediaMonitoringService;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly debugMode: boolean;

  constructor(config: MediaCrawlerConfig) {
    this.supabase = config.supabase;
    this.monitoringService = config.monitoringService;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 5000;
    this.debugMode = config.debugMode ?? false;
  }

  // ========================================
  // RSS FEED MANAGEMENT
  // ========================================

  /**
   * Add a new RSS feed
   */
  async addRSSFeed(orgId: string, input: CreateRSSFeedInput): Promise<MediaRSSFeed> {
    if (this.debugMode) {
      console.log('[MediaCrawler] Adding RSS feed:', { orgId, url: input.url });
    }

    const { data, error } = await this.supabase
      .from('media_rss_feeds')
      .insert({
        org_id: orgId,
        source_id: input.sourceId || null,
        url: input.url,
        title: input.title || null,
        description: input.description || null,
        fetch_frequency_hours: input.fetchFrequencyHours ?? 6,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('RSS feed URL already exists for this organization');
      }
      throw new Error(`Failed to add RSS feed: ${error.message}`);
    }

    return transformRSSFeedRecord(data as MediaRSSFeedRecord);
  }

  /**
   * List RSS feeds
   */
  async listRSSFeeds(orgId: string, query?: ListRSSFeedsQuery): Promise<RSSFeedListResponse> {
    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;

    let queryBuilder = this.supabase
      .from('media_rss_feeds')
      .select('*, media_monitoring_sources(*)', { count: 'exact' })
      .eq('org_id', orgId);

    if (query?.sourceId) {
      queryBuilder = queryBuilder.eq('source_id', query.sourceId);
    }

    if (query?.active !== undefined) {
      queryBuilder = queryBuilder.eq('active', query.active);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list RSS feeds: ${error.message}`);
    }

    const feeds: RSSFeedWithSource[] = (data || []).map((record: any) => {
      const feed = transformRSSFeedRecord(record as MediaRSSFeedRecord);
      return {
        ...feed,
        source: record.media_monitoring_sources
          ? transformSourceRecord(record.media_monitoring_sources)
          : null,
      };
    });

    return {
      feeds,
      total: count ?? 0,
      limit,
      offset,
    };
  }

  /**
   * Get a single RSS feed
   */
  async getRSSFeed(orgId: string, feedId: string): Promise<MediaRSSFeed | null> {
    const { data, error } = await this.supabase
      .from('media_rss_feeds')
      .select()
      .eq('id', feedId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get RSS feed: ${error.message}`);
    }

    return transformRSSFeedRecord(data as MediaRSSFeedRecord);
  }

  /**
   * Update an RSS feed
   */
  async updateRSSFeed(
    orgId: string,
    feedId: string,
    input: UpdateRSSFeedInput
  ): Promise<MediaRSSFeed> {
    const updateData: {
      url?: string;
      source_id?: string | null;
      title?: string | null;
      description?: string | null;
      active?: boolean;
      fetch_frequency_hours?: number;
      metadata?: Record<string, unknown>;
    } = {};

    if (input.url !== undefined) updateData.url = input.url;
    if (input.sourceId !== undefined) updateData.source_id = input.sourceId;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.active !== undefined) updateData.active = input.active;
    if (input.fetchFrequencyHours !== undefined)
      updateData.fetch_frequency_hours = input.fetchFrequencyHours;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from('media_rss_feeds')
      .update(updateData)
      .eq('id', feedId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update RSS feed: ${error.message}`);
    }

    return transformRSSFeedRecord(data as MediaRSSFeedRecord);
  }

  /**
   * Deactivate an RSS feed
   */
  async deactivateRSSFeed(orgId: string, feedId: string): Promise<void> {
    const { error } = await this.supabase
      .from('media_rss_feeds')
      .update({ active: false })
      .eq('id', feedId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to deactivate RSS feed: ${error.message}`);
    }
  }

  // ========================================
  // RSS FETCHER (STUB)
  // ========================================

  /**
   * Fetch and parse RSS feed (stub implementation)
   * In production, this would use a real HTTP client and XML parser
   */
  async fetchRSS(feedUrl: string): Promise<RSSArticleItem[]> {
    if (this.debugMode) {
      console.log('[MediaCrawler] Fetching RSS feed:', feedUrl);
    }

    // Stub: Generate deterministic mock articles based on URL
    const articles: RSSArticleItem[] = [];
    const urlHash = this.hashString(feedUrl);
    const count = (urlHash % 5) + 3; // 3-7 articles

    for (let i = 0; i < count; i++) {
      const articleHash = this.hashString(`${feedUrl}-${i}`);
      const daysAgo = articleHash % 7;

      articles.push({
        title: `Article ${i + 1} from ${new URL(feedUrl).hostname}`,
        link: `${new URL(feedUrl).origin}/article-${articleHash}`,
        publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        description: `This is a stub description for article ${i + 1}. In production, this would contain the actual RSS feed description.`,
        author: articleHash % 3 === 0 ? `Author ${(articleHash % 10) + 1}` : null,
        guid: `article-${articleHash}`,
      });
    }

    return articles;
  }

  /**
   * Parse RSS XML content (stub)
   * In production, use libraries like fast-xml-parser or xml2js
   * Commented out as currently unused - will be implemented when real HTTP fetching is added
   */
  // private parseRSSXML(_xmlContent: string): RSSArticleItem[] {
  //   // Stub implementation - in production, parse real XML
  //   return [];
  // }

  /**
   * Normalize article URL
   */
  private normalizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove tracking parameters
      parsed.searchParams.delete('utm_source');
      parsed.searchParams.delete('utm_medium');
      parsed.searchParams.delete('utm_campaign');
      parsed.searchParams.delete('utm_content');
      parsed.searchParams.delete('utm_term');
      // Remove trailing slash
      return parsed.toString().replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  // ========================================
  // CRAWL JOB MANAGEMENT
  // ========================================

  /**
   * Create a crawl job
   */
  async createCrawlJob(orgId: string, input: CreateCrawlJobInput): Promise<MediaCrawlJob> {
    const normalizedUrl = this.normalizeURL(input.url);

    if (this.debugMode) {
      console.log('[MediaCrawler] Creating crawl job:', { orgId, url: normalizedUrl });
    }

    // Check if job already exists for this URL
    const { data: existing } = await this.supabase
      .from('media_crawl_jobs')
      .select()
      .eq('org_id', orgId)
      .eq('url', normalizedUrl)
      .single();

    if (existing) {
      if (this.debugMode) {
        console.log('[MediaCrawler] Crawl job already exists:', existing.id);
      }
      return transformCrawlJobRecord(existing as MediaCrawlJobRecord);
    }

    const { data, error } = await this.supabase
      .from('media_crawl_jobs')
      .insert({
        org_id: orgId,
        source_id: input.sourceId || null,
        feed_id: input.feedId || null,
        url: normalizedUrl,
        title: input.title || null,
        published_at: input.publishedAt || null,
        status: 'queued',
        run_count: 0,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Race condition - job was created by another process
        const { data: raceData } = await this.supabase
          .from('media_crawl_jobs')
          .select()
          .eq('org_id', orgId)
          .eq('url', normalizedUrl)
          .single();

        if (raceData) {
          return transformCrawlJobRecord(raceData as MediaCrawlJobRecord);
        }
      }
      throw new Error(`Failed to create crawl job: ${error.message}`);
    }

    return transformCrawlJobRecord(data as MediaCrawlJobRecord);
  }

  /**
   * List crawl jobs
   */
  async listCrawlJobs(orgId: string, query?: ListCrawlJobsQuery): Promise<CrawlJobListResponse> {
    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;
    const sortBy = query?.sortBy ?? 'created_at';
    const sortOrder = query?.sortOrder ?? 'desc';

    let queryBuilder = this.supabase
      .from('media_crawl_jobs')
      .select('*, media_rss_feeds(*)', { count: 'exact' })
      .eq('org_id', orgId);

    if (query?.feedId) {
      queryBuilder = queryBuilder.eq('feed_id', query.feedId);
    }

    if (query?.sourceId) {
      queryBuilder = queryBuilder.eq('source_id', query.sourceId);
    }

    if (query?.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query?.startDate) {
      queryBuilder = queryBuilder.gte('created_at', query.startDate);
    }

    if (query?.endDate) {
      queryBuilder = queryBuilder.lte('created_at', query.endDate);
    }

    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list crawl jobs: ${error.message}`);
    }

    const jobs: CrawlJobWithFeed[] = (data || []).map((record: any) => {
      const job = transformCrawlJobRecord(record as MediaCrawlJobRecord);
      return {
        ...job,
        feed: record.media_rss_feeds ? transformRSSFeedRecord(record.media_rss_feeds) : null,
      };
    });

    return {
      jobs,
      total: count ?? 0,
      limit,
      offset,
    };
  }

  /**
   * Get a single crawl job
   */
  async getCrawlJob(orgId: string, jobId: string): Promise<MediaCrawlJob | null> {
    const { data, error } = await this.supabase
      .from('media_crawl_jobs')
      .select()
      .eq('id', jobId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get crawl job: ${error.message}`);
    }

    return transformCrawlJobRecord(data as MediaCrawlJobRecord);
  }

  /**
   * Update crawl job status
   */
  async updateCrawlJobStatus(
    orgId: string,
    jobId: string,
    status: CrawlJobStatus,
    error?: string,
    resultArticleId?: string
  ): Promise<void> {
    const updateData: {
      status: CrawlJobStatus;
      error?: string | null;
      result_article_id?: string | null;
      processing_started_at?: string;
      processing_completed_at?: string;
      run_count?: number;
    } = { status };

    if (status === 'running') {
      updateData.processing_started_at = new Date().toISOString();
    }

    if (status === 'success' || status === 'failed') {
      updateData.processing_completed_at = new Date().toISOString();
    }

    if (error !== undefined) {
      updateData.error = error || null;
    }

    if (resultArticleId !== undefined) {
      updateData.result_article_id = resultArticleId || null;
    }

    // Increment run count if status is running or failed
    if (status === 'running' || status === 'failed') {
      const { data: currentJob } = await this.supabase
        .from('media_crawl_jobs')
        .select('run_count')
        .eq('id', jobId)
        .eq('org_id', orgId)
        .single();

      if (currentJob) {
        updateData.run_count = (currentJob.run_count || 0) + 1;
      }
    }

    const { error: updateError } = await this.supabase
      .from('media_crawl_jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('org_id', orgId);

    if (updateError) {
      throw new Error(`Failed to update crawl job status: ${updateError.message}`);
    }
  }

  // ========================================
  // RSS INGESTION WORKFLOW
  // ========================================

  /**
   * Fetch RSS feed and create crawl jobs for articles
   */
  async ingestFromRSSFeed(orgId: string, feedId: string): Promise<RSSIngestionResult> {
    if (this.debugMode) {
      console.log('[MediaCrawler] Ingesting from RSS feed:', feedId);
    }

    const feed = await this.getRSSFeed(orgId, feedId);
    if (!feed) {
      throw new Error('RSS feed not found');
    }

    if (!feed.active) {
      throw new Error('RSS feed is not active');
    }

    const errors: string[] = [];
    let jobsCreated = 0;

    try {
      // Fetch RSS articles
      const articles = await this.fetchRSS(feed.url);

      // Update last fetched timestamp
      await this.updateRSSFeedMetadata(orgId, feedId, {
        lastFetchedAt: new Date(),
        articlesFound: feed.articlesFound + articles.length,
      });

      // Create crawl jobs for each article
      for (const article of articles) {
        try {
          await this.createCrawlJob(orgId, {
            url: article.link,
            sourceId: feed.sourceId || undefined,
            feedId: feed.id,
            title: article.title,
            publishedAt: article.publishedAt?.toISOString(),
            metadata: {
              guid: article.guid,
              author: article.author,
              description: article.description,
            },
          });
          jobsCreated++;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error creating crawl job';
          errors.push(`Failed to create job for ${article.link}: ${errorMsg}`);
        }
      }

      return {
        feed,
        articles,
        jobsCreated,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error fetching RSS';
      errors.push(errorMsg);

      // Update feed with error
      await this.updateRSSFeedMetadata(orgId, feedId, {
        lastFetchedAt: new Date(),
        lastFetchError: errorMsg,
      });

      throw new Error(`Failed to ingest from RSS feed: ${errorMsg}`);
    }
  }

  /**
   * Update RSS feed metadata
   */
  private async updateRSSFeedMetadata(
    orgId: string,
    feedId: string,
    metadata: {
      lastFetchedAt?: Date;
      lastFetchError?: string | null;
      articlesFound?: number;
    }
  ): Promise<void> {
    const updateData: {
      last_fetched_at?: string;
      last_fetch_error?: string | null;
      articles_found?: number;
    } = {};

    if (metadata.lastFetchedAt) {
      updateData.last_fetched_at = metadata.lastFetchedAt.toISOString();
    }

    if (metadata.lastFetchError !== undefined) {
      updateData.last_fetch_error = metadata.lastFetchError;
    }

    if (metadata.articlesFound !== undefined) {
      updateData.articles_found = metadata.articlesFound;
    }

    await this.supabase
      .from('media_rss_feeds')
      .update(updateData)
      .eq('id', feedId)
      .eq('org_id', orgId);
  }

  /**
   * Trigger fetch for all active feeds
   */
  async fetchAllActiveFeeds(orgId: string, feedIds?: string[]): Promise<RSSIngestionResult[]> {
    const results: RSSIngestionResult[] = [];

    let feeds: MediaRSSFeed[];

    if (feedIds && feedIds.length > 0) {
      // Fetch specific feeds
      const { data } = await this.supabase
        .from('media_rss_feeds')
        .select()
        .eq('org_id', orgId)
        .in('id', feedIds)
        .eq('active', true);

      feeds = (data || []).map((r) => transformRSSFeedRecord(r as MediaRSSFeedRecord));
    } else {
      // Fetch all active feeds
      const response = await this.listRSSFeeds(orgId, { active: true, limit: 100 });
      feeds = response.feeds;
    }

    for (const feed of feeds) {
      try {
        const result = await this.ingestFromRSSFeed(orgId, feed.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to ingest from feed ${feed.id}:`, error);
        results.push({
          feed,
          articles: [],
          jobsCreated: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    return results;
  }

  // ========================================
  // STUB HTML CRAWLER
  // ========================================

  /**
   * Crawl article URL and extract content (stub)
   * In production, use Puppeteer, Cheerio, or similar
   */
  async crawlURL(url: string): Promise<{
    title: string;
    author: string | null;
    publishedAt: Date | null;
    content: string;
    keywords: string[];
    htmlSnapshot: string | null;
  }> {
    if (this.debugMode) {
      console.log('[MediaCrawler] Crawling URL:', url);
    }

    // Stub: Generate deterministic content based on URL
    const urlHash = this.hashString(url);
    const hostname = new URL(url).hostname;

    return {
      title: `Article from ${hostname}`,
      author: urlHash % 3 === 0 ? `Author ${(urlHash % 10) + 1}` : null,
      publishedAt: new Date(Date.now() - (urlHash % 30) * 24 * 60 * 60 * 1000),
      content: `This is stub content extracted from ${url}. In production, this would contain the actual article text extracted from HTML. The content would be cleaned, formatted, and ready for ingestion into the media monitoring system.`,
      keywords: [`keyword${urlHash % 10}`, `topic${(urlHash % 5) + 1}`, hostname.split('.')[0]],
      htmlSnapshot: null,
    };
  }

  // ========================================
  // JOB EXECUTION
  // ========================================

  /**
   * Execute a crawl job
   * This is the main worker function that processes queued jobs
   */
  async executeCrawlJob(orgId: string, jobId: string): Promise<CrawlJobResult> {
    const job = await this.getCrawlJob(orgId, jobId);
    if (!job) {
      throw new Error('Crawl job not found');
    }

    if (job.status === 'success') {
      if (this.debugMode) {
        console.log('[MediaCrawler] Job already completed:', jobId);
      }
      return {
        job,
        article: null,
        success: true,
        error: null,
      };
    }

    // Check retry limit
    if (job.runCount >= this.maxRetries) {
      await this.updateCrawlJobStatus(
        orgId,
        jobId,
        'failed',
        `Max retries (${this.maxRetries}) exceeded`
      );
      return {
        job: { ...job, status: 'failed', error: 'Max retries exceeded' },
        article: null,
        success: false,
        error: 'Max retries exceeded',
      };
    }

    try {
      // Mark job as running
      await this.updateCrawlJobStatus(orgId, jobId, 'running');

      // Crawl the URL
      const crawledData = await this.crawlURL(job.url);

      // Ingest through S40 pipeline
      const ingestionResult = await this.monitoringService.ingestArticle(orgId, job.url, {
        sourceId: job.sourceId || undefined,
        title: crawledData.title,
        author: crawledData.author || undefined,
        content: crawledData.content,
      });

      // Mark job as success
      await this.updateCrawlJobStatus(
        orgId,
        jobId,
        'success',
        undefined,
        ingestionResult.article.id
      );

      return {
        job: {
          ...job,
          status: 'success',
          resultArticleId: ingestionResult.article.id,
        },
        article: ingestionResult.article,
        success: true,
        error: null,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during crawl';

      if (this.debugMode) {
        console.error('[MediaCrawler] Job execution failed:', { jobId, error: errorMsg });
      }

      // Mark job as failed
      await this.updateCrawlJobStatus(orgId, jobId, 'failed', errorMsg);

      return {
        job: { ...job, status: 'failed', error: errorMsg },
        article: null,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Process pending crawl jobs (batch)
   * This is called by the worker to process multiple jobs
   */
  async processPendingJobs(orgId: string, batchSize: number = 10): Promise<CrawlJobResult[]> {
    if (this.debugMode) {
      console.log('[MediaCrawler] Processing pending jobs:', { orgId, batchSize });
    }

    // Get pending jobs
    const { data: pendingJobs } = await this.supabase.rpc('get_pending_crawl_jobs', {
      p_limit: batchSize,
    });

    if (!pendingJobs || pendingJobs.length === 0) {
      if (this.debugMode) {
        console.log('[MediaCrawler] No pending jobs found');
      }
      return [];
    }

    // Filter jobs for this org
    const orgJobs = pendingJobs.filter((j: any) => j.org_id === orgId);

    if (this.debugMode) {
      console.log('[MediaCrawler] Found pending jobs:', orgJobs.length);
    }

    const results: CrawlJobResult[] = [];

    for (const jobData of orgJobs) {
      try {
        const result = await this.executeCrawlJob(orgId, jobData.id);
        results.push(result);

        // Add delay between jobs to avoid rate limiting
        if (this.retryDelayMs > 0) {
          await this.sleep(this.retryDelayMs);
        }
      } catch (error) {
        console.error(`Failed to execute job ${jobData.id}:`, error);
        results.push({
          job: transformCrawlJobRecord(jobData),
          article: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get RSS feed and crawl job statistics
   */
  async getStats(orgId: string): Promise<RSSFeedStats> {
    try {
      const { data, error } = await this.supabase.rpc('get_rss_feed_stats', {
        p_org_id: orgId,
      });

      if (error) {
        if (this.debugMode) {
          console.error('Stats RPC failed:', error);
        }
        // Fallback to individual queries
        return await this.getStatsFallback(orgId);
      }

      return {
        totalFeeds: Number(data.total_feeds || 0),
        activeFeeds: Number(data.active_feeds || 0),
        totalJobs: Number(data.total_jobs || 0),
        queuedJobs: Number(data.queued_jobs || 0),
        runningJobs: Number(data.running_jobs || 0),
        successJobs: Number(data.success_jobs || 0),
        failedJobs: Number(data.failed_jobs || 0),
        articlesDiscovered: Number(data.articles_discovered || 0),
      };
    } catch (error) {
      if (this.debugMode) {
        console.error('Stats query failed:', error);
      }
      return await this.getStatsFallback(orgId);
    }
  }

  /**
   * Fallback stats calculation
   */
  private async getStatsFallback(orgId: string): Promise<RSSFeedStats> {
    const [feedsData, jobsData] = await Promise.all([
      this.supabase.from('media_rss_feeds').select('active', { count: 'exact' }).eq('org_id', orgId),
      this.supabase.from('media_crawl_jobs').select('status', { count: 'exact' }).eq('org_id', orgId),
    ]);

    const feeds = feedsData.data || [];
    const jobs = jobsData.data || [];

    return {
      totalFeeds: feedsData.count ?? 0,
      activeFeeds: feeds.filter((f) => f.active).length,
      totalJobs: jobsData.count ?? 0,
      queuedJobs: jobs.filter((j) => j.status === 'queued').length,
      runningJobs: jobs.filter((j) => j.status === 'running').length,
      successJobs: jobs.filter((j) => j.status === 'success').length,
      failedJobs: jobs.filter((j) => j.status === 'failed').length,
      articlesDiscovered: 0,
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Simple hash function for deterministic stubs
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ========================================
// FACTORY FUNCTION
// ========================================

/**
 * Create a media crawler service instance
 */
export function createMediaCrawlerService(config: MediaCrawlerConfig): MediaCrawlerService {
  return new MediaCrawlerService(config);
}
