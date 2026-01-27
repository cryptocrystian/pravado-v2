/**
 * EVI Computation Unit Tests
 *
 * Tests the canonical EVI formula and computation logic.
 *
 * @see /docs/canon/EVI_SPEC.md
 */

import { describe, it, expect } from 'vitest';
import { computeEVI, validateEVIFormula, computeEVIForecast } from '../compute';
import { EVI_WEIGHTS, EVI_BANDS } from '../types';
import type { EVIInputSnapshot, ComputedEVI } from '../types';

// Helper to create a valid input snapshot
function createSnapshot(overrides: Partial<{
  visibility: number;
  authority: number;
  momentum: number;
}>): EVIInputSnapshot {
  const now = new Date().toISOString();
  return {
    generated_at: now,
    org_id: 'test-org',
    visibility: {
      type: 'visibility',
      score: overrides.visibility ?? 72.5,
      confidence: 0.85,
      components: [],
      delta_7d: 5.2,
      delta_30d: 12.1,
      updated_at: now,
    },
    authority: {
      type: 'authority',
      score: overrides.authority ?? 64.8,
      confidence: 0.82,
      components: [],
      delta_7d: 2.1,
      delta_30d: 6.4,
      updated_at: now,
    },
    momentum: {
      type: 'momentum',
      score: overrides.momentum ?? 61.2,
      confidence: 0.78,
      components: [],
      delta_7d: 4.8,
      delta_30d: 8.9,
      updated_at: now,
    },
    historical_scores: [
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), score: 54.2 },
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), score: 56.8 },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), score: 59.1 },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), score: 61.2 },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), score: 63.3 },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), score: 65.1 },
      { date: now, score: 67.4 },
    ],
  };
}

describe('EVI Formula Constants', () => {
  it('should have weights summing to 1.0', () => {
    const sum = EVI_WEIGHTS.visibility + EVI_WEIGHTS.authority + EVI_WEIGHTS.momentum;
    expect(sum).toBeCloseTo(1.0, 3);
  });

  it('should have correct individual weights', () => {
    expect(EVI_WEIGHTS.visibility).toBe(0.40);
    expect(EVI_WEIGHTS.authority).toBe(0.35);
    expect(EVI_WEIGHTS.momentum).toBe(0.25);
  });

  it('should have contiguous bands', () => {
    expect(EVI_BANDS.at_risk.max + 1).toBe(EVI_BANDS.emerging.min);
    expect(EVI_BANDS.emerging.max + 1).toBe(EVI_BANDS.competitive.min);
    expect(EVI_BANDS.competitive.max + 1).toBe(EVI_BANDS.dominant.min);
  });

  it('should cover full 0-100 range', () => {
    expect(EVI_BANDS.at_risk.min).toBe(0);
    expect(EVI_BANDS.dominant.max).toBe(100);
  });
});

