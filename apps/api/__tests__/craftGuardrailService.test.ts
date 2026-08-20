/**
 * Wave-2 — CRAFT Execution Guardrail + Kill-switch + Outreach-review tests
 * (Autopilot prerequisites / SAFETY FLOOR).
 *
 * Load-bearing claims:
 *   1. Plan-tier daily caps + concurrency + kill-switch BLOCK a would-be autonomous
 *      execution (canon §6.2/§6.4/§11.2) in the simulated autonomous path.
 *   2. autonomy stays OFF — `autonomousAllowed` is NEVER true this slice (the global
 *      flag alone guarantees it), no matter how much headroom the caps have.
 *   3. The outreach human-review gate is INERT for stub egress and BLOCKS un-reviewed
 *      real egress (fail-closed).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  classifyCap,
  evaluateAutonomousGuardrails,
  assertAutonomousExecutionAllowed,
  isKillSwitchEngaged,
  setKillSwitch,
} from '../src/services/craft/craftGuardrailService';
import { requireOutreachReview } from '../src/services/craft/outreachReviewGate';

// ---------------------------------------------------------------------------
// classifyCap — canon §6.4 soft(80%)/hard(100%)/overage(>100%)
// ---------------------------------------------------------------------------

describe('classifyCap — canon §6.4 response tiers', () => {
  it('well under limit → ok', () => {
    expect(classifyCap(2, 1, 10)).toBe('ok');
  });
  it('projected at/over 80% → soft', () => {
    expect(classifyCap(7, 1, 10)).toBe('soft'); // 8/10
  });
  it('projected over 100% but currently under → hard', () => {
    expect(classifyCap(9, 2, 10)).toBe('hard'); // 11/10, current 9<10
  });
  it('already at/over limit → overage', () => {
    expect(classifyCap(10, 1, 10)).toBe('overage');
  });
  it('unlimited sentinel (999_999) → always ok', () => {
    expect(classifyCap(50_000, 1, 999_999)).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// Mock Supabase — counts per table/filter + kill-switch row
// ---------------------------------------------------------------------------

interface MockCfg {
  planSlug?: string;
  dailyActions?: number;
  externalActions?: number;
  concurrent?: number;
  killEngaged?: boolean;
}

function makeSupabase(cfg: MockCfg = {}) {
  const calls = {
    upserts: [] as Array<{ table: string; payload: any }>,
    inserts: [] as Array<{ table: string; payload: any }>,
  };

  function table(name: string) {
    const eqs: Record<string, unknown> = {};
    const chain: any = {
      select: () => chain,
      gte: () => chain,
      eq: (col: string, val: unknown) => {
        eqs[col] = val;
        return chain;
      },
      upsert: (payload: any) => {
        calls.upserts.push({ table: name, payload });
        return chain;
      },
      insert: (payload: any) => {
        calls.inserts.push({ table: name, payload });
        return chain;
      },
      maybeSingle: async () => {
        if (name === 'org_billing_state') {
          return { data: { plan_id: 'plan-1' }, error: null };
        }
        if (name === 'billing_plans') {
          return { data: { slug: cfg.planSlug ?? 'starter' }, error: null };
        }
        if (name === 'craft_kill_switch') {
          return { data: { engaged: Boolean(cfg.killEngaged) }, error: null };
        }
        return { data: null, error: null };
      },
      // Count queries resolve via the thenable (no maybeSingle).
      then: (res: any, rej: any) => {
        let count = 0;
        if (name === 'sage_executions') {
          if (eqs.state === 'executing') count = cfg.concurrent ?? 0;
          else if (eqs.reversibility === 'irreversible')
            count = cfg.externalActions ?? 0;
          else count = cfg.dailyActions ?? 0;
        }
        return Promise.resolve({ count, error: null }).then(res, rej);
      },
    };
    return chain;
  }

  const client = { from: (n: string) => table(n) } as unknown as SupabaseClient;
  return { client, calls };
}

// ---------------------------------------------------------------------------
// evaluateAutonomousGuardrails
// ---------------------------------------------------------------------------

describe('evaluateAutonomousGuardrails — caps + kill-switch (canon §6/§11.2)', () => {
  it('NEVER allows an autonomous run this slice (autonomy globally OFF), even with full headroom', async () => {
    const { client } = makeSupabase({
      planSlug: 'scale',
      dailyActions: 0,
      concurrent: 0,
    });
    const d = await evaluateAutonomousGuardrails(client, {
      orgId: 'org-1',
      isExternal: false,
    });
    expect(d.autonomousAllowed).toBe(false);
    expect(d.autonomousAutopilotEnabled).toBe(false);
    expect(d.blockedBy).toContain('autonomous_autopilot_disabled');
  });

  it('a hit daily action cap is reported as a blocking cap (canon §6.2 Starter = 10/day)', async () => {
    const { client } = makeSupabase({
      planSlug: 'starter',
      dailyActions: 10, // at the Starter cap → overage on the next action
    });
    const d = await evaluateAutonomousGuardrails(client, {
      orgId: 'org-1',
      isExternal: false,
    });
    const cap = d.caps.find((c) => c.resource === 'maxActionsPerDay');
    expect(cap!.blocked).toBe(true);
    expect(d.blockedBy).toContain('cap:maxActionsPerDay:overage');
  });

  it('an engaged kill-switch is a block reason', async () => {
    const { client } = makeSupabase({
      planSlug: 'scale',
      dailyActions: 0,
      killEngaged: true,
    });
    const d = await evaluateAutonomousGuardrails(client, {
      orgId: 'org-1',
      isExternal: false,
    });
    expect(d.killSwitchEngaged).toBe(true);
    expect(d.blockedBy).toContain('kill_switch_engaged');
  });

  it('external actions are checked against the external cap (canon §6.2 Starter external = 2/day)', async () => {
    const { client } = makeSupabase({
      planSlug: 'starter',
      dailyActions: 3,
      externalActions: 2, // at the external cap
    });
    const d = await evaluateAutonomousGuardrails(client, {
      orgId: 'org-1',
      isExternal: true,
    });
    const ext = d.caps.find((c) => c.resource === 'externalActionsPerDay');
    expect(ext!.blocked).toBe(true);
  });
});

describe('assertAutonomousExecutionAllowed — belt-and-suspenders', () => {
  it('returns allowed:false while autonomy is OFF regardless of headroom', async () => {
    const { client } = makeSupabase({ planSlug: 'scale', dailyActions: 0 });
    const r = await assertAutonomousExecutionAllowed(client, {
      orgId: 'org-1',
      isExternal: false,
    });
    expect(r.allowed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Kill-switch toggle + immutable audit
// ---------------------------------------------------------------------------

describe('setKillSwitch — toggle + immutable governance audit', () => {
  it('engaging writes the row and an immutable governance-audit event', async () => {
    const { client, calls } = makeSupabase({ killEngaged: false });
    const res = await setKillSwitch(client, {
      orgId: 'org-1',
      engaged: true,
      actor: 'user-1',
      reason: 'cost overrun',
    });
    expect(res.ok).toBe(true);
    const upsert = calls.upserts.find((c) => c.table === 'craft_kill_switch');
    expect(upsert!.payload).toMatchObject({
      engaged: true,
      engaged_by: 'user-1',
    });
    const audit = calls.inserts.find(
      (c) => c.table === 'craft_governance_audit'
    );
    expect(audit!.payload).toMatchObject({
      event: 'kill_switch_engaged',
      actor: 'user-1',
    });
  });

  it('isKillSwitchEngaged reflects the stored flag', async () => {
    const { client } = makeSupabase({ killEngaged: true });
    expect(await isKillSwitchEngaged(client, 'org-1')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Outreach human-review gate
// ---------------------------------------------------------------------------

describe('requireOutreachReview — the human-review gate before real sends', () => {
  it('stub egress → proceed (inert; current human-initiated stub flow unchanged)', () => {
    const d = requireOutreachReview({ egress: 'stub' });
    expect(d.proceed).toBe(true);
    expect(d.reason).toBe('stub_egress_no_review_required');
  });

  it('real egress WITHOUT a recorded human review → BLOCKED (fail-closed)', () => {
    const d = requireOutreachReview({ egress: 'real' });
    expect(d.proceed).toBe(false);
    if (!d.proceed) expect(d.reason).toBe('review_required');
  });

  it('real egress WITH a recorded human review → proceed', () => {
    const d = requireOutreachReview({
      egress: 'real',
      humanReviewApproved: true,
    });
    expect(d.proceed).toBe(true);
    if (d.proceed) expect(d.reason).toBe('review_approved');
  });
});
