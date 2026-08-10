/**
 * Authority Signals Scorer tests (W2 — Content Insights, D038).
 *
 * Asserts computeAuthoritySignals matches AUTHORITY_SIGNALS_MODEL.md §2 EXACTLY
 * for representative inputs, and that computeAndPersistAuthoritySignals writes
 * an org-scoped row to content_authority_signals.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  computeAuthoritySignals,
  computeAndPersistAuthoritySignals,
  type CiteMindScoreRow,
} from '../src/services/content/authoritySignalsService';

const base: CiteMindScoreRow = {
  overall_score: 80,
  schema_markup_score: 90,
  structural_clarity_score: 60,
  entity_density_score: 30,
  gate_status: 'approved',
};

describe('computeAuthoritySignals — canon formulas (AUTHORITY_SIGNALS_MODEL.md §2)', () => {
  it('§2.1 citation_eligibility = overall_score', () => {
    expect(computeAuthoritySignals(base).citation_eligibility).toBe(80);
  });

  it('§2.2 ai_ingestion_likelihood = mean(schema, clarity, entity) → 60', () => {
    // mean(90, 60, 30) = 180 / 3 = 60
    expect(computeAuthoritySignals(base).ai_ingestion_likelihood).toBe(60);
  });

  it('§2.3 authority_contribution: gate_status=blocked → 0', () => {
    const signals = computeAuthoritySignals({
      ...base,
      gate_status: 'blocked',
    });
    expect(signals.authority_contribution).toBe(0);
  });

  it('§2.3 authority_contribution: gate=approved, overall=80 → 80', () => {
    const signals = computeAuthoritySignals({
      ...base,
      gate_status: 'approved',
      overall_score: 80,
    });
    expect(signals.authority_contribution).toBe(80);
  });

  it('§2.3 gate_status=review → gate_factor 0.5 (overall 80 → 40)', () => {
    const signals = computeAuthoritySignals({ ...base, gate_status: 'review' });
    expect(signals.authority_contribution).toBe(40);
  });

  it('§2.3 scorer synonyms passed/warning map to approved/review', () => {
    expect(
      computeAuthoritySignals({ ...base, gate_status: 'passed' })
        .authority_contribution
    ).toBe(80);
    expect(
      computeAuthoritySignals({ ...base, gate_status: 'warning' })
        .authority_contribution
    ).toBe(40);
  });

  it('§2.4 cross_pillar_impact = 0.8 × 0.35 × 2.15 = 0.602', () => {
    // (authority_contribution / 100) × 0.35 × (1 + 0.45 + 0.70)
    // = (80 / 100) × 0.35 × 2.15 = 0.602
    const signals = computeAuthoritySignals({
      ...base,
      gate_status: 'approved',
      overall_score: 80,
    });
    expect(signals.cross_pillar_impact).toBeCloseTo(0.602, 6);
  });

  it('§2.4 cross_pillar_impact is 0 when authority_contribution is 0 (blocked)', () => {
    const signals = computeAuthoritySignals({
      ...base,
      gate_status: 'blocked',
    });
    expect(signals.cross_pillar_impact).toBe(0);
  });

  it('§2.5 competitive_authority_delta = null (data-gated, never faked)', () => {
    expect(
      computeAuthoritySignals(base).competitive_authority_delta
    ).toBeNull();
    // Even for a blocked asset it stays null — never 0.
    expect(
      computeAuthoritySignals({ ...base, gate_status: 'blocked' })
        .competitive_authority_delta
    ).toBeNull();
  });

  it('unrecognized gate_status → gate_factor 0 (anti-gaming conservative)', () => {
    const signals = computeAuthoritySignals({
      ...base,
      gate_status: 'analyzing',
    });
    expect(signals.authority_contribution).toBe(0);
  });
});

describe('computeAndPersistAuthoritySignals — org-scoped persistence', () => {
  it('inserts a row into content_authority_signals with org_id + asset_id and computed values', async () => {
    const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
    const supabase = {
      from(table: string) {
        return {
          insert(row: Record<string, unknown>) {
            inserts.push({ table, row });
            return Promise.resolve({ error: null });
          },
        };
      },
    } as unknown as SupabaseClient;

    const signals = await computeAndPersistAuthoritySignals(supabase, {
      orgId: 'org-42',
      assetId: 'asset-7',
      score: { ...base, gate_status: 'approved', overall_score: 80 },
    });

    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe('content_authority_signals');
    const row = inserts[0].row;
    expect(row.org_id).toBe('org-42');
    expect(row.asset_id).toBe('asset-7');
    expect(row.authority_contribution_score).toBe(80);
    expect(row.citation_eligibility_score).toBe(80);
    expect(row.ai_ingestion_likelihood).toBe(60);
    // cross_pillar_impact rounded to numeric(5,2): 0.602 → 0.6
    expect(row.cross_pillar_impact).toBe(0.6);
    // competitive_authority_delta is NOT written a computed value (data-gated).
    expect(row.competitive_authority_delta).toBeUndefined();
    // Returned signals keep the data-gated null.
    expect(signals.competitive_authority_delta).toBeNull();
  });

  it('throws when the insert errors (no silent swallow in the non-safe path)', async () => {
    const supabase = {
      from() {
        return {
          insert() {
            return Promise.resolve({ error: { message: 'boom' } });
          },
        };
      },
    } as unknown as SupabaseClient;

    await expect(
      computeAndPersistAuthoritySignals(supabase, {
        orgId: 'org-1',
        assetId: 'asset-1',
        score: base,
      })
    ).rejects.toThrow(/boom/);
  });
});
