/**
 * Content Quality API routes (Sprint S14)
 * Endpoints for analyzing content quality and retrieving scores
 */

import type {
  AnalyzeContentQualityResponse,
  GetContentQualityResponse,
} from '@pravado/types';
import { analyzeContentQualitySchema, validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { ContentQualityService } from '../../services/contentQualityService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: any): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  return userOrgs?.org_id || null;
}

export async function contentQualityRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const contentQualityService = new ContentQualityService(supabase);

  // ========================================
  // POST /api/v1/content/quality/analyze
  // Analyze content quality
  // ========================================
  server.post<{
    Body: { contentItemId: string };
    Reply: AnalyzeContentQualityResponse;
  }>(
    '/analyze',
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

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = analyzeContentQualitySchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      const { contentItemId } = validation.data;

      try {
        const result = await contentQualityService.analyzeQuality(orgId, contentItemId);

        return reply.code(200).send({
          success: true,
          data: { result },
        });
      } catch (error) {
        const err = error as Error;
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ANALYSIS_ERROR',
            message: err.message || 'Failed to analyze content quality',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/content/quality/:contentItemId
  // Get quality score for content item
  // ========================================
  server.get<{
    Params: { contentItemId: string };
    Reply: GetContentQualityResponse;
  }>(
    '/:contentItemId',
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

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { contentItemId } = request.params;

      try {
        // Try to get existing score first
        const existingScore = await contentQualityService.getQualityScore(orgId, contentItemId);

        // If no score exists, analyze now
        if (!existingScore) {
          const result = await contentQualityService.analyzeQuality(orgId, contentItemId);
          return reply.code(200).send({
            success: true,
            data: { result },
          });
        }

        // Return existing analysis
        const result = await contentQualityService.analyzeQuality(orgId, contentItemId);
        return reply.code(200).send({
          success: true,
          data: { result },
        });
      } catch (error) {
        const err = error as Error;
        return reply.code(500).send({
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: err.message || 'Failed to fetch content quality',
          },
        });
      }
    }
  );
}
