/**
 * Wave-2 — SEO competitor aggregation + populate tests.
 *
 * Load-bearing claims:
 *   1. Share-of-Voice is computed from CACHED `seo_serp_results` with the
 *      documented position-weighted formula (weight = 1/rank), owned domains
 *      flagged, ordered by share.
 *   2. Competitor positions compare the org's own best rank vs each competitor
 *      per keyword (topic-delta).
 *   3. Reads are ORG-SCOPED — every query filters by the caller's org id.
 *   4. Honest-empty: no cached rows → empty analysis (no fabrication).
 *   5. No-creds → Null provider → refresh is an honest no-op (nothing written).
 *   6. With real positions, competitor domains are derived from the SERP organic
 *      results themselves and classified against the org's owned domains.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { SEOCompetitorService } from '../src/services/seoCompetitorService';
import {
  resolveSerpProvider,
  type SerpProvider,
  type SerpOrganicResult,
} from '../src/services/seoSerpProvider';

// ----------------------------------------------------------------------------
// Minimal chainable Supabase mock
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
        select(_cols?: string) {
          // A select after insert/upsert is a RETURNING clause, not a read.
          if (ctx.op === 'select') {
            ctx.op = 'select';
          }
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

// ----------------------------------------------------------------------------
// (1)+(2)+(3) Aggregation from cached rows
// ----------------------------------------------------------------------------

describe('SEOCompetitorService.getCompetitorAnalysis', () => {
  const serpRows = [
    // keyword k1 'seo tools'
    {
      keyword_id: 'k1',
      url: 'https://competitor-a.com/guide',
      title: 'A',
      rank: 1,
      is_competitor: true,
    },
    {
      keyword_id: 'k1',
      url: 'https://mysite.com/tools',
      title: 'Us',
      rank: 2,
      is_competitor: false,
    },
    {
      keyword_id: 'k1',
      url: 'https://competitor-b.com/post',
      title: 'B',
      rank: 3,
      is_competitor: true,
    },
    // keyword k2 'seo audit'
    {
      keyword_id: 'k2',
      url: 'https://competitor-a.com/audit',
      title: 'A2',
      rank: 1,
      is_competitor: true,
    },
    {
      keyword_id: 'k2',
      url: 'https://mysite.com/audit',
      title: 'UsAudit',
      rank: 5,
      is_competitor: false,
    },
  ];
  const keywordRows = [
    { id: 'k1', keyword: 'seo tools' },
    { id: 'k2', keyword: 'seo audit' },
  ];

  it('computes position-weighted Share-of-Voice, org-scoped', async () => {
    const calls: QueryCtx[] = [];
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'seo_serp_results')
        return { data: serpRows, error: null };
      if (ctx.table === 'seo_keywords')
        return { data: keywordRows, error: null };
      return { data: [], error: null };
    }, calls);

    const service = new SEOCompetitorService(supabase);
    const analysis = await service.getCompetitorAnalysis('org-1');

    // Ordered by score desc: competitor-a (2.0), mysite (0.7), competitor-b (0.333)
    expect(analysis.shareOfVoice.map((e) => e.domain)).toEqual([
      'competitor-a.com',
      'mysite.com',
      'competitor-b.com',
    ]);
    const a = analysis.shareOfVoice[0];
    expect(a.score).toBe(2); // 1/1 + 1/1
    expect(a.appearances).toBe(2);
    expect(a.isOwned).toBe(false);
    expect(a.sharePct).toBe(65.93); // 2 / 3.03333 * 100

    const mine = analysis.shareOfVoice.find((e) => e.domain === 'mysite.com')!;
    expect(mine.isOwned).toBe(true);
    expect(mine.score).toBe(0.7); // 1/2 + 1/5

    // ORG-SCOPING: both reads filter by org_id = 'org-1'.
    const serpCall = calls.find((c) => c.table === 'seo_serp_results')!;
    expect(serpCall.filters).toContainEqual(['org_id', 'org-1']);
    const kwCall = calls.find((c) => c.table === 'seo_keywords')!;
    expect(kwCall.filters).toContainEqual(['org_id', 'org-1']);
  });

  it('computes per-keyword competitor positions with topic-delta', async () => {
    const calls: QueryCtx[] = [];
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'seo_serp_results')
        return { data: serpRows, error: null };
      if (ctx.table === 'seo_keywords')
        return { data: keywordRows, error: null };
      return { data: [], error: null };
    }, calls);

    const service = new SEOCompetitorService(supabase);
    const analysis = await service.getCompetitorAnalysis('org-1');

    // Sorted by keyword name: 'seo audit' before 'seo tools'.
    expect(analysis.competitorPositions.map((p) => p.keyword)).toEqual([
      'seo audit',
      'seo tools',
    ]);

    const tools = analysis.competitorPositions.find(
      (p) => p.keyword === 'seo tools'
    )!;
    expect(tools.ourDomain).toBe('mysite.com');
    expect(tools.ourRank).toBe(2);
    expect(tools.competitors).toEqual([
      { domain: 'competitor-a.com', rank: 1, delta: 1 }, // 2 - 1
      { domain: 'competitor-b.com', rank: 3, delta: -1 }, // 2 - 3
    ]);

    const audit = analysis.competitorPositions.find(
      (p) => p.keyword === 'seo audit'
    )!;
    expect(audit.ourRank).toBe(5);
    expect(audit.competitors).toEqual([
      { domain: 'competitor-a.com', rank: 1, delta: 4 },
    ]);
  });

  it('honest-empty when there are no cached SERP rows (no fabrication)', async () => {
    const calls: QueryCtx[] = [];
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'seo_serp_results') return { data: [], error: null };
      return { data: [], error: null };
    }, calls);

    const service = new SEOCompetitorService(supabase);
    const analysis = await service.getCompetitorAnalysis('org-1');
    expect(analysis).toEqual({ shareOfVoice: [], competitorPositions: [] });
    // No keyword read needed once the SERP cache is empty.
    expect(calls.some((c) => c.table === 'seo_keywords')).toBe(false);
  });
});

// ----------------------------------------------------------------------------
// (5) No creds → Null provider → refresh is an honest no-op
// ----------------------------------------------------------------------------

describe('SEOCompetitorService.refreshCompetitors — inert-safe', () => {
  it('writes NOTHING when the resolved provider is Null (no creds)', async () => {
    const calls: QueryCtx[] = [];
    const keywords = [
      {
        id: 'k1',
        keyword: 'seo tools',
        tracked_url: 'https://mysite.com/tools',
      },
      {
        id: 'k2',
        keyword: 'seo audit',
        tracked_url: 'https://mysite.com/audit',
      },
    ];
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'seo_keywords') return { data: keywords, error: null };
      return { data: [], error: null };
    }, calls);

    // No DataForSEO creds → NullSerpProvider.
    const provider = resolveSerpProvider({
      dataForSeoLogin: undefined,
      dataForSeoPassword: undefined,
    });

    const service = new SEOCompetitorService(supabase);
    const result = await service.refreshCompetitors('org-1', provider);

    expect(result).toEqual({
      keywordsProcessed: 2,
      positionsStored: 0,
      competitorsUpserted: 0,
      snapshotsCreated: 0,
    });

    // Only the tracked-keyword read happened; NO writes of any kind.
    expect(calls.every((c) => c.op === 'select')).toBe(true);
    expect(
      calls.some((c) =>
        ['seo_snapshots', 'seo_competitors', 'seo_serp_results'].includes(
          c.table
        )
      )
    ).toBe(false);
  });

  // --------------------------------------------------------------------------
  // (6) With real positions: competitor domains derived from SERP + classified
  // --------------------------------------------------------------------------
  it('derives competitors from SERP organic results and persists them', async () => {
    const calls: QueryCtx[] = [];
    const keywords = [
      {
        id: 'k1',
        keyword: 'seo tools',
        tracked_url: 'https://mysite.com/tools',
      },
    ];
    const supabase = makeSupabase((ctx) => {
      if (ctx.table === 'seo_keywords') return { data: keywords, error: null };
      if (ctx.table === 'seo_snapshots')
        return { data: { id: 'snap-1' }, error: null };
      if (ctx.table === 'seo_competitors') {
        // Upsert RETURNING: echo ids for each posted domain.
        const rows = (ctx.payload as Array<{ domain: string }>).map((r) => ({
          id: `comp-${r.domain}`,
          domain: r.domain,
        }));
        return { data: rows, error: null };
      }
      return { data: null, error: null }; // serp_results delete/insert
    }, calls);

    // A fake provider returning REAL-shaped organic positions (one competitor,
    // one owned). This exercises derivation without hitting DataForSEO.
    const fakeProvider: SerpProvider = {
      async fetchSerp(): Promise<SerpOrganicResult[]> {
        return [
          {
            rankAbsolute: 1,
            rankGroup: 1,
            domain: 'competitor-a.com',
            url: 'https://competitor-a.com/x',
            title: 'A',
          },
          {
            rankAbsolute: 2,
            rankGroup: 2,
            domain: 'mysite.com',
            url: 'https://mysite.com/tools',
            title: 'Us',
          },
        ];
      },
    };

    const service = new SEOCompetitorService(supabase);
    const result = await service.refreshCompetitors('org-1', fakeProvider);

    expect(result).toEqual({
      keywordsProcessed: 1,
      positionsStored: 2,
      competitorsUpserted: 1,
      snapshotsCreated: 1,
    });

    // Snapshot captured our best rank + our url + competitor urls.
    const snapCall = calls.find((c) => c.table === 'seo_snapshots')!;
    expect(snapCall.payload.position).toBe(2);
    expect(snapCall.payload.our_url).toBe('https://mysite.com/tools');
    expect(snapCall.payload.competitor_urls).toEqual([
      'https://competitor-a.com/x',
    ]);

    // Only the non-owned domain was upserted as a competitor.
    const compCall = calls.find((c) => c.table === 'seo_competitors')!;
    expect(compCall.op).toBe('upsert');
    expect(compCall.payload).toEqual([
      { org_id: 'org-1', domain: 'competitor-a.com' },
    ]);

    // Stale rows cleared, then fresh rows inserted with correct classification.
    expect(
      calls.some((c) => c.table === 'seo_serp_results' && c.op === 'delete')
    ).toBe(true);
    const insertCall = calls.find(
      (c) => c.table === 'seo_serp_results' && c.op === 'insert'
    )!;
    const inserted = insertCall.payload as any[];
    const compRow = inserted.find(
      (r) => r.url === 'https://competitor-a.com/x'
    );
    const ownRow = inserted.find((r) => r.url === 'https://mysite.com/tools');
    expect(compRow.is_competitor).toBe(true);
    expect(compRow.competitor_id).toBe('comp-competitor-a.com');
    expect(compRow.rank).toBe(1);
    expect(ownRow.is_competitor).toBe(false);
    expect(ownRow.competitor_id).toBeNull();
  });
});