describe('computeEVI', () => {
  it('should compute correct EVI score using canonical formula', () => {
    const snapshot = createSnapshot({
      visibility: 72.5,
      authority: 64.8,
      momentum: 61.2,
    });

    const result = computeEVI(snapshot);

    // EVI = 72.5 * 0.40 + 64.8 * 0.35 + 61.2 * 0.25
    // EVI = 29.0 + 22.68 + 15.3 = 66.98 ≈ 67.0
    expect(result.score).toBeCloseTo(67.0, 1);
  });

  it('should determine correct status band', () => {
    // At Risk (0-40)
    let result = computeEVI(createSnapshot({ visibility: 30, authority: 30, momentum: 30 }));
    expect(result.status).toBe('at_risk');

    // Emerging (41-60)
    result = computeEVI(createSnapshot({ visibility: 50, authority: 50, momentum: 50 }));
    expect(result.status).toBe('emerging');

    // Competitive (61-80)
    result = computeEVI(createSnapshot({ visibility: 70, authority: 70, momentum: 70 }));
    expect(result.status).toBe('competitive');

    // Dominant (81-100)
    result = computeEVI(createSnapshot({ visibility: 90, authority: 90, momentum: 90 }));
    expect(result.status).toBe('dominant');
  });

  it('should compute correct trend from delta', () => {
    const snapshot = createSnapshot({});
    const result = computeEVI(snapshot);

    // Delta is positive, trend should be 'up'
    expect(result.trend).toBe('up');
  });

  it('should clamp score to 0-100 range', () => {
    // Over 100
    let result = computeEVI(createSnapshot({ visibility: 150, authority: 150, momentum: 150 }));
    expect(result.score).toBeLessThanOrEqual(100);

    // Below 0 (theoretically impossible but test boundary)
    result = computeEVI(createSnapshot({ visibility: 0, authority: 0, momentum: 0 }));
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should include driver breakdown', () => {
    const snapshot = createSnapshot({
      visibility: 72.5,
      authority: 64.8,
      momentum: 61.2,
    });

    const result = computeEVI(snapshot);

    expect(result.drivers.visibility.score).toBe(72.5);
    expect(result.drivers.visibility.weighted).toBeCloseTo(29.0, 1);

    expect(result.drivers.authority.score).toBe(64.8);
    expect(result.drivers.authority.weighted).toBeCloseTo(22.68, 1);

    expect(result.drivers.momentum.score).toBe(61.2);
    expect(result.drivers.momentum.weighted).toBeCloseTo(15.3, 1);
  });

  it('should generate sparkline with 7 points', () => {
    const snapshot = createSnapshot({});
    const result = computeEVI(snapshot);

    expect(result.sparkline).toHaveLength(7);
  });

  it('should compute confidence from driver confidences', () => {
    const snapshot = createSnapshot({});
    const result = computeEVI(snapshot);

    // confidence = 0.85 * 0.40 + 0.82 * 0.35 + 0.78 * 0.25
    // confidence = 0.34 + 0.287 + 0.195 = 0.822
    expect(result.confidence).toBeCloseTo(0.82, 1);
  });

  it('should throw on invalid snapshot', () => {
    const invalidSnapshot = {
      generated_at: new Date().toISOString(),
      org_id: 'test',
      visibility: null,
      authority: null,
      momentum: null,
      historical_scores: [],
    } as unknown as EVIInputSnapshot;

    expect(() => computeEVI(invalidSnapshot)).toThrow();
  });
});

describe('validateEVIFormula', () => {
  it('should return valid for correct formula', () => {
    const result = validateEVIFormula();

    expect(result.valid).toBe(true);
    expect(result.formula).toContain('0.4');
    expect(result.formula).toContain('0.35');
    expect(result.formula).toContain('0.25');
  });

  it('should include weights and bands in output', () => {
    const result = validateEVIFormula();

    expect(result.weights).toEqual(EVI_WEIGHTS);
    expect(result.bands).toEqual(EVI_BANDS);
  });
});

describe('computeEVIForecast', () => {
  it('should compute baseline forecast', () => {
    const currentEVI: ComputedEVI = {
      score: 67.4,
      previous_score: 63.3,
      delta_7d: 4.1,
      delta_30d: 12.8,
      status: 'competitive',
      trend: 'up',
      drivers: {
        visibility: { score: 72.5, weighted: 29.0, delta_7d: 5.2, trend: 'up' },
        authority: { score: 64.8, weighted: 22.68, delta_7d: 2.1, trend: 'up' },
        momentum: { score: 61.2, weighted: 15.3, delta_7d: 4.8, trend: 'up' },
      },
      sparkline: [54.2, 56.8, 59.1, 61.2, 63.3, 65.1, 67.4],
      computed_at: new Date().toISOString(),
      confidence: 0.82,
    };

    const forecast = computeEVIForecast(currentEVI, []);

    expect(forecast.expected).toBeGreaterThan(currentEVI.score);
    expect(forecast.low).toBeLessThan(forecast.expected);
    expect(forecast.high).toBeGreaterThan(forecast.expected);
  });

  it('should apply scenario deltas', () => {
    const currentEVI: ComputedEVI = {
      score: 67.4,
      previous_score: 63.3,
      delta_7d: 4.1,
      delta_30d: 12.8,
      status: 'competitive',
      trend: 'up',
      drivers: {
        visibility: { score: 72.5, weighted: 29.0, delta_7d: 5.2, trend: 'up' },
        authority: { score: 64.8, weighted: 22.68, delta_7d: 2.1, trend: 'up' },
        momentum: { score: 61.2, weighted: 15.3, delta_7d: 4.8, trend: 'up' },
      },
      sparkline: [54.2, 56.8, 59.1, 61.2, 63.3, 65.1, 67.4],
      computed_at: new Date().toISOString(),
      confidence: 0.82,
    };

    const scenarios = [
      { delta_authority: 5, delta_momentum: 2 }, // Schema fixes
    ];

    const forecast = computeEVIForecast(currentEVI, scenarios);
    const baselineForecast = computeEVIForecast(currentEVI, []);

    expect(forecast.expected).toBeGreaterThan(baselineForecast.expected);
  });
});
