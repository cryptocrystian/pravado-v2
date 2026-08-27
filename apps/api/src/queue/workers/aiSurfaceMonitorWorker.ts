/**
 * AI Surface Monitor Worker — runs the DataForSEO-sourced AI SEARCH-SURFACE
 * engines (Google AI Overviews + Bing Copilot) for CiteMind Engine 3.
 *
 * Job name: 'citemind:ai-surface'. Two payload shapes (mirrors the fixed citation
 * monitor fan-out, PR #185):
 *   - `{ type: 'scheduled' }` — the configurable-cadence tick: fan out to a
 *     per-org job for every org.
 *   - `{ orgId }` — run the AI-surface monitor for a single org.
 *
 * Separate cadence from the chat monitor because each query is a paid DataForSEO
 * SERP call (default daily, CITEMIND_SERP_CADENCE_HOURS).
 */

import * as Sentry from '@sentry/node';

import { createLogger } from '../../lib/logger';
import { getSupabaseClient } from '../../lib/supabase';
import { monitorAiSurfaces } from '../../services/citeMind/aiSurfaceMonitor';

const logger = createLogger('queue:ai-surface-monitor');

export interface AiSurfaceMonitorPayload {
  orgId?: string;
  type?: 'scheduled';
}

export async function processAiSurfaceMonitor(
  payload: AiSurfaceMonitorPayload
): Promise<void> {
  const supabase = getSupabaseClient();

  if (payload.type === 'scheduled') {
    await runScheduledForAllOrgs(supabase);
    return;
  }

  const { orgId } = payload;
  if (!orgId) {
    logger.warn('AI-surface monitor called without orgId or scheduled type');
    return;
  }

  logger.info(`Running AI-surface monitor for org ${orgId}`);
  try {
    const result = await monitorAiSurfaces(supabase, orgId);
    logger.info(
      `AI-surface monitor complete for org ${orgId}: queries=${result.total_queries}, mentions=${result.total_mentions}, errors=${result.errors.length}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`AI-surface monitor failed for org ${orgId}: ${message}`);
    throw error;
  }
}

async function runScheduledForAllOrgs(
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<void> {
  logger.info('Running scheduled AI-surface monitor for all orgs');

  const { data: orgs, error } = await supabase.from('orgs').select('id');
  if (error || !orgs) {
    logger.error(
      `Scheduled AI-surface monitor could not list orgs: ${error?.message ?? 'no data'}`
    );
    return;
  }

  const { enqueueAiSurfaceMonitor } = await import('../bullmqQueue');

  let enqueued = 0;
  for (const org of orgs as Array<{ id: string }>) {
    try {
      await enqueueAiSurfaceMonitor(org.id);
      enqueued++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(
        `Failed to enqueue AI-surface monitor for org ${org.id}: ${msg}`
      );
      Sentry.captureException(err, {
        tags: { org_id: org.id, phase: 'ai_surface_scheduled_enqueue' },
      });
    }
  }

  logger.info(
    `Scheduled AI-surface monitor fan-out complete: ${enqueued}/${orgs.length} orgs enqueued`
  );
}
