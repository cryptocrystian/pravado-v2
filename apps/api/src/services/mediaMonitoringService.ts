/**
 * Media Monitoring Service (Sprint S40)
 * Core service for media monitoring, article ingestion, and earned mention detection
 *
 * Features:
 * - Source management (monitored publications)
 * - Article ingestion with content extraction
 * - Embedding generation for semantic search
 * - Mention detection using LLM analysis
 * - Journalist matching
 * - Relevance scoring
 */

import type {
  ArticleIngestionResult,
  ArticleListResponse,
  ArticleWithMentions,
  ArticleWithSource,
  CreateSourceInput,
  DetectMentionsResult,
  EarnedMention,
  JournalistMatchResult,
  ListArticlesQuery,
  ListMentionsQuery,
  ListSourcesQuery,
  MediaMonitoringArticle,
  MediaMonitoringArticleRecord,
  MediaMonitoringSource,
  MediaMonitoringSourceRecord,
  MediaMonitoringStats,
  MentionListResponse,
  MentionWithArticle,
  SourceListResponse,
  UpdateSourceInput,
  EarnedMentionRecord,
  MentionSentiment,
  EntityType,
} from '@pravado/types';
import {
  transformArticleRecord,
  transformMentionRecord,
  transformSourceRecord,
} from '@pravado/types';
import { LlmRouter } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { MediaAlertService } from './mediaAlertService';

// ========================================
// SERVICE CONFIGURATION
// ========================================

interface MediaMonitoringServiceConfig {
  supabase: SupabaseClient;
  llmRouter?: LlmRouter;
  openaiApiKey?: string;
  debugMode?: boolean;
  mediaAlertService?: MediaAlertService; // S43: Optional alert evaluation service
}

// ========================================
// MEDIA MONITORING SERVICE CLASS
// ========================================

export class MediaMonitoringService {
  private supabase: SupabaseClient;
  private llmRouter: LlmRouter | null;
  private openaiApiKey: string | null;
  private debugMode: boolean;
  private mediaAlertService: MediaAlertService | null; // S43

  constructor(config: MediaMonitoringServiceConfig) {
    this.supabase = config.supabase;
    this.llmRouter = config.llmRouter || null;
    this.openaiApiKey = config.openaiApiKey || null;
    this.debugMode = config.debugMode || false;
    this.mediaAlertService = config.mediaAlertService || null; // S43
  }

  // ========================================
  // SOURCE MANAGEMENT
  // ========================================

