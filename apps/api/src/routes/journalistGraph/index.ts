/**
 * Journalist Identity Graph API Routes (Sprint S46)
 * API routes for journalist intelligence and identity resolution
 */

import { FLAGS } from '@pravado/feature-flags';
import {
  apiEnvSchema,
  batchCreateActivitiesInputSchema,
  batchUpdateScoresInputSchema,
  createActivityInputSchema,
  createJournalistProfileInputSchema,
  graphQuerySchema,
  identityResolutionInputSchema,
  listActivitiesQuerySchema,
  listJournalistProfilesQuerySchema,
  mergeProfilesInputSchema,
  updateJournalistProfileInputSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { createJournalistGraphService } from '../../services/journalistGraphService';

export default async function journalistGraphRoutes(fastify: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_JOURNALIST_GRAPH) {
    fastify.log.info('Journalist graph routes disabled by feature flag');
    return;
  }

  // Create Supabase client
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  /**
   * Helper to get user's org ID
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1);

    return userOrgs?.[0]?.org_id || null;
  }

  // =============================================
  // Profile Management
  // =============================================

  /**
   * GET /api/journalist-graph/profiles
   * List journalist profiles
   */
  fastify.get(
    '/profiles',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = listJournalistProfilesQuerySchema.parse(request.query);

      const service = createJournalistGraphService(supabase);
      const result = await service.listProfiles(orgId, query);

      return reply.send({
        success: true,
        data: {
          profiles: result.profiles,
          total: result.total,
          limit: query.limit || 20,
          offset: query.offset || 0,
        },
      });
    }
  );

  /**
   * GET /api/journalist-graph/profiles/:id
   * Get a single journalist profile
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/profiles/:id',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;

      const service = createJournalistGraphService(supabase);
      const profile = await service.getProfile(id, orgId);

      if (!profile) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Profile not found' },
        });
      }

      return reply.send({
        success: true,
        data: profile,
      });
    }
  );

  /**
   * GET /api/journalist-graph/profiles/:id/enriched
   * Get enriched profile with all related data
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/profiles/:id/enriched',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;

      const service = createJournalistGraphService(supabase);
      const enrichedProfile = await service.getEnrichedProfile(id, orgId);

      return reply.send({
        success: true,
        data: enrichedProfile,
      });
    }
  );

  /**
   * POST /api/journalist-graph/profiles
   * Create a new journalist profile
   */
  fastify.post(
    '/profiles',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = createJournalistProfileInputSchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const profile = await service.createProfile(orgId, input);

      return reply.status(201).send({
        success: true,
        data: profile,
      });
    }
  );

  /**
   * PUT /api/journalist-graph/profiles/:id
   * Update a journalist profile
   */
  fastify.put<{
    Params: { id: string };
  }>(
    '/profiles/:id',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;
      const input = updateJournalistProfileInputSchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const profile = await service.updateProfile(id, orgId, input);

      return reply.send({
        success: true,
        data: profile,
      });
    }
  );

  /**
   * DELETE /api/journalist-graph/profiles/:id
   * Delete a journalist profile
   */
  fastify.delete<{
    Params: { id: string };
  }>(
    '/profiles/:id',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;

      const service = createJournalistGraphService(supabase);
      await service.deleteProfile(id, orgId);

      return reply.send({
        success: true,
        data: null,
      });
    }
  );

  // =============================================
  // Identity Resolution
  // =============================================

  /**
   * POST /api/journalist-graph/resolve-identity
   * Resolve journalist identity using fuzzy matching
   */
  fastify.post(
    '/resolve-identity',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = identityResolutionInputSchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const result = await service.resolveIdentity(orgId, input);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * POST /api/journalist-graph/find-duplicates
   * Find duplicate journalist profiles
   */
  fastify.post(
    '/find-duplicates',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const service = createJournalistGraphService(supabase);
      const result = await service.findDuplicates(orgId);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * POST /api/journalist-graph/merge-profiles
   * Merge two journalist profiles
   */
  fastify.post(
    '/merge-profiles',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = mergeProfilesInputSchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const result = await service.mergeProfiles(orgId, input, user.id);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // =============================================
  // Activity Management
  // =============================================

  /**
   * GET /api/journalist-graph/activities
   * List activities
   */
  fastify.get(
    '/activities',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = listActivitiesQuerySchema.parse(request.query);

      const service = createJournalistGraphService(supabase);
      const result = await service.listActivities(orgId, query);

      return reply.send({
        success: true,
        data: {
          activities: result.activities,
          total: result.total,
          limit: query.limit || 50,
          offset: query.offset || 0,
        },
      });
    }
  );

  /**
   * POST /api/journalist-graph/activities
   * Create an activity
   */
  fastify.post(
    '/activities',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = createActivityInputSchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const activity = await service.createActivity(orgId, input);

      return reply.status(201).send({
        success: true,
        data: activity,
      });
    }
  );

  /**
   * POST /api/journalist-graph/activities/batch
   * Create multiple activities in batch
   */
  fastify.post(
    '/activities/batch',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = batchCreateActivitiesInputSchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const result = await service.batchCreateActivities(orgId, input.activities);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // =============================================
  // Scoring & Classification
  // =============================================

  /**
   * POST /api/journalist-graph/profiles/:id/update-scores
   * Update all scores for a journalist
   */
  fastify.post<{
    Params: { id: string };
  }>(
    '/profiles/:id/update-scores',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;

      const service = createJournalistGraphService(supabase);
      const result = await service.updateScores(id, orgId);

      return reply.send({
        success: true,
        data: {
          journalistId: id,
          ...result,
          updatedAt: new Date(),
        },
      });
    }
  );

  /**
   * POST /api/journalist-graph/update-scores/batch
   * Update scores for multiple journalists
   */
  fastify.post(
    '/update-scores/batch',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = batchUpdateScoresInputSchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const result = await service.batchUpdateScores(orgId, input.journalistIds);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/journalist-graph/profiles/:id/tier
   * Get tier classification for a journalist
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/profiles/:id/tier',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;

      const service = createJournalistGraphService(supabase);
      const tierClassification = await service.classifyTier(id, orgId);

      return reply.send({
        success: true,
        data: tierClassification,
      });
    }
  );

  // =============================================
  // Graph
  // =============================================

  /**
   * POST /api/journalist-graph/graph
   * Build journalist graph
   */
  fastify.post(
    '/graph',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = graphQuerySchema.parse(request.body);

      const service = createJournalistGraphService(supabase);
      const graph = await service.buildGraph(orgId, query);

      return reply.send({
        success: true,
        data: graph,
      });
    }
  );
}
