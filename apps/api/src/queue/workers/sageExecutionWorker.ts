/**
 * SAGE Governed Execution Worker (Wave-2 — SAGE↔CRAFT loop closure).
 *
 * BullMQ worker that runs a governed CRAFT execution created by
 * `craftExecutionService.executeProposal`. Job name: 'sage:execution'.
 * Payload: { executionId, orgId, proposalId }.
 *
 * Lifecycle (CRAFT_EXECUTION_MODEL §8): the execution row arrives in state 'queued'.
 * This worker transitions it queued→executing (audited), runs the action, then calls
 * `completeExecution` which writes the terminal state + immutable audit row + the
 * outcome fed back to the originating proposal/signal + the signal-type tally — the
 * moment the SAGE→CRAFT→outcome→SAGE loop is closed.
 *
 * SCOPE NOTE: concrete per-pillar action executors (actually send the pitch, publish
 * the content) are a LATER slice. Until one is registered for the proposal's action
 * type, the "action" is a governed handoff that records the lifecycle and completes.
 * The outcome `result` therefore reflects whether the governed execution completed
 * without error (canon §8.2), not a verified business KPI — see completeExecution.
 */

import { createLogger } from '@pravado/utils';
import * as Sentry from '@sentry/node';

import { getSupabaseClient } from '../../lib/supabase';
import {
  markExecuting,
  completeExecution,
} from '../../services/craft/craftExecutionService';

const logger = createLogger('queue:sage-execution');

export interface SageExecutionPayload {
  executionId: string;
  orgId: string;
  proposalId: string;
}

export async function processSageExecution(
  payload: SageExecutionPayload
): Promise<void> {
  const { executionId, orgId, proposalId } = payload;
  logger.info(
    `Running governed execution ${executionId} (proposal ${proposalId}, org ${orgId})`
  );

  const supabase = getSupabaseClient();

  const started = await markExecuting(supabase, executionId);
  if (!started.ok) {
    // Not in 'queued' state (already picked up, or missing) — idempotent no-op.
    logger.warn(
      `Execution ${executionId} not in queued state; skipping (idempotent).`
    );
    return;
  }

  try {
    // LATER SLICE: dispatch to a concrete per-pillar action executor here. For now
    // the governed handoff is recorded and the execution completes.
    const result = await completeExecution(supabase, {
      executionId,
      result: 'success',
      detail: {
        kind: 'governed_handoff',
        note: 'Execution lifecycle recorded; concrete pillar action executor deferred to a later slice.',
      },
    });

    if (!result.ok) {
      throw new Error(`completeExecution failed: ${result.reason}`);
    }

    logger.info(
      `Execution ${executionId} completed; outcome ${result.outcomeId} fed back to SAGE.`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Execution ${executionId} failed: ${message}`);
    Sentry.captureException(err, {
      tags: { queue_name: 'sage-execution', org_id: orgId },
    });
    // Record the failure outcome so the loop closes even on error.
    await completeExecution(supabase, {
      executionId,
      result: 'failure',
      detail: { kind: 'execution_error', error: message },
    });
  }
}
