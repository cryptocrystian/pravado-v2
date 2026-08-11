/**
 * Wave-2 — Analytics-SEO aggregation tests.
 *
 * Load-bearing claims:
 *   1. Engine breakdown is derived from the REAL citation_summaries.by_engine +
 *      citation_monitor_results; rate is null (not a fake 0%) when queries === 0.
 *   2. Own-rank summary counts real tracked keywords, averages only ranking ones,
 *      and prefers real-sourced metric volume; honest-empty when no keywords.
 *   3. Competitive movement comes from seo_snapshots history and is EMPTY with
 *      < 2 snapshots for a keyword (a single capture cannot show movement).
 *   4. Topic performance maps the persisted seo_keyword_clusters (real fields, no
 *      invented values); honest-empty when none exist.
 *   5. Every DB read is ORG-SCOPED (filters by the caller's org id).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  SEOAnalyticsService,
  deriveEngineStats,
  deriveEngineVelocity,
  deriveOwnRankSummary,
  deriveCompetitiveMovement,
} from '../src/services/seoAnalyticsService';

// ----------------------------------------------------------------------------
// Chainable Supabase mock (supports .eq/.gte/.order/.single/.maybeSingle)
// ----------------------------------------------------------------------------

interface QueryCtx {
  table: string;
  op: 'select' | 'insert' | 'upsert' | 'delete';
  filters: Array<[string, unknown]>;
  gte: Array<[string, unknown]>;
  single: boolean;
  maybeSingle: boolean;
}

type Handler = (ctx: QueryCtx) => { data: any; error: any };

function makeSupabase(handler: Handler, calls: QueryCtx[]): SupabaseClient {
  const client = {
    from(table: string) {
      const ctx: QueryCtx = {
        table,
        op: 'select',
        filters: [],
        gte: [],
        single: false,
        maybeSingle: false,
      };
      const settle = (resolve: any, reject: any) => {
        calls.push({ ...ctx, filters: [...ctx.filters], gte: [...ctx.gte] });
        return Promise.resolve(handler(ctx)).then(resolve, reject);
      };
      const builder: any = {
        select() {
          return builder;
        },
        eq(col: string, val: unknown) {
          ctx.filters.push([col, val]);
          return builder;
        },
        gte(col: string, val: unknown) {
          ctx.gte.push([col, val]);
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        single() {
          ctx.single = true;
          return builder;
        },
        maybeSingle() {
          ctx.maybeSingle = true;
          return { then: settle };
        },
        then: settle,
      };
      return builder;
    },
  };
  return client as unknown as SupabaseClient;
}

// ============================================================================
// (1) Engine breakdown — pure derivations
// ============================================================================

describe('deriveEngineStats', () => {
  it('parses by_engine, computes rate, sorts by mentions desc', () => {
    const stats = deriveEngineStats({
      chatgpt: { queries: 10, mentions: 4, rate: 0.4 },
      perplexity: { queries: 5, mentions: 5 },
    });
    expect(stats[0]).toEqual({
      engine: 'perplexity',
      queries: 5,
      mentions: 5,
      rate: 1,
    });
    expect(stats[1]).toEqual({
      engine: 'chatgpt',
      queries: 10,
      mentions: 4,
      rate: 0.4,
    });
  });

  it('rate is null (not a fake 0%) when queries === 0; empty when absent', () => {
    const stats = deriveEngineStats({ gemini: { queries: 0, mentions: 0 } });
    expect(stats[0].rate).toBeNull();
    expect(deriveEngineStats(null)).toEqual([]);
    expect(deriveEngineStats(undefined)).toEqual([]);
  });
});

describe('deriveEngineVelocity', () => {
  it('buckets only brand-mentioned citations by date + engine, ascending', () => {
    const { velocity, engines, totalVelocity } = deriveEngineVelocity([
      {
        engine: 'chatgpt',
        brand_mentioned: true,
        monitored_at: '2026-02-01T09:00:00Z',
      },
      {
        engine: 'chatgpt',
        brand_mentioned: true,
        monitored_at: '2026-02-01T18:00:00Z',
      },
      {
        engine: 'perplexity',
        brand_mentioned: true,
        monitored_at: '2026-02-02T10:00:00Z',
      },
      // Not a citation → excluded.
      {
        engine: 'chatgpt',
        brand_mentioned: false,
        monitored_at: '2026-02-02T10:00:00Z',
      },
    ]);
    expect(engines).toEqual(['chatgpt', 'perplexity']);
    expect(velocity).toEqual([
      { period: '2026-02-01', chatgpt: 2, perplexity: 0 },
      { period: '2026-02-02', chatgpt: 0, perplexity: 1 },
    ]);
    expect(totalVelocity).toEqual([
      { period: '2026-02-01', citations: 2 },
      { period: '2026-02-02', citations: 1 },
    ]);
  });

  it('empty in → empty series (honest, no fabricated points)', () => {
    expect(deriveEngineVelocity([])).toEqual({
      velocity: [],
      engines: [],
      totalVelocity: [],
    });
  });
});

// ============================================================================
// (2) Own-rank summary — pure derivation
// ============================================================================

describe('deriveOwnRankSummary', () => {
  it('averages only ranking keywords; prefers real-sourced metric volume', () => {
    const summary = deriveOwnRankSummary(
      [
        { id: 'k1', keyword: 'a', current_position: 4, search_volume: 100 },
        { id: 'k2', keyword: 'b', current_position: 8, search_volume: 50 },
        { id: 'k3', keyword: 'c', current_position: null, search_volume: null },
      ],
      [
        // GSC metric overrides the denormalized 100 for k1.
        {
          keyword_id: 'k1',
          source: 'gsc',
          search_volume: 320,
          last_refreshed_at: '2026-02-01',
        },
      ]
    );
    expect(summary.trackedKeywords).toBe(3);
    expect(summary.rankedKeywords).toBe(2);
    expect(summary.avgPosition).toBe(6); // mean(4, 8)
    expect(summary.totalVolume).toBe(370); // 320 (gsc) + 50 (fallback); k3 null
    expect(summary.gscKeywords).toBe(1);
    expect(summary.hasData).toBe(true);
  });

  it('honest-empty when the org tracks no keywords', () => {
    const summary = deriveOwnRankSummary([], []);
    expect(summary).toEqual({
      trackedKeywords: 0,
      rankedKeywords: 0,
      avgPosition: null,
      totalVolume: null,
      gscKeywords: 0,
      hasData: false,
    });
  });

  it('avgPosition null when no keyword ranks; totalVolume null when no volume', () => {
    const summary = deriveOwnRankSummary(
      [{ id: 'k1', keyword: 'a', current_position: null, search_volume: null }],
      []
    );
    expect(summary.avgPosition).toBeNull();
    expect(summary.totalVolume).toBeNull();
    expect(summary.hasData).toBe(true); // it IS tracked, just unranked
  });
});

// ============================================================================
// (3) Competitive movement — empty with < 2 snapshots
// ============================================================================

describe('deriveCompetitiveMovement', () => {
  const names = new Map([
    ['k1', 'seo tools'],
    ['k2', 'best crm'],
  ]);

  it('honest-empty with < 2 snapshots for a keyword (no delta possible)', () => {
    const panel = deriveCompetitiveMovement(
      [{ seo_keyword_id: 'k1', captured_at: '2026-02-01', position: 5 }],
      names
    );
    expect(panel.hasData).toBe(false);
    expect(panel.movers).toEqual([]);
    expect(panel.totalSnapshots).toBe(1);
  });

  it('computes real deltas from >= 2 snapshots, biggest move first', () => {
    const panel = deriveCompetitiveMovement(
      [
        { seo_keyword_id: 'k1', captured_at: '2026-02-01', position: 9 },
        { seo_keyword_id: 'k1', captured_at: '2026-02-10', position: 3 }, // +improve 6
        { seo_keyword_id: 'k2', captured_at: '2026-02-01', position: 4 },
        { seo_keyword_id: 'k2', captured_at: '2026-02-10', position: 6 }, // -worse 2
      ],
      names
    );
    expect(panel.hasData).toBe(true);
    expect(panel.movers[0]).toEqual({
      keyword: 'seo tools',
      earliestPosition: 9,
      latestPosition: 3,
      delta: -6,
      snapshotCount: 2,
    });
    expect(panel.movers[1].keyword).toBe('best crm');
    expect(panel.movers[1].delta).toBe(2);
    expect(panel.totalSnapshots).toBe(4);
  });
});

// ============================================================================
// (4)+(5) Service: org-scoping + honest-empty panels
// ============================================================================

describe('SEOAnalyticsService.getAnalytics', () => {
  it('all four panels honest-empty when every source is empty; org-scoped reads', async () => {
    const calls: QueryCtx[] = [];
    const supabase = makeSupabase(() => ({ data: [], error: null }), calls);

    const service = new SEOAnalyticsService(supabase);
    const data = await service.getAnalytics('org-1');

    expect(data.engineBreakdown.hasData).toBe(false);
    expect(data.engineBreakdown.engines).toEqual([]);
    expect(data.summary.hasData).toBe(false);
    expect(data.summary.trackedKeywords).toBe(0);
    expect(data.competitiveMovement.hasData).toBe(false);
    expect(data.topicPerformance.hasData).toBe(false);
    expect(data.topicPerformance.clusters).toEqual([]);

    // Every read is org-scoped by 'org-1'.
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) {
      expect(c.filters).toContainEqual(['org_id', 'org-1']);
    }
    // Reads only — no writes anywhere.
    expect(calls.every((c) => c.op === 'select')).toBe(true);
  });

  it('maps real clusters + engine data; topic panel invents nothing', async () => {
    const calls: QueryCtx[] = [];
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'citation_summaries') {
        return {
          data: { by_engine: { chatgpt: { queries: 4, mentions: 2 } } },
          error: null,
        };
      }
      if (ctx.table === 'citation_monitor_results') {
        return {
          data: [
            {
              engine: 'chatgpt',
              brand_mentioned: true,
              monitored_at: '2026-02-01T10:00:00Z',
            },
          ],
          error: null,
        };
      }
      if (ctx.table === 'seo_keyword_clusters') {
        return {
          data: [
            {
              id: 'c1',
              name: 'seo tools',
              member_keywords: ['seo tools', 'best seo tools'],
              score: 80,
              avg_position: 3,
              total_volume: 1700,
              trend: null, // real null preserved — not fabricated
              computed_at: '2026-02-01T00:00:00Z',
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    }, calls);

    const service = new SEOAnalyticsService(supabase);
    const data = await service.getAnalytics('org-1');

    expect(data.engineBreakdown.hasData).toBe(true);
    expect(data.engineBreakdown.engines[0]).toEqual({
      engine: 'chatgpt',
      queries: 4,
      mentions: 2,
      rate: 0.5,
    });
    expect(data.engineBreakdown.velocity).toEqual([
      { period: '2026-02-01', chatgpt: 1 },
    ]);

    expect(data.topicPerformance.hasData).toBe(true);
    const cluster = data.topicPerformance.clusters[0];
    expect(cluster.name).toBe('seo tools');
    expect(cluster.score).toBe(80);
    expect(cluster.avgPosition).toBe(3);
    expect(cluster.totalVolume).toBe(1700);
    expect(cluster.trend).toBeNull(); // preserved real null

    // clusters read is org-scoped
    const clusterCall = calls.find((c) => c.table === 'seo_keyword_clusters')!;
    expect(clusterCall.filters).toContainEqual(['org_id', 'org-1']);
  });
});
