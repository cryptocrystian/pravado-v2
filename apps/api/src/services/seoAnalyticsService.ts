/**
 * SEO Analytics Service (Wave-2 — Analytics-SEO surface)
 *
 * Aggregates the four Analytics-SEO panels, each from a REAL source and each
 * INDEPENDENTLY honest-empty. This service makes NO new external/paid API calls —
 * it reads ONLY data other paths have already stored.
 *
 * PANELS + REAL SOURCES
 *   1. Engine breakdown — CiteMind. Per-engine citation counts/rate from
 *      `citation_summaries.by_engine` (jsonb) and a per-engine citation velocity
 *      time series from `citation_monitor_results` (engine + brand_mentioned +
 *      monitored_at). Empty until the CiteMind monitor has run for the org.
 *   2. Own-rank summary — GSC/keyword data. Tracked-keyword count, average OWNED
 *      SERP position (`seo_keywords.current_position`) and real search volume
 *      (`seo_keyword_metrics`, source 'gsc'/'external_api', falling back to the
 *      denormalized `seo_keywords.search_volume`). Empty until keywords are
 *      tracked / GSC is connected.
 *   3. Competitive movement — `seo_snapshots.position` over `captured_at`. This is
 *      EMPTY-UNTIL-HISTORY by construction: a single SERP capture yields no delta,
 *      so a keyword needs >= 2 position-bearing snapshots before it can move. NOT
 *      derived from `seo_serp_results` (which is point-in-time and cannot show
 *      movement).
 *   4. Topic-cluster performance — the persisted `seo_keyword_clusters` (migration
 *      113) computed by the SEO Topics surface. READ-ONLY here (no recompute):
 *      real score / avg_position / total_volume / trend, each null when its real
 *      source is absent. Empty until Topics has computed clusters for the org.
 *
 * HONEST-DATA GUARANTEE: every returned number maps to a stored value. When a real
 * source is absent the field is null / the panel is `hasData: false` — never
 * fabricated. Real DB errors are thrown (surfaced by the route), never swallowed
 * into a fake-success empty state.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  SEOTopicClusterService,
  buildTrendData,
  type SeoKeywordCluster,
} from './seoTopicClusterService';

// ============================================================================
// PUBLIC DTO
// ============================================================================

/** One AI engine's citation counts over the window (from citation_summaries). */
export interface EngineStat {
  engine: string;
  queries: number;
  mentions: number;
  /** mentions / queries in [0,1], or null when queries === 0. */
  rate: number | null;
}

/** One point in a per-engine citation velocity series (a date bucket). */
export interface EngineVelocityPoint {
  /** ISO date (YYYY-MM-DD) bucket. */
  period: string;
  /** Per-engine citation (brand-mentioned) counts for that date. */
  [engine: string]: number | string;
}

export interface EngineBreakdownPanel {
  /** Per-engine totals from the org's citation_summaries row (period 30d). */
  engines: EngineStat[];
  /** Per-engine citation counts bucketed by date, ascending. */
  velocity: EngineVelocityPoint[];
  /** The engine keys present across the velocity series (chart series order). */
  velocityEngines: string[];
  /** Aggregate citations/day across all engines (total velocity line). */
  totalVelocity: Array<{ period: string; citations: number }>;
  /** True once the CiteMind monitor has produced any engine data. */
  hasData: boolean;
}

export interface OwnRankSummaryPanel {
  /** Count of the org's tracked keywords. */
  trackedKeywords: number;
  /** How many of those have a known current SERP position. */
  rankedKeywords: number;
  /** Mean of current owned SERP position across ranking keywords, or null. */
  avgPosition: number | null;
  /** Sum of real search volume across keywords with volume data, or null. */
  totalVolume: number | null;
  /** How many keywords carry a GSC-sourced metric. */
  gscKeywords: number;
  /** True once the org tracks at least one keyword. */
  hasData: boolean;
}

/** One keyword's position movement over the snapshot history. */
export interface CompetitiveMover {
  keyword: string;
  /** Position at the earliest capture. */
  earliestPosition: number;
  /** Position at the latest capture. */
  latestPosition: number;
  /** latestPosition - earliestPosition (negative = improved / moved up). */
  delta: number;
  /** How many position-bearing snapshots this keyword has (>= 2). */
  snapshotCount: number;
}

