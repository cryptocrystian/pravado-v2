/**
 * Ops Routes (Sprint S27)
 * Internal observability endpoints for ops dashboard
 */

import { apiEnvSchema, validateEnv } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { OpsMetricsService } from '../../services/opsMetricsService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: any): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('user_orgs')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return userOrgs?.org_id || null;
}

/**
 * Register ops routes
 */
export async function opsRoutes(
  server: FastifyInstance
): Promise<void> {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Create OpsMetricsService
  // Note: queue and workerPool are not available in this context
  // so queue stats will return empty until we wire up the execution engine
  const opsMetrics = new OpsMetricsService(supabase);
  /**
   * GET /api/v1/ops/overview
   * Get overview metrics for current org (execution + LLM usage)
   */
  server.get<{
    Querystring: {
      period?: '24h' | '7d';
    };
  }>(
    '/overview',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        const period = request.query.period || '24h';

        const [executionStats, llmUsage, recentFailures] = await Promise.all([
          opsMetrics.getOrgExecutionStats(orgId, period),
          opsMetrics.getLlmUsageSummary(orgId, period),
          opsMetrics.getRecentFailures(orgId, 10),
        ]);

        return reply.send({
          success: true,
          data: {
            execution: executionStats,
            llmUsage,
            recentFailures,
          },
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Ops] Failed to fetch overview', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch overview metrics',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/ops/queue
   * Get queue statistics (global, non-sensitive)
   */
  server.get(
    '/queue',
    { preHandler: requireUser },
    async (_request, reply) => {
      try {
        const queueStats = await opsMetrics.getQueueStats();

        return reply.send({
          success: true,
          data: queueStats,
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Ops] Failed to fetch queue stats', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch queue stats',
          },
        });
      }
    }
  );
}
