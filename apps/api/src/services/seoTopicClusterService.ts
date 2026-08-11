/**
 * SEO Topic Cluster Service
 * Wave-2: Powers the SEO Topics surface by clustering an org's tracked keywords
 * by SERP-RESULT OVERLAP — reusing the SERP data the #156 competitor refresh
 * already cached. Clustering makes NO new DataForSEO calls.
 *
 * HONEST-DATA GUARANTEE
 *   Every cluster and every derived number comes ONLY from data we already store:
 *     - `seo_serp_results`   → the cached organic URLs per keyword (overlap input)
 *     - `seo_serp_results`   → the org's own best rank per keyword (is_competitor=false)
 *     - `seo_keyword_metrics`/`seo_keywords` → real search volume
 *     - `seo_snapshots`      → our captured position over time (trend)
 *   When the real source for a field is absent, the field is `null` — never
 *   fabricated. An org with no cached SERP rows produces NO clusters (honest-empty).
 *
 * ALGORITHM (documented, deterministic, pure where it counts)
 *   1. OVERLAP GRAPH. For each tracked keyword, take its top-N (N=SERP_TOP_N=10)
 *      organic result URLs from `seo_serp_results`. Two keywords are CONNECTED
 *      when they share at least MIN_SHARED_URLS (=3) of those top-N URLs. This is
 *      the classic "SERP overlap" signal: keywords that surface the same ranking
 *      pages are answering the same intent.
 *   2. CLUSTERS = connected components of that graph (union-find). Transitive:
 *      A–B and B–C ⇒ {A,B,C}. A keyword that shares nothing forms a singleton
 *      cluster (still a real, if small, topic).
 *   3. NAME = the cluster's highest-search-volume member keyword (ties / all-null
 *      volume → the lexicographically-smallest keyword, for determinism).
 *   4. avg_position = mean of the org's OWN best organic rank across the members
 *      that actually rank (is_competitor=false rows). `null` if none rank.
 *   5. score = visibility score in [0,100] derived ONLY from avg_position
 *      (rank 1 → 100 … rank ≥ 11 → 0; a deterministic transform of the real mean
 *      owned position). `null` when avg_position is null. Volume is deliberately
 *      NOT blended into the score — any blend weight would be an invented number;
 *      volume is surfaced separately as `total_volume`.
 *   6. total_volume = sum of members' real search volume. `null` if no member has
 *      volume data.
 *   7. trend = sign of the cluster's aggregate position delta from `seo_snapshots`
 *      (earliest vs latest capture per member). `null` when < 2 snapshots exist
 *      across the members — a single capture cannot establish a trend.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ========================================
// TUNABLES (documented thresholds)
// ========================================

/** Top-N organic positions per keyword considered for overlap. */
export const SERP_TOP_N = 10;

/**
 * Minimum number of shared top-N organic URLs for two keywords to be connected.
 * 3 shared ranking pages is the widely-used SERP-overlap clustering threshold.
 */
export const MIN_SHARED_URLS = 3;

// ========================================
// PURE INPUT / OUTPUT TYPES
// ========================================

/** Per-keyword SERP facts extracted from cached rows (pure clustering input). */
export interface KeywordSerpData {
  keywordId: string;
  keyword: string;
  /** Top-N organic result URLs (normalized), used for overlap. */
  urls: string[];
  /** The org's own best (lowest) organic rank for this keyword, or null. */
  ourBestRank: number | null;
  /** Real search volume for this keyword, or null. */
  volume: number | null;
}

/** One earliest/latest position pair for a keyword (trend input). */
export interface KeywordTrendData {
  keywordId: string;
  /** Position at the earliest capture. */
  earliestPosition: number | null;
  /** Position at the latest capture. */
  latestPosition: number | null;
  /** How many snapshots this keyword has. */
  snapshotCount: number;
}

export type ClusterTrend = 'up' | 'down' | 'stable';