export interface CompetitiveMovementPanel {
  /** Keywords with >= 2 snapshots and a computable delta (biggest move first). */
  movers: CompetitiveMover[];
  /** Total position-bearing snapshots across the org's keywords. */
  totalSnapshots: number;
  /**
   * True only when at least one keyword has >= 2 snapshots (a real delta). A
   * single refresh cannot establish movement — honest-empty until history exists.
   */
  hasData: boolean;
}

export interface TopicPerformancePanel {
  /** The org's persisted SERP-overlap clusters (read-only, real fields). */
  clusters: SeoKeywordCluster[];
  hasData: boolean;
}

export interface AnalyticsSeoData {
  engineBreakdown: EngineBreakdownPanel;
  summary: OwnRankSummaryPanel;
  competitiveMovement: CompetitiveMovementPanel;
  topicPerformance: TopicPerformancePanel;
}

// ============================================================================
// PURE DERIVATION (unit-tested directly — no DB)
// ============================================================================

/** Metric sources that count as REAL search volume for the summary panel. */
const REAL_VOLUME_SOURCES = new Set(['gsc', 'external_api', 'dataforseo']);

/**
 * Parse the `citation_summaries.by_engine` jsonb into a sorted EngineStat[].
 * Each engine's queries/mentions come straight from the stored aggregate; rate is
 * null when queries === 0 (never a fabricated 0%).
 */
export function deriveEngineStats(byEngine: unknown): EngineStat[] {
  if (!byEngine || typeof byEngine !== 'object' || Array.isArray(byEngine)) {
    return [];
  }
  const out: EngineStat[] = [];
  for (const [engine, raw] of Object.entries(
    byEngine as Record<string, unknown>
  )) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    const queries = Number(rec.queries);
    const mentions = Number(rec.mentions);
    if (!Number.isFinite(queries) && !Number.isFinite(mentions)) continue;
    const q = Number.isFinite(queries) ? queries : 0;
    const m = Number.isFinite(mentions) ? mentions : 0;
    out.push({
      engine,
      queries: q,
      mentions: m,
      rate: q > 0 ? m / q : null,
    });
  }
  // Highest citation volume first; ties broken by engine name for determinism.
  out.sort(
    (a, b) => b.mentions - a.mentions || a.engine.localeCompare(b.engine)
  );
  return out;
}

interface MonitorResultRow {
  engine: string;
  brand_mentioned: boolean;
  monitored_at: string | null;
}

/**
 * Bucket citation-monitor results into a per-engine velocity series by capture
 * DATE. A "citation" is a brand_mentioned=true result — the same definition the
 * summary uses. Rows without a monitored_at date are ignored (they cannot be
 * placed on a time axis). Returns ascending-by-date points plus the engine keys
 * present and an aggregate (all-engine) citations/day line.
 */
export function deriveEngineVelocity(rows: MonitorResultRow[]): {
  velocity: EngineVelocityPoint[];
  engines: string[];
  totalVelocity: Array<{ period: string; citations: number }>;
} {
  const engineSet = new Set<string>();
  // date -> engine -> count of citations
  const byDate = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (!row.brand_mentioned) continue; // only actual citations
    const at = typeof row.monitored_at === 'string' ? row.monitored_at : '';
    const date = at.slice(0, 10);
    if (!date) continue;
    const engine = typeof row.engine === 'string' ? row.engine : '';
    if (!engine) continue;
    engineSet.add(engine);
    let perEngine = byDate.get(date);
    if (!perEngine) {
      perEngine = new Map();
      byDate.set(date, perEngine);
    }
    perEngine.set(engine, (perEngine.get(engine) ?? 0) + 1);
  }

  const engines = [...engineSet].sort();
  const dates = [...byDate.keys()].sort();

  const velocity: EngineVelocityPoint[] = dates.map((date) => {
    const point: EngineVelocityPoint = { period: date };
    const perEngine = byDate.get(date)!;
    for (const engine of engines) {
      point[engine] = perEngine.get(engine) ?? 0;
    }
    return point;
  });

  const totalVelocity = dates.map((date) => {
    const perEngine = byDate.get(date)!;
    let citations = 0;
    for (const c of perEngine.values()) citations += c;
    return { period: date, citations };
  });

  return { velocity, engines, totalVelocity };
}

interface KeywordRow {
  id: string;
  keyword?: string | null;
  current_position?: number | null;
  search_volume?: number | null;
  status?: string | null;
}

interface KeywordMetricRow {
  keyword_id: string;
  source?: string | null;
  search_volume?: number | null;
  last_refreshed_at?: string | null;
}

