/**
 * CRAFT governed-execution runner (Wave-2 — SAGE proposals that ACT).
 *
 * The body of the SAGE execution worker, extracted so the full run path
 * (markExecuting → dispatch to the action executor → completeExecution) is
 * unit-testable without booting BullMQ/Sentry. The worker
 * (queue/workers/sageExecutionWorker.ts) is now a thin wrapper around this.
 *
 * Lifecycle (CRAFT_EXECUTION_MODEL §8): the execution row arrives 'queued'.
 *   1. markExecuting  → queued→executing (+ immutable audit).            [governance]
 *   2. dispatch       → run the registered per-pillar executor, if any.  [effect]
 *   3. completeExecution → terminal state + immutable audit + outcome fed
 *                          back to the proposal/signal + signal-type tally. [loop]
 *
 * The executor's outcome (`success` for a real Content brief, or the neutral
 * `governed_complete` for a reserved/unregistered action) is what gets recorded — so
 * the SAGE feedback tally is never biased toward success for governed no-ops.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { markExecuting, completeExecution } from './craftExecutionService';
import { dispatchProposalExecution } from './executors/registry';

export interface RunExecutionPayload {
  executionId: string;
  orgId: string;
  proposalId: string;
}

export type RunExecutionResult =
  | { ran: false; reason: 'not_queued' }
  | { ran: true; outcome: 'success' | 'failure' | 'governed_complete' };

/**
 * Run one queued governed execution end-to-end. Idempotent: if the execution is not
 * in 'queued' state (already picked up / missing) it is a no-op. Any executor error
 * is caught and recorded as a `failure` outcome so the loop always closes.
 */
export async function runQueuedExecution(
  supabase: SupabaseClient,
  payload: RunExecutionPayload
): Promise<RunExecutionResult> {
  const { executionId, orgId, proposalId } = payload;

  const started = await markExecuting(supabase, executionId);
  if (!started.ok) {
    // Not 'queued' (already claimed or missing) — idempotent no-op.
    return { ran: false, reason: 'not_queued' };
  }

  try {
    // Load the originating proposal (org-scoped) to read its structured action.
    const { data: proposal } = await supabase
      .from('sage_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('org_id', orgId)
      .maybeSingle();

    // Dispatch to the registered executor (real effect) or the graceful governed
    // no-op for reserved/unregistered/NULL action types.
    const outcome = await dispatchProposalExecution(
      proposal as Record<string, unknown> | null,
      { supabase, orgId, proposalId, executionId }
    );

    const completed = await completeExecution(supabase, {
      executionId,
      result: outcome.result,
      detail: outcome.detail,
    });

    if (!completed.ok) {
      throw new Error(`completeExecution failed: ${completed.reason}`);
    }

    return { ran: true, outcome: outcome.result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Record the failure outcome so the loop closes even on error.
    await completeExecution(supabase, {
      executionId,
      result: 'failure',
      detail: { kind: 'execution_error', error: message },
    });
    return { ran: true, outcome: 'failure' };
  }
}
