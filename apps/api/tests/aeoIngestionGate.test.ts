/**
 * AEO Ingestion-Readiness Gate tests — CiteMind Engine 1 (Lane D)
 *
 * Canon: SEO_AEO_PILLAR_CANON §3C (formula/bands) + §3E (advisory gate).
 */

import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  computeAeoScore,
  bandForScore,
  runAeoGate,
  AEO_GATE_THRESHOLD,
  AEO_WEIGHTS,
} from '../src/services/citeMind/aeoIngestionGate';
import { createMockSupabaseClient } from './helpers/supabaseMock';

const RICH_BODY = `# Acme Widget Report 2026

Acme Corporation released the Widget Pro on March 15, 2026. According to research from Gartner, 45% of buyers prefer modular widgets.

## Market Overview

The North American market grew 30% in 2025. Analysts at Forrester noted strong demand. See [the full study](https://example.com/study).

## Product Details

The Widget Pro ships with three modules. Microsoft and Google adopted similar designs in 2024.`;

const THIN = { title: 'It works', body: 'It is that thing. They did this. It that this here.', content_type: 'blog_post' };
const RICH = { title: 'Acme Widget Report 2026', body: RICH_BODY, content_type: 'blog_post' };

describe('AEO score formula (canon §3C)', () => {
  it('weights sum to 1.0 and match canon', () => {
    expect(AEO_WEIGHTS.entity_clarity).toBe(0.3);
    expect(AEO_WEIGHTS.schema_coverage).toBe(0.25);
    expect(AEO_WEIGHTS.semantic_depth).toBe(0.25);
    expect(AEO_WEIGHTS.authority_signal).toBe(0.2);
    const sum =
      AEO_WEIGHTS.entity_clarity +
      AEO_WEIGHTS.schema_coverage +
      AEO_WEIGHTS.semantic_depth +
      AEO_WEIGHTS.authority_signal;
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('maps scores to canon bands', () => {
    expect(bandForScore(0)).toBe('not_eligible');
    expect(bandForScore(40)).toBe('not_eligible');
    expect(bandForScore(41)).toBe('partially_eligible');
    expect(bandForScore(60)).toBe('partially_eligible');
    expect(bandForScore(61)).toBe('citation_ready');
    expect(bandForScore(80)).toBe('citation_ready');
    expect(bandForScore(81)).toBe('citation_dominant');
    expect(bandForScore(100)).toBe('citation_dominant');
  });

  it('recomputes overall from the weighted components', () => {
    const { score, components } = computeAeoScore(RICH, []);
    const expected = Math.round(
      components.entity_clarity * 0.3 +
        components.schema_coverage * 0.25 +
        components.semantic_depth * 0.25 +
        components.authority_signal * 0.2
    );
    expect(score).toBe(expected);
  });
});

describe('computeAeoScore — pass vs fail', () => {
  it('scores thin content below the gate threshold (blocked)', () => {
    const { score } = computeAeoScore(THIN, []);
    expect(score).toBeLessThan(AEO_GATE_THRESHOLD);
  });

  it('scores rich, entity-dense content at/above threshold (eligible)', () => {
    const { score, components } = computeAeoScore(RICH, [
      { schema_type: 'BlogPosting', schema_json: { '@type': 'BlogPosting', headline: 'x', author: 'y' } },
    ]);
    expect(score).toBeGreaterThanOrEqual(AEO_GATE_THRESHOLD);
    expect(components.entity_clarity).toBeGreaterThan(50);
    expect(components.schema_coverage).toBe(100);
  });
});

function gateMock(item: Record<string, unknown>, schemas: unknown[]): SupabaseClient {
  return createMockSupabaseClient({
    content_items: { data: item, error: null },
    citemind_schemas: { data: schemas as unknown as null, error: null },
    aeo_gate_results: { data: null, error: null },
  });
}

describe('runAeoGate — end to end', () => {
  it('BLOCKS below-threshold content with a bypass-permitting explanation', async () => {
    const supabase = gateMock(
      { id: 'c1', org_id: 'o1', title: THIN.title, body: THIN.body, content_type: 'blog_post', url: null },
      []
    );
    const spy = vi.spyOn(supabase, 'from');

    const res = await runAeoGate(supabase, 'c1', 'o1');

    expect(res.blocked).toBe(true);
    expect(res.passed).toBe(false);
    expect(res.band).toBe('not_eligible');
    expect(res.bypass_allowed).toBe(true);
    expect(res.explanation.toLowerCase()).toContain('unlikely');
    expect(res.gaps.length).toBeGreaterThan(0);
    // persisted an audit row
    expect(spy).toHaveBeenCalledWith('aeo_gate_results');
  });

  it('PASSES eligible content and does not block', async () => {
    const supabase = gateMock(
      { id: 'c2', org_id: 'o1', title: RICH.title, body: RICH.body, content_type: 'blog_post', url: 'https://acme.example/r' },
      [{ schema_type: 'BlogPosting', schema_json: { '@type': 'BlogPosting', headline: 'x', author: 'y' } }]
    );

    const res = await runAeoGate(supabase, 'c2', 'o1');

    expect(res.blocked).toBe(false);
    expect(res.passed).toBe(true);
    expect(res.aeo_score).toBeGreaterThanOrEqual(AEO_GATE_THRESHOLD);
    expect(['partially_eligible', 'citation_ready', 'citation_dominant']).toContain(res.band);
  });

  it('can skip persistence when persist:false', async () => {
    const supabase = gateMock(
      { id: 'c3', org_id: 'o1', title: THIN.title, body: THIN.body, content_type: 'blog_post', url: null },
      []
    );
    const spy = vi.spyOn(supabase, 'from');
    await runAeoGate(supabase, 'c3', 'o1', { persist: false });
    expect(spy).not.toHaveBeenCalledWith('aeo_gate_results');
  });
});
