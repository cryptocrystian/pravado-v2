/**
 * Wave-2 — CRAFT executor dispatch + full governed-run tests.
 *
 * Covers the load-bearing claims of the executor slice:
 *   1. dispatchProposalExecution routes a `content.create_brief` proposal to the
 *      Content executor, which creates a REAL content brief and returns a VERIFIED
 *      `success` outcome carrying the real brief id.
 *   2. A still-reserved action (`content.publish`) degrades GRACEFULLY to a neutral
 *      `governed_complete` no-op — no crash, no fabricated effect.
 *   3. A registered SEO `seo.generate_schema` with no content_item_id records a
 *      neutral `seo_schema_needs_content` governed_complete (nothing fabricated).
 *   4. runQueuedExecution (the worker body) runs the whole lifecycle: for a
 *      content.create_brief proposal a brief is created AND the outcome + immutable
 *      audit are written; for a needs_content path the governed lifecycle is still
 *      recorded.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { runQueuedExecution } from '../src/services/craft/craftExecutionRunner';
import { dispatchProposalExecution } from '../src/services/craft/executors/registry';

// ---------------------------------------------------------------------------
// Flexible mock Supabase — captures writes per table and serves the reads the
// lifecycle + ContentService exercise.
// ---------------------------------------------------------------------------

interface MockConfig {
  proposal?: Record<string, unknown> | null;
  executionRow?: Record<string, unknown> | null;
}

function makeSupabase(config: MockConfig = {}) {
  const calls = {
    inserts: [] as Array<{ table: string; payload: any }>,
    updates: [] as Array<{ table: string; payload: any }>,
    upserts: [] as Array<{ table: string; payload: any }>,
  };
  const lastInsert: Record<string, any> = {};

  function resolveRead(table: string, op: string | undefined) {
    if (table === 'sage_proposals') {
      return { data: config.proposal ?? null, error: null };
    }
    if (table === 'content_briefs') {
      // ContentService.createContentBrief → insert().select().single()
      const payload = lastInsert['content_briefs'] ?? {};
      return {
        data: {
          id: 'brief-1',
          org_id: payload.org_id,
          title: payload.title,
          target_keyword: payload.target_keyword,
          target_keywords: payload.target_keywords ?? [],
          status: payload.status ?? 'draft',
          metadata: payload.metadata ?? {},
          created_at: '2026-08-07T00:00:00Z',
          updated_at: '2026-08-07T00:00:00Z',
        },
        error: null,
      };
    }
    if (table === 'sage_executions') {
      // markExecuting does update(...).select().maybeSingle(); an explicitly-null
      // executionRow simulates 'already claimed' (idempotent no-op path).
      if (op === 'update') {
        if (config.executionRow === null) return { data: null, error: null };
        return { data: config.executionRow ?? { id: 'exec-1' }, error: null };
      }
      return { data: config.executionRow ?? null, error: null };
    }
    if (table === 'sage_outcomes') {
      return { data: { id: 'outcome-1' }, error: null };
    }
    if (table === 'sage_signal_outcome_tally') {
      return { data: null, error: null };
    }
    return { data: null, error: null };
  }

  function table(name: string) {
    const state: { op?: string } = {};
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      insert: (payload: any) => {
        calls.inserts.push({ table: name, payload });
        lastInsert[name] = payload;
        state.op = 'insert';
        return chain;
      },
      update: (payload: any) => {
        calls.updates.push({ table: name, payload });
        state.op = 'update';
        return chain;
      },
      upsert: (payload: any) => {
        calls.upserts.push({ table: name, payload });
        state.op = 'upsert';
        return chain;
      },
      maybeSingle: async () => resolveRead(name, state.op),
      single: async () => resolveRead(name, state.op),
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

const CTX = {
  orgId: 'org-1',
  proposalId: 'prop-1',
  executionId: 'exec-1',
};

// ---------------------------------------------------------------------------
// 1 + 2. dispatchProposalExecution
// ---------------------------------------------------------------------------

describe('dispatchProposalExecution', () => {
  it('content.create_brief → creates a real brief and returns success with the brief id', async () => {
    const { client, calls } = makeSupabase();
    const proposal = {
      id: 'prop-1',
      org_id: 'org-1',
      title: 'Publish an authority explainer on AI freight visibility',
      action_type: 'content.create_brief',
      action_params: {
        topic: 'AI freight visibility',
        keyword: 'ai freight visibility',
      },
    };

    const outcome = await dispatchProposalExecution(proposal, {
      supabase: client,
      ...CTX,
    });

    expect(outcome.result).toBe('success');
    expect(outcome.detail).toMatchObject({
      kind: 'content_brief_created',
      brief_id: 'brief-1',
    });

    // A REAL content_briefs row was written, org-scoped, linked back to the proposal.
    const briefInsert = calls.inserts.find((c) => c.table === 'content_briefs');
    expect(briefInsert).toBeTruthy();
    expect(briefInsert!.payload).toMatchObject({
      org_id: 'org-1',
      title: 'Publish an authority explainer on AI freight visibility',
      target_keyword: 'ai freight visibility',
    });
    expect(briefInsert!.payload.metadata).toMatchObject({
      source: 'sage_proposal',
      action_type: 'content.create_brief',
      proposal_id: 'prop-1',
      execution_id: 'exec-1',
    });
  });

  it('still-reserved content.publish → graceful governed no-op, NO brief written', async () => {
    const { client, calls } = makeSupabase();
    const proposal = {
      id: 'prop-2',
      org_id: 'org-1',
      title: 'Publish the explainer',
      action_type: 'content.publish',
      action_params: {},
    };

    const outcome = await dispatchProposalExecution(proposal, {
      supabase: client,
      ...CTX,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'governed_handoff',
      action_type: 'content.publish',
    });
    // No fabricated effect.
    expect(calls.inserts.find((c) => c.table === 'content_briefs')).toBeFalsy();
  });

  it('registered seo.generate_schema with NO content_item_id → needs_content governed outcome', async () => {
    const { client, calls } = makeSupabase();
    const proposal = {
      id: 'prop-4',
      org_id: 'org-1',
      title: 'Generate FAQ schema',
      action_type: 'seo.generate_schema',
      action_params: {}, // no content_item_id
    };

    const outcome = await dispatchProposalExecution(proposal, {
      supabase: client,
      ...CTX,
    });

    // Registered now (not a governed_handoff) but neutral — nothing fabricated.
    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'seo_schema_needs_content',
      action_type: 'seo.generate_schema',
    });
    expect(
      calls.inserts.find((c) => c.table === 'citemind_schemas')
    ).toBeFalsy();
  });

  it('pr.send_pitch with NO pitch content + unresolvable recipient → needs_recipient governed outcome (nothing sent)', async () => {
    const { client, calls } = makeSupabase();
    const proposal = {
      id: 'prop-3',
      org_id: 'org-1',
      title: 'Pitch FreightWaves',
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-1' }, // no subject/body
    };

    const outcome = await dispatchProposalExecution(proposal, {
      supabase: client,
      ...CTX,
    });

    // No content on the proposal now triggers the LLM composer path — but the fake
    // DB resolves no recipient email, so the executor neutrally stops at
    // needs_recipient BEFORE composing/sending. No fabricated pitch, nothing sent.
    // (The compose-then-send-through-the-chokepoint path is covered with injected
    // deps in prSendPitchExecutor.test.ts.)
    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_needs_recipient',
      action_type: 'pr.send_pitch',
    });
    expect(calls.inserts.find((c) => c.table === 'content_briefs')).toBeFalsy();
  });

  it('NULL / missing action_type → graceful governed no-op', async () => {
    const { client } = makeSupabase();
    const outcome = await dispatchProposalExecution(
      { id: 'p', org_id: 'org-1', action_type: null },
      { supabase: client, ...CTX }
    );
    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail.action_type).toBeNull();
  });

  it('missing proposal → graceful governed no-op (no crash)', async () => {
    const { client } = makeSupabase();
    const outcome = await dispatchProposalExecution(null, {
      supabase: client,
      ...CTX,
    });
    expect(outcome.result).toBe('governed_complete');
  });
});

// ---------------------------------------------------------------------------
// 3. runQueuedExecution — full governed lifecycle (worker body)
// ---------------------------------------------------------------------------

const executionRow = {
  id: 'exec-1',
  org_id: 'org-1',
  proposal_id: 'prop-1',
  signal_id: 'sig-1',
  signal_type: 'content_coverage_gap',
  pillar: 'Content',
  mode: 'copilot',
  risk_class: 'low',
  confidence: 0.7,
  evi_impact_estimate: 2.0,
  initiated_by: 'user-1',
};

describe('runQueuedExecution — full governed lifecycle', () => {
  it('content.create_brief proposal → brief created + success outcome + audit written', async () => {
    const { client, calls } = makeSupabase({
      executionRow,
      proposal: {
        id: 'prop-1',
        org_id: 'org-1',
        title: 'Authority explainer on AI freight visibility',
        action_type: 'content.create_brief',
        action_params: {
          topic: 'AI freight visibility',
          keyword: 'ai freight',
        },
      },
    });

    const result = await runQueuedExecution(client, {
      executionId: 'exec-1',
      orgId: 'org-1',
      proposalId: 'prop-1',
    });

    expect(result).toEqual({ ran: true, outcome: 'success' });

    // Real brief created.
    expect(
      calls.inserts.find((c) => c.table === 'content_briefs')
    ).toBeTruthy();

    // Terminal execution update records the VERIFIED success outcome.
    const execUpdate = calls.updates.find(
      (c) => c.table === 'sage_executions' && c.payload.outcome
    );
    expect(execUpdate!.payload).toMatchObject({
      state: 'completed',
      outcome: 'success',
    });

    // Outcome row fed back to the proposal + signal (loop closed) with the real
    // brief id in its detail.
    const outcomeInsert = calls.inserts.find(
      (c) => c.table === 'sage_outcomes'
    );
    expect(outcomeInsert!.payload).toMatchObject({
      proposal_id: 'prop-1',
      result: 'success',
    });
    expect(outcomeInsert!.payload.detail).toMatchObject({
      kind: 'content_brief_created',
      brief_id: 'brief-1',
    });

    // Immutable audit rows written for executing + completed.
    const auditEvents = calls.inserts
      .filter((c) => c.table === 'sage_execution_audit')
      .map((c) => c.payload.event);
    expect(auditEvents).toContain('executing');
    expect(auditEvents).toContain('completed');

    // SAGE feedback tally increments the VERIFIED success counter (not neutral).
    const tally = calls.upserts.find(
      (c) => c.table === 'sage_signal_outcome_tally'
    );
    expect(tally!.payload).toMatchObject({
      success_count: 1,
      governed_complete_count: 0,
    });
  });

  it('seo.generate_schema proposal with no content id → needs_content governed_complete lifecycle recorded, no crash', async () => {
    const { client, calls } = makeSupabase({
      executionRow: {
        ...executionRow,
        proposal_id: 'prop-2',
        signal_type: 'seo_position_drop',
        pillar: 'SEO',
      },
      proposal: {
        id: 'prop-2',
        org_id: 'org-1',
        title: 'Generate schema',
        action_type: 'seo.generate_schema',
        action_params: {}, // no content_item_id → needs_content, nothing generated
      },
    });

    const result = await runQueuedExecution(client, {
      executionId: 'exec-1',
      orgId: 'org-1',
      proposalId: 'prop-2',
    });

    // Ran without crashing; neutral governed completion recorded.
    expect(result).toEqual({ ran: true, outcome: 'governed_complete' });

    // No fabricated schema effect.
    expect(
      calls.inserts.find((c) => c.table === 'citemind_schemas')
    ).toBeFalsy();

    // Governed lifecycle still recorded: terminal completion + neutral tally.
    const execUpdate = calls.updates.find(
      (c) => c.table === 'sage_executions' && c.payload.outcome
    );
    expect(execUpdate!.payload).toMatchObject({
      state: 'completed',
      outcome: 'governed_complete',
    });
    const tally = calls.upserts.find(
      (c) => c.table === 'sage_signal_outcome_tally'
    );
    expect(tally!.payload).toMatchObject({
      governed_complete_count: 1,
      success_count: 0,
    });
  });

  it('is an idempotent no-op when the execution is not queued', async () => {
    // markExecuting update returns no row (already claimed) → resolveRead returns
    // null for sage_executions update when executionRow is null.
    const { client, calls } = makeSupabase({ executionRow: null });
    const result = await runQueuedExecution(client, {
      executionId: 'exec-1',
      orgId: 'org-1',
      proposalId: 'prop-1',
    });
    expect(result).toEqual({ ran: false, reason: 'not_queued' });
    expect(calls.inserts.find((c) => c.table === 'sage_outcomes')).toBeFalsy();
  });
});
