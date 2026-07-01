/**
 * SAGE Signal Scan Worker (Sprint S-INT-02, extended for F13 in Tier 2)
 *
 * BullMQ worker that runs a SAGE signal scan for a given org.
 * Job name: 'sage:signal-scan'
 * Payload: { orgId: string }
 *
 * Post-scan pipeline (F13 remediation):
 *   1. runSignalScan writes 0..N rows to sage_signals
 *   2. IF signals_written > 0 → call generateProposals (Fix A). Guarded:
 *      any proposal-gen failure is captured to Sentry with org_id tag
 *      but does NOT fail the scan job (the scan itself already succeeded).
 *   3. IF signals_written === 0 AND the org has never received any
 *      proposals AND has brand data + at least one competitor → call
 *      generateColdStartProposals (Fix B). Same guarded posture.
 *
 * Idempotency: the cold-start branch's "no existing proposals" check
 * means cold-start runs at most once per org; subsequent empty scans
 * (before real signal data arrives) are no-ops.
 */

import { createLogger } from '@pravado/utils';
import * as Sentry from '@sentry/node';

import { getSupabaseClient } from '../../lib/supabase';
import { generateColdStartProposals } from '../../services/sage/sageColdStartProposals';
import { generateProposals } from '../../services/sage/sageProposalGenerator';
import { runSignalScan } from '../../services/sage/sageSignalIngestor';

const logger = createLogger('queue:sage-signal-scan');

export interface SageSignalScanPayload {
  orgId: string;
}

/**
 * Process a SAGE signal scan job.
 * Called by BullMQ worker when a job arrives on the 'sage:signal-scan' queue.
 */
export async function processSageSignalScan(
  payload: SageSignalScanPayload
): Promise<void> {
  const { orgId } = payload;
  logger.info(`Running SAGE signal scan for org ${orgId}`);

  const supabase = getSupabaseClient();

  try {
    const result = await runSignalScan(supabase, orgId);
    logger.info(
      `SAGE scan complete for org ${orgId}: ` +
        `found=${result.signals_found}, written=${result.signals_written}, ` +
        `PR=${result.by_pillar.PR}, Content=${result.by_pillar.Content}, SEO=${result.by_pillar.SEO}`
    );

    if (result.errors.length > 0) {
      logger.warn(
        `SAGE scan had ${result.errors.length} errors: ${result.errors.join('; ')}`
      );
    }

    // Fix A (F13 wiring gap): if the scan produced signals, immediately
    // generate proposals so the user's Command Center shows something
    // actionable. Guarded — a proposal-gen failure is Sentry-captured
    // but doesn't fail the scan job (the scan itself already succeeded
    // and the rows in sage_signals are the value contract for the scan
    // step). Retry logic lives in the queue, not here.
    if (result.signals_written > 0) {
      try {
        const proposalResult = await generateProposals(supabase, orgId);
        logger.info(
          `SAGE proposals generated for org ${orgId}: ` +
            `count=${proposalResult.proposals_generated}, ` +
            `provider=${proposalResult.llm_provider_used}`
        );
      } catch (proposalErr) {
        const msg =
          proposalErr instanceof Error
            ? proposalErr.message
            : String(proposalErr);
        logger.error(
          `Proposal generation failed for org ${orgId} after successful scan: ${msg}`
        );
        Sentry.captureException(proposalErr, {
          tags: { org_id: orgId, phase: 'sage_signal_scan_proposal_gen' },
        });
        // Intentionally don't rethrow — scan succeeded; proposal gen
        // failure shouldn't dead-letter the scan job.
      }
    } else {
      // Fix B (F13 empty-inputs no-op): if the scan produced zero
      // signals AND this org has never received a proposal, try the
      // cold-start path. The service does its own idempotency +
      // brand-data guard checks and short-circuits gracefully when
      // preconditions aren't met — this call is safe to make on
      // every empty scan.
      try {
        await generateColdStartProposals(supabase, orgId);
      } catch (coldStartErr) {
        const msg =
          coldStartErr instanceof Error
            ? coldStartErr.message
            : String(coldStartErr);
        logger.error(
          `Cold-start proposal generation failed for org ${orgId}: ${msg}`
        );
        Sentry.captureException(coldStartErr, {
          tags: { org_id: orgId, phase: 'sage_signal_scan_cold_start' },
        });
        // Same posture as the proposal-gen branch: don't rethrow.
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`SAGE signal scan failed for org ${orgId}: ${message}`);
    throw error;
  }
}
