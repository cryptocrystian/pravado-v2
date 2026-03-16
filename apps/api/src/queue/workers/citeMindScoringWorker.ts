/**
 * CiteMind Scoring Worker (Sprint S-INT-04)
 *
 * BullMQ worker that scores content via CiteMind for a given content item.
 * Job name: 'citemind:score'
 * Payload: { contentItemId: string, orgId: string }
 */

import { createLogger } from '@pravado/utils';
import { getSupabaseClient } from '../../lib/supabase';
import { scoreAndPersist } from '../../services/citeMind/citeMindQualityScorer';

const logger = createLogger('queue:citemind-score');

export interface CiteMindScoringPayload {
  contentItemId: string;
  orgId: string;
}

/**
 * Process a CiteMind scoring job.
 * Called by BullMQ worker when a job arrives on the 'citemind:score' queue.
 */
export async function processCiteMindScore(payload: CiteMindScoringPayload): Promise<void> {
  const { contentItemId, orgId } = payload;
  logger.info(`Scoring content ${contentItemId} for org ${orgId}`);

  const supabase = getSupabaseClient();

  try {
    const result = await scoreAndPersist(supabase, contentItemId, orgId);
    logger.info(
      `CiteMind score complete for ${contentItemId}: ` +
      `overall=${result.overall_score}, gate=${result.gate_status}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`CiteMind scoring failed for ${contentItemId}: ${message}`);
    throw error;
  }
}
