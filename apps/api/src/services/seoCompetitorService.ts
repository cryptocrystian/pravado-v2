/**
 * SEO Competitor Service
 * Wave-2: Powers the SEO Competitors surface (Share-of-Voice + competitor
 * positions) from REAL cached SERP data.
 *
 * Two responsibilities, deliberately separated for cost control:
 *
 *   1. POPULATE (write, DELIBERATE + costed) — `refreshCompetitors`. Given the
 *      org's tracked keywords, it fetches live SERPs via the injected
 *      `SerpProvider` (real DataForSEO when creds present; Null → nothing),
 *      derives competitor domains from the organic results themselves, and
 *      persists positions into `seo_serp_results` (+ a `seo_snapshots` parent row
 *      per keyword, + `seo_competitors` upserts). This is the ONLY path that
 *      spends DataForSEO credits and is invoked on-demand, never on read.
 *
 *   2. AGGREGATE (read, cached + free) — `getCompetitorAnalysis`. Reads cached
 *      `seo_serp_results` and computes Share-of-Voice + competitor positions.
 *      Honest-empty (`[]`) when there is no cached data.
 *
 * Honest-data guarantee: with the Null provider (no creds), the populate writes
 * nothing, so reads return an empty analysis. No competitor data is ever
 * fabricated.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { SerpProvider, FetchSerpOptions } from './seoSerpProvider';

// ========================================
// AGGREGATION RESULT TYPES
// ========================================
// Defined locally in the API (this slice is apps/api-scoped). If/when the FE
// de-mock consumes these, they can be promoted into @pravado/types.

/**
 * One Share-of-Voice entry for a domain, computed from cached SERP positions
 * across the org's tracked keywords. Position-weighted (weight = 1 / rank).
 */
export interface SEOShareOfVoiceEntry {
  domain: string;
  /** True when this domain is one of the org's own (owned) domains. */
  isOwned: boolean;
  /** Sum of position weights (1/rank) across all tracked-keyword appearances. */
  score: number;
  /** score as a percentage of the total score across all domains (0-100). */
  sharePct: number;
  /** Number of tracked-keyword organic positions this domain occupies. */
  appearances: number;
}

/**
 * Per-keyword competitor position comparison: the org's own best rank vs each
 * competitor domain's rank for that keyword (topic-delta).
 */
export interface SEOCompetitorPositionEntry {
  keywordId: string;
  keyword: string;
  /** The org's own ranking domain for this keyword, if it ranks. */
  ourDomain: string | null;
  /** The org's own best (lowest) organic rank, or null if not ranking. */
  ourRank: number | null;
  competitors: {
    domain: string;
    rank: number;
    /** ourRank - competitorRank; positive = competitor ranks ahead of us. */
    delta: number | null;
  }[];
}

export interface SEOCompetitorAnalysis {
  shareOfVoice: SEOShareOfVoiceEntry[];
  competitorPositions: SEOCompetitorPositionEntry[];
}

interface TrackedKeywordRow {
  id: string;
  keyword: string;
  tracked_url: string | null;
}

export interface RefreshCompetitorsResult {
  keywordsProcessed: number;
  positionsStored: number;
  competitorsUpserted: number;
  snapshotsCreated: number;
}

export interface RefreshCompetitorsOptions extends FetchSerpOptions {
  /** Cap on how many tracked keywords to refresh in one call (cost control). */
  maxKeywords?: number;
}

/** Top-N organic positions considered for Share-of-Voice. */
const SOV_TOP_N = 10;

export class SEOCompetitorService {
  constructor(private supabase: SupabaseClient) {}

  // ========================================
  // POPULATE (write side — costs DataForSEO credits)
  // ========================================

