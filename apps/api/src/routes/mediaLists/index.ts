/**
 * AI Media List Builder Routes (Sprint S47)
 * Routes for generating and managing intelligent media lists
 */

import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FLAGS } from '@pravado/feature-flags';
import { createMediaListService } from '../../services/mediaListService';
import { requireUser } from '../../middleware/requireUser';
import {
  apiEnvSchema,
  mediaListGenerationInputSchema,
  mediaListCreateInputSchema,
  mediaListUpdateInputSchema,
  mediaListQuerySchema,
  mediaListEntryQuerySchema,
  validateEnv,
  type MediaListGenerationInput,
  type MediaListCreateInput,
  type MediaListUpdateInput,
  type MediaListQuery,
  type MediaListEntryQuery,
} from '@pravado/validators';
import {
  type MediaListGenerationResult,
  type MediaList,
  type MediaListWithEntries,
  type MediaListSummary,
  type MediaListEntryWithJournalist,
} from '@pravado/types';

export async function mediaListRoutes(fastify: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_MEDIA_LISTS) {
    fastify.log.info('Media lists routes disabled by feature flag');
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

  // POST /api/v1/media-lists/generate
  fastify.post<{
    Body: MediaListGenerationInput;
    Reply: MediaListGenerationResult | { error: string };
  }>(
    '/generate',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: MediaListGenerationInput }>, reply: FastifyReply) => {
      try {
        const validationResult = mediaListGenerationInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const mediaListService = createMediaListService(supabase);
        const result = await mediaListService.generateMediaList(orgId, input);

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /media-lists/generate' }, 'Failed to generate media list');
        return reply.status(500).send({ error: 'Failed to generate media list', message: error.message });
      }
    }
  );

  // POST /api/v1/media-lists
  fastify.post<{
    Body: MediaListCreateInput & { entries: Array<{ journalistId: string; fitScore: number; tier: 'A' | 'B' | 'C' | 'D'; reason: string; fitBreakdown: any; position?: number }> };
    Reply: MediaListWithEntries | { error: string };
  }>(
    '/',
    { onRequest: [requireUser] },
    async (request, reply: FastifyReply) => {
      try {
        const { entries, ...listData } = request.body;
        const validationResult = mediaListCreateInputSchema.safeParse(listData);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const mediaListService = createMediaListService(supabase);
        const savedList = await mediaListService.saveMediaList(orgId, user.id, input, entries as any);

        return reply.status(201).send(savedList);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /media-lists' }, 'Failed to create media list');
        return reply.status(500).send({ error: 'Failed to create media list', message: error.message });
      }
    }
  );

  // GET /api/v1/media-lists
  fastify.get<{
    Querystring: MediaListQuery;
    Reply: { lists: MediaListSummary[]; pagination: { total: number; limit: number; offset: number } } | { error: string };
  }>(
    '/',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Querystring: MediaListQuery }>, reply: FastifyReply) => {
      try {
        const validationResult = mediaListQuerySchema.safeParse(request.query);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid query parameters', details: validationResult.error.errors });
        }

        const query = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const mediaListService = createMediaListService(supabase);
        const result = await mediaListService.listMediaLists(orgId, query);

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /media-lists' }, 'Failed to list media lists');
        return reply.status(500).send({ error: 'Failed to list media lists', message: error.message });
      }
    }
  );

  // GET /api/v1/media-lists/:id
  fastify.get<{
    Params: { id: string };
    Reply: MediaListWithEntries | { error: string };
  }>(
    '/:id',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const mediaListService = createMediaListService(supabase);
        const list = await mediaListService.getMediaList(id, orgId);

        if (!list) {
          return reply.status(404).send({ error: 'Media list not found' });
        }

        return reply.status(200).send(list);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /media-lists/:id' }, 'Failed to get media list');
        return reply.status(500).send({ error: 'Failed to get media list', message: error.message });
      }
    }
  );

  // PUT /api/v1/media-lists/:id
  fastify.put<{
    Params: { id: string };
    Body: MediaListUpdateInput;
    Reply: MediaList | { error: string };
  }>(
    '/:id',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: MediaListUpdateInput }>, reply: FastifyReply) => {
      try {
        const validationResult = mediaListUpdateInputSchema.safeParse(request.body);
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

        const mediaListService = createMediaListService(supabase);
        const updatedList = await mediaListService.updateMediaList(id, orgId, input);

        if (!updatedList) {
          return reply.status(404).send({ error: 'Media list not found' });
        }

        return reply.status(200).send(updatedList);
      } catch (error: any) {
        fastify.log.error({ error, route: 'PUT /media-lists/:id' }, 'Failed to update media list');
        return reply.status(500).send({ error: 'Failed to update media list', message: error.message });
      }
    }
  );

  // DELETE /api/v1/media-lists/:id
  fastify.delete<{
    Params: { id: string };
    Reply: { success: boolean } | { error: string };
  }>(
    '/:id',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const mediaListService = createMediaListService(supabase);
        await mediaListService.deleteMediaList(id, orgId);

        return reply.status(200).send({ success: true });
      } catch (error: any) {
        fastify.log.error({ error, route: 'DELETE /media-lists/:id' }, 'Failed to delete media list');
        return reply.status(500).send({ error: 'Failed to delete media list', message: error.message });
      }
    }
  );

  // GET /api/v1/media-lists/:id/entries
  fastify.get<{
    Params: { id: string };
    Querystring: Omit<MediaListEntryQuery, 'listId'>;
    Reply: { entries: MediaListEntryWithJournalist[]; pagination: { total: number; limit: number; offset: number } } | { error: string };
  }>(
    '/:id/entries',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { id: string }; Querystring: Omit<MediaListEntryQuery, 'listId'> }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const queryParams = { ...request.query, listId: id };

        const validationResult = mediaListEntryQuerySchema.safeParse(queryParams);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid query parameters', details: validationResult.error.errors });
        }

        const query = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        // Verify list belongs to org
        const { data: list, error: listError } = await supabase
          .from('media_lists')
          .select('id')
          .eq('id', id)
          .eq('org_id', orgId)
          .single();

        if (listError || !list) {
          return reply.status(404).send({ error: 'Media list not found' });
        }

        const mediaListService = createMediaListService(supabase);
        const result = await mediaListService.getMediaListEntries(query);

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /media-lists/:id/entries' }, 'Failed to get media list entries');
        return reply.status(500).send({ error: 'Failed to get media list entries', message: error.message });
      }
    }
  );
}