/** A computed cluster (matches the seo_keyword_clusters row shape). */
export interface SeoKeywordCluster {
  id: string;
  name: string;
  memberKeywords: string[];
  score: number | null;
  avgPosition: number | null;
  totalVolume: number | null;
  trend: ClusterTrend | null;
  computedAt: string;
}

export interface ComputeClustersResult {
  clusters: SeoKeywordCluster[];
  /** Number of keywords that had cached SERP data and were clustered. */
  keywordsClustered: number;
}

// ========================================
// PURE FUNCTIONS (unit-tested directly)
// ========================================

/** Normalize a URL for overlap comparison: trim, lowercase, strip trailing slash. */
export function normalizeUrl(url: string): string {
  const trimmed = (url ?? '').trim().toLowerCase();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

/** Count how many top-N URLs two keyword URL sets share. */
export function sharedUrlCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  // Iterate the smaller set for efficiency.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const url of small) {
    if (large.has(url)) {
      count += 1;
    }
  }
  return count;
}

/**
 * Cluster keywords by SERP-URL overlap → array of clusters (each an array of
 * keywordIds), using union-find over the "≥ minShared shared top-N URLs" edge.
 * Deterministic: keywords are processed in input order; singletons are included.
 */
export function clusterByOverlap(
  items: KeywordSerpData[],
  minShared: number = MIN_SHARED_URLS
): string[][] {
  const n = items.length;
  const parent = items.map((_, i) => i);

  function find(x: number): number {
    let root = x;
    while (parent[root] !== root) {
      root = parent[root];
    }
    // Path compression.
    let cur = x;
    while (parent[cur] !== root) {
      const next = parent[cur];
      parent[cur] = root;
      cur = next;
    }
    return root;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      // Attach higher index under lower for stable, deterministic roots.
      if (ra < rb) {
        parent[rb] = ra;
      } else {
        parent[ra] = rb;
      }
    }
  }

  // Precompute the top-N URL sets once.
  const urlSets = items.map((it) => new Set(it.urls.map(normalizeUrl)));

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (sharedUrlCount(urlSets[i], urlSets[j]) >= minShared) {
        union(i, j);
      }
    }
  }

  // Group indices by their representative root, preserving first-seen order.
  const groups = new Map<number, string[]>();
  const order: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const root = find(i);
    if (!groups.has(root)) {
      groups.set(root, []);
      order.push(root);
    }
    groups.get(root)!.push(items[i].keywordId);
  }

  return order.map((root) => groups.get(root)!);
}

/**
 * Visibility score in [0,100] from a cluster's mean OWNED SERP position.
 * rank 1 → 100, rank 11+ → 0 (deterministic transform of the real avg position).
 * `null` avg_position → `null` score (we cannot score visibility we don't have).
 */
export function visibilityScoreFromPosition(
  avgPosition: number | null
): number | null {
  if (avgPosition === null || !Number.isFinite(avgPosition)) {
    return null;
  }
  const capped = Math.min(Math.max(avgPosition, 1), 11);
  return Math.round(((11 - capped) / 10) * 100);
}

/**
 * Cluster trend from member snapshot deltas. Aggregates each member's
 * (latest - earliest) position delta (lower rank = better). Requires the cluster
 * to have ≥ 2 snapshots in total across members AND at least one member with a
 * computable delta (≥ 2 of its own snapshots). Otherwise `null` (honest).
 *
 * Sign convention: negative aggregate delta (position improved) → 'up';
 * positive (position worsened) → 'down'; exactly zero → 'stable'.
 */
export function computeClusterTrend(
  members: KeywordTrendData[]
): ClusterTrend | null {
  const totalSnapshots = members.reduce((s, m) => s + m.snapshotCount, 0);
  if (totalSnapshots < 2) {
    return null;
  }

  const deltas: number[] = [];
  for (const m of members) {
    if (
      m.snapshotCount >= 2 &&
      m.earliestPosition !== null &&
      m.latestPosition !== null
    ) {
      deltas.push(m.latestPosition - m.earliestPosition);
    }
  }
  if (deltas.length === 0) {
    return null;
  }

  const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  if (avgDelta < 0) return 'up';
  if (avgDelta > 0) return 'down';
  return 'stable';
}

