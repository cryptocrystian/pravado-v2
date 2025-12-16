/**
 * Journalist Discovery Engine Routes (Sprint S48)
 * API routes for automated journalist discovery and enrichment
 */

import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FLAGS } from '@pravado/feature-flags';
import { createJournalistDiscoveryService } from '../../services/journalistDiscoveryService';
import { requireUser } from '../../middleware/requireUser';
import {
  apiEnvSchema,
  discoveredJournalistInputSchema,
  resolveDiscoveryInputSchema,
  authorExtractionInputSchema,
  socialProfileInputSchema,
  discoveryQuerySchema,
  batchDiscoveryInputSchema,
  validateEnv,
  type DiscoveredJournalistInput,
  type ResolveDiscoveryInput,
  type AuthorExtractionInput,
  type SocialProfileInput,
  type DiscoveryQuery,
  type BatchDiscoveryInput,
} from '@pravado/validators';
import type {
  DiscoveredJournalist,
  DiscoveryListResponse,
  AuthorExtractionResult,
  MergePreview,
  DiscoveryStats,
  DeduplicationResult,
  BatchDiscoveryResult,
  DiscoveredJournalistInput as DiscoveredJournalistInputType,
} from '@pravado/types';

export async function journalistDiscoveryRoutes(fastify: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_JOURNALIST_DISCOVERY) {
    fastify.log.info('Journalist discovery routes disabled by feature flag');
    return;
  }

  // Create Supabase client
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  /**
   * Helper to get user's org ID
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single();

    return profile?.org_id || null;
  }

  // POST /api/v1/journalist-discovery/extract
  fastify.post<{
    Body: AuthorExtractionInput;
    Reply: AuthorExtractionResult | { error: string };
  }>(
    '/extract',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: AuthorExtractionInput }>, reply: FastifyReply) => {
      try {
        const validationResult = authorExtractionInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const discoveryService = createJournalistDiscoveryService(supabase);
        const result = await discoveryService.extractAuthorsFromArticle(orgId, input);

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-discovery/extract' }, 'Failed to extract authors');
        return reply.status(500).send({ error: 'Failed to extract authors', message: error.message });
      }
    }
  );

  // POST /api/v1/journalist-discovery
  fastify.post<{
    Body: DiscoveredJournalistInput;
    Reply: DiscoveredJournalist | { error: string };
  }>(
    '/',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: DiscoveredJournalistInput }>, reply: FastifyReply) => {
      try {
        const validationResult = discoveredJournalistInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const discoveryService = createJournalistDiscoveryService(supabase);
        const discovery = await discoveryService.createDiscovery(orgId, input as DiscoveredJournalistInputType);

        return reply.status(201).send(discovery);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-discovery' }, 'Failed to create discovery');
        return reply.status(500).send({ error: 'Failed to create discovery', message: error.message });
      }
    }
  );

  // GET /api/v1/journalist-discovery
  fastify.get<{
    Querystring: DiscoveryQuery;
    Reply: DiscoveryListResponse | { error: string };
  }>(
    '/',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Querystring: DiscoveryQuery }>, reply: FastifyReply) => {
      try {
        const validationResult = discoveryQuerySchema.safeParse(request.query);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid query parameters', details: validationResult.error.errors });
        }

        const query = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const discoveryService = createJournalistDiscoveryService(supabase);
        const result = await discoveryService.listDiscoveries(orgId, query);

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /journalist-discovery' }, 'Failed to list discoveries');
        return reply.status(500).send({ error: 'Failed to list discoveries', message: error.message });
      }
    }
  );

  // GET /api/v1/journalist-discovery/stats
  fastify.get<{
    Reply: DiscoveryStats | { error: string };
  }>('/stats', { onRequest: [requireUser] }, async (request, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      const stats = await discoveryService.getDiscoveryStats(orgId);

      return reply.status(200).send(stats);
    } catch (error: any) {
      fastify.log.error({ error, route: 'GET /journalist-discovery/stats' }, 'Failed to get discovery stats');
      return reply.status(500).send({ error: 'Failed to get discovery stats', message: error.message });
    }
  });

  // GET /api/v1/journalist-discovery/:id
  fastify.get<{
    Params: { id: string };
    Reply: DiscoveredJournalist | { error: string };
  }>('/:id', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      const discovery = await discoveryService.getDiscovery(id, orgId);

      if (!discovery) {
        return reply.status(404).send({ error: 'Discovery not found' });
      }

      return reply.status(200).send(discovery);
    } catch (error: any) {
      fastify.log.error({ error, route: 'GET /journalist-discovery/:id' }, 'Failed to get discovery');
      return reply.status(500).send({ error: 'Failed to get discovery', message: error.message });
    }
  });

  // PUT /api/v1/journalist-discovery/:id
  fastify.put<{
    Params: { id: string };
    Body: Partial<DiscoveredJournalistInput>;
    Reply: DiscoveredJournalist | { error: string };
  }>('/:id', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<DiscoveredJournalistInput> }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      const discovery = await discoveryService.updateDiscovery(id, orgId, request.body as Partial<DiscoveredJournalistInputType>);

      if (!discovery) {
        return reply.status(404).send({ error: 'Discovery not found' });
      }

      return reply.status(200).send(discovery);
    } catch (error: any) {
      fastify.log.error({ error, route: 'PUT /journalist-discovery/:id' }, 'Failed to update discovery');
      return reply.status(500).send({ error: 'Failed to update discovery', message: error.message });
    }
  });

  // DELETE /api/v1/journalist-discovery/:id
  fastify.delete<{
    Params: { id: string };
    Reply: { success: boolean } | { error: string };
  }>('/:id', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      await discoveryService.deleteDiscovery(id, orgId);

      return reply.status(200).send({ success: true });
    } catch (error: any) {
      fastify.log.error({ error, route: 'DELETE /journalist-discovery/:id' }, 'Failed to delete discovery');
      return reply.status(500).send({ error: 'Failed to delete discovery', message: error.message });
    }
  });

  // POST /api/v1/journalist-discovery/:id/resolve
  fastify.post<{
    Params: { id: string };
    Body: ResolveDiscoveryInput;
    Reply: DiscoveredJournalist | { error: string };
  }>('/:id/resolve', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Params: { id: string }; Body: ResolveDiscoveryInput }>, reply: FastifyReply) => {
    try {
      const validationResult = resolveDiscoveryInputSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
      }

      const { id } = request.params;
      const input = validationResult.data;
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      const discovery = await discoveryService.resolveDiscovery(id, orgId, user.id, input);

      return reply.status(200).send(discovery);
    } catch (error: any) {
      fastify.log.error({ error, route: 'POST /journalist-discovery/:id/resolve' }, 'Failed to resolve discovery');
      return reply.status(500).send({ error: 'Failed to resolve discovery', message: error.message });
    }
  });

  // POST /api/v1/journalist-discovery/:id/merge-preview
  fastify.post<{
    Params: { id: string };
    Body: { targetJournalistId: string };
    Reply: MergePreview | { error: string };
  }>('/:id/merge-preview', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Params: { id: string }; Body: { targetJournalistId: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { targetJournalistId } = request.body;

      if (!targetJournalistId) {
        return reply.status(400).send({ error: 'targetJournalistId is required' });
      }

      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      const preview = await discoveryService.generateMergePreview(id, targetJournalistId, orgId);

      return reply.status(200).send(preview);
    } catch (error: any) {
      fastify.log.error({ error, route: 'POST /journalist-discovery/:id/merge-preview' }, 'Failed to generate merge preview');
      return reply.status(500).send({ error: 'Failed to generate merge preview', message: error.message });
    }
  });

  // POST /api/v1/journalist-discovery/:id/check-duplication
  fastify.post<{
    Body: DiscoveredJournalistInput;
    Reply: DeduplicationResult | { error: string };
  }>('/check-duplication', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Body: DiscoveredJournalistInput }>, reply: FastifyReply) => {
    try {
      const validationResult = discoveredJournalistInputSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
      }

      const input = validationResult.data;
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      const result = await discoveryService.checkDuplication(orgId, input as DiscoveredJournalistInputType);

      return reply.status(200).send(result);
    } catch (error: any) {
      fastify.log.error({ error, route: 'POST /journalist-discovery/check-duplication' }, 'Failed to check duplication');
      return reply.status(500).send({ error: 'Failed to check duplication', message: error.message });
    }
  });

  // POST /api/v1/journalist-discovery/batch
  fastify.post<{
    Body: BatchDiscoveryInput;
    Reply: BatchDiscoveryResult | { error: string };
  }>('/batch', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Body: BatchDiscoveryInput }>, reply: FastifyReply) => {
    try {
      const validationResult = batchDiscoveryInputSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
      }

      const input = validationResult.data;
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);

      // Create discoveries in batch
      const result: BatchDiscoveryResult = {
        created: 0,
        merged: 0,
        skipped: 0,
        errors: [],
      };

      for (let i = 0; i < input.discoveries.length; i++) {
        try {
          // Check duplication
          const dedup = await discoveryService.checkDuplication(orgId, input.discoveries[i] as DiscoveredJournalistInputType);

          if (dedup.isDuplicate && input.skipDuplicates) {
            result.skipped++;
            continue;
          }

          if (dedup.isDuplicate && dedup.similarityScore >= (input.autoMergeThreshold || 0.95) && dedup.matchedJournalistId) {
            // Auto-merge
            await discoveryService.createDiscovery(orgId, input.discoveries[i] as DiscoveredJournalistInputType);
            result.merged++;
          } else {
            // Create new discovery
            await discoveryService.createDiscovery(orgId, input.discoveries[i] as DiscoveredJournalistInputType);
            result.created++;
          }
        } catch (error: any) {
          result.errors.push({
            index: i,
            error: error.message,
            input: input.discoveries[i] as DiscoveredJournalistInputType,
          });
        }
      }

      return reply.status(200).send(result);
    } catch (error: any) {
      fastify.log.error({ error, route: 'POST /journalist-discovery/batch' }, 'Failed to process batch');
      return reply.status(500).send({ error: 'Failed to process batch', message: error.message });
    }
  });

  // POST /api/v1/journalist-discovery/social-profile
  fastify.post<{
    Body: SocialProfileInput;
    Reply: DiscoveredJournalist | { error: string };
  }>('/social-profile', { onRequest: [requireUser] }, async (request: FastifyRequest<{ Body: SocialProfileInput }>, reply: FastifyReply) => {
    try {
      const validationResult = socialProfileInputSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
      }

      const input = validationResult.data;
      const user = (request as any).user;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({ error: 'User organization not found' });
      }

      const discoveryService = createJournalistDiscoveryService(supabase);
      const discovery = await discoveryService.ingestSocialProfile(orgId, input);

      return reply.status(201).send(discovery);
    } catch (error: any) {
      fastify.log.error({ error, route: 'POST /journalist-discovery/social-profile' }, 'Failed to ingest social profile');
      return reply.status(500).send({ error: 'Failed to ingest social profile', message: error.message });
    }
  });
}
