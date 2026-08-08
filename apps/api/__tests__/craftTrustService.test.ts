/**
 * Wave-2 — CRAFT Trust Ladder tests (Autopilot prerequisites / SAFETY FLOOR).
 *
 * Load-bearing claims:
 *   1. Trust GRADUATES from earned signal per canon §2.3 (New→Established→Proven→Veteran),
 *      with every threshold taken verbatim from canon.
 *   2. A LOW-TRUST pillar cannot reach Autopilot eligibility even at 0.99 confidence —
 *      trust is the fifth ceiling folded into computeExecutionMode.
 *   3. Trust accrues from completed executions and writes an immutable audit row when the
 *      level moves. Autonomy stays OFF throughout.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  computeExecutionMode,
  AUTONOMOUS_AUTOPILOT_ENABLED,
} from '../src/services/craft/craftExecutionService';
import {
  computeTrustLevel,
  trustCeiling,
  getPillarTrust,
  recordExecutionOutcome,
  type TrustCounters,
} from '../src/services/craft/craftTrustService';

const NOW = new Date('2026-08-07T00:00:00Z');
function daysAgoIso(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}
function counters(p: Partial<TrustCounters>): TrustCounters {
  return {
    successful_executions: 0,
    failed_executions: 0,
    critical_failures: 0,
    human_approvals: 0,
    human_dismissals: 0,
    first_active_at: null,
    last_activity_at: null,
    ...p,
  };
}

// ---------------------------------------------------------------------------
// 1. Canon §2.3 graduation rules
// ---------------------------------------------------------------------------

describe('computeTrustLevel — canon §2.3 graduation', () => {
  it('a fresh org/pillar is New (Manual only)', () => {
    expect(computeTrustLevel(counters({}), NOW)).toBe('new');
  });

  it('30+ successful, 0 critical failures → Established', () => {
    expect(
      computeTrustLevel(counters({ successful_executions: 30 }), NOW)
    ).toBe('established');
  });

  it('a single critical failure blocks Established (canon "0 critical failures")', () => {
    expect(
      computeTrustLevel(
        counters({ successful_executions: 50, critical_failures: 1 }),
        NOW
      )
    ).toBe('new');
  });

  it('100+ successful, <2% failure, 90+ days → Proven', () => {
    expect(
      computeTrustLevel(
        counters({
          successful_executions: 100,
          failed_executions: 1, // ~0.99% < 2%
          first_active_at: daysAgoIso(90),
        }),
        NOW
      )
    ).toBe('proven');
  });

  it('Proven requires 90+ days active — 89 days stays Established', () => {
    expect(
      computeTrustLevel(
        counters({
          successful_executions: 100,
          first_active_at: daysAgoIso(89),
        }),
        NOW
      )
    ).toBe('established');
  });

  it('Proven requires <2% failure rate — 3% caps at Established', () => {
    expect(
      computeTrustLevel(
        counters({
          successful_executions: 100,
          failed_executions: 4, // ~3.8% ≥ 2%
          first_active_at: daysAgoIso(120),
        }),
        NOW
      )
    ).toBe('established');
  });

  it('500+ successful, <1% failure, 180+ days → Veteran', () => {
    expect(
      computeTrustLevel(
        counters({
          successful_executions: 500,
          failed_executions: 2, // ~0.4% < 1%
          first_active_at: daysAgoIso(180),
        }),
        NOW
      )
    ).toBe('veteran');
  });
});

describe('trustCeiling — canon §2.2 Mode Eligibility Matrix (Trust row)', () => {
  it('New→manual, Established→copilot, Proven→autopilot, Veteran→autopilot', () => {
    expect(trustCeiling('new')).toBe('manual');
    expect(trustCeiling('established')).toBe('copilot');
    expect(trustCeiling('proven')).toBe('autopilot');
    expect(trustCeiling('veteran')).toBe('autopilot');
  });
});

// ---------------------------------------------------------------------------
// 2. Trust as the fifth ceiling in computeExecutionMode
// ---------------------------------------------------------------------------

describe('computeExecutionMode — low trust blocks Autopilot even at high confidence', () => {
  it('a NEW-trust pillar caps at manual despite 0.99 confidence / low risk / reversible / autopilot plan', () => {
    const m = computeExecutionMode({
      confidence: 0.99,
      riskClass: 'low',
      reversibility: 'fully',
      planCeiling: 'autopilot',
      trustCeiling: 'manual', // New pillar
    });
    expect(m.mode).toBe('manual');
    expect(m.rationale.trustCeiling).toBe('manual');
  });

  it('an ESTABLISHED-trust pillar caps at copilot even when every other ceiling is autopilot', () => {
    const m = computeExecutionMode({
      confidence: 0.95,
      riskClass: 'low',
      reversibility: 'fully',
      planCeiling: 'autopilot',
      trustCeiling: 'copilot', // Established pillar
    });
    expect(m.mode).toBe('copilot');
  });

  it('a PROVEN-trust pillar reaches autopilot ELIGIBILITY — but it still requires approval (autonomy OFF)', () => {
    const m = computeExecutionMode({
      confidence: 0.95,
      riskClass: 'low',
      reversibility: 'fully',
      planCeiling: 'autopilot',
      trustCeiling: 'autopilot', // Proven pillar
    });
    expect(m.mode).toBe('autopilot');
    // Eligible ≠ autonomous. AUTONOMOUS_AUTOPILOT_ENABLED is false → still human-gated.
    expect(m.requiresApproval).toBe(true);
    expect(m.rationale.autonomousAutopilotEnabled).toBe(false);
  });

  it('omitting trustCeiling defaults to no-constraint (backward compat)', () => {
    const m = computeExecutionMode({
      confidence: 0.95,
      riskClass: 'low',
      reversibility: 'fully',
      planCeiling: 'autopilot',
    });
    expect(m.mode).toBe('autopilot');
    expect(m.rationale.trustCeiling).toBe('autopilot');
  });
});

// ---------------------------------------------------------------------------
// 3. Persistence + audit
// ---------------------------------------------------------------------------

function makeSupabase(trustRow: Record<string, unknown> | null) {
  const calls = {
    upserts: [] as Array<{ table: string; payload: any }>,
    inserts: [] as Array<{ table: string; payload: any }>,
  };
  function table(name: string) {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      upsert: (payload: any) => {
        calls.upserts.push({ table: name, payload });
        return chain;
      },
      insert: (payload: any) => {
        calls.inserts.push({ table: name, payload });
        return chain;
      },
      maybeSingle: async () =>
        name === 'craft_pillar_trust'
          ? { data: trustRow, error: null }
          : { data: null, error: null },
      then: (res: any, rej: any) =>
        Promise.resolve({ error: null }).then(res, rej),
    };
    return chain;
  }
  const client = { from: (n: string) => table(n) } as unknown as SupabaseClient;
  return { client, calls };
}

describe('getPillarTrust', () => {
  it('returns New/manual for an org/pillar with no row (fresh)', async () => {
    const { client } = makeSupabase(null);
    const t = await getPillarTrust(client, 'org-1', 'PR');
    expect(t.level).toBe('new');
    expect(t.ceiling).toBe('manual');
  });

  it('recomputes the level from counters rather than trusting the stored label', async () => {
    // Stored label is stale 'new' but counters qualify for Established.
    const { client } = makeSupabase({
      trust_level: 'new',
      successful_executions: 40,
      failed_executions: 0,
      critical_failures: 0,
    });
    const t = await getPillarTrust(client, 'org-1', 'Content');
    expect(t.level).toBe('established');
    expect(t.ceiling).toBe('copilot');
  });
});

describe('recordExecutionOutcome — earned-signal accrual', () => {
  it('a successful execution accrues trust and writes an audit row when the level graduates', async () => {
    // 29 successes → one more success crosses the canon Established threshold (30).
    const { client, calls } = makeSupabase({
      trust_level: 'new',
      successful_executions: 29,
      failed_executions: 0,
      critical_failures: 0,
      first_active_at: daysAgoIso(10),
    });
    const res = await recordExecutionOutcome(client, {
      orgId: 'org-1',
      pillar: 'PR',
      outcome: 'success',
    });
    expect(res.level).toBe('established');
    expect(res.leveledChanged).toBe(true);

    const upsert = calls.upserts.find((c) => c.table === 'craft_pillar_trust');
    expect(upsert!.payload).toMatchObject({
      trust_level: 'established',
      successful_executions: 30,
    });
    // Immutable governance audit written for the level change.
    const audit = calls.inserts.find(
      (c) => c.table === 'craft_governance_audit'
    );
    expect(audit!.payload).toMatchObject({
      event: 'trust_level_change',
      pillar: 'PR',
      after_state: { trust_level: 'established' },
    });
  });

  it('a critical-risk failure records a critical_failure (blocks Established per §2.3)', async () => {
    const { client, calls } = makeSupabase({
      trust_level: 'new',
      successful_executions: 40,
      failed_executions: 0,
      critical_failures: 0,
    });
    await recordExecutionOutcome(client, {
      orgId: 'org-1',
      pillar: 'PR',
      outcome: 'failure',
      riskClass: 'critical',
    });
    const upsert = calls.upserts.find((c) => c.table === 'craft_pillar_trust');
    expect(upsert!.payload).toMatchObject({
      critical_failures: 1,
      failed_executions: 1,
      // 40 successes but a critical failure → NOT Established.
      trust_level: 'new',
    });
  });

  it('governed_complete (neutral lifecycle completion) counts as a successful execution', async () => {
    const { client, calls } = makeSupabase(null);
    await recordExecutionOutcome(client, {
      orgId: 'org-1',
      pillar: 'SEO',
      outcome: 'governed_complete',
    });
    const upsert = calls.upserts.find((c) => c.table === 'craft_pillar_trust');
    expect(upsert!.payload.successful_executions).toBe(1);
    expect(upsert!.payload.failed_executions).toBe(0);
  });
});

describe('autonomy stays OFF', () => {
  it('AUTONOMOUS_AUTOPILOT_ENABLED is false', () => {
    expect(AUTONOMOUS_AUTOPILOT_ENABLED).toBe(false);
  });
});