/**
 * Own-rank summary from the org's tracked keywords + real metric volume. Average
 * position is the mean of the keywords that actually rank (null when none rank);
 * total volume prefers the latest real-sourced metric and falls back to the
 * denormalized keyword volume, summing only real values (null when none exist).
 */
export function deriveOwnRankSummary(
  keywords: KeywordRow[],
  metrics: KeywordMetricRow[]
): OwnRankSummaryPanel {
  const trackedKeywords = keywords.length;

  // Latest real-sourced volume per keyword (preferred over the denormalized col).
  const latestMetricAt = new Map<string, string>();
  const metricVolume = new Map<string, number>();
  const gscKeywordIds = new Set<string>();
  for (const m of metrics) {
    if (m.source === 'gsc') gscKeywordIds.add(m.keyword_id);
    if (
      typeof m.search_volume !== 'number' ||
      !Number.isFinite(m.search_volume) ||
      !(m.source && REAL_VOLUME_SOURCES.has(m.source))
    ) {
      continue;
    }
    const at = m.last_refreshed_at ?? '';
    const prev = latestMetricAt.get(m.keyword_id);
    if (prev === undefined || at > prev) {
      latestMetricAt.set(m.keyword_id, at);
      metricVolume.set(m.keyword_id, m.search_volume);
    }
  }

  const positions: number[] = [];
  const volumes: number[] = [];
  for (const k of keywords) {
    if (
      typeof k.current_position === 'number' &&
      Number.isFinite(k.current_position)
    ) {
      positions.push(k.current_position);
    }
    const metricVol = metricVolume.get(k.id);
    if (typeof metricVol === 'number') {
      volumes.push(metricVol);
    } else if (
      typeof k.search_volume === 'number' &&
      Number.isFinite(k.search_volume)
    ) {
      volumes.push(k.search_volume);
    }
  }

  const avgPosition =
    positions.length > 0
      ? parseFloat(
          (positions.reduce((s, p) => s + p, 0) / positions.length).toFixed(2)
        )
      : null;
  const totalVolume =
    volumes.length > 0 ? volumes.reduce((s, v) => s + v, 0) : null;

  return {
    trackedKeywords,
    rankedKeywords: positions.length,
    avgPosition,
    totalVolume,
    gscKeywords: gscKeywordIds.size,
    hasData: trackedKeywords > 0,
  };
}

interface SnapshotRow {
  seo_keyword_id: string;
  captured_at: string | null;
  position: number | null;
}

/**
 * Competitive (own-position) movement from snapshot history. Reuses buildTrendData
 * (the same earliest/latest reduction the Topics trend uses). A keyword only moves
 * when it has >= 2 position-bearing snapshots; with fewer there is no delta and it
 * is omitted (honest-empty until history accumulates). Movers are sorted by the
 * magnitude of their move, biggest first.
 */
export function deriveCompetitiveMovement(
  snapshotRows: SnapshotRow[],
  keywordName: Map<string, string>
): CompetitiveMovementPanel {
  const trend = buildTrendData(snapshotRows);

  let totalSnapshots = 0;
  const movers: CompetitiveMover[] = [];
  for (const [keywordId, t] of trend) {
    totalSnapshots += t.snapshotCount;
    if (
      t.snapshotCount >= 2 &&
      t.earliestPosition !== null &&
      t.latestPosition !== null
    ) {
      movers.push({
        keyword: keywordName.get(keywordId) ?? keywordId,
        earliestPosition: t.earliestPosition,
        latestPosition: t.latestPosition,
        delta: t.latestPosition - t.earliestPosition,
        snapshotCount: t.snapshotCount,
      });
    }
  }

  // Biggest absolute move first; ties broken by keyword for determinism.
  movers.sort(
    (a, b) =>
      Math.abs(b.delta) - Math.abs(a.delta) ||
      a.keyword.localeCompare(b.keyword)
  );

  return {
    movers,
    totalSnapshots,
    hasData: movers.length > 0,
  };
}

// ============================================================================
// SERVICE (DB I/O — reads stored data only)
// ============================================================================

export class SEOAnalyticsService {
  private topicClusterService: SEOTopicClusterService;

  constructor(
    private supabase: SupabaseClient,
    topicClusterService?: SEOTopicClusterService
  ) {
    this.topicClusterService =
      topicClusterService ?? new SEOTopicClusterService(supabase);
  }