/**
 * Derive the display metrics for a single cluster from its members' real facts.
 * Pure: given the member keyword data + trend data, returns the persisted shape
 * (minus id/computedAt, which the persistence layer supplies).
 */
export function deriveClusterMetrics(
  memberData: KeywordSerpData[],
  trendData: KeywordTrendData[]
): {
  name: string;
  memberKeywords: string[];
  score: number | null;
  avgPosition: number | null;
  totalVolume: number | null;
  trend: ClusterTrend | null;
} {
  // NAME: highest-volume member; ties / all-null → lexicographically smallest.
  const named = [...memberData].sort((a, b) => {
    const va = a.volume ?? -1;
    const vb = b.volume ?? -1;
    if (vb !== va) return vb - va;
    return a.keyword.localeCompare(b.keyword);
  });
  const name = named[0]?.keyword ?? '';

  const memberKeywords = memberData.map((m) => m.keyword);

  // avg_position: mean of owned best ranks across members that rank.
  const ranks = memberData
    .map((m) => m.ourBestRank)
    .filter((r): r is number => r !== null && Number.isFinite(r));
  const avgPosition =
    ranks.length > 0
      ? parseFloat((ranks.reduce((s, r) => s + r, 0) / ranks.length).toFixed(2))
      : null;

  const score = visibilityScoreFromPosition(avgPosition);

  // total_volume: sum of members' real volume; null if none available.
  const volumes = memberData
    .map((m) => m.volume)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const totalVolume =
    volumes.length > 0 ? volumes.reduce((s, v) => s + v, 0) : null;

  const trend = computeClusterTrend(trendData);

  return { name, memberKeywords, score, avgPosition, totalVolume, trend };
}

// ========================================
// SERVICE (DB I/O — reads cache, persists clusters)
// ========================================

interface SerpRow {
  keyword_id: string;
  url: string;
  rank: number;
  is_competitor: boolean;
}

