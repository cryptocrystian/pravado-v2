/**
 * SAGE Daily Brief Generation Worker (D039 — SAGE_DAILY_BRIEF.md §6)
 *
 * Runs nightly AFTER the EVI recalc + the SAGE signal scan so the brief
 * summarizes fresh signals. Two shapes:
 *   - `{ type: 'scheduled' }` — batch: generate a brief for every org.
 *   - `{ orgId }` — generate a brief for a single org (on-demand, e.g.
 *     onboarding activation).
 *
 * GUARDED BATCH: a brief failure (or honest-empty skip) for one org must never
 * break the batch — each org is wrapped in its own try/catch and reported to
 * Sentry, exactly like the SAGE scan proposal-gen guard.
 */

import * as Sentry from '@sentry/node';

import { createLogger } from '../../lib/logger';
import { getSupabaseClient } from '../../lib/supabase';
import { generateDailyBrief } from '../../services/sage/sageDailyBriefService';

const logger = createLogger('queue:brief-generate');

export interface BriefGeneratePayload {
  orgId?: string;
  type?: 'scheduled';
}

export async function processBriefGenerate(
  payload: BriefGeneratePayload
): Promise<void> {
  const supabase = getSupabaseClient();

  if (payload.type === 'scheduled') {
    await generateBriefsForAllOrgs();
    return;
  }

  const { orgId } = payload;
  if (!orgId) {
    logger.warn('Brief generate called without orgId or scheduled type');
    return;
  }

  logger.info(`Generating daily brief for org ${orgId}`);
  const brief = await generateDailyBrief(supabase, orgId);
  logger.info(
    brief
      ? `Daily brief generated for org ${orgId} (provider: ${brief.provider_used})`
      : `No brief generated for org ${orgId} (honest empty — no real signals)`
  );
}

/**
 * Batch: generate a brief for every org, guarding each so a single failure
 * never dead-letters the whole nightly job.
 */
async function generateBriefsForAllOrgs(): Promise<void> {
  const supabase = getSupabaseClient();
  logger.info('Running scheduled daily brief generation for all orgs');

  const { data: orgs, error } = await supabase.from('orgs').select('id');
  if (error || !orgs) {
    logger.error(
      `Scheduled brief generation could not list orgs: ${error?.message ?? 'no data'}`
    );
    return;
  }

  let written = 0;
  let empty = 0;
  for (const org of orgs as Array<{ id: string }>) {
    try {
      const brief = await generateDailyBrief(supabase, org.id);
      if (brief) written++;
      else empty++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Daily brief failed for org ${org.id}: ${msg}`);
      Sentry.captureException(err, {
        tags: { org_id: org.id, phase: 'sage_daily_brief_generate' },
      });
      // Intentionally don't rethrow — one org's failure must not break the batch.
    }
  }

  logger.info(
    `Scheduled brief generation complete: ${written} written, ${empty} honest-empty, ` +
      `of ${orgs.length} orgs`
  );
}
