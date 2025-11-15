/**
 * SEO SERP Service
 * Sprint S4: SERP snapshot & competitor comparison
 */

import type { SEOSerpResult, SEOSerpSnapshot } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CompetitorGap {
  domain: string;
  rank: number;
  url: string;
  title: string | null;
  ourRank: number | null;
  gapExplanation: string;
}

export class SEOSerpService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get SERP snapshot for a specific keyword
   */
  async getSerpSnapshotForKeyword(
    orgId: string,
    keywordId: string
  ): Promise<SEOSerpSnapshot | null> {
    // Fetch keyword info
    const { data: keyword, error: keywordError } = await this.supabase
      .from('seo_keywords')
      .select('*')
      .eq('id', keywordId)
      .eq('org_id', orgId)
      .single();

    if (keywordError || !keyword) {
      return null;
    }

    // Fetch all SERP results for this keyword
    const { data: results, error: resultsError } = await this.supabase
      .from('seo_serp_results')
      .select('*')
      .eq('keyword_id', keywordId)
      .eq('org_id', orgId)
      .order('rank', { ascending: true });

    if (resultsError) {
      throw new Error(`Failed to fetch SERP results: ${resultsError.message}`);
    }

    if (!results || results.length === 0) {
      // Return empty snapshot
      return {
        keywordId,
        keyword: keyword.keyword,
        results: [],
        topCompetitors: [],
        ourBestRank: null,
        capturedAt: new Date().toISOString(),
      };
    }

    // Map results
    const mappedResults: SEOSerpResult[] = results.map(this.mapSerpResultFromDb);

    // Extract top competitors (competitors with ranks 1-10)
    const topCompetitors = results
      .filter((r) => r.is_competitor && r.rank <= 10)
      .slice(0, 5)
      .map((r) => ({
        domain: this.extractDomain(r.url),
        rank: r.rank,
        url: r.url,
      }));

    // Find our best rank (if we're in the results)
    const ourResults = results.filter((r) => !r.is_competitor);
    const ourBestRank = ourResults.length > 0 ? Math.min(...ourResults.map((r) => r.rank)) : null;

    // Get latest capture time
    const capturedAt =
      results.length > 0
        ? results.reduce((latest, r) =>
            new Date(r.last_seen_at) > new Date(latest) ? r.last_seen_at : latest
          , results[0].last_seen_at)
        : new Date().toISOString();

    return {
      keywordId,
      keyword: keyword.keyword,
      results: mappedResults,
      topCompetitors,
      ourBestRank,
      capturedAt,
    };
  }

  /**
   * Get competitor gap analysis for a keyword
   */
  async getCompetitorDiff(orgId: string, keywordId: string): Promise<CompetitorGap[]> {
    // Get SERP snapshot
    const snapshot = await this.getSerpSnapshotForKeyword(orgId, keywordId);

    if (!snapshot || snapshot.results.length === 0) {
      return [];
    }

    // Build gap analysis
    const gaps: CompetitorGap[] = [];
    const ourBestRank = snapshot.ourBestRank;

    // Focus on top 10 competitors
    const topCompetitorResults = snapshot.results
      .filter((r) => r.isCompetitor && r.rank <= 10)
      .slice(0, 5);

    for (const result of topCompetitorResults) {
      const domain = this.extractDomain(result.url);
      let gapExplanation: string;

      if (!ourBestRank) {
        gapExplanation = `${domain} ranks at position ${result.rank}. We're not currently ranking for this keyword.`;
      } else if (result.rank < ourBestRank) {
        const gap = ourBestRank - result.rank;
        gapExplanation = `${domain} ranks ${gap} position${gap !== 1 ? 's' : ''} ahead of us (position ${result.rank} vs ${ourBestRank}).`;
      } else {
        gapExplanation = `${domain} ranks at position ${result.rank}. We're outranking them at position ${ourBestRank}.`;
      }

      gaps.push({
        domain,
        rank: result.rank,
        url: result.url,
        title: result.title,
        ourRank: ourBestRank,
        gapExplanation,
      });
    }

    return gaps;
  }

  /**
   * Create or update SERP results (for future SERP scraping integration)
   */
  async upsertSerpResults(
    orgId: string,
    keywordId: string,
    results: Array<{
      url: string;
      title?: string;
      snippet?: string;
      rank: number;
      isCompetitor?: boolean;
    }>
  ): Promise<void> {
    // First, verify the keyword exists and belongs to this org
    const { data: keyword, error: keywordError } = await this.supabase
      .from('seo_keywords')
      .select('id')
      .eq('id', keywordId)
      .eq('org_id', orgId)
      .single();

    if (keywordError || !keyword) {
      throw new Error('Keyword not found or access denied');
    }

    // Insert or update SERP results
    const serpRecords = results.map((r) => ({
      org_id: orgId,
      keyword_id: keywordId,
      url: r.url,
      title: r.title || null,
      snippet: r.snippet || null,
      rank: r.rank,
      is_competitor: r.isCompetitor !== undefined ? r.isCompetitor : true,
      last_seen_at: new Date().toISOString(),
    }));

    const { error: insertError } = await this.supabase
      .from('seo_serp_results')
      .upsert(serpRecords, {
        onConflict: 'org_id,keyword_id,url',
        ignoreDuplicates: false,
      });

    if (insertError) {
      throw new Error(`Failed to upsert SERP results: ${insertError.message}`);
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private mapSerpResultFromDb(row: any): SEOSerpResult {
    return {
      id: row.id,
      orgId: row.org_id,
      keywordId: row.keyword_id,
      url: row.url,
      title: row.title,
      snippet: row.snippet,
      rank: row.rank,
      isCompetitor: row.is_competitor,
      competitorId: row.competitor_id,
      snapshotId: row.snapshot_id,
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
}
