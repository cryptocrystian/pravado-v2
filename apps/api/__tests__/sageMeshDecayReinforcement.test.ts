/**
 * Wave-2 — SAGE mesh: signal DECAY + cross-pillar REINFORCEMENT.
 *
 * Load-bearing claims (all canon-grounded, SAGE_OPERATING_MODEL):
 *   1. Decay (§2.1 S(t)=S₀·e^(-λt), canon λ per category) reduces an OLD signal's
 *      effective score vs an identical FRESH one.
 *   2. The reinforcement matrix values are canon-verbatim (§3.3).
 *   3. A completed PR outcome reinforces the linked SEO/Content signals by the canon
 *      weight (buildReinforcementRows) and the scorer factors that boost in.
 *   4. Reinforcement is org-scoped (another org's boost never leaks in).
 *   5. The scorer factors BOTH decay and reinforcement into the final score.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  DECAY_LAMBDA_PER_HOUR,
  classifySignalCategory,
  decayFactor,
  applyDecay,
  computeAgeHours,
} from '../src/services/sage/sageDecay';
import { scoreOpportunities } from '../src/services/sage/sageOpportunityScorer';
import {
  REINFORCEMENT_MATRIX,
  buildReinforcementRows,
} from '../src/services/sage/sageReinforcement';

// ---------------------------------------------------------------------------
// 1. Decay — canon λ per category (SAGE_OPERATING_MODEL §2.1 L78-82)
// ---------------------------------------------------------------------------

describe('sageDecay — canon λ per category', () => {
  it('uses canon-verbatim λ rates normalised to per-hour', () => {
    expect(DECAY_LAMBDA_PER_HOUR.Crisis).toBe(0.5); // 0.5/hour
    expect(DECAY_LAMBDA_PER_HOUR.Opportunity).toBeCloseTo(0.1 / 24, 10); // 0.1/day
    expect(DECAY_LAMBDA_PER_HOUR.Gap).toBeCloseTo(0.02 / (24 * 7), 12); // 0.02/week
    expect(DECAY_LAMBDA_PER_HOUR.Competitive).toBeCloseTo(0.05 / 24, 10); // 0.05/day
    expect(DECAY_LAMBDA_PER_HOUR.Technical).toBeCloseTo(0.01 / 24, 10); // 0.01/day
  });

  it('classifies concrete signal_types into canon categories', () => {
    expect(classifySignalCategory('pr_pitch_window')).toBe('Opportunity');
    expect(classifySignalCategory('seo_content_gap')).toBe('Gap');
    expect(classifySignalCategory('seo_position_drop')).toBe('Technical');
    // Unknown → conservative canon default (Opportunity), never an invented λ.
    expect(classifySignalCategory('some_future_type')).toBe('Opportunity');
  });

  it('decayFactor is 1.0 at age 0 and monotonically decreasing', () => {
    expect(decayFactor('pr_pitch_window', 0)).toBe(1);
    const a = decayFactor('pr_pitch_window', 24); // 1 day
    const b = decayFactor('pr_pitch_window', 240); // 10 days
    expect(a).toBeLessThan(1);
    expect(b).toBeLessThan(a);
  });

  it('Crisis half-life ≈ 1.4h; Opportunity half-life ≈ 7d (canon §5.4)', () => {
    // e^(-λt) = 0.5 → t = ln2/λ
    const crisisHalfLife = Math.log(2) / DECAY_LAMBDA_PER_HOUR.Crisis;
    expect(crisisHalfLife).toBeCloseTo(1.386, 2); // ~1.4 hours
    const oppHalfLifeDays =
      Math.log(2) / DECAY_LAMBDA_PER_HOUR.Opportunity / 24;
    expect(oppHalfLifeDays).toBeCloseTo(6.93, 1); // ~7 days
  });

  it('applyDecay: an OLD signal has a smaller effective strength than a FRESH one', () => {
    const now = new Date('2026-08-07T00:00:00Z');
    const fresh = applyDecay(100, 'pr_pitch_window', now, now);
    const tenDaysOld = applyDecay(
      100,
      'pr_pitch_window',
      new Date('2026-07-28T00:00:00Z'),
      now
    );
    expect(fresh).toBe(100);
    expect(tenDaysOld).toBeLessThan(fresh);
    // 10 days at Opportunity λ=0.1/day → e^(-1) ≈ 0.3679 → ~36.8.
    expect(tenDaysOld).toBeCloseTo(100 * Math.exp(-1), 4);
  });

  it('computeAgeHours never returns negative (future scored_at cannot pre-decay)', () => {
    const now = new Date('2026-08-07T00:00:00Z');
    expect(computeAgeHours('2026-08-08T00:00:00Z', now)).toBe(0);
    expect(computeAgeHours('2026-08-06T00:00:00Z', now)).toBe(24);
  });
});

// ---------------------------------------------------------------------------
// 2. Reinforcement matrix — canon §3.3 (L190-195)
// ---------------------------------------------------------------------------

describe('sageReinforcement — canon §3.3 matrix', () => {
  it('holds the canon-verbatim coefficients', () => {
    expect(REINFORCEMENT_MATRIX.PR.Content).toBe(0.5); // PR → Content 0.50
    expect(REINFORCEMENT_MATRIX.PR.SEO).toBe(0.35); // PR → SEO 0.35
    expect(REINFORCEMENT_MATRIX.Content!.PR).toBe(0.45); // Content → PR 0.45
    expect(REINFORCEMENT_MATRIX.Content!.SEO).toBe(0.7); // Content → SEO 0.70
    expect(REINFORCEMENT_MATRIX.SEO!.PR).toBe(0.25); // SEO → PR 0.25
    expect(REINFORCEMENT_MATRIX.SEO!.Content).toBe(0.35); // SEO → Content 0.35
  });

  it('a completed PR action reinforces Content (0.50) and SEO (0.35) by the canon weight', () => {
    const rows = buildReinforcementRows({
      orgId: 'org-1',
      sourcePillar: 'PR',
      sourceSignalType: 'pr_high_value_unpitched',
      sourceOutcomeId: 'outcome-1',
      sourceImpact: 10, // EVI points
    });
    const content = rows.find((r) => r.recipient_pillar === 'Content')!;
    const seo = rows.find((r) => r.recipient_pillar === 'SEO')!;
    expect(rows).toHaveLength(2);
    // strength_delta = coefficient × impact.
    expect(content.coefficient).toBe(0.5);
    expect(content.strength_delta).toBe(5); // 0.50 × 10
    expect(seo.coefficient).toBe(0.35);
    expect(seo.strength_delta).toBeCloseTo(3.5, 4); // 0.35 × 10
    // A PR source never reinforces PR itself (that is "Direct impact 1.0").
    expect(rows.some((r) => r.recipient_pillar === 'PR')).toBe(false);
    // Provenance preserved for audit.
    expect(content.source_outcome_id).toBe('outcome-1');
  });

  it('null/zero source impact yields a 0 delta — never an invented base magnitude', () => {
    const rows = buildReinforcementRows({
      orgId: 'org-1',
      sourcePillar: 'Content',
      sourceSignalType: 'content_coverage_gap',
      sourceOutcomeId: 'o-2',
      sourceImpact: 0,
    });
    expect(rows.every((r) => r.strength_delta === 0)).toBe(true);
    // Content → PR (0.45) + Content → SEO (0.70).
    expect(rows.map((r) => r.recipient_pillar).sort()).toEqual(['PR', 'SEO']);
  });
});

// ---------------------------------------------------------------------------
// 3+4+5. Scorer factors decay + reinforcement; reinforcement is org-scoped
// ---------------------------------------------------------------------------

interface SignalRow {
  id: string;
  signal_type: string;
  pillar: string;
  priority: string;
  evi_impact_estimate: number;
  confidence: number;
  signal_data: Record<string, unknown>;
  scored_at: string;
  expires_at: string | null;
}

interface ReinfRow {
  recipient_pillar: string;
  strength_delta: number;
}

/**
 * Mock Supabase serving `sage_signals` (with .or/.order/.limit chain) and
 * `sage_signal_reinforcements` (with .eq chain). Reinforcement rows returned depend
 * on the org_id passed to .eq — so we can prove org-scoping.
 */
