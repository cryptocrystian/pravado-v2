/**
 * SAGE Governed Execution Worker (Wave-2 — SAGE↔CRAFT loop closure + executors).
 *
 * BullMQ worker that runs a governed CRAFT execution created by
 * `craftExecutionService.executeProposal`. Job name: 'sage:execution'.
 * Payload: { executionId, orgId, proposalId }.
 *
 * Lifecycle (CRAFT_EXECUTION_MODEL §8): the execution row arrives in state 'queued'.
 * The heavy lifting lives in `runQueuedExecution` (craftExecutionRunner) so it is
 * unit-testable without BullMQ: it transitions queued→executing (audited), DISPATCHES
 * to the registered per-pillar action executor (Wave-2 — the Content
 * `content.create_brief` executor produces a real brief; reserved PR/SEO actions
 * degrade to a governed no-op), then calls `completeExecution` which writes the
 * terminal state + immutable audit + the outcome fed back to the proposal/signal +
 * the signal-type tally — closing the SAGE→CRAFT→outcome→SAGE loop.
 *
 * This worker is a thin wrapper: it owns logging + Sentry error reporting and the
 * Supabase client; the runner owns the governed lifecycle + dispatch.
 */

import { createLogger } from '@pravado/utils';
import * as Sentry from '@sentry/node';

import { getSupabaseClient } from '../../lib/supabase';
import { runQueuedExecution } from '../../services/craft/craftExecutionRunner';

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

  try {
    const result = await runQueuedExecution(supabase, payload);

    if (!result.ran) {
      logger.warn(
        `Execution ${executionId} not in queued state; skipping (idempotent).`
      );
      return;
    }

    logger.info(
      `Execution ${executionId} completed with outcome '${result.outcome}'; fed back to SAGE.`
    );
  } catch (err) {
    // runQueuedExecution records the failure outcome itself; this is a last-resort
    // guard (e.g. markExecuting/DB unreachable) so the worker still reports.
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Execution ${executionId} failed: ${message}`);
    Sentry.captureException(err, {
      tags: { queue_name: 'sage-execution', org_id: orgId },
    });
    throw err;
  }
}
