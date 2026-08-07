/**
 * PR-5a — sageProposalActionService unit tests.
 *
 * Canon-mapped action model: execute→executed, dismiss→dismissed. Covers the
 * transition, acted_by/acted_at stamping, active-only idempotency (terminal
 * states are no-ops), org-scoped not_found (non-existent AND cross-org are
 * indistinguishable → 404 at the route), invalid action, and write failures.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

import { applyProposalAction } from '../src/services/sage/sageProposalActionService';

const ORG = 'org-1';
const USER = 'user-1';

// The onExecute hook is MANDATORY for `execute` (governed intake before any flip);
// a permissive stub that reports a governed execution was created.
const okHook = async () => ({ ok: true as const, executionId: 'exec-1' });

function activeProposal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prop-1',
    org_id: ORG,
    status: 'active',
    title: 'Pitch FreightWaves',
    acted_by: null,
    acted_at: null,
    ...overrides,
  };
}

/**
 * Mock Supabase supporting:
 *   from(t).select('*').eq().eq().maybeSingle()                → the proposal
 *   from(t).update(payload).eq().eq().select('*').maybeSingle() → merged row
 */
function makeSupabase(opts: {
  proposal?: Record<string, unknown> | null;
  fetchError?: unknown;
  updateError?: unknown;
}) {
  const updateSpy = vi.fn();
  const client = {
    from(_table: string) {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.proposal ?? null,
                error: opts.fetchError ?? null,
              }),
            }),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          updateSpy(payload);
          return {
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({
                    data: opts.updateError
                      ? null
                      : { ...(opts.proposal ?? {}), ...payload },
                    error: opts.updateError ?? null,
                  }),
                }),
              }),
            }),
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, updateSpy };
}

describe('applyProposalAction — canon action model (PR-5a)', () => {
  it('execute on an active proposal → status executed + acted_by/acted_at', async () => {
    const { client, updateSpy } = makeSupabase({ proposal: activeProposal() });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute',
      { onExecute: okHook }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.previous_status).toBe('active');
    expect(result.proposal.status).toBe('executed');
    expect(result.execution_id).toBe('exec-1');
    expect(result.proposal.acted_by).toBe(USER);
    expect(result.proposal.acted_at).toEqual(expect.any(String));
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'executed',
        acted_by: USER,
        acted_at: expect.any(String),
        updated_at: expect.any(String),
      })
    );
  });

  it('dismiss on an active proposal → status dismissed + acted_by/acted_at', async () => {
    const { client, updateSpy } = makeSupabase({ proposal: activeProposal() });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'dismiss'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.previous_status).toBe('active');
    expect(result.proposal.status).toBe('dismissed');
    expect(result.proposal.acted_by).toBe(USER);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'dismissed', acted_by: USER })
    );
  });

  it('execute on an already-executed proposal → idempotent no-op', async () => {
    const { client, updateSpy } = makeSupabase({
      proposal: activeProposal({ status: 'executed', acted_by: 'someone' }),
    });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // previous_status === current status; no re-write.
    expect(result.previous_status).toBe('executed');
    expect(result.proposal.status).toBe('executed');
    expect(result.proposal.acted_by).toBe('someone'); // untouched
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('dismiss on an already-dismissed proposal → idempotent no-op', async () => {
    const { client, updateSpy } = makeSupabase({
      proposal: activeProposal({ status: 'dismissed' }),
    });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'dismiss'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.previous_status).toBe('dismissed');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('execute on a dismissed proposal → cannot transition, returns current state', async () => {
    const { client, updateSpy } = makeSupabase({
      proposal: activeProposal({ status: 'dismissed' }),
    });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Terminal states never transition, regardless of the requested action.
    expect(result.previous_status).toBe('dismissed');
    expect(result.proposal.status).toBe('dismissed');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('rejects a malformed action value (no DB read)', async () => {
    const { client, updateSpy } = makeSupabase({ proposal: activeProposal() });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'turbo'
    );
    expect(result).toEqual({ ok: false, reason: 'invalid_action' });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('returns not_found for a non-existent / cross-org proposal (no existence leak)', async () => {
    // Org-scoped fetch → null for both a missing id and another org's proposal.
    const { client } = makeSupabase({ proposal: null });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-x',
      'execute'
    );
    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('returns write_failed on a fetch error', async () => {
    const { client } = makeSupabase({ fetchError: { message: 'db down' } });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute'
    );
    expect(result).toEqual({ ok: false, reason: 'write_failed' });
  });

  it('returns write_failed when the update errors', async () => {
    const { client } = makeSupabase({
      proposal: activeProposal(),
      updateError: { message: 'update failed' },
    });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute',
      { onExecute: okHook }
    );
    expect(result).toEqual({ ok: false, reason: 'write_failed' });
  });

  it('execute WITHOUT a governed-execution hook → execution_required, never flips', async () => {
    const { client, updateSpy } = makeSupabase({ proposal: activeProposal() });
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute'
      // no deps → mandatory hook missing
    );
    expect(result).toEqual({ ok: false, reason: 'execution_required' });
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe('applyProposalAction — Wave-2 governed execution hook', () => {
  it('execute runs onExecute and attaches execution_id, then flips status', async () => {
    const { client, updateSpy } = makeSupabase({ proposal: activeProposal() });
    const onExecute = vi.fn(async (proposal: Record<string, unknown>) => {
      // Hook receives the full proposal row (drives risk/mode computation) and
      // runs while the proposal is still un-flipped (status 'active').
      expect(proposal.id).toBe('prop-1');
      expect(proposal.status).toBe('active');
      expect(updateSpy).not.toHaveBeenCalled();
      return { ok: true as const, executionId: 'exec-1' };
    });

    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute',
      { onExecute }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(onExecute).toHaveBeenCalledTimes(1);
    expect(result.execution_id).toBe('exec-1');
    expect(result.proposal.status).toBe('executed');
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it('aborts the status flip (write_failed) when onExecute fails — no silent automation', async () => {
    const { client, updateSpy } = makeSupabase({ proposal: activeProposal() });
    const onExecute = vi.fn(async () => ({ ok: false as const }));
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'execute',
      { onExecute }
    );
    expect(result).toEqual({ ok: false, reason: 'write_failed' });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('dismiss does not invoke the execution hook', async () => {
    const { client } = makeSupabase({ proposal: activeProposal() });
    const onExecute = vi.fn();
    const result = await applyProposalAction(
      client,
      ORG,
      USER,
      'prop-1',
      'dismiss',
      { onExecute }
    );
    expect(result.ok).toBe(true);
    expect(onExecute).not.toHaveBeenCalled();
  });
});
