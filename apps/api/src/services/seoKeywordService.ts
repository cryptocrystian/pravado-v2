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
  enrichKeyword(
    orgId: string,
    keyword: SEOKeyword
  ): Promise<SEOKeywordMetric | null>;
  batchEnrichKeywords(
    orgId: string,
    keywords: SEOKeyword[]
  ): Promise<SEOKeywordMetric[]>;
}

/**
 * StubKeywordProvider — DEV / TEST ONLY. NEVER selectable in production.
 *
 * Fabricates metrics from `Math.random` + string heuristics. This data is
 * INVENTED and must never reach a live user surface. It is reachable only via
 * the explicit `SEO_KEYWORD_PROVIDER=stub` escape hatch in `resolveKeywordProvider`,
 * and that escape hatch is hard-ignored when `NODE_ENV === 'production'`.
 *
 * Honest data is the prime constraint (canon SEO_AEO_PILLAR_CANON — "measure vs.
 * build": buy real commodity Layer-1 data, never synthesize it). The production
 * factory returns DataForSEO (real bought data) or the Null provider (no data) —
 * never this class.
 */
export class StubKeywordProvider implements KeywordProvider {
  async enrichKeyword(
    orgId: string,
    keyword: SEOKeyword
  ): Promise<SEOKeywordMetric | null> {
    // Generate mock metrics based on keyword characteristics
    const keywordLength = keyword.keyword.length;
    const wordCount = keyword.keyword.split(' ').length;

    // Simple heuristics for stub data
    const searchVolume =
      wordCount === 1 ? 10000 : wordCount === 2 ? 5000 : 2000;
    const difficulty = Math.min(100, keywordLength * 3 + wordCount * 5);
    const cpc = parseFloat((wordCount * 0.5 + Math.random() * 2).toFixed(2));
    const clickThroughRate = parseFloat((5 + Math.random() * 15).toFixed(2));

    // Calculate priority score (higher search volume + lower difficulty = higher priority)
    const priorityScore = parseFloat(
      Math.min(
        100,
        (searchVolume / 100) * 0.4 + (100 - difficulty) * 0.6
      ).toFixed(2)
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

/**
 * NullKeywordProvider — the honest production default when NO real data source
 * is configured. Returns `null` / `[]` (no metrics) rather than inventing any.
 *
 * This is the mechanism that GUARANTEES no fabricated data reaches a surface:
 * absent DataForSEO credentials, the factory hands back this provider, so
 * enrichment simply produces nothing — an empty, honest state.
 */
export class NullKeywordProvider implements KeywordProvider {
  async enrichKeyword(): Promise<SEOKeywordMetric | null> {
    return null;
  }

  async batchEnrichKeywords(): Promise<SEOKeywordMetric[]> {
    return [];
  }
}

// ========================================
// DATAFORSEO PROVIDER (real bought Layer-1 data)
// ========================================

/**
 * Minimal HTTP response shape the DataForSEO provider depends on. Kept narrow so
 * the transport is trivially mockable in unit tests (no real network).
 */
export interface KeywordHttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

/**
 * Injectable fetch seam. Defaults to global `fetch`; unit tests pass a mock so
 * the mapping + honest-degradation logic can be verified without a network call.
 */
export type KeywordFetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<KeywordHttpResponse>;

const defaultKeywordFetch: KeywordFetchLike = (url, init) =>
  fetch(url, init) as unknown as Promise<KeywordHttpResponse>;

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

export interface DataForSEOProviderOptions {
  /** DataForSEO base URL. Defaults to the production v3 REST base. */
  baseUrl?: string;
  /** Location code for volume/CPC (default 2840 = United States). */
  locationCode?: number;
  /** Language code (default 'en'). */
  languageCode?: string;
}

/** DataForSEO "success" status code (per API envelope). */
const DATAFORSEO_OK = 20000;

/**
 * DataForSEOKeywordProvider — calls DataForSEO Labs to fetch REAL commodity
 * Layer-1 keyword metrics (search volume, keyword difficulty, CPC) and maps them
 * to `SEOKeywordMetric` with `source: 'external_api'`.
 *
 * Endpoint used: POST `${base}dataforseo_labs/google/keyword_overview/live`
 *   - returns `keyword_info.search_volume`, `keyword_info.cpc`
 *   - returns `keyword_properties.keyword_difficulty`
 *
 * INERT-SAFE contract:
 *   - Only ever constructed by the factory when credentials are present.
 *   - On ANY failure (network throw, non-2xx, unexpected envelope, missing
 *     fields) it degrades HONESTLY — returns null / empty and logs. It NEVER
 *     fabricates and NEVER falls back to the stub.
 */
export class DataForSEOKeywordProvider implements KeywordProvider {
  private readonly baseUrl: string;
  private readonly locationCode: number;
  private readonly languageCode: string;

  constructor(
    private readonly credentials: DataForSEOCredentials,
    private readonly fetchImpl: KeywordFetchLike = defaultKeywordFetch,
    options: DataForSEOProviderOptions = {}
  ) {
    // Normalize base URL to always end with a single trailing slash.
    const base = options.baseUrl ?? 'https://api.dataforseo.com/v3/';
    this.baseUrl = base.endsWith('/') ? base : `${base}/`;
    this.locationCode = options.locationCode ?? 2840;
    this.languageCode = options.languageCode ?? 'en';
  }

  async enrichKeyword(
    orgId: string,
    keyword: SEOKeyword
  ): Promise<SEOKeywordMetric | null> {
    const [metric] = await this.fetchOverview(orgId, [keyword]);
    return metric ?? null;
  }

  async batchEnrichKeywords(
    orgId: string,
    keywords: SEOKeyword[]
  ): Promise<SEOKeywordMetric[]> {
    if (keywords.length === 0) {
      return [];
    }
    return this.fetchOverview(orgId, keywords);
  }

  private authHeader(): string {
    const token = Buffer.from(
      `${this.credentials.login}:${this.credentials.password}`
    ).toString('base64');
    return `Basic ${token}`;
  }

  private async fetchOverview(
    orgId: string,
    keywords: SEOKeyword[]
  ): Promise<SEOKeywordMetric[]> {
    const url = `${this.baseUrl}dataforseo_labs/google/keyword_overview/live`;
    const body = JSON.stringify([
      {
        keywords: keywords.map((k) => k.keyword),
        location_code: this.locationCode,
        language_code: this.languageCode,
      },
    ]);

    let payload: any;
    try {
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!res.ok) {
        // Honest degradation: log and return no data (never fabricate).
        console.warn(
          `[DataForSEOKeywordProvider] HTTP ${res.status} from keyword_overview — degrading to no data`
        );
        return [];
      }

      payload = await res.json();
    } catch (err) {
      console.warn(
        '[DataForSEOKeywordProvider] request failed — degrading to no data (no fabrication)',
        err
      );
      return [];
    }

    const task = payload?.tasks?.[0];
    if (
      !task ||
      task.status_code !== DATAFORSEO_OK ||
      !Array.isArray(task.result)
    ) {
      console.warn(
        '[DataForSEOKeywordProvider] unexpected task envelope — degrading to no data',
        task?.status_code,
        task?.status_message
      );
      return [];
    }

    // Map returned items back to the requested keyword rows by keyword string.
    const byKeyword = new Map(
      keywords.map((k) => [k.keyword.toLowerCase(), k])
    );

    const metrics: SEOKeywordMetric[] = [];
    for (const result of task.result) {
      const items = Array.isArray(result?.items) ? result.items : [];
      for (const item of items) {
        const source = byKeyword.get(String(item?.keyword ?? '').toLowerCase());
        if (!source) {
          continue;
        }
        const metric = this.mapItem(orgId, source, item);
        if (metric) {
          metrics.push(metric);
        }
      }
    }
    return metrics;
  }

  private mapItem(
    orgId: string,
    keyword: SEOKeyword,
    item: any
  ): SEOKeywordMetric | null {
    const info = item?.keyword_info ?? {};
    const props = item?.keyword_properties ?? {};

    const searchVolume =
      typeof info.search_volume === 'number' ? info.search_volume : null;
    const difficulty =
      typeof props.keyword_difficulty === 'number'
        ? props.keyword_difficulty
        : null;
    const cpc =
      typeof info.cpc === 'number' ? parseFloat(info.cpc.toFixed(2)) : null;

    // priorityScore is a DETERMINISTIC transform of the real bought values —
    // no randomness. Null when either input is missing (never invented).
    const priorityScore =
      searchVolume !== null && difficulty !== null
        ? parseFloat(
            Math.min(
              100,
              (searchVolume / 100) * 0.4 + (100 - difficulty) * 0.6
            ).toFixed(2)
          )
        : null;

    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      orgId,
      keywordId: keyword.id,
      source: 'external_api',
      searchVolume,
      difficulty,
      cpc,
      // DataForSEO does not provide CTR — honest null, never fabricated.
      clickThroughRate: null,
      priorityScore,
      lastRefreshedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }
}

// ========================================
// PROVIDER FACTORY / SELECTION
// ========================================

export interface KeywordProviderConfig {
  /** DataForSEO API login (env DATAFORSEO_LOGIN). */
  dataForSeoLogin?: string;
  /** DataForSEO API password (env DATAFORSEO_PASSWORD). */
  dataForSeoPassword?: string;
  /** Process NODE_ENV — production hard-disables the stub escape hatch. */
  nodeEnv?: string;
  /**
   * Internal dev/test escape hatch (env SEO_KEYWORD_PROVIDER). Only value with
   * an effect is 'stub', and only outside production. NOT a user-facing surface
   * flag — surface wiring (SEO_*_WIRED / ANALYTICS_SEO_WIRED) is untouched here.
   */
  providerOverride?: string;
}

export interface ResolveKeywordProviderDeps {
  /** Injectable transport for the DataForSEO provider (tests pass a mock). */
  fetchImpl?: KeywordFetchLike;
}

/** Read provider config from the environment (lazily, at call time). */
export function keywordProviderConfigFromEnv(): KeywordProviderConfig {
  return {
    dataForSeoLogin: process.env.DATAFORSEO_LOGIN,
    dataForSeoPassword: process.env.DATAFORSEO_PASSWORD,
    nodeEnv: process.env.NODE_ENV,
    providerOverride: process.env.SEO_KEYWORD_PROVIDER,
  };
}

/**
 * resolveKeywordProvider — the SINGLE runtime seam that decides which keyword
 * provider is active. Selection order:
 *
 *   1. SEO_KEYWORD_PROVIDER=stub  → StubKeywordProvider — DEV/TEST ONLY, and
 *      HARD-IGNORED in production. This is the only path to the fabricating stub.
 *   2. DataForSEO credentials set → DataForSEOKeywordProvider (real bought data).
 *   3. Otherwise                  → NullKeywordProvider (NO data — honest empty).
 *
 * Guarantee: through this factory, no `Math.random` value can reach a live
 * surface. In production, the stub branch is skipped entirely; with no creds the
 * result is the Null provider, never the stub.
 */
export function resolveKeywordProvider(
  cfg: KeywordProviderConfig = keywordProviderConfigFromEnv(),
  deps: ResolveKeywordProviderDeps = {}
): KeywordProvider {
  const login = cfg.dataForSeoLogin?.trim();
  const password = cfg.dataForSeoPassword?.trim();
  const isProduction = cfg.nodeEnv === 'production';

  // (1) Dev/test-only stub escape hatch — NEVER honored in production.
  if (cfg.providerOverride === 'stub') {
    if (isProduction) {
      console.warn(
        '[resolveKeywordProvider] SEO_KEYWORD_PROVIDER=stub ignored in production — fabricated data is never served'
      );
    } else {
      return new StubKeywordProvider();
    }
  }

  // (2) Real bought data when DataForSEO credentials are present.
  if (login && password) {
    return new DataForSEOKeywordProvider({ login, password }, deps.fetchImpl);
  }

  // (3) No credentials → NO data (honest empty state). Never the stub.
  return new NullKeywordProvider();
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
  sortBy?:
    | 'keyword'
    | 'searchVolume'
    | 'difficulty'
    | 'priorityScore'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class SEOKeywordService {
  private keywordProvider: KeywordProvider;

  constructor(
    private supabase: SupabaseClient,
    keywordProvider?: KeywordProvider
  ) {
    // Default to the env-resolved provider (DataForSEO when configured, else the
    // honest Null provider). NEVER defaults to the fabricating stub.
    this.keywordProvider = keywordProvider ?? resolveKeywordProvider();
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
          new Date(metric.last_refreshed_at) >
            new Date(existing.lastRefreshedAt)
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
  async getKeyword(
    orgId: string,
    keywordId: string
  ): Promise<SEOKeywordWithMetrics | null> {
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
      metrics:
        metrics && metrics.length > 0 ? this.mapMetricFromDb(metrics[0]) : null,
    };
  }

  /**
   * Enrich a keyword with metrics using the configured provider
   */
  async enrichKeyword(
    orgId: string,
    keywordId: string
  ): Promise<SEOKeywordMetric | null> {
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
      clickThroughRate: row.click_through_rate
        ? parseFloat(row.click_through_rate)
        : null,
      priorityScore: row.priority_score ? parseFloat(row.priority_score) : null,
      lastRefreshedAt: row.last_refreshed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
