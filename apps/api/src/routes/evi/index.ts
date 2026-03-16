/**
 * EVI (Earned Visibility Index) API routes (Sprint S-INT-01)
 *
 * GET /current — calculate and return current EVI score
 * GET /history — return historical snapshots for chart rendering
 */

import { FLAGS } from '@pravado/feature-flags';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { getSupabaseClient } from '../../lib/supabase';
import { calculateEVI } from '../../services/evi/eviCalculationService';
import { getEVIDelta } from '../../services/evi/eviDeltaService';
import { getEVIHistory } from '../../services/evi/eviHistoryService';

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
        const breakdown = await calculateEVI(supabase, orgId);
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
        const message = error instanceof Error ? error.message : 'EVI calculation failed';
        console.error('[EVI /current] Error:', message);
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
      const validDays = [30, 60, 90].includes(days) ? days : 90;

      try {
        const history = await getEVIHistory(supabase, orgId, validDays);

        return reply.send({
          success: true,
          data: history,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'EVI history query failed';
        console.error('[EVI /history] Error:', message);
        return reply.code(500).send({
          success: false,
          error: { code: 'EVI_HISTORY_ERROR', message },
        });
      }
    }
  );
}
