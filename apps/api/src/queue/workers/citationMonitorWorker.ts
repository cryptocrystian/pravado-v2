/**
 * Citation Monitor Worker (Sprint S-INT-05)
 *
 * BullMQ worker that runs citation monitoring for an org.
 * Job name: 'citemind:monitor'
 * Payload: { orgId: string }
 * Schedule: every 6 hours per org
 */

import { createLogger } from '@pravado/utils';
import { getSupabaseClient } from '../../lib/supabase';
import { monitorCitations } from '../../services/citeMind/citationMonitor';

const logger = createLogger('queue:citation-monitor');

export interface CitationMonitorPayload {
  orgId: string;
}

/**
 * Process a citation monitoring job.
 * Called by BullMQ worker when a job arrives on the 'citemind:monitor' queue.
 */
export async function processCitationMonitor(payload: CitationMonitorPayload): Promise<void> {
  const { orgId } = payload;
  logger.info(`Running citation monitor for org ${orgId}`);

  const supabase = getSupabaseClient();

  try {
    const result = await monitorCitations(supabase, orgId);
    logger.info(
      `Citation monitor complete for org ${orgId}: ` +
      `queries=${result.total_queries}, mentions=${result.total_mentions}, ` +
      `errors=${result.errors.length}`
    );

    if (result.errors.length > 0) {
      logger.warn(`Citation monitor had ${result.errors.length} errors: ${result.errors.slice(0, 3).join('; ')}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Citation monitor failed for org ${orgId}: ${message}`);
    throw error;
  }
}
