/**
 * Wave-2 — deriveImpactPillars unit tests (SAGE_v2 proposal contract).
 * Cross-pillar attribution: primary pillar always first + non-empty; canonical
 * reinforcement targets; signal-driven AEO.
 */

import { describe, it, expect } from 'vitest';

import { deriveImpactPillars } from '../src/services/sage/sageImpactPillars';

describe('deriveImpactPillars', () => {
  it('primary pillar is always present and first', () => {
    expect(deriveImpactPillars('PR', 'coverage_detected')[0]).toBe('PR');
    expect(deriveImpactPillars('Content', 'topic_gap')[0]).toBe('Content');
    expect(deriveImpactPillars('SEO', 'ingestibility')[0]).toBe('SEO');
  });

  it('PR reinforces Content', () => {
    expect(deriveImpactPillars('PR', 'coverage_detected')).toEqual([
      'PR',
      'Content',
    ]);
  });

  it('Content reinforces SEO and AEO', () => {
    expect(deriveImpactPillars('Content', 'topic_gap')).toEqual([
      'Content',
      'SEO',
      'AEO',
    ]);
  });

  it('citation-flavored signals add AEO even from PR', () => {
    const pillars = deriveImpactPillars('PR', 'citation_gap_detected');
    expect(pillars).toContain('PR');
    expect(pillars).toContain('AEO');
  });

  it('never returns an empty array and never duplicates', () => {
    const pillars = deriveImpactPillars('SEO', 'aeo_answer_gap');
    expect(pillars.length).toBeGreaterThan(0);
    expect(new Set(pillars).size).toBe(pillars.length);
  });
});
