/**
 * EVI Component Mathematics tests (Wave-2: EVI real math)
 *
 * Validates the canonical 14 sub-metric formula, the insufficient_data
 * renormalisation + coverage mechanism, and an end-to-end EVI from fixtures.
 * References: EARNED_VISIBILITY_INDEX.md §3, EVI_MATHEMATICS.md §2/§9.
 */

import { describe, it, expect } from 'vitest';

import {
  EVI_WEIGHTS,
  VISIBILITY_WEIGHTS,
  AUTHORITY_WEIGHTS,
  MOMENTUM_WEIGHTS,
  composeComponent,
  computeVisibility,
  computeAuthority,
  computeMomentum,
  computeEVI,
  getEVIBand,
  aiPresence,
  pressCoverage,
  serpCoverage,
  citationQuality,
  domainAuthority,
  journalistMatch,
  structuredData,
  citationVelocity,
  contentVelocity,
  sovChange,
  type PeriodSignals,
  type SubMetric,
} from '../src/services/evi/eviComponentMath';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A period with rich, fully-observable data for every REAL sub-metric. */
function richPeriod(overrides: Partial<PeriodSignals> = {}): PeriodSignals {
  return {
    periodStart: '2026-07-07T00:00:00.000Z',
    periodEnd: '2026-08-06T00:00:00.000Z',
    periodDays: 30,
    // citation (Engine-3)
    citationMonitored: true,
    citationTotalQueries: 20,
    citationBrandMentions: 10,
    citationDirectMentions: 8,
    citationIndirectMentions: 2,
    citationCompetitorMentions: 5,
    citationDistinctEngines: 3,
    citationEnginesPolled: 4,
    // press
    monitoringSourceCount: 3,
    pressMentionCount: 6,
    pressTierWeightedMentions: 15, // → 50/100 at saturation 30
    brandMentionArticleCount: 6,
    brandMentionAvgRelevance: 0.8,
    // backlinks
    referringDomainCount: 4,
    referringDomainWeightedDA: 60,
    // content / schema
    publishedContentCount: 10,
    schemaCoveredPages: 7,
    contentEverExists: true,
    ...overrides,
  };
}

