/**
 * Analytics API routes (Wave-2 — Analytics-SEO surface).
 *
 * GET /api/v1/analytics/seo — org-scoped aggregate of the four Analytics-SEO
 * panels (engine breakdown, own-rank summary, competitive movement, topic-cluster
 * performance). Reads ONLY stored data (no new external/paid calls). Each panel is
 * independently honest-empty; real errors are surfaced, never swallowed.
 */

import type { ApiResponse } from '@pravado/types';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import {
  SEOAnalyticsService,
  type AnalyticsSeoData,
} from '../../services/seoAnalyticsService';

type GetAnalyticsSeoResponse = ApiResponse<AnalyticsSeoData>;

export async function analyticsRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const analyticsService = new SEOAnalyticsService(supabase);

  /**
   * Helper to get the user's org ID (first org — mirrors the SEO routes).
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    return userOrgs?.org_id || null;
  }

  // ========================================
  // GET /api/v1/analytics/seo
  // Aggregates the four Analytics-SEO panels (org-scoped, read-only).
  // ========================================
  server.get<{
    Querystring: { days?: string };
    Reply: GetAnalyticsSeoResponse;
  }>(
    '/seo',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Citation-velocity window (default 30 days), clamped to a sane range.
      let days = 30;
      if (request.query.days) {
        const parsed = parseInt(request.query.days, 10);
        if (Number.isFinite(parsed)) {
          days = Math.min(Math.max(parsed, 1), 365);
        }
      }

      try {
        const data = await analyticsService.getAnalytics(orgId, days);
        return {
          success: true,
          data,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to load SEO analytics',
          },
        });
      }
    }
  );
}
