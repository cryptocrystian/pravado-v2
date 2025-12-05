/**
 * Content Brief Generator API routes (Sprint S13)
 * AI-assisted content brief generation endpoints
 */

import type {
  GenerateBriefResponse,
  GetGeneratedBriefResponse,
  ListGeneratedBriefsResponse,
  BriefGenerationInput,
} from '@pravado/types';
import { LlmRouter } from '@pravado/utils';
import {
  briefGenerationInputSchema,
  listGeneratedBriefsQuerySchema,
  validateEnv,
  apiEnvSchema,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { BillingService } from '../../services/billingService';
import { BriefGeneratorService } from '../../services/briefGeneratorService';

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

export async function contentBriefGeneratorRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // S28+S29: Initialize billing service
  const billingService = new BillingService(supabase, env.BILLING_DEFAULT_PLAN_SLUG);

  // S16: Initialize LLM router from environment
  const llmRouter = LlmRouter.fromEnv(env);

  const briefGeneratorService = new BriefGeneratorService(supabase, billingService, llmRouter);

  // ========================================
  // POST /api/v1/content/briefs/generate
  // Generate a new content brief
  // ========================================
  server.post<{
    Body: BriefGenerationInput;
    Reply: GenerateBriefResponse;
  }>(
    '/generate',
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
      const validation = briefGenerationInputSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid brief generation input',
          },
        });
      }

      const input = validation.data;
      const result = await briefGeneratorService.generateBrief(orgId, request.user.id, input);

      return reply.code(201).send({
        success: true,
        data: { result },
      });
    }
  );

  // ========================================
  // GET /api/v1/content/generated-briefs/:id
  // Get a generated brief by ID
  // ========================================
  server.get<{
    Params: { id: string };
    Reply: GetGeneratedBriefResponse;
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
      const item = await briefGeneratorService.getGeneratedBrief(orgId, id);

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Generated brief not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { item },
      });
    }
  );

  // ========================================
  // GET /api/v1/content/generated-briefs
  // List generated briefs for the org
  // ========================================
  server.get<{
    Querystring: {
      limit?: string;
      offset?: string;
      contentItemId?: string;
    };
    Reply: ListGeneratedBriefsResponse;
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

      // Parse and validate query params
      const validation = listGeneratedBriefsQuerySchema.safeParse({
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
        contentItemId: request.query.contentItemId,
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

      const filters = validation.data;
      const items = await briefGeneratorService.listGeneratedBriefs(orgId, filters);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );
}
