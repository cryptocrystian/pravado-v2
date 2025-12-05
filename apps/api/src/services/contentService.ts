/**
 * Content Intelligence Service (Sprint S12)
 * Handles content library, briefs, clusters, and gap detection
 */

import type {
  ContentItem,
  ContentBrief,
  ContentTopic,
  ContentTopicCluster,
  ContentItemListDTO,
  ContentBriefWithContextDTO,
  ContentClusterDTO,
  ContentGapDTO,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ContentServiceOptions {
  debugMode?: boolean;
}

export class ContentService {
  private supabase: SupabaseClient;
  private debugMode: boolean;

  constructor(supabase: SupabaseClient, options: ContentServiceOptions = {}) {
    this.supabase = supabase;
    this.debugMode = options.debugMode || false;
  }

  // ========================================
  // CONTENT LIBRARY
  // ========================================

  /**
   * List content items with filtering and pagination
   */
  async listContentItems(
    orgId: string,
    filters: {
      status?: 'draft' | 'published' | 'archived';
      q?: string;
      topicId?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ContentItemListDTO> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from('content_items')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.topicId) {
      query = query.eq('primary_topic_id', filters.topicId);
    }

    if (filters.q) {
      query = query.or(`title.ilike.%${filters.q}%,body.ilike.%${filters.q}%`);
    }

    // Pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list content items: ${error.message}`);
    }

    const items = (data || []).map((row) => this.mapContentItemFromDb(row));
    const total = count || 0;

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get a content item by ID
   */
  async getContentItemById(orgId: string, id: string): Promise<ContentItem | null> {
    const { data, error } = await this.supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get content item: ${error.message}`);
    }

    return this.mapContentItemFromDb(data);
  }

  /**
   * Create a new content item
   */
  async createContentItem(
    orgId: string,
    data: {
      title: string;
      slug?: string;
      contentType: 'blog_post' | 'social_post' | 'long_form' | 'video_script' | 'newsletter';
      status?: 'draft' | 'published' | 'archived';
      body?: string;
      url?: string;
      primaryTopicId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ContentItem> {
    // Calculate word count if body is provided
    const wordCount = data.body ? this.calculateWordCount(data.body) : null;

    // Generate embeddings (stub)
    const embeddings = data.body ? await this.generateEmbeddings(data.body) : null;

    const insertData = {
      org_id: orgId,
      title: data.title,
      slug: data.slug || this.generateSlug(data.title),
      content_type: data.contentType,
      status: data.status || 'draft',
      body: data.body || null,
      url: data.url || null,
      word_count: wordCount,
      primary_topic_id: data.primaryTopicId || null,
      embeddings,
      performance: {},
      metadata: data.metadata || {},
    };

    const { data: item, error } = await this.supabase
      .from('content_items')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create content item: ${error.message}`);
    }

    return this.mapContentItemFromDb(item);
  }

  /**
   * Update a content item
   */
  async updateContentItem(
    orgId: string,
    id: string,
    data: {
      title?: string;
      slug?: string;
      contentType?: 'blog_post' | 'social_post' | 'long_form' | 'video_script' | 'newsletter';
      status?: 'draft' | 'published' | 'archived';
      body?: string;
      url?: string;
      primaryTopicId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ContentItem> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.contentType !== undefined) updateData.content_type = data.contentType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.primaryTopicId !== undefined) updateData.primary_topic_id = data.primaryTopicId;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    // Update body and recalculate word count + embeddings
    if (data.body !== undefined) {
      updateData.body = data.body;
      updateData.word_count = data.body ? this.calculateWordCount(data.body) : null;
      updateData.embeddings = data.body ? await this.generateEmbeddings(data.body) : null;
    }

    const { data: item, error } = await this.supabase
      .from('content_items')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update content item: ${error.message}`);
    }

    return this.mapContentItemFromDb(item);
  }

  // ========================================
  // CONTENT BRIEFS
  // ========================================

  /**
   * List content briefs
   */
  async listContentBriefs(
    orgId: string,
    filters: {
      status?: 'draft' | 'in_progress' | 'completed';
      limit?: number;
      offset?: number;
    }
  ): Promise<ContentBrief[]> {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = this.supabase
      .from('content_briefs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list content briefs: ${error.message}`);
    }

    return (data || []).map((row) => this.mapContentBriefFromDb(row));
  }

  /**
   * Get content brief with context (related topics, suggested keywords)
   */
  async getContentBriefWithContext(
    orgId: string,
    id: string
  ): Promise<ContentBriefWithContextDTO | null> {
    // Get the brief
    const { data: briefData, error: briefError } = await this.supabase
      .from('content_briefs')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (briefError) {
      if (briefError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get content brief: ${briefError.message}`);
    }

    const brief = this.mapContentBriefFromDb(briefData);

    // Get related topics (stub - just get some topics for now)
    const { data: topicsData } = await this.supabase
      .from('content_topics')
      .select('*')
      .eq('org_id', orgId)
      .limit(5);

    const relatedTopics = (topicsData || []).map((row) => this.mapContentTopicFromDb(row));

    // Suggested keywords from SEO pillar (stub)
    const suggestedKeywords = await this.fetchSuggestedKeywords(orgId, brief.targetKeyword);

    return {
      brief,
      relatedTopics,
      suggestedKeywords,
    };
  }

  /**
   * Create a content brief
   */
  async createContentBrief(
    orgId: string,
    data: {
      title: string;
      targetKeyword?: string;
      targetIntent?: string;
      outline?: Record<string, unknown>;
      targetAudience?: string;
      targetKeywords?: string[];
      tone?: 'professional' | 'casual' | 'technical' | 'friendly';
      minWordCount?: number;
      maxWordCount?: number;
      status?: 'draft' | 'in_progress' | 'completed';
      metadata?: Record<string, unknown>;
    }
  ): Promise<ContentBrief> {
    const insertData = {
      org_id: orgId,
      title: data.title,
      target_keyword: data.targetKeyword || null,
      target_intent: data.targetIntent || null,
      outline: data.outline || null,
      target_audience: data.targetAudience || null,
      target_keywords: data.targetKeywords || [],
      tone: data.tone || null,
      min_word_count: data.minWordCount || null,
      max_word_count: data.maxWordCount || null,
      status: data.status || 'draft',
      metadata: data.metadata || {},
    };

    const { data: brief, error } = await this.supabase
      .from('content_briefs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create content brief: ${error.message}`);
    }

    return this.mapContentBriefFromDb(brief);
  }

  /**
   * Update a content brief
   */
  async updateContentBrief(
    orgId: string,
    id: string,
    data: {
      title?: string;
      targetKeyword?: string;
      targetIntent?: string;
      outline?: Record<string, unknown>;
      targetAudience?: string;
      targetKeywords?: string[];
      tone?: 'professional' | 'casual' | 'technical' | 'friendly';
      minWordCount?: number;
      maxWordCount?: number;
      status?: 'draft' | 'in_progress' | 'completed';
      metadata?: Record<string, unknown>;
    }
  ): Promise<ContentBrief> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.targetKeyword !== undefined) updateData.target_keyword = data.targetKeyword;
    if (data.targetIntent !== undefined) updateData.target_intent = data.targetIntent;
    if (data.outline !== undefined) updateData.outline = data.outline;
    if (data.targetAudience !== undefined) updateData.target_audience = data.targetAudience;
    if (data.targetKeywords !== undefined) updateData.target_keywords = data.targetKeywords;
    if (data.tone !== undefined) updateData.tone = data.tone;
    if (data.minWordCount !== undefined) updateData.min_word_count = data.minWordCount;
    if (data.maxWordCount !== undefined) updateData.max_word_count = data.maxWordCount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: brief, error } = await this.supabase
      .from('content_briefs')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update content brief: ${error.message}`);
    }

    return this.mapContentBriefFromDb(brief);
  }

  // ========================================
  // TOPIC CLUSTERS
  // ========================================

  /**
   * List content clusters
   */
  async listContentClusters(orgId: string): Promise<ContentClusterDTO[]> {
    // Get all clusters for the org
    const { data: clustersData, error: clustersError } = await this.supabase
      .from('content_topic_clusters')
      .select('*')
      .eq('org_id', orgId);

    if (clustersError) {
      throw new Error(`Failed to list clusters: ${clustersError.message}`);
    }

    const clusters = (clustersData || []).map((row) => this.mapClusterFromDb(row));

    // For each cluster, get topics and representative content
    const clusterDTOs: ContentClusterDTO[] = [];

    for (const cluster of clusters) {
      // Get topics in this cluster
      const { data: topicsData } = await this.supabase
        .from('content_topics')
        .select('*')
        .eq('org_id', orgId)
        .eq('cluster_id', cluster.id);

      const topics = (topicsData || []).map((row) => this.mapContentTopicFromDb(row));

      // Get representative content (top 3 by word count)
      const { data: contentData } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('org_id', orgId)
        .in(
          'primary_topic_id',
          topics.map((t) => t.id)
        )
        .order('word_count', { ascending: false })
        .limit(3);

      const representativeContent = (contentData || []).map((row) => this.mapContentItemFromDb(row));

      clusterDTOs.push({
        cluster,
        topics,
        representativeContent,
      });
    }

    return clusterDTOs;
  }

  /**
   * Rebuild topic clusters (stub - basic heuristic clustering)
   */
  async rebuildTopicClusters(orgId: string): Promise<ContentClusterDTO[]> {
    if (this.debugMode) {
      console.log('[ContentService] Rebuilding topic clusters (stub)');
    }

    // S12 V1: Simple stub clustering
    // In production, this would use embeddings and clustering algorithms

    // Clear existing clusters
    await this.supabase.from('content_topic_clusters').delete().eq('org_id', orgId);

    // Get all topics
    const { data: topicsData } = await this.supabase
      .from('content_topics')
      .select('*')
      .eq('org_id', orgId);

    const topics = topicsData || [];

    if (topics.length === 0) {
      return [];
    }

    // Create a single "General" cluster for now (stub)
    const { data: cluster } = await this.supabase
      .from('content_topic_clusters')
      .insert({
        org_id: orgId,
        name: 'General Topics',
        description: 'Auto-generated topic cluster',
      })
      .select()
      .single();

    if (cluster) {
      // Assign all topics to this cluster
      await this.supabase
        .from('content_topics')
        .update({ cluster_id: cluster.id })
        .eq('org_id', orgId);
    }

    // Return the clusters
    return this.listContentClusters(orgId);
  }

  // ========================================
  // CONTENT GAPS
  // ========================================

  /**
   * List content gaps (opportunities based on SEO keywords)
   */
  async listContentGaps(
    orgId: string,
    filters: {
      keyword?: string;
      minScore?: number;
      topicId?: string;
      limit?: number;
    }
  ): Promise<ContentGapDTO[]> {
    const limit = filters.limit || 20;

    // Get SEO keywords from seo_keywords table
    let keywordsQuery = this.supabase
      .from('seo_keywords')
      .select('keyword, intent, search_volume, difficulty_score')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('search_volume', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (filters.keyword) {
      keywordsQuery = keywordsQuery.ilike('keyword', `%${filters.keyword}%`);
    }

    const { data: keywordsData } = await keywordsQuery;
    const keywords = keywordsData || [];

    // For each keyword, count existing content
    const gaps: ContentGapDTO[] = [];

    for (const kw of keywords) {
      // Count content items that target this keyword
      const { count } = await this.supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .or(`title.ilike.%${kw.keyword}%,url.ilike.%${kw.keyword}%`);

      const existingContentCount = count || 0;

      // Calculate SEO opportunity score (stub)
      const searchVolume = kw.search_volume || 0;
      const difficulty = kw.difficulty_score || 50;

      // Higher score = high volume + low difficulty + low existing content
      const seoOpportunityScore = Math.min(
        100,
        Math.max(
          0,
          (searchVolume / 100) * (1 - difficulty / 100) * (1 - existingContentCount / 10) * 100
        )
      );

      if (filters.minScore && seoOpportunityScore < filters.minScore) {
        continue;
      }

      gaps.push({
        keyword: kw.keyword,
        intent: kw.intent,
        existingContentCount,
        seoOpportunityScore: Math.round(seoOpportunityScore),
      });
    }

    return gaps.sort((a, b) => b.seoOpportunityScore - a.seoOpportunityScore);
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Calculate word count from text
   */
  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate embeddings (stub - same pattern as Memory/SEO services)
   */
  private async generateEmbeddings(_text: string): Promise<number[]> {
    // Stub: In production, call OpenAI embeddings API
    return new Array(1536).fill(0).map(() => Math.random());
  }

  /**
   * Fetch suggested keywords from SEO pillar (stub)
   */
  private async fetchSuggestedKeywords(orgId: string, targetKeyword?: string | null): Promise<string[]> {
    if (!targetKeyword) {
      return [];
    }

    // Get related keywords from seo_keywords table
    const { data } = await this.supabase
      .from('seo_keywords')
      .select('keyword')
      .eq('org_id', orgId)
      .ilike('keyword', `%${targetKeyword}%`)
      .limit(5);

    return (data || []).map((row) => row.keyword);
  }

  // ========================================
  // MAPPING FUNCTIONS
  // ========================================

  private mapContentItemFromDb(row: any): ContentItem {
    return {
      id: row.id,
      orgId: row.org_id,
      title: row.title,
      slug: row.slug,
      contentType: row.content_type,
      status: row.status,
      body: row.body,
      url: row.url,
      publishedAt: row.published_at,
      wordCount: row.word_count,
      readingTimeMinutes: row.reading_time_minutes,
      performanceScore: row.performance_score,
      primaryTopicId: row.primary_topic_id,
      embeddings: row.embeddings,
      performance: row.performance || {},
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapContentBriefFromDb(row: any): ContentBrief {
    return {
      id: row.id,
      orgId: row.org_id,
      title: row.title,
      targetAudience: row.target_audience,
      targetKeywords: row.target_keywords || [],
      targetKeyword: row.target_keyword,
      targetIntent: row.target_intent,
      outline: row.outline,
      tone: row.tone,
      minWordCount: row.min_word_count,
      maxWordCount: row.max_word_count,
      contentItemId: row.content_item_id,
      status: row.status,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapContentTopicFromDb(row: any): ContentTopic {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name || row.topic_name,
      topicName: row.topic_name,
      description: row.description,
      embedding: row.embedding,
      embeddings: row.embeddings,
      contentItemId: row.content_item_id,
      relevanceScore: row.relevance_score,
      clusterId: row.cluster_id,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapClusterFromDb(row: any): ContentTopicCluster {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
