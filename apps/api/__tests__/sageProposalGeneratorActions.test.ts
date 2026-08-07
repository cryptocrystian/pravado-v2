/**
 * Wave-2 — sageProposalGenerator structured-action emission test.
 *
 * Proves the generator persists a machine-executable action (`action_type` +
 * `action_params`) alongside the free-text display fields. Drives the deterministic
 * STUB path (budget exceeded → no LLM/network) so the test is hermetic; the LLM
 * branch reuses the exact same insert payload construction.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { generateProposals } from '../src/services/sage/sageProposalGenerator';

const ORG = 'org-1';

const contentSignal = {
  id: 'sig-1',
  signal_type: 'content_coverage_gap',
  pillar: 'Content',
  priority: 'low',
  signal_data: { topic_name: 'AI freight visibility', content_item_id: 'ci-1' },
  evi_impact_estimate: 2.0,
  confidence: 0.5,
  expires_at: null,
};

/**
 * Mock Supabase for the generator's stub path. Serves org context, plan lookups,
 * unprocessed-signal reads, an OVER-budget ledger (forces stub), and captures the
 * sage_proposals insert.
 */
function makeSupabase() {
  const inserts: Array<{ table: string; payload: any }> = [];

  function resolveRead(table: string, op: string | undefined) {
    if (table === 'orgs') return { data: { name: 'FreightCo' }, error: null };
    if (table === 'org_billing_state')
      return { data: { plan_id: null }, error: null }; // → 'starter' fallback
    if (table === 'billing_plans') return { data: null, error: null };
    if (table === 'sage_proposals') {
      if (op === 'insert') return { data: null, error: null }; // success
      return { data: [], error: null }; // no already-processed signals
    }
    if (table === 'sage_signals') return { data: [contentSignal], error: null };
    if (table === 'llm_usage_ledger') {
      // Over the monthly budget → generator uses the deterministic stub.
      return { data: [{ tokens_total: 999_999 }], error: null };
    }
    return { data: null, error: null };
  }

  function table(name: string) {
    const state: { op?: string } = {};
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      not: () => chain,
      or: () => chain,
      gte: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (payload: any) => {
        inserts.push({ table: name, payload });
        state.op = 'insert';
        return chain;
      },
      single: async () => resolveRead(name, state.op),
      maybeSingle: async () => resolveRead(name, state.op),
      then: (res: any, rej: any) =>
        Promise.resolve(resolveRead(name, state.op)).then(res, rej),
    };
    return chain;
  }

  const client = {
    from: (name: string) => table(name),
  } as unknown as SupabaseClient;
  return { client, inserts };
}

describe('generateProposals — emits a structured action', () => {
  it('persists action_type + action_params derived from the signal', async () => {
    const { client, inserts } = makeSupabase();

    const result = await generateProposals(client, ORG);

    expect(result.proposals_generated).toBe(1);

    const proposalInsert = inserts.find((i) => i.table === 'sage_proposals');
    expect(proposalInsert).toBeTruthy();

    // The machine-executable half: a Content coverage gap → create_brief.
    expect(proposalInsert!.payload.action_type).toBe('content.create_brief');
    expect(proposalInsert!.payload.action_params).toEqual({
      topic: 'AI freight visibility',
      keyword: 'AI freight visibility',
    });

    // The display half is still free-text (unchanged behaviour).
    expect(typeof proposalInsert!.payload.title).toBe('string');
    expect(proposalInsert!.payload.rationale).toContain('Recommended:');
  });
});
