/**
 * Wave-2 — SEO Topic Cluster (SERP-overlap) tests.
 *
 * Load-bearing claims:
 *   1. Keywords whose top-N SERP URLs overlap ≥ MIN_SHARED_URLS cluster together;
 *      disjoint keywords land in separate clusters.
 *   2. Every derived number comes ONLY from real member values — score is a
 *      deterministic transform of the real avg owned position; total_volume is a
 *      plain sum of real volumes; no invented numbers.
 *   3. Trend is null with < 2 snapshots (honest); computed from position deltas
 *      otherwise.
 *   4. The read is ORG-SCOPED — every query filters by the caller's org id.
 *   5. No cached SERP data → NO clusters written (honest-empty no-op).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  SEOTopicClusterService,
  clusterByOverlap,
  visibilityScoreFromPosition,
  computeClusterTrend,
  deriveClusterMetrics,
  buildTrendData,
  sharedUrlCount,
  normalizeUrl,
  MIN_SHARED_URLS,
  type KeywordSerpData,
  type KeywordTrendData,
} from '../src/services/seoTopicClusterService';

// ----------------------------------------------------------------------------
// Chainable Supabase mock (adds .order() over the competitor-test shape)
// ----------------------------------------------------------------------------

interface QueryCtx {
  table: string;
  op: 'select' | 'insert' | 'upsert' | 'delete';
  filters: Array<[string, unknown]>;
  payload: any;
  single: boolean;
}

type Handler = (ctx: QueryCtx) => { data: any; error: any };

function makeSupabase(handler: Handler, calls: QueryCtx[]): SupabaseClient {
  const client = {
    from(table: string) {
      const ctx: QueryCtx = {
        table,
        op: 'select',
        filters: [],
        payload: null,
        single: false,
      };
      const builder: any = {
        select() {
          return builder;
        },
        insert(payload: any) {
          ctx.op = 'insert';
          ctx.payload = payload;
          return builder;
        },
        upsert(payload: any) {
          ctx.op = 'upsert';
          ctx.payload = payload;
          return builder;
        },
        delete() {
          ctx.op = 'delete';
          return builder;
        },
        eq(col: string, val: unknown) {
          ctx.filters.push([col, val]);
          return builder;
        },
        order() {
          return builder;
        },
        single() {
          ctx.single = true;
          return builder;
        },
        then(resolve: any, reject: any) {
          calls.push({ ...ctx, filters: [...ctx.filters] });
          return Promise.resolve(handler(ctx)).then(resolve, reject);
        },
      };
      return builder;
    },
  };
  return client as unknown as SupabaseClient;
}

// ============================================================================
// (1) Overlap clustering
// ============================================================================

describe('clusterByOverlap', () => {
  it('groups keywords sharing ≥ MIN_SHARED_URLS top-N URLs; separates disjoint', () => {
    const items: KeywordSerpData[] = [
      // k1 & k2 share 3 URLs (a,b,c) → same cluster.
      {
        keywordId: 'k1',
        keyword: 'seo tools',
        urls: [
          'https://a.com',
          'https://b.com',
          'https://c.com',
          'https://d.com',
        ],
        ourBestRank: 2,
        volume: 500,
      },
      {
        keywordId: 'k2',
        keyword: 'best seo tools',
        urls: [
          'https://a.com',
          'https://b.com',
          'https://c.com',
          'https://z.com',
        ],
        ourBestRank: 4,
        volume: 300,
      },
      // k3 shares nothing with k1/k2 → its own cluster.
      {
        keywordId: 'k3',
        keyword: 'email marketing',
        urls: ['https://m.com', 'https://n.com', 'https://o.com'],
        ourBestRank: 6,
        volume: 900,
      },
    ];

    const clusters = clusterByOverlap(items);
    // Sort inner + outer for a stable comparison.
    const norm = clusters.map((c) => [...c].sort()).sort();
    expect(norm).toEqual(
      [['k1', 'k2'], ['k3']].map((c) => [...c].sort()).sort()
    );
  });

  it('is transitive: A–B and B–C ⇒ one cluster of three', () => {
    const shared = (extra: string) => [
      'https://x.com',
      'https://y.com',
      'https://z.com',
      extra,
    ];
    const items: KeywordSerpData[] = [
      {
        keywordId: 'a',
        keyword: 'a',
        urls: shared('https://a.com'),
        ourBestRank: 1,
        volume: 1,
      },
      {
        keywordId: 'b',
        keyword: 'b',
        urls: shared('https://b.com'),
        ourBestRank: 1,
        volume: 1,
      },
      {
        keywordId: 'c',
        keyword: 'c',
        urls: shared('https://c.com'),
        ourBestRank: 1,
        volume: 1,
      },
    ];
    const clusters = clusterByOverlap(items);
    expect(clusters).toHaveLength(1);
    expect([...clusters[0]].sort()).toEqual(['a', 'b', 'c']);
  });

  it('respects the shared-URL threshold (2 shared < 3 = separate)', () => {
    const items: KeywordSerpData[] = [
      {
        keywordId: 'k1',
        keyword: 'k1',
        urls: ['https://a.com', 'https://b.com'],
        ourBestRank: 1,
        volume: 1,
      },
      {
        keywordId: 'k2',
        keyword: 'k2',
        urls: ['https://a.com', 'https://b.com'],
        ourBestRank: 1,
        volume: 1,
      },
    ];
    // Only 2 shared URLs, MIN_SHARED_URLS is 3 → not connected.
    expect(MIN_SHARED_URLS).toBe(3);
    const clusters = clusterByOverlap(items);
    expect(clusters).toHaveLength(2);
  });
});

describe('normalizeUrl + sharedUrlCount', () => {
  it('normalizes case + trailing slash so the same page matches', () => {
    expect(normalizeUrl('https://A.com/Page/')).toBe('https://a.com/page');
  });
  it('counts shared normalized URLs', () => {
    const a = new Set(['https://a.com', 'https://b.com', 'https://c.com']);
    const b = new Set(['https://b.com', 'https://c.com', 'https://d.com']);
    expect(sharedUrlCount(a, b)).toBe(2);
  });
});

// ============================================================================
// (2) Scoring / metrics use ONLY real member values
// ============================================================================

describe('visibilityScoreFromPosition', () => {
  it('maps rank 1 → 100, rank 11+ → 0, rank 6 → 50; null → null', () => {
    expect(visibilityScoreFromPosition(1)).toBe(100);
    expect(visibilityScoreFromPosition(11)).toBe(0);
    expect(visibilityScoreFromPosition(20)).toBe(0);
    expect(visibilityScoreFromPosition(6)).toBe(50);
    expect(visibilityScoreFromPosition(null)).toBeNull();
  });
});

describe('deriveClusterMetrics', () => {
  it('names by highest volume, sums real volume, scores from real avg position', () => {
    const members: KeywordSerpData[] = [
      {
        keywordId: 'k1',
        keyword: 'seo tools',
        urls: [],
        ourBestRank: 2,
        volume: 500,
      },
      {
        keywordId: 'k2',
        keyword: 'best seo tools',
        urls: [],
        ourBestRank: 4,
        volume: 1200,
      },
    ];
    const trend: KeywordTrendData[] = [
      {
        keywordId: 'k1',
        earliestPosition: null,
        latestPosition: null,
        snapshotCount: 0,
      },
      {
        keywordId: 'k2',
        earliestPosition: null,
        latestPosition: null,
        snapshotCount: 0,
      },
    ];
    const m = deriveClusterMetrics(members, trend);

    expect(m.name).toBe('best seo tools'); // highest volume (1200)
    expect(m.totalVolume).toBe(1700); // 500 + 1200 (real sum)
    expect(m.avgPosition).toBe(3); // (2 + 4) / 2 — real owned ranks
    expect(m.score).toBe(80); // visibilityScoreFromPosition(3): (11-3)/10*100
    expect(m.trend).toBeNull(); // no snapshots
  });

  it('honest nulls when the org does not rank and has no volume', () => {
    const members: KeywordSerpData[] = [
      {
        keywordId: 'k1',
        keyword: 'alpha',
        urls: [],
        ourBestRank: null,
        volume: null,
      },
      {
        keywordId: 'k2',
        keyword: 'beta',
        urls: [],
        ourBestRank: null,
        volume: null,
      },
    ];
    const m = deriveClusterMetrics(members, []);
    expect(m.avgPosition).toBeNull();
    expect(m.score).toBeNull(); // no owned position → no invented score
    expect(m.totalVolume).toBeNull(); // no volume → null, not 0
    expect(m.name).toBe('alpha'); // ties → lexicographically smallest
  });
});

// ============================================================================
// (3) Trend from snapshot deltas; null with < 2 snapshots
// ============================================================================

describe('computeClusterTrend', () => {
  it('null when fewer than 2 snapshots total (honest)', () => {
    expect(
      computeClusterTrend([
        {
          keywordId: 'k1',
          earliestPosition: 5,
          latestPosition: 5,
          snapshotCount: 1,
        },
      ])
    ).toBeNull();
  });

  it("'up' when position improved (delta negative)", () => {
    expect(
      computeClusterTrend([
        {
          keywordId: 'k1',
          earliestPosition: 8,
          latestPosition: 3,
          snapshotCount: 2,
        },
      ])
    ).toBe('up');
  });

  it("'down' when position worsened (delta positive)", () => {
    expect(
      computeClusterTrend([
        {
          keywordId: 'k1',
          earliestPosition: 3,
          latestPosition: 9,
          snapshotCount: 2,
        },
      ])
    ).toBe('down');
  });

  it("'stable' when net delta is zero across members", () => {
    expect(
      computeClusterTrend([
        {
          keywordId: 'k1',
          earliestPosition: 4,
          latestPosition: 2,
          snapshotCount: 2,
        },
        {
          keywordId: 'k2',
          earliestPosition: 2,
          latestPosition: 4,
          snapshotCount: 2,
        },
      ])
    ).toBe('stable');
  });
});

describe('buildTrendData', () => {
  it('reduces snapshots to earliest/latest position + count', () => {
    const map = buildTrendData([
      { seo_keyword_id: 'k1', captured_at: '2026-01-01', position: 8 },
      { seo_keyword_id: 'k1', captured_at: '2026-02-01', position: 3 },
      { seo_keyword_id: 'k1', captured_at: null, position: null }, // ignored
    ]);
    const k1 = map.get('k1')!;
    expect(k1.snapshotCount).toBe(2);
    expect(k1.earliestPosition).toBe(8);
    expect(k1.latestPosition).toBe(3);
  });
});

// ============================================================================
// (4)+(5) Service: org-scoping + honest-empty no-op
// ============================================================================

describe('SEOTopicClusterService.computeClusters', () => {
  it('honest-empty: no cached SERP rows → nothing written, no clusters', async () => {
    const calls: QueryCtx[] = [];
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'seo_serp_results') return { data: [], error: null };
      return { data: [], error: null };
    }, calls);

    const service = new SEOTopicClusterService(supabase);
    const result = await service.computeClusters('org-1');

    expect(result).toEqual({ clusters: [], keywordsClustered: 0 });
    // No writes of any kind; not even a delete on seo_keyword_clusters.
    expect(calls.every((c) => c.op === 'select')).toBe(true);
    expect(calls.some((c) => c.table === 'seo_keyword_clusters')).toBe(false);
    // The SERP read is org-scoped.
    const serpCall = calls.find((c) => c.table === 'seo_serp_results')!;
    expect(serpCall.filters).toContainEqual(['org_id', 'org-1']);
  });

  it('clusters cached SERP data, derives real metrics, persists org-scoped', async () => {
    const calls: QueryCtx[] = [];
    // k1 & k2 share 3 top-N URLs → one cluster; k3 disjoint → its own.
    const serpRows = [
      { keyword_id: 'k1', url: 'https://a.com', rank: 1, is_competitor: true },
      { keyword_id: 'k1', url: 'https://b.com', rank: 2, is_competitor: false },
      { keyword_id: 'k1', url: 'https://c.com', rank: 3, is_competitor: true },
      { keyword_id: 'k2', url: 'https://a.com', rank: 1, is_competitor: true },
      { keyword_id: 'k2', url: 'https://b.com', rank: 4, is_competitor: false },
      { keyword_id: 'k2', url: 'https://c.com', rank: 5, is_competitor: true },
      { keyword_id: 'k3', url: 'https://m.com', rank: 1, is_competitor: true },
      { keyword_id: 'k3', url: 'https://n.com', rank: 2, is_competitor: false },
      { keyword_id: 'k3', url: 'https://o.com', rank: 3, is_competitor: true },
    ];
    let insertPayload: any = null;
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'seo_serp_results')
        return { data: serpRows, error: null };
      if (ctx.table === 'seo_keywords')
        return {
          data: [
            { id: 'k1', keyword: 'seo tools', search_volume: 500 },
            { id: 'k2', keyword: 'best seo tools', search_volume: 1200 },
            { id: 'k3', keyword: 'email marketing', search_volume: 900 },
          ],
          error: null,
        };
      if (ctx.table === 'seo_keyword_metrics') return { data: [], error: null };
      if (ctx.table === 'seo_snapshots') return { data: [], error: null };
      if (ctx.table === 'seo_keyword_clusters') {
        if (ctx.op === 'delete') return { data: null, error: null };
        if (ctx.op === 'insert') {
          insertPayload = ctx.payload;
          // Echo rows back with ids, mimicking the RETURNING select.
          const rows = (ctx.payload as any[]).map((r, i) => ({
            id: `cluster-${i}`,
            name: r.name,
            member_keywords: r.member_keywords,
            score: r.score,
            avg_position: r.avg_position,
            total_volume: r.total_volume,
            trend: r.trend,
            computed_at: r.computed_at,
          }));
          return { data: rows, error: null };
        }
      }
      return { data: [], error: null };
    }, calls);

    const service = new SEOTopicClusterService(supabase);
    const result = await service.computeClusters('org-1');

    // Two clusters: {k1,k2} and {k3}.
    expect(result.keywordsClustered).toBe(3);
    expect(result.clusters).toHaveLength(2);

    const merged = result.clusters.find((c) => c.name === 'best seo tools')!;
    // Members are the two overlapping keyword strings.
    expect([...merged.memberKeywords].sort()).toEqual([
      'best seo tools',
      'seo tools',
    ]);
    // avg owned position = mean(2, 4) = 3 → score 80 (all real).
    expect(merged.avgPosition).toBe(3);
    expect(merged.score).toBe(80);
    // total volume = 500 + 1200 = 1700 (real sum).
    expect(merged.totalVolume).toBe(1700);
    // No snapshots → null trend (honest).
    expect(merged.trend).toBeNull();

    const solo = result.clusters.find((c) => c.name === 'email marketing')!;
    expect(solo.memberKeywords).toEqual(['email marketing']);
    expect(solo.avgPosition).toBe(2);
    expect(solo.totalVolume).toBe(900);

    // Persistence is org-scoped: delete + insert carry org_id = 'org-1'.
    const deleteCall = calls.find(
      (c) => c.table === 'seo_keyword_clusters' && c.op === 'delete'
    )!;
    expect(deleteCall.filters).toContainEqual(['org_id', 'org-1']);
    expect(insertPayload.every((r: any) => r.org_id === 'org-1')).toBe(true);

    // Every read is org-scoped.
    for (const table of [
      'seo_serp_results',
      'seo_keywords',
      'seo_keyword_metrics',
      'seo_snapshots',
    ]) {
      const call = calls.find((c) => c.table === table && c.op === 'select')!;
      expect(call.filters).toContainEqual(['org_id', 'org-1']);
    }
  });
});