  /**
   * Refresh cached SERP/competitor data for an org's tracked keywords.
   *
   * Cost control: this is the ONLY method that calls the SERP provider (each
   * keyword = one paid DataForSEO call). It is meant to run behind a deliberate
   * on-demand endpoint or guarded batch — never on a read path. `maxKeywords`
   * caps spend per invocation.
   *
   * With the Null provider (no creds) every `fetchSerp` returns `[]`, so nothing
   * is written and the result counts are all zero — an honest no-op.
   */
  async refreshCompetitors(
    orgId: string,
    provider: SerpProvider,
    options: RefreshCompetitorsOptions = {}
  ): Promise<RefreshCompetitorsResult> {
    const { maxKeywords, ...serpOptions } = options;

    const { data: keywordRows, error: keywordError } = await this.supabase
      .from('seo_keywords')
      .select('id, keyword, tracked_url')
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (keywordError) {
      throw new Error(`Failed to fetch keywords: ${keywordError.message}`);
    }

    const keywords: TrackedKeywordRow[] = (keywordRows ?? []).filter(
      (k): k is TrackedKeywordRow =>
        typeof k?.keyword === 'string' && k.keyword.trim().length > 0
    );

    // Org's own domains, derived from the tracked URLs on its keywords. A SERP
    // result on one of these domains is "ours"; everything else is a competitor.
    const ownedDomains = new Set<string>();
    for (const k of keywords) {
      const domain = this.extractDomain(k.tracked_url);
      if (domain) {
        ownedDomains.add(domain);
      }
    }

    const limited =
      typeof maxKeywords === 'number' && maxKeywords >= 0
        ? keywords.slice(0, maxKeywords)
        : keywords;

    const result: RefreshCompetitorsResult = {
      keywordsProcessed: 0,
      positionsStored: 0,
      competitorsUpserted: 0,
      snapshotsCreated: 0,
    };

    for (const kw of limited) {
      const positions = await provider.fetchSerp(kw.keyword, serpOptions);
      result.keywordsProcessed += 1;

      if (positions.length === 0) {
        // Honest no-op for this keyword (Null provider or genuinely empty SERP).
        continue;
      }

      // Classify ownership from the organic domains themselves.
      const ourPositions = positions.filter((p) => ownedDomains.has(p.domain));
      const competitorPositions = positions.filter(
        (p) => !ownedDomains.has(p.domain)
      );

      const ourBestRank =
        ourPositions.length > 0
          ? Math.min(...ourPositions.map((p) => p.rankAbsolute))
          : null;
      const ourUrl =
        ourPositions.length > 0
          ? ourPositions.reduce((best, p) =>
              p.rankAbsolute < best.rankAbsolute ? p : best
            ).url
          : null;

      // (1) Create the snapshot parent row for this capture.
      const { data: snapshot, error: snapshotError } = await this.supabase
        .from('seo_snapshots')
        .insert({
          org_id: orgId,
          seo_keyword_id: kw.id,
          position: ourBestRank,
          our_url: ourUrl,
          competitor_urls: competitorPositions.map((p) => p.url),
          serp_data: {
            source: 'dataforseo_serp',
            fetchedAt: new Date().toISOString(),
            organicCount: positions.length,
          },
        })
        .select('id')
        .single();

      if (snapshotError || !snapshot) {
        throw new Error(
          `Failed to create SERP snapshot: ${snapshotError?.message ?? 'unknown error'}`
        );
      }
      result.snapshotsCreated += 1;

      // (2) Upsert the competitor domains that appeared (the de-facto
      //     competitors ranking for this org's keywords) and map domain → id.
      const competitorDomains = Array.from(
        new Set(competitorPositions.map((p) => p.domain))
      );
      const domainToCompetitorId = new Map<string, string>();
      if (competitorDomains.length > 0) {
        const { data: upserted, error: competitorError } = await this.supabase
          .from('seo_competitors')
          .upsert(
            competitorDomains.map((domain) => ({ org_id: orgId, domain })),
            { onConflict: 'org_id,domain', ignoreDuplicates: false }
          )
          .select('id, domain');

        if (competitorError) {
          throw new Error(
            `Failed to upsert competitors: ${competitorError.message}`
          );
        }
        for (const row of upserted ?? []) {
          domainToCompetitorId.set(row.domain, row.id);
          result.competitorsUpserted += 1;
        }
      }

      // (3) Replace this keyword's cached positions with the fresh capture.
      const { error: deleteError } = await this.supabase
        .from('seo_serp_results')
        .delete()
        .eq('org_id', orgId)
        .eq('keyword_id', kw.id);

      if (deleteError) {
        throw new Error(
          `Failed to clear stale SERP results: ${deleteError.message}`
        );
      }

      const now = new Date().toISOString();
      const serpRows = positions.map((p) => {
        const isCompetitor = !ownedDomains.has(p.domain);
        return {
          org_id: orgId,
          keyword_id: kw.id,
          url: p.url,
          title: p.title,
          snippet: null,
          rank: p.rankAbsolute,
          is_competitor: isCompetitor,
          competitor_id: isCompetitor
            ? (domainToCompetitorId.get(p.domain) ?? null)
            : null,
          snapshot_id: snapshot.id,
          last_seen_at: now,
        };
      });

      const { error: insertError } = await this.supabase
        .from('seo_serp_results')
        .insert(serpRows);

      if (insertError) {
        throw new Error(`Failed to store SERP results: ${insertError.message}`);
      }
      result.positionsStored += serpRows.length;
    }

    return result;
  }

  // ========================================
  // AGGREGATE (read side — cached, free, honest-empty)
  // ========================================

