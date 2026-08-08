/**
 * EVI (Earned Visibility Index) API routes (Sprint S-INT-01)
 *
 * GET /current — calculate and return current EVI score
 * GET /history — return historical snapshots for chart rendering
 */

import { FLAGS } from '@pravado/feature-flags';
import { FastifyInstance } from 'fastify';

import { createLogger } from '../../lib/logger';
import { getSupabaseClient } from '../../lib/supabase';
import { requireUser } from '../../middleware/requireUser';
import { calculateEVI } from '../../services/evi/eviCalculationService';
import { getEVIDelta } from '../../services/evi/eviDeltaService';
import { getEVIHistory } from '../../services/evi/eviHistoryService';

const logger = createLogger('api:routes:evi');
/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data: userOrgs } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return (userOrgs as { org_id: string } | null)?.org_id || null;
}

export async function eviRoutes(server: FastifyInstance) {
  const supabase = getSupabaseClient();

  /**
   * GET /current
   * Calculate and return the current EVI score with full signal breakdown.
   */
  server.get(
    '/current',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_EVI) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'EVI is not enabled' },
        });
      }

      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        // Adjacent P2 (F13 remediation): snapshot dedup.
        //
        // Before this fix, GET /current called calculateEVI on every
        // request, which inserts a fresh row into evi_snapshots every
        // time. Command Center hits /current on every render, so a
        // single idle user with a browser tab open produced 34 snapshots
        // in 14 hours (observed 2026-07-01 for FlowMetric).
        //
        // Dedup rule: if the most-recent snapshot for this org is
        // younger than 1 hour, return its cached breakdown directly
        // without re-calculating or writing. If it's older (or missing)
        // fall through to a fresh calculateEVI call.
        //
        // Threshold is a judgment call — 1 hour matches the coarsest
        // signal-change window we expect from any single dashboard load.
        // Easy to tune later if user feedback demands finer resolution.
        const SNAPSHOT_TTL_MS = 60 * 60 * 1000;
        const { data: latestSnapshot } = await supabase
          .from('evi_snapshots')
          .select(
            'evi_score, visibility_score, authority_score, momentum_score, signal_breakdown, calculated_at, period_days'
          )
          .eq('org_id', orgId)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nowMs = Date.now();
        const snapshotAgeMs = latestSnapshot?.calculated_at
          ? nowMs - new Date(latestSnapshot.calculated_at).getTime()
          : Infinity;

        let breakdown;
        if (
          latestSnapshot &&
          Number.isFinite(snapshotAgeMs) &&
          snapshotAgeMs < SNAPSHOT_TTL_MS
        ) {
          // Fresh enough — reuse without touching calculateEVI.
          breakdown = {
            evi_score: Number(latestSnapshot.evi_score),
            visibility_score: Number(latestSnapshot.visibility_score),
            authority_score: Number(latestSnapshot.authority_score),
            momentum_score: Number(latestSnapshot.momentum_score),
            signal_breakdown: latestSnapshot.signal_breakdown,
            calculated_at: latestSnapshot.calculated_at,
            period_days: Number(latestSnapshot.period_days),
          };
        } else {
          breakdown = await calculateEVI(supabase, orgId);
        }

        const delta = await getEVIDelta(supabase, orgId);

        return reply.send({
          success: true,
          data: {
            ...breakdown,
            delta: delta.delta,
            delta_percent: delta.deltaPercent,
            direction: delta.direction,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'EVI calculation failed';
        logger.error('[EVI /current] Error:', message);
        return reply.code(500).send({
          success: false,
          error: { code: 'EVI_CALCULATION_ERROR', message },
        });
      }
    }
  );

  /**
   * GET /history
   * Return historical EVI snapshots for chart rendering.
   * Query param: ?days=30|60|90 (default 90)
   */
  server.get<{ Querystring: { days?: string } }>(
    '/history',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_EVI) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'EVI is not enabled' },
        });
      }

      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const days = parseInt(request.query.days || '90', 10);
      const validDays = [7, 30, 60, 90].includes(days) ? days : 90;

      try {
        const history = await getEVIHistory(supabase, orgId, validDays);

        return reply.send({
          success: true,
          data: history,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'EVI history query failed';
        logger.error('[EVI /history] Error:', message);
        return reply.code(500).send({
          success: false,
          error: { code: 'EVI_HISTORY_ERROR', message },
        });
      }
    }
  );
}