export class SEOTopicClusterService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Compute the org's topic clusters from CACHED SERP data, persist them
   * (replace-all), and return them. Makes NO external API calls — reads only
   * stored rows. If the org has no cached SERP data, writes NOTHING and returns
   * an honest-empty result.
   */
  async computeClusters(orgId: string): Promise<ComputeClustersResult> {
    // (1) Cached SERP rows for the org (the overlap + owned-rank source).
    const { data: serpRows, error: serpError } = await this.supabase
      .from('seo_serp_results')
      .select('keyword_id, url, rank, is_competitor')
      .eq('org_id', orgId);

    if (serpError) {
      throw new Error(`Failed to fetch SERP results: ${serpError.message}`);
    }

    const rows: SerpRow[] = (serpRows ?? []).filter(
      (r): r is SerpRow =>
        typeof r?.keyword_id === 'string' &&
        typeof r?.url === 'string' &&
        Number.isFinite(Number(r?.rank))
    );

    // HONEST-EMPTY: no cached SERP data → nothing to cluster, write nothing.
    if (rows.length === 0) {
      return { clusters: [], keywordsClustered: 0 };
    }

    // (2) Keyword names + fallback volume (org-scoped).
    const { data: keywordRows, error: keywordError } = await this.supabase
      .from('seo_keywords')
      .select('id, keyword, search_volume')
      .eq('org_id', orgId);

    if (keywordError) {
      throw new Error(`Failed to fetch keywords: ${keywordError.message}`);
    }

    const keywordName = new Map<string, string>();
    const keywordVolume = new Map<string, number | null>();
    for (const k of keywordRows ?? []) {
      keywordName.set(k.id, k.keyword);
      keywordVolume.set(
        k.id,
        typeof k.search_volume === 'number' ? k.search_volume : null
      );
    }

    // (3) Latest real volume per keyword from metrics (preferred over the
    //     denormalized column on seo_keywords when present).
    const { data: metricRows, error: metricError } = await this.supabase
      .from('seo_keyword_metrics')
      .select('keyword_id, search_volume, last_refreshed_at')
      .eq('org_id', orgId);

    if (metricError) {
      throw new Error(
        `Failed to fetch keyword metrics: ${metricError.message}`
      );
    }

    const latestMetricAt = new Map<string, string>();
    for (const m of metricRows ?? []) {
      if (typeof m.search_volume !== 'number') {
        continue;
      }
      const prev = latestMetricAt.get(m.keyword_id);
      const at = m.last_refreshed_at ?? '';
      if (prev === undefined || at > prev) {
        latestMetricAt.set(m.keyword_id, at);
        keywordVolume.set(m.keyword_id, m.search_volume);
      }
    }

    // (4) Snapshots for trend (org-scoped).
    const { data: snapshotRows, error: snapshotError } = await this.supabase
      .from('seo_snapshots')
      .select('seo_keyword_id, captured_at, position')
      .eq('org_id', orgId);

    if (snapshotError) {
      throw new Error(`Failed to fetch snapshots: ${snapshotError.message}`);
    }

    const trendByKeyword = buildTrendData(snapshotRows ?? []);

    // Build per-keyword SERP facts from the cached rows.
    const byKeyword = new Map<
      string,
      { urls: Set<string>; topUrls: string[]; ourBest: number | null }
    >();
    for (const row of rows) {
      const rank = Number(row.rank);
      let entry = byKeyword.get(row.keyword_id);
      if (!entry) {
        entry = { urls: new Set(), topUrls: [], ourBest: null };
        byKeyword.set(row.keyword_id, entry);
      }
      // Only top-N organic URLs contribute to overlap.
      if (rank >= 1 && rank <= SERP_TOP_N) {
        const norm = normalizeUrl(row.url);
        if (!entry.urls.has(norm)) {
          entry.urls.add(norm);
          entry.topUrls.push(norm);
        }
      }
      // Our own best (lowest) organic rank for this keyword.
      if (row.is_competitor === false && Number.isFinite(rank)) {
        if (entry.ourBest === null || rank < entry.ourBest) {
          entry.ourBest = rank;
        }
      }
    }

    const items: KeywordSerpData[] = [];
    for (const [keywordId, entry] of byKeyword) {
      items.push({
        keywordId,
        keyword: keywordName.get(keywordId) ?? keywordId,
        urls: entry.topUrls,
        ourBestRank: entry.ourBest,
        volume: keywordVolume.get(keywordId) ?? null,
      });
    }

    // Cluster + derive metrics.
    const clusterKeywordIds = clusterByOverlap(items);
    const itemById = new Map(items.map((it) => [it.keywordId, it]));

    const computedAt = new Date().toISOString();
    const toInsert = clusterKeywordIds.map((ids) => {
      const memberData = ids
        .map((id) => itemById.get(id))
        .filter((m): m is KeywordSerpData => m !== undefined);
      const trendData = ids.map(
        (id) =>
          trendByKeyword.get(id) ?? {
            keywordId: id,
            earliestPosition: null,
            latestPosition: null,
            snapshotCount: 0,
          }
      );
      const metrics = deriveClusterMetrics(memberData, trendData);
      return {
        org_id: orgId,
        name: metrics.name,
        member_keywords: metrics.memberKeywords,
        score: metrics.score,
        avg_position: metrics.avgPosition,
        total_volume: metrics.totalVolume,
        trend: metrics.trend,
        computed_at: computedAt,
      };
    });

    // Replace-all: clear the org's previous clusters, then insert fresh.
    const { error: deleteError } = await this.supabase
      .from('seo_keyword_clusters')
      .delete()
      .eq('org_id', orgId);

    if (deleteError) {
      throw new Error(`Failed to clear stale clusters: ${deleteError.message}`);
    }

    if (toInsert.length === 0) {
      return { clusters: [], keywordsClustered: items.length };
    }

    const { data: inserted, error: insertError } = await this.supabase
      .from('seo_keyword_clusters')
      .insert(toInsert)
      .select(
        'id, name, member_keywords, score, avg_position, total_volume, trend, computed_at'
      );

    if (insertError) {
      throw new Error(`Failed to persist clusters: ${insertError.message}`);
    }

    const clusters: SeoKeywordCluster[] = (inserted ?? []).map((row) =>
      mapClusterRow(row)
    );
    // Sort by score desc (nulls last), then name, for a stable surface order.
    clusters.sort((a, b) => {
      const sa = a.score ?? -1;
      const sb = b.score ?? -1;
      if (sb !== sa) return sb - sa;
      return a.name.localeCompare(b.name);
    });

    return { clusters, keywordsClustered: items.length };
  }

  /**
   * Read the org's persisted clusters WITHOUT recomputing. Honest-empty (`[]`)
   * when none exist. Used when a caller wants the last computed result only.
   */
  async getClusters(orgId: string): Promise<SeoKeywordCluster[]> {
    const { data, error } = await this.supabase
      .from('seo_keyword_clusters')
      .select(
        'id, name, member_keywords, score, avg_position, total_volume, trend, computed_at'
      )
      .eq('org_id', orgId)
      .order('computed_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch clusters: ${error.message}`);
    }

    return (data ?? []).map((row) => mapClusterRow(row));
  }
}