  /**
   * Aggregate all four Analytics-SEO panels for an org. Every read is org-scoped.
   * Makes NO external calls. Each panel is independently honest-empty; a real DB
   * error is thrown (never swallowed into a fake-success empty state).
   *
   * @param orgId  caller's organization id
   * @param days   citation velocity window (default 30) for the engine panel
   */
  async getAnalytics(orgId: string, days = 30): Promise<AnalyticsSeoData> {
    const [engineBreakdown, summary, competitiveMovement, topicPerformance] =
      await Promise.all([
        this.getEngineBreakdown(orgId, days),
        this.getOwnRankSummary(orgId),
        this.getCompetitiveMovement(orgId),
        this.getTopicPerformance(orgId),
      ]);

    return { engineBreakdown, summary, competitiveMovement, topicPerformance };
  }

  private async getEngineBreakdown(
    orgId: string,
    days: number
  ): Promise<EngineBreakdownPanel> {
    // Per-engine totals from the cached summary (period 30d aggregate).
    const { data: summaryRow, error: summaryError } = await this.supabase
      .from('citation_summaries')
      .select('by_engine')
      .eq('org_id', orgId)
      .eq('period_days', 30)
      .maybeSingle();

    if (summaryError) {
      throw new Error(
        `Failed to fetch citation summary: ${summaryError.message}`
      );
    }

    const engines = deriveEngineStats(summaryRow?.by_engine);

    // Per-engine velocity from individual monitor results within the window.
    const cutoff = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: monitorRows, error: monitorError } = await this.supabase
      .from('citation_monitor_results')
      .select('engine, brand_mentioned, monitored_at')
      .eq('org_id', orgId)
      .gte('monitored_at', cutoff)
      .order('monitored_at', { ascending: true });

    if (monitorError) {
      throw new Error(
        `Failed to fetch citation results: ${monitorError.message}`
      );
    }

    const {
      velocity,
      engines: velocityEngines,
      totalVelocity,
    } = deriveEngineVelocity((monitorRows ?? []) as MonitorResultRow[]);

    const hasData = engines.length > 0 || velocity.length > 0;

    return { engines, velocity, velocityEngines, totalVelocity, hasData };
  }

  private async getOwnRankSummary(orgId: string): Promise<OwnRankSummaryPanel> {
    const { data: keywordRows, error: keywordError } = await this.supabase
      .from('seo_keywords')
      .select('id, keyword, current_position, search_volume, status')
      .eq('org_id', orgId);

    if (keywordError) {
      throw new Error(`Failed to fetch keywords: ${keywordError.message}`);
    }

    const { data: metricRows, error: metricError } = await this.supabase
      .from('seo_keyword_metrics')
      .select('keyword_id, source, search_volume, last_refreshed_at')
      .eq('org_id', orgId);

    if (metricError) {
      throw new Error(
        `Failed to fetch keyword metrics: ${metricError.message}`
      );
    }

    return deriveOwnRankSummary(
      (keywordRows ?? []) as KeywordRow[],
      (metricRows ?? []) as KeywordMetricRow[]
    );
  }

  private async getCompetitiveMovement(
    orgId: string
  ): Promise<CompetitiveMovementPanel> {
    // Keyword names (org-scoped) for labeling movers.
    const { data: keywordRows, error: keywordError } = await this.supabase
      .from('seo_keywords')
      .select('id, keyword')
      .eq('org_id', orgId);

    if (keywordError) {
      throw new Error(`Failed to fetch keywords: ${keywordError.message}`);
    }

    const keywordName = new Map<string, string>();
    for (const k of keywordRows ?? []) {
      if (typeof k.keyword === 'string') keywordName.set(k.id, k.keyword);
    }

    // Snapshot history — the ONLY source that can show movement over time.
    const { data: snapshotRows, error: snapshotError } = await this.supabase
      .from('seo_snapshots')
      .select('seo_keyword_id, captured_at, position')
      .eq('org_id', orgId);

    if (snapshotError) {
      throw new Error(`Failed to fetch snapshots: ${snapshotError.message}`);
    }

    return deriveCompetitiveMovement(
      (snapshotRows ?? []) as SnapshotRow[],
      keywordName
    );
  }

  private async getTopicPerformance(
    orgId: string
  ): Promise<TopicPerformancePanel> {
    // READ-ONLY: the persisted clusters the Topics surface computed. No recompute
    // (that is the Topics surface's job) and no writes here.
    const clusters = await this.topicClusterService.getClusters(orgId);
    return { clusters, hasData: clusters.length > 0 };
  }
}
