/**
 * PR Intelligence API routes (S6 - Real Implementation)
 */

import type {
  ListPRSourcesResponse,
  ListMediaOutletsResponse,
  ListJournalistsWithContextResponse,
  ListPRListsResponse,
  GetPRListWithMembersResponse,
  CreatePRListResponse,
  UpdatePRListMembersResponse,
} from '@pravado/types';
import {
  listPRSourcesSchema,
  listJournalistsQuerySchema,
  createPRListSchema,
  updatePRListMembersSchema,
 validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { PRMediaService } from '../../services/prMediaService';


export async function prRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Service
  const prMediaService = new PRMediaService(supabase);

  /**
   * Helper to get user's org ID
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('user_orgs')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    return userOrgs?.org_id || null;
  }

  // ========================================
  // GET /api/v1/pr/sources - List PR sources
  // ========================================
  server.get<{
    Querystring: { limit?: string; offset?: string; sourceType?: string };
    Reply: ListPRSourcesResponse;
  }>(
    '/sources',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      // Validate query params
      const validation = listPRSourcesSchema.safeParse({
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
        sourceType: request.query.sourceType,
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

      // S3 Stub: Return empty array
      // Full implementation in future sprints
      return {
        success: true,
        data: {
          items: [],
        },
      };
    }
  );

  // ========================================
  // GET /api/v1/pr/outlets - List media outlets
  // ========================================
  server.get<{
    Reply: ListMediaOutletsResponse;
  }>(
    '/outlets',
    {
      preHandler: requireUser,
    },
    async () => {
      // S3 Stub: Return empty array
      // Full implementation in future sprints
      return {
        success: true,
        data: {
          items: [],
        },
      };
    }
  );

  // ========================================
  // GET /api/v1/pr/journalists - Search journalists with context
  // S6 - Real Implementation
  // ========================================
  server.get<{
    Querystring: {
      q?: string;
      beatId?: string;
      outletId?: string;
      country?: string;
      tier?: string;
      limit?: string;
      offset?: string;
    };
    Reply: ListJournalistsWithContextResponse;
  }>(
    '/journalists',
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

      // Parse and validate query params
      const validation = listJournalistsQuerySchema.safeParse({
        q: request.query.q,
        beatId: request.query.beatId,
        outletId: request.query.outletId,
        country: request.query.country,
        tier: request.query.tier,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
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
        const result = await prMediaService.searchJournalists(orgId, validation.data);

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to search journalists',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/pr/lists - List all PR lists
  // S6 - Real Implementation
  // ========================================
  server.get<{
    Querystring: { limit?: string; offset?: string };
    Reply: ListPRListsResponse;
  }>(
    '/lists',
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

      try {
        const lists = await prMediaService.listPRLists(orgId);

        return {
          success: true,
          data: {
            items: lists,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list PR lists',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/pr/lists/:listId - Get list with members
  // S6 - Real Implementation
  // ========================================
  server.get<{
    Params: { listId: string };
    Reply: GetPRListWithMembersResponse;
  }>(
    '/lists/:listId',
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

      try {
        const listWithMembers = await prMediaService.getPRListWithMembers(
          orgId,
          request.params.listId
        );

        if (!listWithMembers) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'PR list not found',
            },
          });
        }

        return {
          success: true,
          data: {
            item: listWithMembers,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get PR list',
          },
        });
      }
    }
  );

  // ========================================
  // POST /api/v1/pr/lists - Create new list
  // S6 - Real Implementation
  // ========================================
  server.post<{
    Body: { name: string; description?: string };
    Reply: CreatePRListResponse;
  }>(
    '/lists',
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

      // Validate request body
      const validation = createPRListSchema.safeParse(request.body);

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
        const list = await prMediaService.createPRList(
          orgId,
          request.user.id,
          validation.data.name,
          validation.data.description
        );

        return reply.code(201).send({
          success: true,
          data: {
            item: list,
          },
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to create PR list',
          },
        });
      }
    }
  );

  // ========================================
  // POST /api/v1/pr/lists/:listId/members - Add members to list
  // S6 - Real Implementation
  // ========================================
  server.post<{
    Params: { listId: string };
    Body: { journalistIds: string[] };
    Reply: UpdatePRListMembersResponse;
  }>(
    '/lists/:listId/members',
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

      // Validate request body
      const validation = updatePRListMembersSchema.safeParse(request.body);

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
        await prMediaService.addMembersToList(
          orgId,
          request.params.listId,
          validation.data.journalistIds,
          request.user.id
        );

        // Fetch updated list with members
        const listWithMembers = await prMediaService.getPRListWithMembers(
          orgId,
          request.params.listId
        );

        if (!listWithMembers) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'PR list not found',
            },
          });
        }

        return {
          success: true,
          data: {
            item: listWithMembers,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to add members to list',
          },
        });
      }
    }
  );

  // ========================================
  // DELETE /api/v1/pr/lists/:listId/members - Remove members from list
  // S6 - Real Implementation
  // ========================================
  server.delete<{
    Params: { listId: string };
    Body: { journalistIds: string[] };
    Reply: UpdatePRListMembersResponse;
  }>(
    '/lists/:listId/members',
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

      // Validate request body
      const validation = updatePRListMembersSchema.safeParse(request.body);

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
        await prMediaService.removeMembersFromList(
          orgId,
          request.params.listId,
          validation.data.journalistIds
        );

        // Fetch updated list with members
        const listWithMembers = await prMediaService.getPRListWithMembers(
          orgId,
          request.params.listId
        );

        if (!listWithMembers) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'PR list not found',
            },
          });
        }

        return {
          success: true,
          data: {
            item: listWithMembers,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to remove members from list',
          },
        });
      }
    }
  );
}
