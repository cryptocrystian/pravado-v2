/**
 * Content Signals Read Service tests (W2 — Content Insights, D038).
 *
 * Verifies:
 *   1. Every query is org-scoped (.eq('org_id', <orgId>) on both tables).
 *   2. Aggregates the four real signals from content_authority_signals.
 *   3. competitiveAuthorityDelta is ALWAYS null (never the stored DEFAULT 0).
 *   4. Latest-per-asset dedup across multiple measured_at rows.
 *   5. Empty org → all metrics null, scoredAssetCount 0, no topAssets.
 *   6. topAssets ranked by authority contribution with honest titles/status.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { readContentSignals } from '../src/services/content/contentSignalsService';

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

describe('readContentSignals — persisted Authority Signals', () => {
  it('empty org → all metrics null, scoredAssetCount 0, org-scoped', async () => {
    const eqCalls: Array<{ table: string; column: string; value: unknown }> =
      [];
    const supabase = makeSupabase(
      { content_authority_signals: { data: [], error: null } },
      eqCalls
    );

    const payload = await readContentSignals(supabase, ORG);

    expect(payload.signals.authorityContributionScore).toBeNull();
    expect(payload.signals.citationEligibilityScore).toBeNull();
    expect(payload.signals.aiIngestionLikelihood).toBeNull();
    expect(payload.signals.crossPillarImpact).toBeNull();
    expect(payload.signals.competitiveAuthorityDelta).toBeNull();
    expect(payload.signals.scoredAssetCount).toBe(0);
    expect(payload.topAssets).toEqual([]);

    // Org-scoped even on the empty path.
    expect(
      eqCalls.some(
        (c) =>
          c.table === 'content_authority_signals' &&
          c.column === 'org_id' &&
          c.value === ORG
      )
    ).toBe(true);
  });

  it('aggregates the four real signals; competitive delta stays null; org-scoped on both tables', async () => {
    const eqCalls: Array<{ table: string; column: string; value: unknown }> =
      [];
    const supabase = makeSupabase(
      {
        content_authority_signals: {
          data: [
            // asset-a: two rows — newest (higher authority) must win the dedup.
            {
              asset_id: 'asset-a',
              authority_contribution_score: 80,
              citation_eligibility_score: 80,
              ai_ingestion_likelihood: 60,
              cross_pillar_impact: 0.6,
              measured_at: '2026-08-02T00:00:00Z',
            },
            {
              asset_id: 'asset-a',
              authority_contribution_score: 10,
              citation_eligibility_score: 10,
              ai_ingestion_likelihood: 10,
              cross_pillar_impact: 0.1,
              measured_at: '2026-08-01T00:00:00Z',
            },
            {
              asset_id: 'asset-b',
              authority_contribution_score: 40,
              citation_eligibility_score: 40,
              ai_ingestion_likelihood: 30,
              cross_pillar_impact: 0.3,
              measured_at: '2026-08-02T00:00:00Z',
            },
          ],
          error: null,
        },
        content_items: {
          data: [
            {
              id: 'asset-a',
              title: 'Asset A',
              status: 'approved',
              content_type: 'article',
            },
            {
              id: 'asset-b',
              title: 'Asset B',
              status: 'draft',
              content_type: 'article',
            },
          ],
          error: null,
        },
      },
      eqCalls
    );

    const payload = await readContentSignals(supabase, ORG);

    // Dedup to latest-per-asset: asset-a=80, asset-b=40 → mean 60.
    expect(payload.signals.scoredAssetCount).toBe(2);
    expect(payload.signals.authorityContributionScore).toBe(60);
    expect(payload.signals.citationEligibilityScore).toBe(60);
    // mean(60, 30) = 45
    expect(payload.signals.aiIngestionLikelihood).toBe(45);
    // mean(0.6, 0.3) = 0.45 (2-dp)
    expect(payload.signals.crossPillarImpact).toBe(0.45);
    // Data-gated — always null, never the stored default 0.
    expect(payload.signals.competitiveAuthorityDelta).toBeNull();

    // Ranked by authority contribution: asset-a (80) before asset-b (40).
    expect(payload.topAssets.map((a) => a.id)).toEqual(['asset-a', 'asset-b']);
    expect(payload.topAssets[0].title).toBe('Asset A');

    // Org-scoped on BOTH tables.
    expect(
      eqCalls.some(
        (c) =>
          c.table === 'content_authority_signals' &&
          c.column === 'org_id' &&
          c.value === ORG
      )
    ).toBe(true);
    expect(
      eqCalls.some(
        (c) =>
          c.table === 'content_items' &&
          c.column === 'org_id' &&
          c.value === ORG
      )
    ).toBe(true);
  });
});
