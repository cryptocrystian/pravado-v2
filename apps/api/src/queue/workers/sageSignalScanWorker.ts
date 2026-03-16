/**
 * SAGE Signal Scan Worker (Sprint S-INT-02)
 *
 * BullMQ worker that runs a SAGE signal scan for a given org.
 * Job name: 'sage:signal-scan'
 * Payload: { orgId: string }
 */

import { createLogger } from '@pravado/utils';
import { getSupabaseClient } from '../../lib/supabase';
import { runSignalScan } from '../../services/sage/sageSignalIngestor';

const logger = createLogger('queue:sage-signal-scan');

export interface SageSignalScanPayload {
  orgId: string;
}

/**
 * Process a SAGE signal scan job.
 * Called by BullMQ worker when a job arrives on the 'sage:signal-scan' queue.
 */
export async function processSageSignalScan(payload: SageSignalScanPayload): Promise<void> {
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
      logger.warn(`SAGE scan had ${result.errors.length} errors: ${result.errors.join('; ')}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`SAGE signal scan failed for org ${orgId}: ${message}`);
    throw error;
  }
}