/** A period with NO observable data at all. */
function emptyPeriod(overrides: Partial<PeriodSignals> = {}): PeriodSignals {
  return {
    periodStart: '2026-06-07T00:00:00.000Z',
    periodEnd: '2026-07-07T00:00:00.000Z',
    periodDays: 30,
    citationMonitored: false,
    citationTotalQueries: 0,
    citationBrandMentions: 0,
    citationDirectMentions: 0,
    citationIndirectMentions: 0,
    citationCompetitorMentions: 0,
    citationDistinctEngines: 0,
    citationEnginesPolled: 0,
    monitoringSourceCount: 0,
    pressMentionCount: 0,
    pressTierWeightedMentions: 0,
    brandMentionArticleCount: 0,
    brandMentionAvgRelevance: null,
    referringDomainCount: 0,
    referringDomainWeightedDA: 0,
    publishedContentCount: 0,
    schemaCoveredPages: 0,
    contentEverExists: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Canonical weights
// ---------------------------------------------------------------------------

describe('EVI canonical weights (EVI_MATHEMATICS §9.1)', () => {
  it('top-level weights sum to 1.0 and match canon', () => {
    expect(EVI_WEIGHTS.visibility).toBe(0.4);
    expect(EVI_WEIGHTS.authority).toBe(0.35);
    expect(EVI_WEIGHTS.momentum).toBe(0.25);
    expect(
      EVI_WEIGHTS.visibility + EVI_WEIGHTS.authority + EVI_WEIGHTS.momentum
    ).toBeCloseTo(1);
  });

  it('each component sub-weights sum to 1.0', () => {
    const sum = (o: Record<string, number>) =>
      Object.values(o).reduce((a, b) => a + b, 0);
    expect(sum(VISIBILITY_WEIGHTS)).toBeCloseTo(1);
    expect(sum(AUTHORITY_WEIGHTS)).toBeCloseTo(1);
    expect(sum(MOMENTUM_WEIGHTS)).toBeCloseTo(1);
  });
});

// ---------------------------------------------------------------------------
// composeComponent: renormalisation + coverage
// ---------------------------------------------------------------------------

describe('composeComponent renormalisation + coverage', () => {
  it('renormalises weights over real sub-metrics only', () => {
    const subs: SubMetric[] = [
      { key: 'a', value: 80, status: 'real', weight: 0.35, source: '' },
      { key: 'b', value: 40, status: 'real', weight: 0.25, source: '' },
      {
        key: 'c',
        value: null,
        status: 'insufficient_data',
        weight: 0.25,
        source: '',
      },
      {
        key: 'd',
        value: null,
        status: 'insufficient_data',
        weight: 0.15,
        source: '',
      },
    ];
    const r = composeComponent(subs);
    // real weight = 0.60; score = (80*0.35 + 40*0.25)/0.60 = 38/0.6 = 63.33
    expect(r.score).toBeCloseTo(63.33, 1);
    expect(r.coverage).toBeCloseTo(0.6, 4);
  });

  it('reports zero score and zero coverage when nothing is observable', () => {
    const subs: SubMetric[] = [
      {
        key: 'a',
        value: null,
        status: 'insufficient_data',
        weight: 0.5,
        source: '',
      },
      {
        key: 'b',
        value: null,
        status: 'insufficient_data',
        weight: 0.5,
        source: '',
      },
    ];
    const r = composeComponent(subs);
    expect(r.score).toBe(0);
    expect(r.coverage).toBe(0);
  });

  it('a single real sub-metric drives the whole component (coverage flags the gap)', () => {
    const subs: SubMetric[] = [
      { key: 'a', value: 90, status: 'real', weight: 0.35, source: '' },
      {
        key: 'b',
        value: null,
        status: 'insufficient_data',
        weight: 0.65,
        source: '',
      },
    ];
    const r = composeComponent(subs);
    expect(r.score).toBe(90);
    expect(r.coverage).toBeCloseTo(0.35, 4);
  });
});

// ---------------------------------------------------------------------------
// Individual sub-metrics — REAL math
// ---------------------------------------------------------------------------

describe('sub-metric math (real sources)', () => {
  it('aiPresence = brand mentions / total queries × 100', () => {
    const m = aiPresence(richPeriod());
    expect(m.status).toBe('real');
    expect(m.value).toBe(50); // 10/20
  });

  it('pressCoverage normalises tier-weighted mentions against saturation', () => {
    const m = pressCoverage(richPeriod());
    expect(m.status).toBe('real');
    expect(m.value).toBe(50); // 15 / 30 * 100
  });

  it('pressCoverage saturates at 100', () => {
    const m = pressCoverage(richPeriod({ pressTierWeightedMentions: 90 }));
    expect(m.value).toBe(100);
  });

  it('citationQuality = 0.7·directShare + 0.3·engineDiversity', () => {
    const m = citationQuality(richPeriod());
    // directShare = 8/10 = 0.8; diversity = 3/4 = 0.75
    // (0.8*0.7 + 0.75*0.3) * 100 = (0.56 + 0.225) * 100 = 78.5
    expect(m.status).toBe('real');
    expect(m.value).toBeCloseTo(78.5, 1);
  });

  it('domainAuthority passes weighted DA through', () => {
    const m = domainAuthority(richPeriod());
    expect(m.status).toBe('real');
    expect(m.value).toBe(60);
  });

  it('journalistMatch scales avg relevance (0-1) to 0-100', () => {
    const m = journalistMatch(richPeriod());
    expect(m.status).toBe('real');
    expect(m.value).toBe(80);
  });

  it('structuredData = schema pages / published pages × 100', () => {
    const m = structuredData(richPeriod());
    expect(m.status).toBe('real');
    expect(m.value).toBe(70); // 7/10
  });

  it('citationVelocity maps growth to a 0-100 score (50 = flat)', () => {
    const cur = richPeriod({ citationBrandMentions: 12 });
    const prior = richPeriod({ citationBrandMentions: 10 });
    const m = citationVelocity(cur, prior);
    // +20% → 50 + 20*0.5 = 60
    expect(m.status).toBe('real');
    expect(m.value).toBe(60);
  });

  it('citationVelocity: flat period-over-period → 50', () => {
    const m = citationVelocity(richPeriod(), richPeriod());
    expect(m.value).toBe(50);
  });

  it('contentVelocity rewards increased publishing cadence', () => {
    const cur = richPeriod({ publishedContentCount: 15 });
    const prior = richPeriod({ publishedContentCount: 10 });
    const m = contentVelocity(cur, prior);
    // +50% → 50 + 25 = 75
    expect(m.value).toBe(75);
  });

  it('sovChange rewards rising share of voice', () => {
    // current: brand 10 / (10+5)=0.667 ; prior: brand 8/(8+8)=0.5 → +16.7pp
    const cur = richPeriod({
      citationBrandMentions: 10,
      citationCompetitorMentions: 5,
    });
    const prior = richPeriod({
      citationBrandMentions: 8,
      citationCompetitorMentions: 8,
    });
    const m = sovChange(cur, prior);
    expect(m.status).toBe('real');
    expect(m.value).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// insufficient_data handling — structural + data-driven
// ---------------------------------------------------------------------------

describe('insufficient_data handling', () => {
  it('SERP and snippets are always insufficient (no source wired)', () => {
    expect(serpCoverage().status).toBe('insufficient_data');
    expect(serpCoverage().value).toBeNull();
  });

  it('aiPresence is insufficient when no citation polling ran', () => {
    const m = aiPresence(emptyPeriod());
    expect(m.status).toBe('insufficient_data');
    expect(m.value).toBeNull();
  });

  it('domainAuthority is insufficient with no referring domains', () => {
    const m = domainAuthority(emptyPeriod());
    expect(m.status).toBe('insufficient_data');
  });

  it('journalistMatch is insufficient with no covering articles', () => {
    expect(journalistMatch(emptyPeriod()).status).toBe('insufficient_data');
  });

  it('structuredData is insufficient with no published content', () => {
    expect(structuredData(emptyPeriod()).status).toBe('insufficient_data');
  });

  it('sovChange is insufficient with no competitor mentions', () => {
    const cur = richPeriod({
      citationBrandMentions: 0,
      citationCompetitorMentions: 0,
    });
    expect(sovChange(cur, emptyPeriod()).status).toBe('insufficient_data');
  });
});

// ---------------------------------------------------------------------------
// Component-level coverage (the honest gaps)
// ---------------------------------------------------------------------------

describe('component coverage with real fixtures', () => {
  it('visibility covers exactly the AI+Press legs (0.60) — SERP+Snippets missing', () => {
    const v = computeVisibility(richPeriod());
    expect(v.coverage).toBeCloseTo(0.6, 4);
    // score = (50*0.35 + 50*0.25)/0.60 = 50
    expect(v.score).toBe(50);
  });

  it('authority covers 4 of 5 legs (0.90) — EEAT missing', () => {
    const a = computeAuthority(richPeriod());
    expect(a.coverage).toBeCloseTo(0.9, 4);
  });

  it('momentum covers 3 of 5 legs (0.75) — Topic+Ranking missing', () => {
    const m = computeMomentum(richPeriod(), richPeriod());
    expect(m.coverage).toBeCloseTo(0.75, 4);
  });
});

// ---------------------------------------------------------------------------
// Bands
// ---------------------------------------------------------------------------

describe('scoring bands (EVI_MATHEMATICS §9.3)', () => {
  it('maps scores to canonical bands', () => {
    expect(getEVIBand(20)).toBe('at_risk');
    expect(getEVIBand(50)).toBe('emerging');
    expect(getEVIBand(70)).toBe('competitive');
    expect(getEVIBand(90)).toBe('dominant');
  });
});

// ---------------------------------------------------------------------------
// End-to-end EVI from fixtures
// ---------------------------------------------------------------------------

describe('end-to-end computeEVI', () => {
  it('composes EVI from real fixtures using canonical top weights', () => {
    const current = richPeriod();
    const prior = richPeriod({
      citationBrandMentions: 8,
      publishedContentCount: 8,
      citationCompetitorMentions: 8,
    });

    const evi = computeEVI(current, prior);

    // Recompute expected top-level from component scores.
    const expected =
      Math.round(
        Math.max(
          0,
          Math.min(
            100,
            evi.visibility.score * 0.4 +
              evi.authority.score * 0.35 +
              evi.momentum.score * 0.25
          )
        ) * 100
      ) / 100;

    expect(evi.evi_score).toBe(expected);
    expect(evi.evi_score).toBeGreaterThan(0);
    expect(evi.evi_score).toBeLessThanOrEqual(100);
    expect(evi.band).toBe(getEVIBand(evi.evi_score));
  });

  it('produces a 0 EVI with 0 coverage when nothing is observable', () => {
    const evi = computeEVI(emptyPeriod(), emptyPeriod());
    expect(evi.evi_score).toBe(0);
    expect(evi.overall_coverage).toBe(0);
    expect(evi.visibility.coverage).toBe(0);
    expect(evi.authority.coverage).toBe(0);
    expect(evi.momentum.coverage).toBe(0);
  });

  it('overall_coverage is the weighted blend of component coverages', () => {
    const evi = computeEVI(richPeriod(), richPeriod());
    const expected =
      evi.visibility.coverage * 0.4 +
      evi.authority.coverage * 0.35 +
      evi.momentum.coverage * 0.25;
    expect(evi.overall_coverage).toBeCloseTo(
      Math.round(expected * 10000) / 10000,
      4
    );
  });

  it('every canonical sub-metric is present and tagged real|insufficient_data', () => {
    const evi = computeEVI(richPeriod(), richPeriod());
    const keys = [
      ...evi.visibility.sub_metrics,
      ...evi.authority.sub_metrics,
      ...evi.momentum.sub_metrics,
    ].map((m) => m.key);
    expect(keys).toEqual([
      'ai_presence',
      'press_coverage',
      'serp_coverage',
      'snippets',
      'citation_quality',
      'domain_authority',
      'journalist_match',
      'structured_data',
      'eeat_density',
      'citation_velocity',
      'sov_change',
      'content_velocity',
      'topic_growth',
      'ranking_trajectory',
    ]);
    expect(keys).toHaveLength(14);
  });
});
