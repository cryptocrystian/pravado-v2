/**
 * GSC Sync Worker (Sprint S-INT-06)
 *
 * Processes gsc:sync jobs — syncs Google Search Console data for an org.
 * Also handles scheduled daily syncs for all connected orgs.
 */

import { createLogger } from '@pravado/utils';

const logger = createLogger('queue:gsc-sync');

export interface GscSyncPayload {
  orgId?: string;
  type?: 'scheduled';
}

export async function processGscSync(payload: GscSyncPayload): Promise<void> {
  const { syncOrg } = await import('../../services/gsc/gscSyncService');
  const { getSupabaseClient } = await import('../../lib/supabase');
  const supabase = getSupabaseClient();

  if (payload.type === 'scheduled') {
    // Scheduled job: sync all connected orgs
    logger.info('Running scheduled GSC sync for all connected orgs');

    const { data: connections } = await supabase
      .from('gsc_connections')
      .select('org_id')
      .neq('sync_status', 'syncing');

    if (!connections?.length) {
      logger.info('No GSC connections to sync');
      return;
    }

    let synced = 0;
    for (const conn of connections) {
      try {
        await syncOrg(supabase, conn.org_id);
        synced++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`GSC sync failed for org ${conn.org_id}: ${msg}`);
      }
    }

    logger.info(`Scheduled GSC sync complete: ${synced}/${connections.length} orgs synced`);

    // After sync, trigger SAGE signal scan for each synced org
    try {
      const { enqueueSageSignalScan } = await import('../bullmqQueue');
      for (const conn of connections) {
        await enqueueSageSignalScan(conn.org_id);
      }
    } catch {
      logger.warn('Failed to enqueue SAGE scans after GSC sync');
    }
  } else if (payload.orgId) {
    // Single org sync
    logger.info(`Processing GSC sync for org ${payload.orgId}`);
    const result = await syncOrg(supabase, payload.orgId);
    logger.info(
      `GSC sync complete: ${result.keywordsUpserted} keywords, ${result.metricsUpserted} metrics, ${result.errors.length} errors`
    );

    // Trigger SAGE signal scan with fresh keyword data
    try {
      const { enqueueSageSignalScan } = await import('../bullmqQueue');
      await enqueueSageSignalScan(payload.orgId);
    } catch {
      logger.warn('Failed to enqueue SAGE scan after GSC sync');
    }
  }
}
