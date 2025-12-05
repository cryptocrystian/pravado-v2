/**
 * Content Rewrite API routes (Sprint S15)
 * Endpoints for semantic content rewriting
 */

import type {
  CreateRewriteResponse,
  GetRewriteResponse,
  ListRewritesResponse,
} from '@pravado/types';
import { LlmRouter } from '@pravado/utils';
import { rewriteRequestSchema, listRewritesSchema, validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { BillingService } from '../../services/billingService';
import { ContentRewriteService } from '../../services/contentRewriteService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: any): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('user_orgs')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  return userOrgs?.org_id || null;
}

export async function contentRewriteRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // S28+S29: Initialize billing service
  const billingService = new BillingService(supabase, env.BILLING_DEFAULT_PLAN_SLUG);

  // S16: Initialize LLM router from environment
  const llmRouter = LlmRouter.fromEnv(env);

  const rewriteService = new ContentRewriteService(supabase, billingService, llmRouter);

  // ========================================
  // POST /api/v1/content/rewrites
  // Generate a new content rewrite
  // ========================================
  server.post<{
    Body: {
      contentItemId: string;
      personalityId?: string | null;
      targetKeyword?: string | null;
      targetIntent?: string | null;
    };
    Reply: CreateRewriteResponse;
  }>(
    '/',
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
      const validation = rewriteRequestSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      try {
        const result = await rewriteService.generateRewrite(orgId, validation.data);

        return reply.code(201).send({
          success: true,
          data: { result },
        });
      } catch (error) {
        const err = error as Error;
        return reply.code(500).send({
          success: false,
          error: {
            code: 'REWRITE_ERROR',
            message: err.message || 'Failed to generate rewrite',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/content/rewrites
  // List rewrites for org
  // ========================================
  server.get<{
    Querystring: {
      page?: string;
      pageSize?: string;
      contentItemId?: string;
    };
    Reply: ListRewritesResponse;
  }>(
    '/',
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

      // Parse query params
      const page = request.query.page ? parseInt(request.query.page, 10) : 1;
      const pageSize = request.query.pageSize ? parseInt(request.query.pageSize, 10) : 20;
      const contentItemId = request.query.contentItemId;

      // Validate params
      const validation = listRewritesSchema.safeParse({
        page,
        pageSize,
        contentItemId,
      });

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
          },
        });
      }

      try {
        const { rewrites, total } = await rewriteService.listRewrites(orgId, validation.data);

        return reply.code(200).send({
          success: true,
          data: { rewrites, total },
        });
      } catch (error) {
        const err = error as Error;
        return reply.code(500).send({
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: err.message || 'Failed to fetch rewrites',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/content/rewrites/:id
  // Get single rewrite by ID
  // ========================================
  server.get<{
    Params: { id: string };
    Reply: GetRewriteResponse;
  }>(
    '/:id',
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

      const { id } = request.params;

      try {
        const rewrite = await rewriteService.getRewrite(orgId, id);

        if (!rewrite) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Rewrite not found',
            },
          });
        }

        return reply.code(200).send({
          success: true,
          data: { rewrite },
        });
      } catch (error) {
        const err = error as Error;
        return reply.code(500).send({
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: err.message || 'Failed to fetch rewrite',
          },
        });
      }
    }
  );
}
