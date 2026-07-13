/**
 * SAGE Proposal Action Service (PR-5a).
 *
 * Applies a user action to a SAGE proposal. Canon-mapped action model (FLAG 1):
 *   - `execute` → status 'executed'
 *   - `dismiss` → status 'dismissed'
 * There is NO 'approved' or 'modified' status (canon: SAGE_v2 §183 + migration 81
 * CHECK). "Modify" is handled by the canon-native `edit` deep-link handoff on the
 * frontend (PR-5b), not here.
 *
 * Only `active` proposals transition. Terminal states (executed / dismissed /
 * expired) are idempotent no-ops — the current state is returned unchanged with
 * `previous_status === proposal.status`, no error, no re-write. Records who acted
 * (`acted_by`) and when (`acted_at`); `reasoning_trace` remains the generation
 * audit (no sage_proposal_actions table — FLAG 3).
 *
 * Pure function taking the Supabase client (mirrors modeService) so the logic is
 * unit-testable without booting Fastify. The caller (route) is responsible for
 * auth + resolving the caller's org; this function scopes every query by orgId so
 * a proposal in another org is indistinguishable from a non-existent one (no
 * existence leak → the route maps `not_found` to 404, never 403).
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

export type ApplyProposalActionResult =
  | {
      ok: true;
      proposal: Record<string, unknown>;
      previous_status: ProposalStatus;
    }
  | { ok: false; reason: 'invalid_action' | 'not_found' | 'write_failed' };

export async function applyProposalAction(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  proposalId: string,
  action: string
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

  return { ok: true, proposal: updated, previous_status };
}
