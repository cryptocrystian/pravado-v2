/**
 * Wave-2 — craftExecutionService unit tests (SAGE↔CRAFT loop closure).
 *
 * Covers the three load-bearing claims of the slice:
 *   1. Computed mode eligibility: Mode = f(confidence, risk, reversibility, plan
 *      ceiling), most-restrictive-wins, plan ceiling always respected, Autopilot
 *      autonomous execution gated.
 *   2. executeProposal: creates a sage_executions row + an immutable audit row +
 *      enqueues on the substrate (the intake half of the loop).
 *   3. completeExecution: persists the outcome back to the originating proposal +
 *      signal and increments the signal-type tally (the loop is closed).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

import {
  computeExecutionMode,
  classifyRisk,
  classifyReversibility,
  executeProposal,
  completeExecution,
} from '../src/services/craft/craftExecutionService';

// ---------------------------------------------------------------------------
// Flexible mock Supabase — records insert/update/upsert calls per table and
// returns configured rows for the read paths the service exercises.
// ---------------------------------------------------------------------------

interface MockConfig {
  planSlug?: string | null;
  billingPlanId?: string | null;
  executionRow?: Record<string, unknown> | null; // for completeExecution fetch
  tallyRow?: { success_count: number; failure_count: number } | null;
  execInsertError?: unknown;
  outcomeInsertError?: unknown;
}

function makeSupabase(config: MockConfig = {}) {
  const calls = {
    inserts: [] as Array<{ table: string; payload: any }>,
    updates: [] as Array<{ table: string; payload: any }>,
    upserts: [] as Array<{ table: string; payload: any; opts: any }>,
  };

  function resolveRead(table: string, op: string | undefined) {
    if (table === 'org_billing_state') {
      return {
        data: { plan_id: config.billingPlanId ?? 'plan-1' },
        error: null,
      };
    }
    if (table === 'billing_plans') {
      return { data: { slug: config.planSlug ?? 'growth' }, error: null };
    }
    if (table === 'sage_executions') {
      if (op === 'insert') {
        return {
          data: config.execInsertError ? null : { id: 'exec-1' },
          error: config.execInsertError ?? null,
        };
      }
      if (op === 'update') {
        return { data: config.executionRow ?? { id: 'exec-1' }, error: null };
      }
      // select
      return { data: config.executionRow ?? null, error: null };
    }
    if (table === 'sage_outcomes') {
      return {
        data: config.outcomeInsertError ? null : { id: 'outcome-1' },
        error: config.outcomeInsertError ?? null,
      };
    }
    if (table === 'sage_signal_outcome_tally') {
      return { data: config.tallyRow ?? null, error: null };
    }
    return { data: null, error: null };
  }

  function table(name: string) {
    const state: { op?: string } = {};
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      gte: () => chain,
      insert: (payload: any) => {
        calls.inserts.push({ table: name, payload });
        state.op = 'insert';
        return chain;
      },
      update: (payload: any) => {
        calls.updates.push({ table: name, payload });
        state.op = 'update';
        return chain;
      },
      upsert: (payload: any, opts: any) => {
        calls.upserts.push({ table: name, payload, opts });
        state.op = 'upsert';
        return chain;
      },
      maybeSingle: async () => resolveRead(name, state.op),
      single: async () => resolveRead(name, state.op),
      // Awaitable for calls without a terminal maybeSingle (audit insert,
      // execution update, tally upsert).
      then: (res: any, rej: any) =>
        Promise.resolve({ error: null }).then(res, rej),
    };
    return chain;
  }

  const client = {
    from: (name: string) => table(name),
  } as unknown as SupabaseClient;
  return { client, calls };
}

// ---------------------------------------------------------------------------
// 1. Computed mode eligibility
// ---------------------------------------------------------------------------

describe('computeExecutionMode — Mode = f(confidence, risk, reversibility, plan)', () => {
  it('low risk + fully reversible + high confidence + autopilot ceiling → autopilot eligible but gated', () => {
    const m = computeExecutionMode({
      confidence: 0.95,
      riskClass: 'low',
      reversibility: 'fully',
      planCeiling: 'autopilot',
    });
    expect(m.mode).toBe('autopilot');
    // Autonomous Autopilot is disabled this slice → still requires approval.
    expect(m.requiresApproval).toBe(true);
    expect(m.rationale.autonomousAutopilotEnabled).toBe(false);
  });

  it('medium risk clamps to copilot even with high confidence', () => {
    const m = computeExecutionMode({
      confidence: 0.99,
      riskClass: 'medium',
      reversibility: 'fully',
      planCeiling: 'autopilot',
    });
    expect(m.mode).toBe('copilot');
  });

  it('irreversible action floors at manual regardless of confidence', () => {
    const m = computeExecutionMode({
      confidence: 0.99,
      riskClass: 'low',
      reversibility: 'irreversible',
      planCeiling: 'autopilot',
    });
    expect(m.mode).toBe('manual');
  });

  it('low confidence floors at manual (below copilot 0.70 threshold)', () => {
    const m = computeExecutionMode({
      confidence: 0.5,
      riskClass: 'low',
      reversibility: 'fully',
      planCeiling: 'autopilot',
    });
    expect(m.mode).toBe('manual');
  });

  it('NEVER exceeds the plan ceiling (copilot plan caps an autopilot-eligible action)', () => {
    const m = computeExecutionMode({
      confidence: 0.95,
      riskClass: 'low',
      reversibility: 'fully',
      planCeiling: 'copilot',
    });
    expect(m.mode).toBe('copilot');
  });
});

describe('classifyRisk / classifyReversibility', () => {
  it('PR pitch/outreach → irreversible → high risk', () => {
    const rev = classifyReversibility('PR', 'high_value_unpitched');
    expect(rev).toBe('irreversible');
    expect(classifyRisk('PR', 'high_value_unpitched', rev)).toBe('high');
  });

  it('internal/draft schedule action → fully reversible → low risk', () => {
    const rev = classifyReversibility('Content', 'draft_schedule_gap');
    expect(rev).toBe('fully');
    expect(classifyRisk('Content', 'draft_schedule_gap', rev)).toBe('low');
  });

  it('crisis signal → critical', () => {
    const rev = classifyReversibility('PR', 'crisis_response');
    expect(classifyRisk('PR', 'crisis_response', rev)).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// 2. executeProposal — intake: execution row + audit + enqueue
// ---------------------------------------------------------------------------

describe('executeProposal — governed intake', () => {
  const proposal = {
    id: 'prop-1',
    org_id: 'org-1',
    signal_id: 'sig-1',
    signal_type: 'high_value_unpitched',
    pillar: 'PR',
    confidence: 0.8,
    evi_impact_estimate: 4.0,
  };

  it('creates a sage_executions row, an immutable audit row, and enqueues', async () => {
    const { client, calls } = makeSupabase({ planSlug: 'growth' });
    const enqueue = vi.fn().mockResolvedValue(undefined);

    const result = await executeProposal(
      client,
      { proposal, userId: 'user-1' },
      { enqueue }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.executionId).toBe('exec-1');

    // Execution row written, linked to proposal + signal, with computed governance.
    const execInsert = calls.inserts.find((c) => c.table === 'sage_executions');
    expect(execInsert).toBeTruthy();
    expect(execInsert!.payload).toMatchObject({
      proposal_id: 'prop-1',
      signal_id: 'sig-1',
      state: 'queued',
      risk_class: 'high', // PR pitch → irreversible → high
      reversibility: 'irreversible',
      initiated_by: 'user-1',
    });

    // Immutable audit row written for the 'queued' intake.
    const auditInsert = calls.inserts.find(
      (c) => c.table === 'sage_execution_audit'
    );
    expect(auditInsert).toBeTruthy();
    expect(auditInsert!.payload).toMatchObject({
      execution_id: 'exec-1',
      proposal_id: 'prop-1',
      event: 'queued',
      actor: 'user-1',
    });

    // Enqueued on the real substrate.
    expect(enqueue).toHaveBeenCalledWith({
      executionId: 'exec-1',
      orgId: 'org-1',
      proposalId: 'prop-1',
    });
  });

  it('returns write_failed and does not enqueue when the execution insert fails', async () => {
    const { client } = makeSupabase({
      execInsertError: { message: 'db down' },
    });
    const enqueue = vi.fn();
    const result = await executeProposal(
      client,
      { proposal, userId: 'user-1' },
      { enqueue }
    );
    expect(result).toEqual({ ok: false, reason: 'write_failed' });
    expect(enqueue).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 3. completeExecution — outcome fed back to SAGE (loop closed)
// ---------------------------------------------------------------------------

describe('completeExecution — outcome feedback closes the loop', () => {
  const executionRow = {
    id: 'exec-1',
    org_id: 'org-1',
    proposal_id: 'prop-1',
    signal_id: 'sig-1',
    signal_type: 'high_value_unpitched',
    pillar: 'PR',
    mode: 'manual',
    risk_class: 'high',
    confidence: 0.8,
    evi_impact_estimate: 4.0,
    initiated_by: 'user-1',
  };

  it('persists an outcome linked to the originating proposal + signal and tallies it', async () => {
    const { client, calls } = makeSupabase({ executionRow, tallyRow: null });

    const result = await completeExecution(client, {
      executionId: 'exec-1',
      result: 'success',
      detail: { kind: 'governed_handoff' },
    });

    expect(result.ok).toBe(true);

    // Execution transitioned to terminal 'completed'.
    const execUpdate = calls.updates.find((c) => c.table === 'sage_executions');
    expect(execUpdate!.payload).toMatchObject({
      state: 'completed',
      outcome: 'success',
    });

    // Outcome row links BACK to the originating proposal + signal — loop closed.
    const outcomeInsert = calls.inserts.find(
      (c) => c.table === 'sage_outcomes'
    );
    expect(outcomeInsert).toBeTruthy();
    expect(outcomeInsert!.payload).toMatchObject({
      execution_id: 'exec-1',
      proposal_id: 'prop-1',
      signal_id: 'sig-1',
      signal_type: 'high_value_unpitched',
      result: 'success',
    });
    // impact_pillars derived and attached (PR → Content).
    expect(outcomeInsert!.payload.impact_pillars).toEqual(
      expect.arrayContaining(['PR', 'Content'])
    );

    // Terminal audit row written (append-only).
    const auditInsert = calls.inserts.find(
      (c) => c.table === 'sage_execution_audit'
    );
    expect(auditInsert!.payload).toMatchObject({
      event: 'completed',
      outcome: 'success',
    });

    // Signal-type tally incremented (SAGE state feedback).
    const tally = calls.upserts.find(
      (c) => c.table === 'sage_signal_outcome_tally'
    );
    expect(tally!.payload).toMatchObject({
      org_id: 'org-1',
      signal_type: 'high_value_unpitched',
      governed_complete_count: 0,
      success_count: 1,
      failure_count: 0,
    });
  });

  it('governed_complete (the worker path) → state completed, neutral tally, NOT success', async () => {
    const { client, calls } = makeSupabase({ executionRow, tallyRow: null });

    const result = await completeExecution(client, {
      executionId: 'exec-1',
      result: 'governed_complete',
      detail: { kind: 'governed_handoff' },
    });

    expect(result.ok).toBe(true);

    // Execution is COMPLETED (lifecycle finished) — but the outcome is neutral.
    const execUpdate = calls.updates.find((c) => c.table === 'sage_executions');
    expect(execUpdate!.payload).toMatchObject({
      state: 'completed',
      outcome: 'governed_complete',
    });

    const outcomeInsert = calls.inserts.find(
      (c) => c.table === 'sage_outcomes'
    );
    expect(outcomeInsert!.payload.result).toBe('governed_complete');

    // Only the neutral counter moves — business success/failure stay at 0 so a
    // future SAGE reader is not biased toward ~100% success.
    const tally = calls.upserts.find(
      (c) => c.table === 'sage_signal_outcome_tally'
    );
    expect(tally!.payload).toMatchObject({
      governed_complete_count: 1,
      success_count: 0,
      failure_count: 0,
    });

    // A governed_complete produced NO cross-pillar output (suppressed / ineligible /
    // needs_content / refused no-op) — it must NOT reinforce, or the mesh would be
    // biased by an action that never happened.
    expect(
      calls.inserts.some((c) => c.table === 'sage_signal_reinforcements')
    ).toBe(false);
  });

  it('records a failure outcome and increments the failure tally', async () => {
    const { client, calls } = makeSupabase({
      executionRow,
      tallyRow: { success_count: 2, failure_count: 1 },
    });

    const result = await completeExecution(client, {
      executionId: 'exec-1',
      result: 'failure',
      detail: { kind: 'execution_error', error: 'boom' },
    });

    expect(result.ok).toBe(true);
    const tally = calls.upserts.find(
      (c) => c.table === 'sage_signal_outcome_tally'
    );
    // Existing 2/1 → failure increments failure to 2, success unchanged.
    expect(tally!.payload).toMatchObject({
      success_count: 2,
      failure_count: 2,
    });
  });

  it('returns not_found when the execution does not exist', async () => {
    const { client } = makeSupabase({ executionRow: null });
    const result = await completeExecution(client, {
      executionId: 'missing',
      result: 'success',
    });
    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });
});

// ---------------------------------------------------------------------------
// 4. completeExecution — cross-pillar reinforcement (SAGE mesh, canon §3.3)
// ---------------------------------------------------------------------------

describe('completeExecution — cross-pillar reinforcement', () => {
  const prExecutionRow = {
    id: 'exec-1',
    org_id: 'org-1',
    proposal_id: 'prop-1',
    signal_id: 'sig-1',
    signal_type: 'pr_high_value_unpitched',
    pillar: 'PR',
    mode: 'manual',
    risk_class: 'high',
    confidence: 0.8,
    evi_impact_estimate: 4.0,
    initiated_by: 'user-1',
  };

  it('a completed PR action reinforces Content (0.50) and SEO (0.35) by the canon weight', async () => {
    const { client, calls } = makeSupabase({
      executionRow: prExecutionRow,
      tallyRow: null,
    });

    const result = await completeExecution(client, {
      executionId: 'exec-1',
      result: 'success',
    });
    expect(result.ok).toBe(true);

    const reinf = calls.inserts.filter(
      (c) => c.table === 'sage_signal_reinforcements'
    );
    // One insert call carrying the two canon recipient rows.
    expect(reinf).toHaveLength(1);
    const rows = reinf[0].payload as Array<any>;
    const content = rows.find((r) => r.recipient_pillar === 'Content');
    const seo = rows.find((r) => r.recipient_pillar === 'SEO');
    expect(content).toMatchObject({
      org_id: 'org-1',
      source_pillar: 'PR',
      coefficient: 0.5,
      strength_delta: 2, // 0.50 × 4.0 EVI
    });
    expect(seo).toMatchObject({ coefficient: 0.35, strength_delta: 1.4 });
    // PR never reinforces itself (that is Direct impact 1.0).
    expect(rows.some((r) => r.recipient_pillar === 'PR')).toBe(false);
  });

  it('a business FAILURE does NOT propagate reinforcement', async () => {
    const { client, calls } = makeSupabase({
      executionRow: prExecutionRow,
      tallyRow: null,
    });
    await completeExecution(client, {
      executionId: 'exec-1',
      result: 'failure',
    });
    expect(
      calls.inserts.some((c) => c.table === 'sage_signal_reinforcements')
    ).toBe(false);
  });

  it('a governed_complete (no output produced — e.g. a refused pitch) does NOT reinforce', async () => {
    const { client, calls } = makeSupabase({
      executionRow: prExecutionRow,
      tallyRow: null,
    });
    // Governed lifecycle finished, but nothing was actually sent/generated. Reinforcing
    // here would use the signal's non-zero evi_impact_estimate to boost SEO/Content
    // from an action that never happened — canon §3.3 requires a real OUTPUT.
    await completeExecution(client, {
      executionId: 'exec-1',
      result: 'governed_complete',
    });
    expect(
      calls.inserts.some((c) => c.table === 'sage_signal_reinforcements')
    ).toBe(false);
  });
});