  /**
   * Create a new monitoring source
   */
  async createSource(orgId: string, input: CreateSourceInput): Promise<MediaMonitoringSource> {
    const { data, error } = await this.supabase
      .from('media_monitoring_sources')
      .insert({
        org_id: orgId,
        name: input.name,
        url: input.url,
        description: input.description || null,
        source_type: input.sourceType || 'website',
        crawl_frequency_hours: input.crawlFrequencyHours || 24,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create source: ${error.message}`);
    }

    return transformSourceRecord(data as MediaMonitoringSourceRecord);
  }

  /**
   * List monitoring sources for an organization
   */
  async listSources(orgId: string, query: ListSourcesQuery = {}): Promise<SourceListResponse> {
    const { active, limit = 50, offset = 0 } = query;

    let queryBuilder = this.supabase
      .from('media_monitoring_sources')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (active !== undefined) {
      queryBuilder = queryBuilder.eq('active', active);
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list sources: ${error.message}`);
    }

    return {
      sources: (data || []).map((r) => transformSourceRecord(r as MediaMonitoringSourceRecord)),
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Get a single source by ID
   */
  async getSource(orgId: string, sourceId: string): Promise<MediaMonitoringSource | null> {
    const { data, error } = await this.supabase
      .from('media_monitoring_sources')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', sourceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get source: ${error.message}`);
    }

    return transformSourceRecord(data as MediaMonitoringSourceRecord);
  }

  /**
   * Update a monitoring source
   */
  async updateSource(
    orgId: string,
    sourceId: string,
    input: UpdateSourceInput
  ): Promise<MediaMonitoringSource> {
    const updateData: {
      name?: string;
      url?: string;
      description?: string | null;
      active?: boolean;
      source_type?: string;
      crawl_frequency_hours?: number;
      metadata?: Record<string, unknown>;
    } = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.url !== undefined) updateData.url = input.url;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.active !== undefined) updateData.active = input.active;
    if (input.sourceType !== undefined) updateData.source_type = input.sourceType;
    if (input.crawlFrequencyHours !== undefined)
      updateData.crawl_frequency_hours = input.crawlFrequencyHours;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from('media_monitoring_sources')
      .update(updateData)
      .eq('org_id', orgId)
      .eq('id', sourceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update source: ${error.message}`);
    }

    return transformSourceRecord(data as MediaMonitoringSourceRecord);
  }

  /**
   * Deactivate (soft delete) a monitoring source
   */
  async deactivateSource(orgId: string, sourceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('media_monitoring_sources')
      .update({ active: false })
      .eq('org_id', orgId)
      .eq('id', sourceId);

    if (error) {
      throw new Error(`Failed to deactivate source: ${error.message}`);
    }
  }

  // ========================================
  // ARTICLE INGESTION PIPELINE
  // ========================================

  /**
   * Ingest an article from a URL
   */
  async ingestArticle(
    orgId: string,
    url: string,
    options: {
      sourceId?: string;
      title?: string;
      author?: string;
      publishedAt?: string;
      content?: string;
    } = {}
  ): Promise<ArticleIngestionResult> {
    // Step 1: Extract metadata and content (stub scraper)
    const extracted = await this.extractArticleContent(url, options);

    // Step 2: Generate embeddings
    const embeddings = await this.generateEmbeddings(extracted.content);

    // Step 3: Classify keywords
    const keywords = await this.extractKeywords(extracted.content, extracted.title);

    // Step 4: Calculate relevance score (stub)
    const relevanceScore = this.calculateRelevanceScore(keywords, extracted);

    // Step 5: Estimate domain authority (stub)
    const domainAuthority = this.estimateDomainAuthority(url);

    // Step 6: Store article
    const { data, error } = await this.supabase
      .from('media_monitoring_articles')
      .upsert(
        {
          org_id: orgId,
          source_id: options.sourceId || null,
          url,
          title: extracted.title,
          author: extracted.author,
          published_at: extracted.publishedAt?.toISOString() || null,
          content: extracted.content,
          summary: extracted.summary,
          embeddings: embeddings.vector,
          relevance_score: relevanceScore,
          keywords,
          domain_authority: domainAuthority,
          word_count: extracted.wordCount,
          language: 'en',
        },
        { onConflict: 'org_id,url' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store article: ${error.message}`);
    }

    const article = transformArticleRecord(data as MediaMonitoringArticleRecord);

    // Update source last_crawled_at if source provided
    if (options.sourceId) {
      await this.supabase
        .from('media_monitoring_sources')
        .update({ last_crawled_at: new Date().toISOString() })
        .eq('id', options.sourceId);
    }

    return {
      article,
      extracted: {
        title: extracted.title,
        author: extracted.author,
        publishedAt: extracted.publishedAt,
        content: extracted.content,
        summary: extracted.summary,
        keywords,
        wordCount: extracted.wordCount,
      },
      embeddings: {
        generated: embeddings.generated,
        dimensions: embeddings.dimensions,
      },
    };
  }

  /**
   * Extract content from URL (stub scraper)
   */
  private async extractArticleContent(
    url: string,
    options: {
      title?: string;
      author?: string;
      publishedAt?: string;
      content?: string;
    }
  ): Promise<{
    title: string;
    author: string | null;
    publishedAt: Date | null;
    content: string;
    summary: string;
    wordCount: number;
  }> {
    // In production, this would use a web scraper (Puppeteer, Cheerio, etc.)
    // For now, use provided content or generate stub data

    const title = options.title || this.extractTitleFromUrl(url);
    const author = options.author || null;
    const publishedAt = options.publishedAt ? new Date(options.publishedAt) : null;
    const content =
      options.content ||
      `This is stub content for article from ${url}. In production, this would be scraped from the actual webpage.`;

    // Generate summary using LLM or fallback
    const summary = await this.generateSummary(content, title);

    const wordCount = content.split(/\s+/).length;

    return {
      title,
      author,
      publishedAt,
      content,
      summary,
      wordCount,
    };
  }

  /**
   * Extract title from URL (fallback)
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1]
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\.[^/.]+$/, '') // Remove file extension
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return urlObj.hostname;
    } catch {
      return 'Untitled Article';
    }
  }

  /**
   * Generate article summary using LLM
   */
  private async generateSummary(content: string, title: string): Promise<string> {
    if (!this.llmRouter) {
      // Fallback: First 200 characters
      return content.substring(0, 200) + (content.length > 200 ? '...' : '');
    }

    try {
      const response = await this.llmRouter.generate({
        systemPrompt:
          'You are a concise article summarizer. Generate a 2-3 sentence summary of the article.',
        userPrompt: `Title: ${title}\n\nContent:\n${content.substring(0, 5000)}`,
        temperature: 0.3,
        maxTokens: 150,
      });

      return response.completion.trim();
    } catch (error) {
      if (this.debugMode) {
        console.error('Summary generation failed:', error);
      }
      return content.substring(0, 200) + (content.length > 200 ? '...' : '');
    }
  }

  /**
   * Generate embeddings for article content
   */
  private async generateEmbeddings(
    content: string
  ): Promise<{ vector: number[] | null; generated: boolean; dimensions: number }> {
    if (!this.openaiApiKey) {
      return { vector: null, generated: false, dimensions: 0 };
    }

    try {
      // Call OpenAI embeddings API directly
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: content.substring(0, 8000), // Limit input size
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
      };
      const vector = data.data[0]?.embedding || null;

      return {
        vector,
        generated: vector !== null,
        dimensions: vector?.length || 0,
      };
    } catch (error) {
      if (this.debugMode) {
        console.error('Embedding generation failed:', error);
      }
      return { vector: null, generated: false, dimensions: 0 };
    }
  }

  /**
   * Extract keywords from content
   */
  private async extractKeywords(content: string, title: string): Promise<string[]> {
    if (!this.llmRouter) {
      // Fallback: Simple keyword extraction
      return this.extractKeywordsFallback(content, title);
    }

    try {
      const response = await this.llmRouter.generate({
        systemPrompt:
          'Extract 5-10 relevant keywords from the article. Return only a comma-separated list of keywords, nothing else.',
        userPrompt: `Title: ${title}\n\nContent:\n${content.substring(0, 3000)}`,
        temperature: 0.2,
        maxTokens: 100,
      });

      const keywords = response.completion
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0 && k.length < 50);

      return keywords.slice(0, 10);
    } catch (error) {
      if (this.debugMode) {
        console.error('Keyword extraction failed:', error);
      }
      return this.extractKeywordsFallback(content, title);
    }
  }

  /**
   * Fallback keyword extraction
   */
  private extractKeywordsFallback(content: string, title: string): string[] {
    const text = `${title} ${content}`.toLowerCase();

    // Common stop words to filter out
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'can',
      'need',
      'dare',
      'ought',
      'used',
      'that',
      'this',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'what',
      'which',
      'who',
      'whom',
      'where',
      'when',
      'why',
      'how',
      'all',
      'each',
      'every',
      'both',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'just',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'under',
      'again',
      'further',
      'then',
      'once',
    ]);

    // Count word frequency
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      if (!stopWords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Sort by frequency and return top keywords
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Calculate relevance score (stub)
   */
  private calculateRelevanceScore(
    keywords: string[],
    extracted: { title: string; content: string }
  ): number {
    // In production, this would use more sophisticated scoring
    // Based on keyword relevance, topic matching, etc.

    // Simple scoring based on content length and keyword count
    const lengthScore = Math.min(extracted.content.length / 5000, 0.3);
    const keywordScore = Math.min(keywords.length / 10, 0.3);
    const titleScore = extracted.title.length > 10 ? 0.2 : 0.1;

    return Math.min(lengthScore + keywordScore + titleScore + 0.2, 1);
  }

  /**
   * Estimate domain authority (stub)
   */
  private estimateDomainAuthority(url: string): number {
    // In production, this would use actual DA data from Moz, Ahrefs, etc.
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Simple tier-based scoring
      const tier1Domains = ['nytimes.com', 'wsj.com', 'bbc.com', 'reuters.com', 'bloomberg.com'];
      const tier2Domains = ['techcrunch.com', 'wired.com', 'theverge.com', 'forbes.com'];

      if (tier1Domains.some((d) => domain.includes(d))) return 90;
      if (tier2Domains.some((d) => domain.includes(d))) return 70;
      if (domain.endsWith('.gov') || domain.endsWith('.edu')) return 75;

      return 40; // Default for unknown domains
    } catch {
      return 30;
    }
  }

  // ========================================
  // ARTICLE QUERIES
  // ========================================

  /**
   * List articles for an organization
   */
  async listArticles(orgId: string, query: ListArticlesQuery = {}): Promise<ArticleListResponse> {
    const {
      sourceId,
      minRelevance,
      keyword,
      author,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    let queryBuilder = this.supabase
      .from('media_monitoring_articles')
      .select('*, media_monitoring_sources(*)', { count: 'exact' })
      .eq('org_id', orgId);

    if (sourceId) {
      queryBuilder = queryBuilder.eq('source_id', sourceId);
    }

    if (minRelevance !== undefined) {
      queryBuilder = queryBuilder.gte('relevance_score', minRelevance);
    }

    if (keyword) {
      queryBuilder = queryBuilder.contains('keywords', [keyword.toLowerCase()]);
    }

    if (author) {
      queryBuilder = queryBuilder.ilike('author', `%${author}%`);
    }

    if (startDate) {
      queryBuilder = queryBuilder.gte('published_at', startDate);
    }

    if (endDate) {
      queryBuilder = queryBuilder.lte('published_at', endDate);
    }

    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list articles: ${error.message}`);
    }

    const articles: ArticleWithSource[] = (data || []).map((record) => {
      const articleRecord = record as MediaMonitoringArticleRecord & {
        media_monitoring_sources: MediaMonitoringSourceRecord | MediaMonitoringSourceRecord[] | null;
      };

      const sourceData = articleRecord.media_monitoring_sources;
      const source = Array.isArray(sourceData) ? sourceData[0] : sourceData;

      return {
        ...transformArticleRecord(articleRecord),
        source: source ? transformSourceRecord(source) : null,
      };
    });

    return {
      articles,
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Get article with all mentions
   */
  async getArticleWithMentions(
    orgId: string,
    articleId: string
  ): Promise<ArticleWithMentions | null> {
    // Get article with source
    const { data: articleData, error: articleError } = await this.supabase
      .from('media_monitoring_articles')
      .select('*, media_monitoring_sources(*)')
      .eq('org_id', orgId)
      .eq('id', articleId)
      .single();

    if (articleError) {
      if (articleError.code === 'PGRST116') return null;
      throw new Error(`Failed to get article: ${articleError.message}`);
    }

    const articleRecord = articleData as MediaMonitoringArticleRecord & {
      media_monitoring_sources: MediaMonitoringSourceRecord | MediaMonitoringSourceRecord[] | null;
    };

    const sourceData = articleRecord.media_monitoring_sources;
    const source = Array.isArray(sourceData) ? sourceData[0] : sourceData;

    // Get mentions for article
    const { data: mentionsData, error: mentionsError } = await this.supabase
      .from('earned_mentions')
      .select('*')
      .eq('org_id', orgId)
      .eq('article_id', articleId)
      .order('position_in_article', { ascending: true });

    if (mentionsError) {
      throw new Error(`Failed to get mentions: ${mentionsError.message}`);
    }

    return {
      ...transformArticleRecord(articleRecord),
      source: source ? transformSourceRecord(source) : null,
      mentions: (mentionsData || []).map((r) => transformMentionRecord(r as EarnedMentionRecord)),
    };
  }

  // ========================================
  // MENTION DETECTION ENGINE
  // ========================================

  /**
   * Detect mentions in an article
   */
  async detectMentions(
    orgId: string,
    articleId: string,
    entities: string[],
    detectCompetitors: boolean = false
  ): Promise<DetectMentionsResult> {
    // Get article
    const { data: articleData, error: articleError } = await this.supabase
      .from('media_monitoring_articles')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', articleId)
      .single();

    if (articleError) {
      throw new Error(`Article not found: ${articleError.message}`);
    }

    const article = articleData as MediaMonitoringArticleRecord;

    if (!article.content) {
      throw new Error('Article has no content for mention detection');
    }

    // Detect mentions using LLM or fallback
    const detectedMentions = await this.detectMentionsInContent(
      article.content,
      article.title,
      entities,
      detectCompetitors
    );

    // Match journalist
    const journalistMatch = await this.matchJournalist(orgId, article.author, article.content);

    // Store mentions
    const storedMentions: EarnedMention[] = [];

    for (const mention of detectedMentions) {
      const { data, error } = await this.supabase
        .from('earned_mentions')
        .insert({
          org_id: orgId,
          article_id: articleId,
          journalist_id: journalistMatch?.journalistId || null,
          entity: mention.entity,
          entity_type: mention.entityType,
          snippet: mention.snippet,
          context: mention.context,
          sentiment: mention.sentiment,
          confidence: mention.confidence,
          is_primary_mention: mention.isPrimary,
          position_in_article: mention.position,
        })
        .select()
        .single();

      if (!error && data) {
        const mention = transformMentionRecord(data as EarnedMentionRecord);
        storedMentions.push(mention);

        // S43: Evaluate alert rules for new mention
        if (this.mediaAlertService) {
          try {
            await this.mediaAlertService.evaluateRulesForNewMention(mention);
          } catch (alertError) {
            // Log but don't fail mention detection if alert evaluation fails
            console.error('Failed to evaluate alert rules for mention:', alertError);
          }
        }
      }
    }

    // Calculate stats
    const stats = {
      total: storedMentions.length,
      positive: storedMentions.filter((m) => m.sentiment === 'positive').length,
      neutral: storedMentions.filter((m) => m.sentiment === 'neutral').length,
      negative: storedMentions.filter((m) => m.sentiment === 'negative').length,
      primaryMentions: storedMentions.filter((m) => m.isPrimaryMention).length,
    };

    return {
      articleId,
      mentions: storedMentions,
      stats,
    };
  }

  /**
   * Detect mentions in content using LLM
   */
  private async detectMentionsInContent(
    content: string,
    title: string,
    entities: string[],
    detectCompetitors: boolean
  ): Promise<
    Array<{
      entity: string;
      entityType: EntityType;
      snippet: string;
      context: string;
      sentiment: MentionSentiment;
      confidence: number;
      isPrimary: boolean;
      position: number;
    }>
  > {
    if (!this.llmRouter) {
      // Fallback: Simple string matching
      return this.detectMentionsFallback(content, title, entities);
    }

    try {
      const prompt = `Analyze the following article and detect mentions of these entities: ${entities.join(', ')}

${detectCompetitors ? 'Also detect mentions of potential competitors or competing products.' : ''}

For each mention found, provide:
1. entity: The entity name mentioned
2. entityType: "brand", "product", "executive", or "competitor"
3. snippet: The exact text containing the mention (max 200 chars)
4. context: Brief context of the mention (1-2 sentences)
5. sentiment: "positive", "neutral", or "negative"
6. confidence: 0-1 confidence score
7. isPrimary: true if this entity is the main subject of the article
8. position: approximate character position in the article

Return a JSON array of mentions. If no mentions found, return [].

Article Title: ${title}

Article Content:
${content.substring(0, 6000)}`;

      const response = await this.llmRouter.generate({
        systemPrompt:
          'You are a media analyst specializing in mention detection. Return only valid JSON arrays.',
        userPrompt: prompt,
        temperature: 0.2,
        maxTokens: 2000,
      });

      // Parse JSON response
      const jsonMatch = response.completion.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.detectMentionsFallback(content, title, entities);
      }

      const mentions = JSON.parse(jsonMatch[0]) as Array<{
        entity: string;
        entityType: string;
        snippet: string;
        context: string;
        sentiment: string;
        confidence: number;
        isPrimary: boolean;
        position: number;
      }>;

      return mentions.map((m) => ({
        entity: m.entity,
        entityType: (m.entityType as EntityType) || 'brand',
        snippet: m.snippet?.substring(0, 500) || '',
        context: m.context?.substring(0, 1000) || '',
        sentiment: (m.sentiment as MentionSentiment) || 'neutral',
        confidence: Math.min(Math.max(m.confidence || 0.5, 0), 1),
        isPrimary: m.isPrimary || false,
        position: m.position || 0,
      }));
    } catch (error) {
      if (this.debugMode) {
        console.error('LLM mention detection failed:', error);
      }
      return this.detectMentionsFallback(content, title, entities);
    }
  }

  /**
   * Fallback mention detection using string matching
   */
  private detectMentionsFallback(
    content: string,
    title: string,
    entities: string[]
  ): Array<{
    entity: string;
    entityType: EntityType;
    snippet: string;
    context: string;
    sentiment: MentionSentiment;
    confidence: number;
    isPrimary: boolean;
    position: number;
  }> {
    const mentions: Array<{
      entity: string;
      entityType: EntityType;
      snippet: string;
      context: string;
      sentiment: MentionSentiment;
      confidence: number;
      isPrimary: boolean;
      position: number;
    }> = [];

    const fullText = `${title}\n\n${content}`;
    const lowerContent = fullText.toLowerCase();

    for (const entity of entities) {
      const lowerEntity = entity.toLowerCase();
      let position = 0;
      let searchFrom = 0;

      while ((position = lowerContent.indexOf(lowerEntity, searchFrom)) !== -1) {
        // Extract snippet (100 chars before and after)
        const start = Math.max(0, position - 100);
        const end = Math.min(fullText.length, position + entity.length + 100);
        const snippet = fullText.substring(start, end);

        // Check if in title (primary mention indicator)
        const isPrimary = title.toLowerCase().includes(lowerEntity);

        mentions.push({
          entity,
          entityType: 'brand',
          snippet: snippet.trim(),
          context: snippet.trim(),
          sentiment: 'neutral',
          confidence: 0.6, // Lower confidence for fallback
          isPrimary,
          position,
        });

        searchFrom = position + entity.length;
      }
    }

    return mentions;
  }

  // ========================================
  // JOURNALIST MATCHING
  // ========================================

  /**
   * Match article author to known journalists
   */
  async matchJournalist(
    orgId: string,
    authorName: string | null,
    _content: string
  ): Promise<JournalistMatchResult | null> {
    if (!authorName) return null;

    // Try exact name match first
    const { data: exactMatch, error: exactError } = await this.supabase
      .from('journalists')
      .select('*, media_outlets(name)')
      .eq('org_id', orgId)
      .ilike('name', authorName)
      .limit(1)
      .single();

    if (!exactError && exactMatch) {
      const outletData = exactMatch.media_outlets;
      const outlet = Array.isArray(outletData) ? outletData[0] : outletData;
      const typedOutlet = outlet as { name: string } | null | undefined;

      return {
        journalistId: exactMatch.id,
        name: exactMatch.name,
        email: exactMatch.email,
        beat: exactMatch.beat,
        outlet: typedOutlet?.name || null,
        matchScore: 1.0,
        matchReason: 'Exact name match',
      };
    }

    // Try fuzzy name match
    const nameParts = authorName.toLowerCase().split(/\s+/);
    if (nameParts.length >= 2) {
      const { data: fuzzyMatches, error: fuzzyError } = await this.supabase
        .from('journalists')
        .select('*, media_outlets(name)')
        .eq('org_id', orgId)
        .or(`name.ilike.%${nameParts[0]}%,name.ilike.%${nameParts[nameParts.length - 1]}%`)
        .limit(5);

      if (!fuzzyError && fuzzyMatches && fuzzyMatches.length > 0) {
        // Score matches by name similarity
        const scoredMatches = fuzzyMatches.map((j) => {
          const jNameParts = j.name.toLowerCase().split(/\s+/);
          const matchingParts = nameParts.filter((p) => jNameParts.includes(p));
          const score = matchingParts.length / Math.max(nameParts.length, jNameParts.length);
          return { journalist: j, score };
        });

        const bestMatch = scoredMatches.sort((a, b) => b.score - a.score)[0];
        if (bestMatch && bestMatch.score >= 0.5) {
          const outletData = bestMatch.journalist.media_outlets;
          const outlet = Array.isArray(outletData) ? outletData[0] : outletData;
          const typedOutlet = outlet as { name: string } | null | undefined;

          return {
            journalistId: bestMatch.journalist.id,
            name: bestMatch.journalist.name,
            email: bestMatch.journalist.email,
            beat: bestMatch.journalist.beat,
            outlet: typedOutlet?.name || null,
            matchScore: bestMatch.score,
            matchReason: 'Fuzzy name match',
          };
        }
      }
    }

    return null;
  }

  // ========================================
  // MENTION QUERIES
  // ========================================

  /**
   * List mentions for an organization
   */
  async listMentions(orgId: string, query: ListMentionsQuery = {}): Promise<MentionListResponse> {
    const {
      articleId,
      entity,
      entityType,
      sentiment,
      minConfidence,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    let queryBuilder = this.supabase
      .from('earned_mentions')
      .select('*, media_monitoring_articles(*)', { count: 'exact' })
      .eq('org_id', orgId);

    if (articleId) {
      queryBuilder = queryBuilder.eq('article_id', articleId);
    }

    if (entity) {
      queryBuilder = queryBuilder.ilike('entity', `%${entity}%`);
    }

    if (entityType) {
      queryBuilder = queryBuilder.eq('entity_type', entityType);
    }

    if (sentiment) {
      queryBuilder = queryBuilder.eq('sentiment', sentiment);
    }

    if (minConfidence !== undefined) {
      queryBuilder = queryBuilder.gte('confidence', minConfidence);
    }

    if (startDate) {
      queryBuilder = queryBuilder.gte('created_at', startDate);
    }

    if (endDate) {
      queryBuilder = queryBuilder.lte('created_at', endDate);
    }

    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list mentions: ${error.message}`);
    }

    const mentions: MentionWithArticle[] = (data || []).map((record) => {
      const mentionRecord = record as EarnedMentionRecord & {
        media_monitoring_articles: MediaMonitoringArticleRecord | MediaMonitoringArticleRecord[];
      };

      const articleData = mentionRecord.media_monitoring_articles;
      const article = Array.isArray(articleData) ? articleData[0] : articleData;

      return {
        ...transformMentionRecord(mentionRecord),
        article: transformArticleRecord(article),
      };
    });

    return {
      mentions,
      total: count || 0,
      limit,
      offset,
    };
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get media monitoring statistics
   */
  async getStats(orgId: string): Promise<MediaMonitoringStats> {
    const { data, error } = await this.supabase.rpc('get_media_monitoring_stats', {
      p_org_id: orgId,
    });

    if (error) {
      // Fallback if RPC not available
      if (this.debugMode) {
        console.error('Stats RPC failed:', error);
      }

      // Manual calculation
      const [sourcesResult, articlesResult, mentionsResult] = await Promise.all([
        this.supabase
          .from('media_monitoring_sources')
          .select('active', { count: 'exact' })
          .eq('org_id', orgId),
        this.supabase
          .from('media_monitoring_articles')
          .select('relevance_score, created_at', { count: 'exact' })
          .eq('org_id', orgId),
        this.supabase
          .from('earned_mentions')
          .select('sentiment, created_at', { count: 'exact' })
          .eq('org_id', orgId),
      ]);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      return {
        totalSources: sourcesResult.count || 0,
        activeSources: (sourcesResult.data || []).filter((s) => s.active).length,
        totalArticles: articlesResult.count || 0,
        articlesThisWeek: (articlesResult.data || []).filter((a) => a.created_at >= weekAgo).length,
        totalMentions: mentionsResult.count || 0,
        mentionsThisWeek: (mentionsResult.data || []).filter((m) => m.created_at >= weekAgo).length,
        positiveMentions: (mentionsResult.data || []).filter((m) => m.sentiment === 'positive')
          .length,
        neutralMentions: (mentionsResult.data || []).filter((m) => m.sentiment === 'neutral')
          .length,
        negativeMentions: (mentionsResult.data || []).filter((m) => m.sentiment === 'negative')
          .length,
        avgRelevance:
          (articlesResult.data || []).reduce((sum, a) => sum + (a.relevance_score || 0), 0) /
            Math.max((articlesResult.data || []).length, 1) || 0,
      };
    }

    const stats = Array.isArray(data) ? data[0] : data;

    return {
      totalSources: Number(stats?.total_sources || 0),
      activeSources: Number(stats?.active_sources || 0),
      totalArticles: Number(stats?.total_articles || 0),
      articlesThisWeek: Number(stats?.articles_this_week || 0),
      totalMentions: Number(stats?.total_mentions || 0),
      mentionsThisWeek: Number(stats?.mentions_this_week || 0),
      positiveMentions: Number(stats?.positive_mentions || 0),
      neutralMentions: Number(stats?.neutral_mentions || 0),
      negativeMentions: Number(stats?.negative_mentions || 0),
      avgRelevance: Number(stats?.avg_relevance || 0),
    };
  }

  // ========================================
  // SEMANTIC SEARCH
  // ========================================

  /**
   * Find similar articles by content
   */
  async findSimilarArticles(
    orgId: string,
    content: string,
    limit: number = 10
  ): Promise<Array<{ article: MediaMonitoringArticle; similarity: number }>> {
    // Generate embeddings for query
    const embeddings = await this.generateEmbeddings(content);

    if (!embeddings.vector) {
      // Fallback to keyword search if embeddings not available
      const keywords = await this.extractKeywords(content, '');
      const { articles } = await this.listArticles(orgId, {
        keyword: keywords[0],
        limit,
      });

      return articles.map((a) => ({
        article: a,
        similarity: 0.5, // Default similarity for keyword match
      }));
    }

    // Use RPC for vector similarity search
    const { data, error } = await this.supabase.rpc('find_similar_articles', {
      p_org_id: orgId,
      p_embedding: embeddings.vector,
      p_limit: limit,
      p_threshold: 0.5,
    });

    if (error) {
      if (this.debugMode) {
        console.error('Similar articles search failed:', error);
      }
      return [];
    }

    // Fetch full article data
    const articleIds = (data || []).map((r: { id: string }) => r.id);
    if (articleIds.length === 0) return [];

    const { data: articlesData, error: articlesError } = await this.supabase
      .from('media_monitoring_articles')
      .select('*')
      .in('id', articleIds);

    if (articlesError) return [];

    const similarityMap = new Map<string, number>(
      (data || []).map((r: { id: string; similarity: number }) => [r.id, r.similarity])
    );

    return (articlesData || []).map((r) => ({
      article: transformArticleRecord(r as MediaMonitoringArticleRecord),
      similarity: (similarityMap.get(r.id) || 0) as number,
    }));
  }
}

// ========================================
// FACTORY FUNCTION
// ========================================

export function createMediaMonitoringService(
  config: MediaMonitoringServiceConfig
): MediaMonitoringService {
  return new MediaMonitoringService(config);
}
