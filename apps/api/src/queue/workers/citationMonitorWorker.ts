/**
 * Citation Monitor Worker (Sprint S-INT-05)
 *
 * BullMQ worker that runs CiteMind citation monitoring (Engine 3).
 * Job name: 'citemind:monitor'
 * Schedule: the repeatable job fires every 6 hours as `{ type: 'scheduled' }`
 * and fans out to a per-org `{ orgId }` job for every org.
 *
 * The scheduled tick MUST fan out: it carries no orgId, so a single job cannot
 * monitor anyone. (Previously the worker ran `monitorCitations(supabase,
 * undefined)` on the tick, which no-opped/failed on the NOT-NULL org_id — so
 * nothing populated citation_monitor_results on a schedule, and Share of Model
 * stayed empty. This fan-out, mirroring the SAGE nightly scan, is what actually
 * keeps the data — and Share of Model — fresh.)
 */

import * as Sentry from '@sentry/node';

import { createLogger } from '../../lib/logger';
import { getSupabaseClient } from '../../lib/supabase';
import { monitorCitations } from '../../services/citeMind/citationMonitor';

const logger = createLogger('queue:citation-monitor');

export interface CitationMonitorPayload {
  /** Single-org run (enqueued on-demand, or by the scheduled fan-out below). */
  orgId?: string;
  /** The repeatable 6-hourly scheduler enqueues this (no orgId). */
  type?: 'scheduled';
}

/**
 * Process a citation monitoring job.
 *
 * Two shapes:
 *   - `{ type: 'scheduled' }` — fan out: enqueue a per-org monitor for every org.
 *   - `{ orgId }` — run the monitor for a single org.
 */
export async function processCitationMonitor(
  payload: CitationMonitorPayload
): Promise<void> {
  const supabase = getSupabaseClient();

  if (payload.type === 'scheduled') {
    await runScheduledMonitorForAllOrgs(supabase);
    return;
  }

  const { orgId } = payload;
  if (!orgId) {
    logger.warn('Citation monitor called without orgId or scheduled type');
    return;
  }

  logger.info(`Running citation monitor for org ${orgId}`);

  try {
    const result = await monitorCitations(supabase, orgId);
    logger.info(
      `Citation monitor complete for org ${orgId}: ` +
        `queries=${result.total_queries}, mentions=${result.total_mentions}, ` +
        `errors=${result.errors.length}`
    );

    if (result.errors.length > 0) {
      logger.warn(
        `Citation monitor had ${result.errors.length} errors: ${result.errors.slice(0, 3).join('; ')}`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Citation monitor failed for org ${orgId}: ${message}`);
    throw error;
  }
}

/**
 * 6-hourly fan-out: enqueue a per-org citation monitor for every org. Each org
 * runs as its own job so one org's failure is isolated (per-job retry) and never
 * breaks the batch. Mirrors the SAGE nightly scan fan-out.
 */
async function runScheduledMonitorForAllOrgs(
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<void> {
  logger.info('Running scheduled citation monitor for all orgs');

  const { data: orgs, error } = await supabase.from('orgs').select('id');
  if (error || !orgs) {
    logger.error(
      `Scheduled citation monitor could not list orgs: ${error?.message ?? 'no data'}`
    );
    return;
  }

  const { enqueueCitationMonitor } = await import('../bullmqQueue');

  let enqueued = 0;
  for (const org of orgs as Array<{ id: string }>) {
    try {
      await enqueueCitationMonitor(org.id);
      enqueued++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(
        `Failed to enqueue citation monitor for org ${org.id}: ${msg}`
      );
      Sentry.captureException(err, {
        tags: { org_id: org.id, phase: 'citation_scheduled_monitor_enqueue' },
      });
    }
  }

  logger.info(
    `Scheduled citation monitor fan-out complete: ${enqueued}/${orgs.length} orgs enqueued`
  );
}
