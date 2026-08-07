/**
 * SAGE Proposal Action Service (PR-5a + Wave-2 loop closure).
 *
 * Applies a user action to a SAGE proposal. Canon-mapped action model:
 *   - `execute` → governed CRAFT execution + status 'executed'
 *   - `dismiss` → status 'dismissed'
 * There is NO 'approved' or 'modified' status (canon: SAGE_v2 §183 + migration 81
 * CHECK). "Modify" is handled by the canon-native `edit` deep-link handoff on the
 * frontend (PR-5b), not here.
 *
 * WAVE-2 CHANGE — proposals are no longer terminal. `execute` now runs a governed
 * CRAFT execution FIRST (via the injected `onExecute` hook →
 * `craftExecutionService.executeProposal`): it creates a `sage_executions` row,
 * writes an immutable audit row, and enqueues onto the real execution substrate.
 * Only if that governed intake succeeds is the proposal flipped to 'executed'
 * (which now means "handed to execution", not "done"). If intake fails we return
 * `write_failed` and do NOT flip — "No Silent Automation": a proposal is never
 * marked executed without a governed, audited execution behind it. When no hook is
 * injected (e.g. legacy callers / unit tests of the status transition), behaviour is
 * the original status flip — backwards compatible.
 *
 * Only `active` proposals transition. Terminal states are idempotent no-ops. Records
 * who acted (`acted_by`) and when (`acted_at`). Pure function taking the Supabase
 * client (mirrors modeService) so the logic is unit-testable without booting Fastify.
 * The caller (route) resolves auth + org; every query is org-scoped so a proposal in
 * another org is indistinguishable from a non-existent one (no existence leak).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ProposalAction = 'execute' | 'dismiss';

export type ProposalStatus = 'active' | 'dismissed' | 'executed' | 'expired';

/** Canon action → proposal status (FLAG 1). */
const ACTION_TO_STATUS: Record<ProposalAction, 'executed' | 'dismissed'> = {
  execute: 'executed',
  dismiss: 'dismissed',
};

const VALID_ACTIONS: readonly string[] = ['execute', 'dismiss'];

/**
 * Governed-execution hook. Wired to `craftExecutionService.executeProposal` by the
 * route; injected so this module stays queue-free and unit-testable. Receives the
 * full proposal row (pillar/signal_type/confidence drive risk + mode computation).
 */
export type ProposalExecutionHook = (
  proposal: Record<string, unknown>
) => Promise<{ ok: true; executionId: string } | { ok: false }>;

export interface ApplyProposalActionDeps {
  onExecute?: ProposalExecutionHook;
}

export type ApplyProposalActionResult =
  | {
      ok: true;
      proposal: Record<string, unknown>;
      previous_status: ProposalStatus;
      execution_id?: string;
    }
  | { ok: false; reason: 'invalid_action' | 'not_found' | 'write_failed' };

export async function applyProposalAction(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  proposalId: string,
  action: string,
  deps: ApplyProposalActionDeps = {}
): Promise<ApplyProposalActionResult> {
  if (!VALID_ACTIONS.includes(action)) {
    return { ok: false, reason: 'invalid_action' };
  }

  // Fetch scoped to the caller's org — a proposal in another org resolves to
  // null, identical to a non-existent id (no existence leak).
  const { data: existing, error: fetchErr } = await supabase
    .from('sage_proposals')
    .select('*')
    .eq('id', proposalId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (fetchErr) return { ok: false, reason: 'write_failed' };
  if (!existing) return { ok: false, reason: 'not_found' };

  const previous_status = (existing as { status: ProposalStatus }).status;

  // Idempotent: only `active` proposals transition. Anything terminal is a
  // no-op — return current state, previous_status === current status.
  if (previous_status !== 'active') {
    return { ok: true, proposal: existing, previous_status };
  }

  // Governed execution BEFORE the status flip (No Silent Automation). Only runs on
  // `execute` and only when a hook is injected. A failure here aborts the flip.
  let executionId: string | undefined;
  if (action === 'execute' && deps.onExecute) {
    const exec = await deps.onExecute(existing as Record<string, unknown>);
    if (!exec.ok) return { ok: false, reason: 'write_failed' };
    executionId = exec.executionId;
  }

  const newStatus = ACTION_TO_STATUS[action as ProposalAction];
  const actedAt = new Date().toISOString();

  const { data: updated, error: updateErr } = await supabase
    .from('sage_proposals')
    .update({
      status: newStatus,
      acted_by: userId,
      acted_at: actedAt,
      updated_at: actedAt,
    })
    .eq('id', proposalId)
    .eq('org_id', orgId)
    .select('*')
    .maybeSingle();

  if (updateErr || !updated) return { ok: false, reason: 'write_failed' };

  return {
    ok: true,
    proposal: updated,
    previous_status,
    execution_id: executionId,
  };
}
