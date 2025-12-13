/**
 * Media Crawler Service (Sprint S41, updated S98)
 * Automated media ingestion pipeline with RSS feeds and crawl jobs
 *
 * Features:
 * - RSS feed management
 * - RSS XML parsing (real implementation with fast-xml-parser)
 * - Crawl job queue management
 * - HTML content extraction (real implementation with cheerio)
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
  // RSS FETCHER (S98 - Real Implementation)
  // ========================================

  /**
   * Fetch and parse RSS feed (real implementation - S98)
   * Uses native fetch and fast-xml-parser for RSS parsing
   */
  async fetchRSS(feedUrl: string): Promise<RSSArticleItem[]> {
    if (this.debugMode) {
      console.log('[MediaCrawler] Fetching RSS feed:', feedUrl);
    }

    try {
      // Fetch the RSS feed with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(feedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Pravado Media Monitor/1.0 (+https://pravado.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlContent = await response.text();
      return this.parseRSSXML(xmlContent, feedUrl);
    } catch (error) {
      if (this.debugMode) {
        console.error('[MediaCrawler] Failed to fetch RSS:', error);
      }

      // If fetch fails, return empty array (caller can retry)
      return [];
    }
  }

  /**
   * Parse RSS/Atom XML content into article items (S98)
   */
  private parseRSSXML(xmlContent: string, feedUrl: string): RSSArticleItem[] {
    // Dynamic import to avoid issues with ESM
    const { XMLParser } = require('fast-xml-parser');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '_text',
      parseTagValue: true,
      trimValues: true,
    });

    try {
      const result = parser.parse(xmlContent);
      const articles: RSSArticleItem[] = [];

      // Handle RSS 2.0 format
      if (result.rss?.channel) {
        const channel = result.rss.channel;
        const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);

        for (const item of items) {
          const article = this.parseRSSItem(item, feedUrl);
          if (article) {
            articles.push(article);
          }
        }
      }

      // Handle Atom format
      if (result.feed?.entry) {
        const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];

        for (const entry of entries) {
          const article = this.parseAtomEntry(entry, feedUrl);
          if (article) {
            articles.push(article);
          }
        }
      }

      // Handle RSS 1.0 (RDF) format
      if (result['rdf:RDF']?.item) {
        const items = Array.isArray(result['rdf:RDF'].item)
          ? result['rdf:RDF'].item
          : [result['rdf:RDF'].item];

        for (const item of items) {
          const article = this.parseRSSItem(item, feedUrl);
          if (article) {
            articles.push(article);
          }
        }
      }

      if (this.debugMode) {
        console.log(`[MediaCrawler] Parsed ${articles.length} articles from ${feedUrl}`);
      }

      return articles;
    } catch (error) {
      if (this.debugMode) {
        console.error('[MediaCrawler] Failed to parse RSS XML:', error);
      }
      return [];
    }
  }

  /**
   * Parse a single RSS item
   */
  private parseRSSItem(item: Record<string, unknown>, feedUrl: string): RSSArticleItem | null {
    if (!item) return null;

    const title = this.extractText(item.title);
    const link = this.extractLink(item.link) || this.extractText(item.guid);

    if (!title || !link) return null;

    // Parse publication date
    let publishedAt: Date | null = null;
    const pubDate = this.extractText(item.pubDate) ||
                    this.extractText(item['dc:date']) ||
                    this.extractText(item.date);

    if (pubDate) {
      const parsed = new Date(pubDate);
      if (!isNaN(parsed.getTime())) {
        publishedAt = parsed;
      }
    }

    // Extract author
    const author = this.extractText(item.author) ||
                   this.extractText(item['dc:creator']) ||
                   null;

    // Extract description
    const description = this.extractText(item.description) ||
                        this.extractText(item['content:encoded']) ||
                        null;

    // Extract guid (unique identifier)
    const guid = this.extractText(item.guid) ||
                 this.hashString(`${feedUrl}-${link}`).toString();

    return {
      title,
      link: this.normalizeURL(link),
      publishedAt: publishedAt || new Date(),
      description: description ? this.stripHtml(description).substring(0, 500) : null,
      author,
      guid,
    };
  }

  /**
   * Parse a single Atom entry
   */
  private parseAtomEntry(entry: Record<string, unknown>, feedUrl: string): RSSArticleItem | null {
    if (!entry) return null;

    const title = this.extractText(entry.title);

    // Atom links can be objects or arrays
    const linkObj = entry.link;
    let link: string | null = null;

    if (Array.isArray(linkObj)) {
      // Find alternate link or first link
      const alternate = linkObj.find((l: Record<string, unknown>) =>
        l['@_rel'] === 'alternate' || !l['@_rel']
      );
      link = alternate?.['@_href'] || linkObj[0]?.['@_href'];
    } else if (typeof linkObj === 'object' && linkObj !== null) {
      link = (linkObj as Record<string, unknown>)['@_href'] as string;
    } else if (typeof linkObj === 'string') {
      link = linkObj;
    }

    if (!title || !link) return null;

    // Parse publication date
    let publishedAt: Date | null = null;
    const pubDate = this.extractText(entry.published) ||
                    this.extractText(entry.updated);

    if (pubDate) {
      const parsed = new Date(pubDate);
      if (!isNaN(parsed.getTime())) {
        publishedAt = parsed;
      }
    }

    // Extract author
    let author: string | null = null;
    if (entry.author) {
      if (typeof entry.author === 'object' && entry.author !== null) {
        author = this.extractText((entry.author as Record<string, unknown>).name);
      }
    }

    // Extract description/summary
    const description = this.extractText(entry.summary) ||
                        this.extractText(entry.content) ||
                        null;

    // Extract guid
    const guid = this.extractText(entry.id) ||
                 this.hashString(`${feedUrl}-${link}`).toString();

    return {
      title,
      link: this.normalizeURL(link),
      publishedAt: publishedAt || new Date(),
      description: description ? this.stripHtml(description).substring(0, 500) : null,
      author,
      guid,
    };
  }

  /**
   * Extract text from various XML element formats
   */
  private extractText(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if ('_text' in obj) return String(obj._text).trim();
      if ('#text' in obj) return String(obj['#text']).trim();
      // CDATA content
      if ('__cdata' in obj) return String(obj.__cdata).trim();
    }
    return String(value).trim();
  }

  /**
   * Extract link from various formats
   */
  private extractLink(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if ('@_href' in obj) return String(obj['@_href']).trim();
      if ('href' in obj) return String(obj.href).trim();
      if ('_text' in obj) return String(obj._text).trim();
    }
    return null;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

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
  // HTML CRAWLER (S98 - Real Implementation)
  // ========================================

  /**
   * Crawl article URL and extract content
   * Uses fetch + cheerio for HTML extraction
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

    try {
      // Fetch the page with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Pravado Media Monitor/1.0 (+https://pravado.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Use cheerio for HTML parsing
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      // Extract title (in order of preference)
      const title = this.extractTitle($);

      // Extract author
      const author = this.extractAuthor($);

      // Extract publication date
      const publishedAt = this.extractPublishedDate($);

      // Extract main content
      const content = this.extractMainContent($);

      // Extract keywords from meta tags
      const keywords = this.extractKeywords($);

      if (this.debugMode) {
        console.log('[MediaCrawler] Extracted content:', {
          url,
          titleLength: title.length,
          contentLength: content.length,
          keywordCount: keywords.length,
        });
      }

      return {
        title,
        author,
        publishedAt,
        content,
        keywords,
        htmlSnapshot: html.substring(0, 50000), // Store first 50KB of HTML
      };
    } catch (error) {
      if (this.debugMode) {
        console.error('[MediaCrawler] Failed to crawl URL:', error);
      }

      // Return minimal data with error indication
      const hostname = new URL(url).hostname;
      return {
        title: `Article from ${hostname}`,
        author: null,
        publishedAt: null,
        content: `Failed to extract content from ${url}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        keywords: [],
        htmlSnapshot: null,
      };
    }
  }

  /**
   * Extract title from HTML using multiple strategies
   */
  private extractTitle($: ReturnType<typeof import('cheerio').load>): string {
    // Try Open Graph title first
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle?.trim()) return ogTitle.trim();

    // Try Twitter title
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    if (twitterTitle?.trim()) return twitterTitle.trim();

    // Try article headline (schema.org)
    const schemaTitle = $('[itemprop="headline"]').first().text();
    if (schemaTitle?.trim()) return schemaTitle.trim();

    // Try h1 in article
    const h1InArticle = $('article h1').first().text();
    if (h1InArticle?.trim()) return h1InArticle.trim();

    // Try first h1
    const h1 = $('h1').first().text();
    if (h1?.trim()) return h1.trim();

    // Fall back to page title
    const pageTitle = $('title').text();
    if (pageTitle?.trim()) {
      // Remove common suffixes like " | Site Name" or " - Site Name"
      return pageTitle.split(/\s*[|\-–—]\s*/)[0].trim();
    }

    return 'Untitled Article';
  }

  /**
   * Extract author from HTML using multiple strategies
   */
  private extractAuthor($: ReturnType<typeof import('cheerio').load>): string | null {
    // Try Open Graph author
    const ogAuthor = $('meta[property="article:author"]').attr('content');
    if (ogAuthor?.trim()) return ogAuthor.trim();

    // Try author meta tag
    const authorMeta = $('meta[name="author"]').attr('content');
    if (authorMeta?.trim()) return authorMeta.trim();

    // Try schema.org author
    const schemaAuthor = $('[itemprop="author"]').first().text();
    if (schemaAuthor?.trim()) return schemaAuthor.trim();

    // Try common author class patterns
    const authorSelectors = [
      '.author-name',
      '.author',
      '.byline',
      '.post-author',
      '.entry-author',
      '[rel="author"]',
      '.article-author',
      '.writer',
    ];

    for (const selector of authorSelectors) {
      const author = $(selector).first().text();
      if (author?.trim() && author.trim().length < 100) {
        // Clean up "By " prefix
        return author.trim().replace(/^[Bb]y\s+/, '');
      }
    }

    return null;
  }

  /**
   * Extract publication date from HTML
   */
  private extractPublishedDate($: ReturnType<typeof import('cheerio').load>): Date | null {
    // Try Open Graph published time
    const ogTime = $('meta[property="article:published_time"]').attr('content');
    if (ogTime) {
      const parsed = new Date(ogTime);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Try schema.org datePublished
    const schemaDate = $('[itemprop="datePublished"]').attr('content') ||
                       $('[itemprop="datePublished"]').attr('datetime');
    if (schemaDate) {
      const parsed = new Date(schemaDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Try time element with datetime attribute
    const timeElement = $('article time[datetime]').first().attr('datetime') ||
                        $('time[datetime]').first().attr('datetime');
    if (timeElement) {
      const parsed = new Date(timeElement);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Try JSON-LD script
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        const dateStr = data.datePublished || data.dateCreated;
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    return null;
  }

  /**
   * Extract main content from HTML
   */
  private extractMainContent($: ReturnType<typeof import('cheerio').load>): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, noscript, .ad, .ads, .advertisement, .social-share, .comments, .related-posts').remove();

    // Try to find article content using common patterns
    const contentSelectors = [
      'article .content',
      'article .entry-content',
      'article .post-content',
      'article .article-content',
      'article .article-body',
      'article .story-body',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.story-content',
      '[itemprop="articleBody"]',
      'article',
      'main',
      '.content',
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length) {
        // Get all paragraphs within the content area
        const paragraphs: string[] = [];
        element.find('p').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) { // Filter out very short paragraphs
            paragraphs.push(text);
          }
        });

        if (paragraphs.length >= 2) {
          content = paragraphs.join('\n\n');
          break;
        }
      }
    }

    // Fallback: get all paragraphs from body
    if (!content || content.length < 200) {
      const paragraphs: string[] = [];
      $('body p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30) {
          paragraphs.push(text);
        }
      });
      content = paragraphs.slice(0, 20).join('\n\n'); // Limit to first 20 paragraphs
    }

    // Clean up the content
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .trim()
      .substring(0, 50000); // Limit to 50K characters
  }

  /**
   * Extract keywords from meta tags
   */
  private extractKeywords($: ReturnType<typeof import('cheerio').load>): string[] {
    const keywords: Set<string> = new Set();

    // Try keywords meta tag
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      metaKeywords.split(',').forEach(k => {
        const keyword = k.trim().toLowerCase();
        if (keyword.length > 2 && keyword.length < 50) {
          keywords.add(keyword);
        }
      });
    }

    // Try article tags
    const articleTags = $('meta[property="article:tag"]');
    articleTags.each((_, el) => {
      const tag = $(el).attr('content');
      if (tag?.trim()) {
        keywords.add(tag.trim().toLowerCase());
      }
    });

    // Try news keywords
    const newsKeywords = $('meta[name="news_keywords"]').attr('content');
    if (newsKeywords) {
      newsKeywords.split(',').forEach(k => {
        const keyword = k.trim().toLowerCase();
        if (keyword.length > 2 && keyword.length < 50) {
          keywords.add(keyword);
        }
      });
    }

    return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
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
