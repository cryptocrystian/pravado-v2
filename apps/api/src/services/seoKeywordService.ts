/**
 * SEO Keyword Service
 * Sprint S4: Hybrid keyword intelligence layer with provider abstraction
 */

import type {
  SEOKeyword,
  SEOKeywordMetric,
  SEOKeywordWithMetrics,
  SEOKeywordIntent,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// ========================================
// KEYWORD PROVIDER ABSTRACTION
// ========================================

/**
 * Interface for keyword enrichment providers
 * S4: Stub implementation; S5+ can plug in real APIs (Ahrefs, SEMrush, etc.)
 */
export interface KeywordProvider {
  enrichKeyword(orgId: string, keyword: SEOKeyword): Promise<SEOKeywordMetric | null>;
  batchEnrichKeywords(orgId: string, keywords: SEOKeyword[]): Promise<SEOKeywordMetric[]>;
}

/**
 * Stub implementation for S4
 * Returns mock metrics based on simple heuristics
 */
export class StubKeywordProvider implements KeywordProvider {
  async enrichKeyword(orgId: string, keyword: SEOKeyword): Promise<SEOKeywordMetric | null> {
    // Generate mock metrics based on keyword characteristics
    const keywordLength = keyword.keyword.length;
    const wordCount = keyword.keyword.split(' ').length;

    // Simple heuristics for stub data
    const searchVolume = wordCount === 1 ? 10000 : wordCount === 2 ? 5000 : 2000;
    const difficulty = Math.min(100, keywordLength * 3 + wordCount * 5);
    const cpc = parseFloat((wordCount * 0.5 + Math.random() * 2).toFixed(2));
    const clickThroughRate = parseFloat((5 + Math.random() * 15).toFixed(2));

    // Calculate priority score (higher search volume + lower difficulty = higher priority)
    const priorityScore = parseFloat(
      Math.min(100, (searchVolume / 100) * 0.4 + (100 - difficulty) * 0.6).toFixed(2)
    );

    return {
      id: crypto.randomUUID(),
      orgId,
      keywordId: keyword.id,
      source: 'llm_estimate',
      searchVolume,
      difficulty,
      cpc,
      clickThroughRate,
      priorityScore,
      lastRefreshedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async batchEnrichKeywords(
    orgId: string,
    keywords: SEOKeyword[]
  ): Promise<SEOKeywordMetric[]> {
    const metrics = await Promise.all(
      keywords.map((keyword) => this.enrichKeyword(orgId, keyword))
    );
    return metrics.filter((m): m is SEOKeywordMetric => m !== null);
  }
}

// ========================================
// KEYWORD SERVICE
// ========================================

export interface ListKeywordsOptions {
  q?: string; // search query
  page?: number;
  pageSize?: number;
  status?: 'active' | 'paused' | 'archived';
  intent?: SEOKeywordIntent;
  sortBy?: 'keyword' | 'searchVolume' | 'difficulty' | 'priorityScore' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class SEOKeywordService {
  private keywordProvider: KeywordProvider;

  constructor(
    private supabase: SupabaseClient,
    keywordProvider?: KeywordProvider
  ) {
    this.keywordProvider = keywordProvider || new StubKeywordProvider();
  }

  /**
   * List keywords for an org with optional filters and search
   */
  async listKeywords(
    orgId: string,
    options: ListKeywordsOptions = {}
  ): Promise<{ items: SEOKeywordWithMetrics[]; total: number }> {
    const {
      q,
      page = 1,
      pageSize = 20,
      status,
      intent,
      sortBy = 'priorityScore',
      sortOrder = 'desc',
    } = options;

    // Build query
    let query = this.supabase
      .from('seo_keywords')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (q) {
      query = query.ilike('keyword', `%${q}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (intent) {
      query = query.eq('intent', intent);
    }

    // Calculate pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    // Apply sorting - note: for priorityScore we need to join with metrics
    if (sortBy !== 'priorityScore') {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const { data: keywords, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch keywords: ${error.message}`);
    }

    if (!keywords) {
      return { items: [], total: 0 };
    }

    // Fetch metrics for each keyword
    const keywordIds = keywords.map((k) => k.id);
    const { data: metrics } = await this.supabase
      .from('seo_keyword_metrics')
      .select('*')
      .in('keyword_id', keywordIds)
      .eq('org_id', orgId);

    // Build metrics map
    const metricsMap = new Map<string, SEOKeywordMetric>();
    if (metrics) {
      for (const metric of metrics) {
        // Keep the latest metric for each keyword (in case of duplicates)
        const existing = metricsMap.get(metric.keyword_id);
        if (
          !existing ||
          new Date(metric.last_refreshed_at) > new Date(existing.lastRefreshedAt)
        ) {
          metricsMap.set(metric.keyword_id, this.mapMetricFromDb(metric));
        }
      }
    }

    // Combine keywords with metrics
    const items: SEOKeywordWithMetrics[] = keywords.map((k) => ({
      keyword: this.mapKeywordFromDb(k),
      metrics: metricsMap.get(k.id) || null,
    }));

    // If sorting by priority score, do it in memory after fetching metrics
    if (sortBy === 'priorityScore') {
      items.sort((a, b) => {
        const aScore = a.metrics?.priorityScore || 0;
        const bScore = b.metrics?.priorityScore || 0;
        return sortOrder === 'asc' ? aScore - bScore : bScore - aScore;
      });
    }

    return { items, total: count || 0 };
  }

  /**
   * Get a single keyword by ID with metrics
   */
  async getKeyword(orgId: string, keywordId: string): Promise<SEOKeywordWithMetrics | null> {
    const { data: keyword, error } = await this.supabase
      .from('seo_keywords')
      .select('*')
      .eq('id', keywordId)
      .eq('org_id', orgId)
      .single();

    if (error || !keyword) {
      return null;
    }

    // Fetch latest metric
    const { data: metrics } = await this.supabase
      .from('seo_keyword_metrics')
      .select('*')
      .eq('keyword_id', keywordId)
      .eq('org_id', orgId)
      .order('last_refreshed_at', { ascending: false })
      .limit(1);

    return {
      keyword: this.mapKeywordFromDb(keyword),
      metrics: metrics && metrics.length > 0 ? this.mapMetricFromDb(metrics[0]) : null,
    };
  }

  /**
   * Enrich a keyword with metrics using the configured provider
   */
  async enrichKeyword(orgId: string, keywordId: string): Promise<SEOKeywordMetric | null> {
    // Fetch keyword
    const { data: keyword, error } = await this.supabase
      .from('seo_keywords')
      .select('*')
      .eq('id', keywordId)
      .eq('org_id', orgId)
      .single();

    if (error || !keyword) {
      return null;
    }

    // Use provider to enrich
    const metric = await this.keywordProvider.enrichKeyword(
      orgId,
      this.mapKeywordFromDb(keyword)
    );

    if (!metric) {
      return null;
    }

    // Store metric in database
    const { data: inserted, error: insertError } = await this.supabase
      .from('seo_keyword_metrics')
      .insert({
        org_id: metric.orgId,
        keyword_id: metric.keywordId,
        source: metric.source,
        search_volume: metric.searchVolume,
        difficulty: metric.difficulty,
        cpc: metric.cpc,
        click_through_rate: metric.clickThroughRate,
        priority_score: metric.priorityScore,
        last_refreshed_at: metric.lastRefreshedAt,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to store metric: ${insertError.message}`);
    }

    return inserted ? this.mapMetricFromDb(inserted) : metric;
  }

  /**
   * Get recommendations based on priority score
   */
  async getRecommendations(
    orgId: string,
    limit: number = 10
  ): Promise<SEOKeywordWithMetrics[]> {
    const { items } = await this.listKeywords(orgId, {
      pageSize: limit,
      sortBy: 'priorityScore',
      sortOrder: 'desc',
      status: 'active',
    });

    return items;
  }

  // ========================================
  // MAPPING HELPERS
  // ========================================

  private mapKeywordFromDb(row: any): SEOKeyword {
    return {
      id: row.id,
      orgId: row.org_id,
      keyword: row.keyword,
      searchVolume: row.search_volume,
      difficultyScore: row.difficulty_score,
      currentPosition: row.current_position,
      targetPosition: row.target_position,
      trackedUrl: row.tracked_url,
      status: row.status,
      intent: row.intent,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapMetricFromDb(row: any): SEOKeywordMetric {
    return {
      id: row.id,
      orgId: row.org_id,
      keywordId: row.keyword_id,
      source: row.source,
      searchVolume: row.search_volume,
      difficulty: row.difficulty,
      cpc: row.cpc ? parseFloat(row.cpc) : null,
      clickThroughRate: row.click_through_rate ? parseFloat(row.click_through_rate) : null,
      priorityScore: row.priority_score ? parseFloat(row.priority_score) : null,
      lastRefreshedAt: row.last_refreshed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
