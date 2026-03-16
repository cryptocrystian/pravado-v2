/**
 * EVI Recalculate Worker (Sprint S-INT-01)
 *
 * BullMQ worker that recalculates EVI for a given org.
 * Job name: 'evi:recalculate'
 * Payload: { orgId: string }
 */

import { createLogger } from '@pravado/utils';
import { getSupabaseClient } from '../../lib/supabase';
import { calculateEVI } from '../../services/evi/eviCalculationService';

const logger = createLogger('queue:evi-recalculate');

export interface EVIRecalculatePayload {
  orgId: string;
}

/**
 * Process an EVI recalculation job.
 * Called by BullMQ worker when a job arrives on the 'evi:recalculate' queue.
 */
export async function processEVIRecalculate(payload: EVIRecalculatePayload): Promise<void> {
  const { orgId } = payload;
  logger.info(`Recalculating EVI for org ${orgId}`);

  const supabase = getSupabaseClient();

  try {
    const result = await calculateEVI(supabase, orgId);
    logger.info(`EVI recalculated for org ${orgId}: score=${result.evi_score}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`EVI recalculation failed for org ${orgId}: ${message}`);
    throw error; // Re-throw so BullMQ marks the job as failed and can retry
  }
}
