/**
 * SEO Opportunity Service
 * Sprint S4: Opportunity detection engine
 */

import type {
  SEOOpportunityDTO,
  SEOKeyword,
  SEOKeywordMetric,
  SEOPage,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ListOpportunitiesOptions {
  limit?: number;
  offset?: number;
  opportunityType?: 'keyword_gap' | 'content_refresh' | 'broken_link' | 'missing_meta' | 'low_content';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'completed' | 'dismissed';
  minPriorityScore?: number;
}

export class SEOOpportunityService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate SEO opportunities for an org based on heuristics
   */
  async listOpportunities(
    orgId: string,
    options: ListOpportunitiesOptions = {}
  ): Promise<SEOOpportunityDTO[]> {
    const {
      limit = 20,
      offset = 0,
      opportunityType,
      minPriorityScore = 0,
    } = options;

    // Fetch keywords with metrics
    const { data: keywords } = await this.supabase
      .from('seo_keywords')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!keywords || keywords.length === 0) {
      return [];
    }

    // Fetch all metrics for these keywords
    const keywordIds = keywords.map((k) => k.id);
    const { data: metrics } = await this.supabase
      .from('seo_keyword_metrics')
      .select('*')
      .in('keyword_id', keywordIds)
      .eq('org_id', orgId);

    // Build metrics map (keyword_id -> metric)
    const metricsMap = new Map<string, any>();
    if (metrics) {
      for (const metric of metrics) {
        const existing = metricsMap.get(metric.keyword_id);
        if (
          !existing ||
          new Date(metric.last_refreshed_at) > new Date(existing.last_refreshed_at)
        ) {
          metricsMap.set(metric.keyword_id, metric);
        }
      }
    }

    // Fetch pages
    const { data: pages } = await this.supabase
      .from('seo_pages')
      .select('*')
      .eq('org_id', orgId);

    const pagesMap = new Map<string, any>();
    if (pages) {
      for (const page of pages) {
        pagesMap.set(page.url, page);
      }
    }

    // Fetch SERP results for competitive analysis
    const { data: serpResults } = await this.supabase
      .from('seo_serp_results')
      .select('*')
      .in('keyword_id', keywordIds)
      .eq('org_id', orgId)
      .order('rank', { ascending: true });

    const serpMap = new Map<string, any[]>();
    if (serpResults) {
      for (const result of serpResults) {
        if (!serpMap.has(result.keyword_id)) {
          serpMap.set(result.keyword_id, []);
        }
        serpMap.get(result.keyword_id)!.push(result);
      }
    }

    // Generate opportunities
    const opportunities: SEOOpportunityDTO[] = [];

    for (const keyword of keywords) {
      const metric = metricsMap.get(keyword.id);
      const serpList = serpMap.get(keyword.id) || [];
      const targetPage = keyword.tracked_url ? pagesMap.get(keyword.tracked_url) : null;

      // Detect opportunity types
      const opportunity = this.detectOpportunity(
        keyword,
        metric,
        targetPage,
        serpList,
        orgId
      );

      if (opportunity) {
        // Filter by type if specified
        if (opportunityType && opportunity.opportunityType !== opportunityType) {
          continue;
        }

        // Filter by min priority score
        if (opportunity.priorityScore < minPriorityScore) {
          continue;
        }

        opportunities.push(opportunity);
      }
    }

    // Sort by priority score descending
    opportunities.sort((a, b) => b.priorityScore - a.priorityScore);

    // Apply pagination
    return opportunities.slice(offset, offset + limit);
  }

  /**
   * Detect opportunity type and details for a keyword
   */
  private detectOpportunity(
    keyword: any,
    metric: any,
    targetPage: any,
    serpResults: any[],
    orgId: string
  ): SEOOpportunityDTO | null {
    // Calculate priority score
    const searchVolume = metric?.search_volume || 0;
    const difficulty = metric?.difficulty || 50;
    const priorityScore = metric?.priority_score || this.calculatePriorityScore(searchVolume, difficulty);

    // Determine opportunity type
    let opportunityType: SEOOpportunityDTO['opportunityType'];
    let gapSummary: string;
    let recommendedAction: string;

    // Check if we have a page targeting this keyword
    const hasTargetPage = !!targetPage;

    // Check our ranking in SERP results
    const ourResults = serpResults.filter((r) => !r.is_competitor);
    const ourBestRank = ourResults.length > 0 ? Math.min(...ourResults.map((r) => r.rank)) : null;

    // Check competitor rankings
    const competitorResults = serpResults.filter((r) => r.is_competitor);
    const topCompetitorRank = competitorResults.length > 0 ? Math.min(...competitorResults.map((r) => r.rank)) : null;

    if (!hasTargetPage && searchVolume > 1000) {
      // Keyword gap: High volume keyword with no target page
      opportunityType = 'keyword_gap';
      gapSummary = `High-value keyword "${keyword.keyword}" (${searchVolume.toLocaleString()} searches/mo) has no dedicated page.`;
      recommendedAction = `Create optimized content targeting "${keyword.keyword}" with focus on ${keyword.intent || 'user intent'}.`;
    } else if (hasTargetPage && ourBestRank && ourBestRank > 10 && topCompetitorRank && topCompetitorRank < ourBestRank) {
      // Content refresh: We have a page but competitors outrank us
      const gap = ourBestRank - topCompetitorRank;
      opportunityType = 'content_refresh';
      gapSummary = `Our page ranks at position ${ourBestRank} while competitors rank at ${topCompetitorRank} (${gap} position gap).`;
      recommendedAction = `Refresh and optimize existing content. Add depth, update statistics, improve internal linking.`;
    } else if (hasTargetPage && !targetPage.meta_description) {
      // Missing meta: Page exists but missing critical SEO elements
      opportunityType = 'missing_meta';
      gapSummary = `Page targeting "${keyword.keyword}" is missing meta description.`;
      recommendedAction = `Add compelling meta description (150-160 chars) including target keyword.`;
    } else if (hasTargetPage && targetPage.word_count && targetPage.word_count < 500) {
      // Low content: Page exists but has thin content
      opportunityType = 'low_content';
      gapSummary = `Page has only ${targetPage.word_count} words. Low content may impact rankings.`;
      recommendedAction = `Expand content to at least 1,500 words with comprehensive coverage of "${keyword.keyword}".`;
    } else if (searchVolume > 500 && difficulty < 40) {
      // Quick win: Decent volume, low competition
      opportunityType = 'keyword_gap';
      gapSummary = `Low-competition keyword "${keyword.keyword}" with ${searchVolume.toLocaleString()} monthly searches.`;
      recommendedAction = `Quick win opportunity. Create focused content to capture this keyword.`;
    } else {
      // No clear opportunity detected
      return null;
    }

    return {
      id: crypto.randomUUID(),
      orgId,
      keyword: this.mapKeywordFromDb(keyword),
      metrics: metric ? this.mapMetricFromDb(metric) : null,
      currentPage: targetPage ? this.mapPageFromDb(targetPage) : null,
      gapSummary,
      recommendedAction,
      priorityScore,
      opportunityType,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate priority score from search volume and difficulty
   */
  private calculatePriorityScore(searchVolume: number, difficulty: number): number {
    // Higher search volume + lower difficulty = higher priority
    const volumeScore = Math.min(100, (searchVolume / 100) * 0.4);
    const difficultyScore = (100 - difficulty) * 0.6;
    return parseFloat(Math.min(100, volumeScore + difficultyScore).toFixed(2));
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

  private mapPageFromDb(row: any): SEOPage {
    return {
      id: row.id,
      orgId: row.org_id,
      url: row.url,
      title: row.title,
      metaDescription: row.meta_description,
      h1Tag: row.h1_tag,
      wordCount: row.word_count,
      internalLinksCount: row.internal_links_count,
      externalLinksCount: row.external_links_count,
      pageSpeedScore: row.page_speed_score,
      mobileFriendly: row.mobile_friendly || false,
      indexed: row.indexed || false,
      lastCrawledAt: row.last_crawled_at,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