  /**
   * Compute Share-of-Voice + competitor positions from the org's CACHED SERP
   * results. Never calls the provider (no cost). Returns empty arrays when there
   * is no cached data (honest-empty).
   *
   * Share-of-Voice formula (position-weighted):
   *   For every cached organic position in the top-N (N=10) of a tracked
   *   keyword, a domain earns weight = 1 / rank. A domain's `score` is the sum
   *   of its weights across all tracked keywords; `sharePct` is that score as a
   *   percentage of the total score across all domains. Higher (better) ranks
   *   are worth more, and a domain ranking for many keywords accumulates more
   *   share — mirroring how SoV is normally modelled.
   */
  async getCompetitorAnalysis(orgId: string): Promise<SEOCompetitorAnalysis> {
    const { data: serpRows, error: serpError } = await this.supabase
      .from('seo_serp_results')
      .select('keyword_id, url, title, rank, is_competitor')
      .eq('org_id', orgId);

    if (serpError) {
      throw new Error(`Failed to fetch SERP results: ${serpError.message}`);
    }

    if (!serpRows || serpRows.length === 0) {
      return { shareOfVoice: [], competitorPositions: [] };
    }

    // Map keywordId → keyword string (org-scoped).
    const { data: keywordRows, error: keywordError } = await this.supabase
      .from('seo_keywords')
      .select('id, keyword')
      .eq('org_id', orgId);

    if (keywordError) {
      throw new Error(`Failed to fetch keywords: ${keywordError.message}`);
    }

    const keywordName = new Map<string, string>();
    for (const k of keywordRows ?? []) {
      keywordName.set(k.id, k.keyword);
    }

    const shareOfVoice = this.computeShareOfVoice(serpRows);
    const competitorPositions = this.computeCompetitorPositions(
      serpRows,
      keywordName
    );

    return { shareOfVoice, competitorPositions };
  }

  // ========================================
  // AGGREGATION HELPERS
  // ========================================

  private computeShareOfVoice(rows: any[]): SEOShareOfVoiceEntry[] {
    interface Acc {
      domain: string;
      isOwned: boolean;
      score: number;
      appearances: number;
    }
    const byDomain = new Map<string, Acc>();
    let totalScore = 0;

    for (const row of rows) {
      const rank = Number(row.rank);
      if (!Number.isFinite(rank) || rank <= 0 || rank > SOV_TOP_N) {
        continue;
      }
      const domain = this.extractDomain(row.url);
      if (!domain) {
        continue;
      }
      const isOwned = row.is_competitor === false;
      const weight = 1 / rank;
      totalScore += weight;

      const existing = byDomain.get(domain);
      if (existing) {
        existing.score += weight;
        existing.appearances += 1;
        // Once owned, always owned for this domain.
        existing.isOwned = existing.isOwned || isOwned;
      } else {
        byDomain.set(domain, {
          domain,
          isOwned,
          score: weight,
          appearances: 1,
        });
      }
    }

    const entries: SEOShareOfVoiceEntry[] = Array.from(byDomain.values()).map(
      (a) => ({
        domain: a.domain,
        isOwned: a.isOwned,
        score: parseFloat(a.score.toFixed(4)),
        sharePct:
          totalScore > 0
            ? parseFloat(((a.score / totalScore) * 100).toFixed(2))
            : 0,
        appearances: a.appearances,
      })
    );

    // Highest share first.
    entries.sort((a, b) => b.score - a.score);
    return entries;
  }

  private computeCompetitorPositions(
    rows: any[],
    keywordName: Map<string, string>
  ): SEOCompetitorPositionEntry[] {
    // Group rows by keyword.
    const byKeyword = new Map<string, any[]>();
    for (const row of rows) {
      const list = byKeyword.get(row.keyword_id) ?? [];
      list.push(row);
      byKeyword.set(row.keyword_id, list);
    }

    const entries: SEOCompetitorPositionEntry[] = [];
    for (const [keywordId, keywordRows] of byKeyword) {
      const ourRows = keywordRows.filter((r) => r.is_competitor === false);
      const ourBest =
        ourRows.length > 0
          ? ourRows.reduce((best, r) =>
              Number(r.rank) < Number(best.rank) ? r : best
            )
          : null;
      const ourRank = ourBest ? Number(ourBest.rank) : null;
      const ourDomain = ourBest ? this.extractDomain(ourBest.url) : null;

      // Best (lowest) rank per competitor domain.
      const bestByDomain = new Map<string, number>();
      for (const r of keywordRows) {
        if (r.is_competitor === false) {
          continue;
        }
        const domain = this.extractDomain(r.url);
        if (!domain) {
          continue;
        }
        const rank = Number(r.rank);
        if (!Number.isFinite(rank)) {
          continue;
        }
        const prev = bestByDomain.get(domain);
        if (prev === undefined || rank < prev) {
          bestByDomain.set(domain, rank);
        }
      }

      const competitors = Array.from(bestByDomain.entries())
        .map(([domain, rank]) => ({
          domain,
          rank,
          delta: ourRank !== null ? ourRank - rank : null,
        }))
        .sort((a, b) => a.rank - b.rank);

      entries.push({
        keywordId,
        keyword: keywordName.get(keywordId) ?? '',
        ourDomain,
        ourRank,
        competitors,
      });
    }

    // Stable-ish ordering by keyword name for predictable output.
    entries.sort((a, b) => a.keyword.localeCompare(b.keyword));
    return entries;
  }

  private extractDomain(url: string | null): string {
    if (!url) {
      return '';
    }
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      // Not a full URL — treat a bare hostname as-is (strip leading www).
      const trimmed = url.trim().replace(/^www\./, '');
      return /\s/.test(trimmed) ? '' : trimmed;
    }
  }
}
