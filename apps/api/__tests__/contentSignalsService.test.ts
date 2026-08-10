/**
 * Content Signals Derivation Service tests (W2 — Content Insights, honest partial).
 *
 * Verifies:
 *   1. Every query is org-scoped (.eq('org_id', <orgId>) on both tables).
 *   2. The two honestly-derivable metrics are computed from the real scorer
 *      columns: citationEligibilityScore ← mean(citemind_scores.overall_score),
 *      aiIngestionLikelihood ← mean(citemind_scores.schema_markup_score).
 *   3. The three non-derivable metrics are returned as `null` (never 0):
 *      authorityContributionScore, crossPillarImpact, competitiveAuthorityDelta.
 *   4. Latest-per-item dedup (multiple scored_at rows for one asset).
 *   5. Empty org → all metrics null, scoredAssetCount 0, no topAssets.
 *   6. topAssets ranked by citation eligibility with honest titles/status.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { deriveContentSignals } from '../src/services/content/contentSignalsService';

const ORG = 'org-1';

interface TableResult {
  data: unknown;
  error: unknown;
}

/**
 * Chainable Supabase mock. Records every .eq(column, value) call so tests can
 * assert org-scoping. Each table's builder is thenable and resolves the
 * configured result. Supports the chain the service uses: select/eq/order/in.
 */
function makeSupabase(
  byTable: Record<string, TableResult>,
  eqCalls: Array<{ table: string; column: string; value: unknown }>
): SupabaseClient {
  return {
    from(table: string) {
      const result = byTable[table] ?? { data: [], error: null };
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.order = () => chain;
      chain.in = () => chain;
      chain.eq = (column: string, value: unknown) => {
        eqCalls.push({ table, column, value });
        return chain;
      };
      (chain as { then: unknown }).then = (
        resolve: (r: TableResult) => unknown
      ) => resolve(result);
      return chain;
    },
  } as unknown as SupabaseClient;
}

describe('deriveContentSignals — honest partial derivation', () => {
  it('empty org → all metrics null, scoredAssetCount 0, no topAssets', async () => {
    const eqCalls: Array<{ table: string; column: string; value: unknown }> =
      [];
    const supabase = makeSupabase(
      { citemind_scores: { data: [], error: null } },
      eqCalls
    );

    const payload = await deriveContentSignals(supabase, ORG);

    expect(payload.signals.citationEligibilityScore).toBeNull();
    expect(payload.signals.aiIngestionLikelihood).toBeNull();
    expect(payload.signals.authorityContributionScore).toBeNull();
    expect(payload.signals.crossPillarImpact).toBeNull();
    expect(payload.signals.competitiveAuthorityDelta).toBeNull();
    expect(payload.signals.scoredAssetCount).toBe(0);
    expect(payload.topAssets).toEqual([]);

    // Org-scoped even on the empty path.
    expect(
      eqCalls.some(
        (c) =>
          c.table === 'citemind_scores' &&
          c.column === 'org_id' &&
          c.value === ORG
      )
    ).toBe(true);
  });

  it('derives citation eligibility + AI ingestion from real columns; leaves the rest null', async () => {
    const eqCalls: Array<{ table: string; column: string; value: unknown }> =
      [];
    const supabase = makeSupabase(
      {
        citemind_scores: {
          data: [
            {
              content_item_id: 'a1',
              overall_score: 80,
              schema_markup_score: 100,
              gate_status: 'passed',
              scored_at: '2026-08-01T00:00:00Z',
            },
            {
              content_item_id: 'a2',
              overall_score: 60,
              schema_markup_score: 0,
              gate_status: 'warning',
              scored_at: '2026-08-01T00:00:00Z',
            },
          ],
          error: null,
        },
        content_items: {
          data: [
            {
              id: 'a1',
              title: 'Alpha',
              status: 'published',
              content_type: 'article',
            },
            {
              id: 'a2',
              title: 'Beta',
              status: 'draft',
              content_type: 'article',
            },
          ],
          error: null,
        },
      },
      eqCalls
    );

    const payload = await deriveContentSignals(supabase, ORG);

    // citationEligibility ← mean(overall_score) = (80+60)/2 = 70
    expect(payload.signals.citationEligibilityScore).toBe(70);
    // aiIngestion ← mean(schema_markup_score) = (100+0)/2 = 50
    expect(payload.signals.aiIngestionLikelihood).toBe(50);
    // Non-derivable → null (never 0)
    expect(payload.signals.authorityContributionScore).toBeNull();
    expect(payload.signals.crossPillarImpact).toBeNull();
    expect(payload.signals.competitiveAuthorityDelta).toBeNull();
    expect(payload.signals.scoredAssetCount).toBe(2);

    // topAssets ranked by citation eligibility (overall_score) desc, with titles.
    expect(payload.topAssets.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(payload.topAssets[0]).toMatchObject({
      id: 'a1',
      title: 'Alpha',
      status: 'published',
      citationEligibilityScore: 80,
      aiIngestionLikelihood: 100,
    });

    // Both queries org-scoped.
    expect(
      eqCalls.filter((c) => c.column === 'org_id' && c.value === ORG).length
    ).toBeGreaterThanOrEqual(2);
    expect(
      eqCalls.some((c) => c.table === 'content_items' && c.column === 'org_id')
    ).toBe(true);
  });

  it('dedupes to the latest score per content item (newest scored_at wins)', async () => {
    const eqCalls: Array<{ table: string; column: string; value: unknown }> =
      [];
    // Rows are pre-sorted desc by scored_at (the service orders that way).
    const supabase = makeSupabase(
      {
        citemind_scores: {
          data: [
            {
              content_item_id: 'a1',
              overall_score: 90,
              schema_markup_score: 100,
              gate_status: 'passed',
              scored_at: '2026-08-05T00:00:00Z',
            },
            {
              content_item_id: 'a1',
              overall_score: 10,
              schema_markup_score: 0,
              gate_status: 'blocked',
              scored_at: '2026-08-01T00:00:00Z',
            },
          ],
          error: null,
        },
        content_items: {
          data: [
            {
              id: 'a1',
              title: 'Alpha',
              status: 'published',
              content_type: 'article',
            },
          ],
          error: null,
        },
      },
      eqCalls
    );

    const payload = await deriveContentSignals(supabase, ORG);

    // Only the newest row (90/100) counts.
    expect(payload.signals.scoredAssetCount).toBe(1);
    expect(payload.signals.citationEligibilityScore).toBe(90);
    expect(payload.signals.aiIngestionLikelihood).toBe(100);
    expect(payload.topAssets).toHaveLength(1);
    expect(payload.topAssets[0].citationEligibilityScore).toBe(90);
  });

  it('propagates a scorer query error instead of fabricating success', async () => {
    const eqCalls: Array<{ table: string; column: string; value: unknown }> =
      [];
    const supabase = makeSupabase(
      {
        citemind_scores: {
          data: null,
          error: { message: 'boom' },
        },
      },
      eqCalls
    );

    await expect(deriveContentSignals(supabase, ORG)).rejects.toThrow(/boom/);
  });
});