function makeSupabase(
  signals: SignalRow[],
  reinforcementsByOrg: Record<string, ReinfRow[]>
) {
  function table(name: string) {
    let orgFilter: string | null = null;
    const chain: any = {
      select: () => chain,
      eq: (_col: string, val: string) => {
        if (name === 'sage_signal_reinforcements') orgFilter = val;
        return chain;
      },
      or: () => chain,
      order: () => chain,
      limit: async () => ({ data: signals, error: null }),
      // reinforcement path terminates on the awaited select().eq()
      then: (res: any, rej: any) => {
        if (name === 'sage_signal_reinforcements') {
          const data = reinforcementsByOrg[orgFilter ?? ''] ?? [];
          return Promise.resolve({ data, error: null }).then(res, rej);
        }
        return Promise.resolve({ data: signals, error: null }).then(res, rej);
      },
    };
    return chain;
  }
  return { from: (name: string) => table(name) } as unknown as SupabaseClient;
}

describe('scoreOpportunities — factors decay AND reinforcement', () => {
  const now = new Date();
  const freshIso = now.toISOString();
  const tenDaysAgo = new Date(
    now.getTime() - 10 * 24 * 3_600_000
  ).toISOString();

  const baseSignal = (over: Partial<SignalRow>): SignalRow => ({
    id: 'sig',
    signal_type: 'pr_pitch_window',
    pillar: 'PR',
    priority: 'medium',
    evi_impact_estimate: 50,
    confidence: 0.5,
    signal_data: {},
    scored_at: freshIso,
    expires_at: null,
    ...over,
  });

  it('an OLD signal scores lower than an identical FRESH one (decay applied)', async () => {
    const supabase = makeSupabase(
      [
        baseSignal({ id: 'fresh', scored_at: freshIso }),
        baseSignal({ id: 'old', scored_at: tenDaysAgo }),
      ],
      {}
    );
    const scored = await scoreOpportunities(supabase, 'org-1');
    const fresh = scored.find((s) => s.signal_id === 'fresh')!;
    const old = scored.find((s) => s.signal_id === 'old')!;

    expect(fresh.decay_factor).toBe(1);
    expect(old.decay_factor).toBeLessThan(1);
    expect(old.opportunity_score).toBeLessThan(fresh.opportunity_score);
    // Fresh is ranked first (sorted desc).
    expect(scored[0].signal_id).toBe('fresh');
    // Old = base × e^(-1) (Opportunity λ=0.1/day over 10 days).
    expect(old.opportunity_score).toBeCloseTo(
      fresh.base_score * Math.exp(-1),
      1
    );
  });

  it('reinforcement boost is added to the recipient-pillar signal and is org-scoped', async () => {
    const seoSignal = baseSignal({
      id: 'seo-sig',
      pillar: 'SEO',
      signal_type: 'seo_content_gap',
      scored_at: freshIso,
    });

    // org-1 has a PR→SEO reinforcement of +3.5; org-2 has none.
    const supabaseOrg1 = makeSupabase([seoSignal], {
      'org-1': [{ recipient_pillar: 'SEO', strength_delta: 3.5 }],
    });
    const supabaseOrg2 = makeSupabase([seoSignal], {
      'org-1': [{ recipient_pillar: 'SEO', strength_delta: 3.5 }],
    });

    const [org1] = await scoreOpportunities(supabaseOrg1, 'org-1');
    const [org2] = await scoreOpportunities(supabaseOrg2, 'org-2');

    // Fresh signal → decay_factor 1, so score = base + reinforcement.
    expect(org1.reinforcement_boost).toBe(3.5);
    expect(org1.opportunity_score).toBeCloseTo(org1.base_score + 3.5, 2);

    // org-2 sees NO reinforcement (org-scoped) despite identical signal.
    expect(org2.reinforcement_boost).toBe(0);
    expect(org2.opportunity_score).toBeCloseTo(org2.base_score, 2);

    // The boost strictly raises org-1's score above org-2's.
    expect(org1.opportunity_score).toBeGreaterThan(org2.opportunity_score);
  });

  it('decay and reinforcement compose: old + reinforced', async () => {
    const supabase = makeSupabase(
      [
        baseSignal({
          id: 'old-seo',
          pillar: 'SEO',
          signal_type: 'seo_content_gap',
          scored_at: tenDaysAgo,
        }),
      ],
      { 'org-1': [{ recipient_pillar: 'SEO', strength_delta: 4 }] }
    );
    const [s] = await scoreOpportunities(supabase, 'org-1');
    // score = base × decay(Gap, 10d) + 4.  Gap λ = 0.02/week → tiny decay.
    const expectedDecay = Math.exp(-(0.02 / (24 * 7)) * (10 * 24));
    expect(s.decay_factor).toBeCloseTo(expectedDecay, 4);
    expect(s.opportunity_score).toBeCloseTo(
      s.base_score * expectedDecay + 4,
      1
    );
  });
});
