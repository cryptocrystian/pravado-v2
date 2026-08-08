/**
 * Wave-2 — sageActionStreamService loop-visibility tests.
 *
 * Verifies the action stream hydrates each proposal ActionItem with its CRAFT
 * execution lifecycle:
 *   1. execution_state + outcome are present when an execution/outcome exist.
 *   2. Both are honestly `null` when the proposal has never been executed.
 *   3. A governed_complete (governor-refused) pitch surfaces its reason, and is
 *      NOT reported as a business success.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { getActionStreamForOrg } from '../src/services/sage/sageActionStreamService';

const ORG = 'org-1';

interface TableResult {
  data: unknown;
  error: unknown;
}

/**
 * Minimal chainable Supabase mock. Every builder method returns the same chain;
 * the chain is thenable and resolves the configured result for its table. This
 * matches the service's usage: `await from(t).select().eq().in().order()...`.
 */
function makeSupabase(byTable: Record<string, TableResult>): SupabaseClient {
  return {
    from(table: string) {
      const result = byTable[table] ?? { data: [], error: null };
      const chain: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'in', 'order', 'limit']) {
        chain[m] = () => chain;
      }
      (chain as { then: unknown }).then = (
        resolve: (r: TableResult) => unknown
      ) => resolve(result);
      return chain;
    },
  } as unknown as SupabaseClient;
}

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-base',
    org_id: ORG,
    pillar: 'PR',
    signal_type: 'pr_pitch_window',
    priority: 'high',
    title: 'Pitch FreightWaves on Q4 logistics',
    rationale: 'A strong pitch window is open.',
    confidence: 0.9,
    evi_impact_estimate: 4,
    mode: 'copilot',
    status: 'executed',
    updated_at: '2026-07-13T00:00:00.000Z',
    reasoning_trace: {},
    deep_link: { label: 'Open in PR', href: '/app/pr/pitches' },
    ...overrides,
  };
}

describe('getActionStreamForOrg — execution + outcome hydration', () => {
  it('attaches execution_state + outcome when an execution/outcome exist', async () => {
    const supabase = makeSupabase({
      sage_proposals: {
        data: [proposal({ id: 'p-exec' })],
        error: null,
      },
      sage_executions: {
        data: [
          {
            proposal_id: 'p-exec',
            state: 'completed',
            outcome: 'success',
            outcome_detail: { kind: 'content_brief_created', title: 'Q4' },
            created_at: '2026-07-13T01:00:00.000Z',
          },
        ],
        error: null,
      },
      sage_outcomes: {
        data: [
          {
            proposal_id: 'p-exec',
            result: 'success',
            detail: { kind: 'content_brief_created', title: 'Q4 Logistics' },
            created_at: '2026-07-13T01:00:00.000Z',
          },
        ],
        error: null,
      },
    });

    const res = await getActionStreamForOrg(supabase, ORG);
    const item = res.items.find((i) => i.id === 'p-exec');
    expect(item).toBeDefined();
    expect(item!.execution_state).toBe('completed');
    expect(item!.outcome).toEqual({
      result: 'success',
      reason: 'Content brief created: Q4 Logistics',
      kind: 'content_brief_created',
    });
  });

  it('reports execution_state + outcome as null when never executed (honest empty)', async () => {
    const supabase = makeSupabase({
      sage_proposals: {
        data: [proposal({ id: 'p-none', status: 'active' })],
        error: null,
      },
      sage_executions: { data: [], error: null },
      sage_outcomes: { data: [], error: null },
    });

    const res = await getActionStreamForOrg(supabase, ORG);
    const item = res.items.find((i) => i.id === 'p-none');
    expect(item).toBeDefined();
    expect(item!.execution_state).toBeNull();
    expect(item!.outcome).toBeNull();
  });

  it('surfaces a governed_complete pitch reason and does not call it a success', async () => {
    const supabase = makeSupabase({
      sage_proposals: {
        data: [proposal({ id: 'p-refused' })],
        error: null,
      },
      sage_executions: {
        data: [
          {
            proposal_id: 'p-refused',
            state: 'completed',
            outcome: 'governed_complete',
            outcome_detail: {
              kind: 'pr_pitch_governed_refusal',
              governor: 'personalization',
              reason: 'Pitch failed the personalization gate',
            },
            created_at: '2026-07-13T02:00:00.000Z',
          },
        ],
        error: null,
      },
      sage_outcomes: {
        data: [
          {
            proposal_id: 'p-refused',
            result: 'governed_complete',
            detail: {
              kind: 'pr_pitch_governed_refusal',
              governor: 'personalization',
              reason: 'Pitch failed the personalization gate',
            },
            created_at: '2026-07-13T02:00:00.000Z',
          },
        ],
        error: null,
      },
    });

    const res = await getActionStreamForOrg(supabase, ORG);
    const item = res.items.find((i) => i.id === 'p-refused');
    expect(item).toBeDefined();
    expect(item!.execution_state).toBe('completed');
    expect(item!.outcome?.result).toBe('governed_complete');
    expect(item!.outcome?.result).not.toBe('success');
    expect(item!.outcome?.reason).toBe('Pitch failed the personalization gate');
  });

  it('falls back to the execution outcome when no sage_outcomes row exists', async () => {
    const supabase = makeSupabase({
      sage_proposals: {
        data: [proposal({ id: 'p-fallback' })],
        error: null,
      },
      sage_executions: {
        data: [
          {
            proposal_id: 'p-fallback',
            state: 'failed',
            outcome: 'failure',
            outcome_detail: { kind: 'pr_pitch_send_failed', error: 'SMTP 550' },
            created_at: '2026-07-13T03:00:00.000Z',
          },
        ],
        error: null,
      },
      sage_outcomes: { data: [], error: null },
    });

    const res = await getActionStreamForOrg(supabase, ORG);
    const item = res.items.find((i) => i.id === 'p-fallback');
    expect(item!.execution_state).toBe('failed');
    expect(item!.outcome).toEqual({
      result: 'failure',
      reason: 'SMTP 550',
      kind: 'pr_pitch_send_failed',
    });
  });
});
