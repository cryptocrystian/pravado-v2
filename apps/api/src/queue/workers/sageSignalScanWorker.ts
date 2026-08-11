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
  orgId?: string;
  /**
   * Nightly repeatable driver (D039 prerequisite): fan the scan out to every
   * org so briefs summarize FRESH signals, not stale ones. Mirrors the GSC
   * scheduled fan-out pattern.
   */
  type?: 'scheduled';
}

/**
 * Process a SAGE signal scan job.
 * Called by BullMQ worker when a job arrives on the 'sage:signal-scan' queue.
 *
 * Two shapes:
 *   - `{ type: 'scheduled' }` — nightly: enqueue a per-org scan for every org.
 *   - `{ orgId }` — run the scan for a single org.
 */
export async function processSageSignalScan(
  payload: SageSignalScanPayload
): Promise<void> {
  const supabase = getSupabaseClient();

  if (payload.type === 'scheduled') {
    await runScheduledScanForAllOrgs(supabase);
    return;
  }

  const { orgId } = payload;
  if (!orgId) {
    logger.warn('SAGE signal scan called without orgId or scheduled type');
    return;
  }
  logger.info(`Running SAGE signal scan for org ${orgId}`);

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

/**
 * Nightly fan-out: enqueue a per-org SAGE signal scan for every org. Mirrors the
 * GSC scheduled-sync pattern — each org's scan runs as its own queue job so a
 * single org's failure is isolated (per-job retry/dead-letter) and never breaks
 * the batch. This keeps signals fresh for the downstream nightly brief.
 */
async function runScheduledScanForAllOrgs(
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<void> {
  logger.info('Running scheduled SAGE signal scan for all orgs');

  const { data: orgs, error } = await supabase.from('orgs').select('id');
  if (error || !orgs) {
    logger.error(
      `Scheduled SAGE scan could not list orgs: ${error?.message ?? 'no data'}`
    );
    return;
  }

  const { enqueueSageSignalScan } = await import('../bullmqQueue');

  let enqueued = 0;
  for (const org of orgs as Array<{ id: string }>) {
    try {
      await enqueueSageSignalScan(org.id);
      enqueued++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to enqueue SAGE scan for org ${org.id}: ${msg}`);
      Sentry.captureException(err, {
        tags: { org_id: org.id, phase: 'sage_scheduled_scan_enqueue' },
      });
    }
  }

  logger.info(
    `Scheduled SAGE scan fan-out complete: ${enqueued}/${orgs.length} orgs enqueued`
  );
}