// ========================================
// HELPERS
// ========================================

/** Map a persisted cluster row to the DTO shape (defensive coercion). */
function mapClusterRow(row: any): SeoKeywordCluster {
  const members = Array.isArray(row.member_keywords)
    ? row.member_keywords.filter(
        (k: unknown): k is string => typeof k === 'string'
      )
    : [];
  return {
    id: String(row.id),
    name: typeof row.name === 'string' ? row.name : '',
    memberKeywords: members,
    score:
      row.score === null || row.score === undefined ? null : Number(row.score),
    avgPosition:
      row.avg_position === null || row.avg_position === undefined
        ? null
        : Number(row.avg_position),
    totalVolume:
      row.total_volume === null || row.total_volume === undefined
        ? null
        : Number(row.total_volume),
    trend:
      row.trend === 'up' || row.trend === 'down' || row.trend === 'stable'
        ? row.trend
        : null,
    computedAt:
      typeof row.computed_at === 'string'
        ? row.computed_at
        : new Date().toISOString(),
  };
}

/**
 * Reduce raw snapshot rows to per-keyword earliest/latest position + count.
 * Rows without a numeric position are ignored for the position pair but still
 * counted toward snapshotCount only if they carry a capture time — we keep the
 * count strict (position-bearing captures) so the < 2 honest-null rule is sound.
 */
export function buildTrendData(
  snapshotRows: Array<{
    seo_keyword_id: string;
    captured_at: string | null;
    position: number | null;
  }>
): Map<string, KeywordTrendData> {
  interface Acc {
    earliestAt: string | null;
    earliestPos: number | null;
    latestAt: string | null;
    latestPos: number | null;
    count: number;
  }
  const acc = new Map<string, Acc>();

  for (const row of snapshotRows) {
    if (typeof row.position !== 'number' || !Number.isFinite(row.position)) {
      continue; // Only position-bearing captures inform a trend.
    }
    const at = row.captured_at ?? '';
    let a = acc.get(row.seo_keyword_id);
    if (!a) {
      a = {
        earliestAt: null,
        earliestPos: null,
        latestAt: null,
        latestPos: null,
        count: 0,
      };
      acc.set(row.seo_keyword_id, a);
    }
    a.count += 1;
    if (a.earliestAt === null || at < a.earliestAt) {
      a.earliestAt = at;
      a.earliestPos = row.position;
    }
    if (a.latestAt === null || at > a.latestAt) {
      a.latestAt = at;
      a.latestPos = row.position;
    }
  }

  const out = new Map<string, KeywordTrendData>();
  for (const [keywordId, a] of acc) {
    out.set(keywordId, {
      keywordId,
      earliestPosition: a.earliestPos,
      latestPosition: a.latestPos,
      snapshotCount: a.count,
    });
  }
  return out;
}
