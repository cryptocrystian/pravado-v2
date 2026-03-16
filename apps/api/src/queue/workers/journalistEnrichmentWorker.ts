/**
 * Journalist Enrichment Worker (Sprint S-INT-06)
 *
 * Processes journalists:enrich-batch jobs — enriches journalists via Hunter.io.
 * Scheduled: weekly on Sunday nights.
 */

import { createLogger } from '@pravado/utils';

const logger = createLogger('queue:journalist-enrichment');

export interface JournalistEnrichPayload {
  orgId?: string;
  type?: 'scheduled';
}

export async function processJournalistEnrich(payload: JournalistEnrichPayload): Promise<void> {
  const { enrichBatch } = await import('../../services/journalists/hunterEnrichmentService');
  const { getSupabaseClient } = await import('../../lib/supabase');
  const supabase = getSupabaseClient();

  if (payload.type === 'scheduled') {
    // Scheduled job: enrich all orgs
    logger.info('Running scheduled journalist enrichment for all orgs');

    const { data: orgs } = await supabase.from('orgs').select('id');

    if (!orgs?.length) {
      logger.info('No orgs to enrich');
      return;
    }

    let enrichedTotal = 0;
    for (const org of orgs) {
      try {
        const result = await enrichBatch(supabase, org.id);
        enrichedTotal += result.enriched;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Enrichment failed for org ${org.id}: ${msg}`);
      }
    }

    logger.info(`Scheduled enrichment complete: ${enrichedTotal} journalists enriched across ${orgs.length} orgs`);
  } else if (payload.orgId) {
    // Single org enrichment
    logger.info(`Processing journalist enrichment for org ${payload.orgId}`);
    const result = await enrichBatch(supabase, payload.orgId);
    logger.info(
      `Enrichment complete: ${result.enriched} enriched, ${result.skipped} skipped, ${result.errors} errors`
    );
  }
}
