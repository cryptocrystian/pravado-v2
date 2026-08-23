/**
 * Share of Model computation tests (SEO_AEO_PILLAR_CANON §4).
 * Pins the honest math: Brand / (Brand + Competitors) × 100, per-topic + trend,
 * and the honest-empty contract (no fabricated zeros).
 */

import { describe, it, expect } from 'vitest';

import {
  computeShareOfModel,
  type CitationResultRow,
} from '../src/services/citeMind/shareOfModelService';

const brand = (topic: string): CitationResultRow => ({
  brand_mentioned: true,
  mention_type: 'direct',
  query_topic: topic,
});
const competitor = (topic: string): CitationResultRow => ({
  brand_mentioned: false,
  mention_type: 'competitor',
  query_topic: topic,
});
/** Sampled answer that cited neither the brand nor a competitor. */
const uncited = (topic: string): CitationResultRow => ({
  brand_mentioned: false,
  mention_type: null,
  query_topic: topic,
});

describe('computeShareOfModel', () => {
  it('is honest-empty when there are no results', () => {
    const r = computeShareOfModel([], [], 30);
    expect(r.available).toBe(false);
    expect(r.shareOfModel).toBeNull();
    expect(r.trendDelta).toBeNull();
    expect(r.topics).toEqual([]);
    expect(r.sampledQueries).toBe(0);
  });

  it('returns available with a NULL share when rows exist but nothing was cited (no fake 0%)', () => {
    const r = computeShareOfModel([uncited('A'), uncited('B')], [], 30);
    expect(r.available).toBe(true);
    expect(r.shareOfModel).toBeNull(); // denominator 0 → no basis, not 0%
    expect(r.brandCitations).toBe(0);
    expect(r.competitorCitations).toBe(0);
    expect(r.sampledQueries).toBe(2);
    expect(r.topics).toEqual([]);
  });

  it('computes Brand / (Brand + Competitors) × 100 overall and per topic', () => {
    const current = [
      brand('A'),
      brand('A'),
      competitor('A'),
      competitor('B'),
      uncited('B'),
    ];
    const r = computeShareOfModel(current, [], 30);
    expect(r.available).toBe(true);
    expect(r.brandCitations).toBe(2);
    expect(r.competitorCitations).toBe(2);
    expect(r.shareOfModel).toBe(50); // 2 / (2+2) × 100
    expect(r.sampledQueries).toBe(5);
    // Topic A: 2 brand / (2+1) = 66.7 ; Topic B: 0 brand / (0+1) = 0
    const a = r.topics.find((t) => t.topic === 'A')!;
    const b = r.topics.find((t) => t.topic === 'B')!;
    expect(a.shareOfModel).toBe(66.7);
    expect(b.shareOfModel).toBe(0);
    // Sorted highest share first
    expect(r.topics[0].topic).toBe('A');
  });

  it('is 100% when only the brand is cited', () => {
    const r = computeShareOfModel([brand('A'), brand('A')], [], 30);
    expect(r.shareOfModel).toBe(100);
  });

  it('computes the trend delta vs the previous period (percentage points)', () => {
    // current: 3 brand / 1 competitor → 75% ; previous: 1 brand / 1 competitor → 50%
    const current = [brand('A'), brand('A'), brand('A'), competitor('A')];
    const previous = [brand('A'), competitor('A')];
    const r = computeShareOfModel(current, previous, 30);
    expect(r.shareOfModel).toBe(75);
    expect(r.trendDelta).toBe(25);
  });

  it('leaves trendDelta null when the previous period has no citations', () => {
    const r = computeShareOfModel(
      [brand('A'), competitor('A')],
      [uncited('A')],
      30
    );
    expect(r.shareOfModel).toBe(50);
    expect(r.trendDelta).toBeNull();
  });
});
