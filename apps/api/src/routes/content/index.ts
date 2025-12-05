/**
 * Content Intelligence API routes (Sprint S12)
 * Full implementation of Content Intelligence Engine V1
 */

import type {
  ListContentItemsResponse,
  GetContentItemResponse,
  CreateContentItemResponse,
  UpdateContentItemResponse,
  ListContentBriefsResponse,
  GetContentBriefWithContextResponse,
  CreateContentBriefResponse,
  UpdateContentBriefResponse,
  ListContentClustersResponse,
  ListContentGapsResponse,
  ContentItem,
  ContentBrief,
} from '@pravado/types';
import {
  listContentItemsSchema,
  createContentItemSchema,
  updateContentItemSchema,
  listContentBriefsSchema,
  createContentBriefSchema,
  updateContentBriefSchema,
  listContentGapsSchema,
  validateEnv,
  apiEnvSchema,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { ContentService } from '../../services/contentService';

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

export async function contentRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const contentService = new ContentService(supabase);

  // ========================================
  // CONTENT ITEMS ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/content/items
   * List content items with filtering and pagination
   */
  server.get<{
    Querystring: {
      status?: string;
      q?: string;
      topicId?: string;
      page?: string;
      pageSize?: string;
      contentType?: string;
    };
    Reply: ListContentItemsResponse;
  }>(
    '/items',
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
      const validation = listContentItemsSchema.safeParse({
        status: request.query.status,
        q: request.query.q,
        topicId: request.query.topicId,
        page: request.query.page ? parseInt(request.query.page, 10) : undefined,
        pageSize: request.query.pageSize ? parseInt(request.query.pageSize, 10) : undefined,
        contentType: request.query.contentType,
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
      const result = await contentService.listContentItems(orgId, filters);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/v1/content/items/:id
   * Get a single content item by ID
   */
  server.get<{
    Params: { id: string };
    Reply: GetContentItemResponse;
  }>(
    '/items/:id',
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
      const item = await contentService.getContentItemById(orgId, id);

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content item not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { item },
      });
    }
  );

  /**
   * POST /api/v1/content/items
   * Create a new content item
   */
  server.post<{
    Body: Partial<ContentItem>;
    Reply: CreateContentItemResponse;
  }>(
    '/items',
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
      const validation = createContentItemSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content item data',
          },
        });
      }

      const data = validation.data;
      const item = await contentService.createContentItem(orgId, data);

      return reply.code(201).send({
        success: true,
        data: { item },
      });
    }
  );

  /**
   * PUT /api/v1/content/items/:id
   * Update an existing content item
   */
  server.put<{
    Params: { id: string };
    Body: Partial<ContentItem>;
    Reply: UpdateContentItemResponse;
  }>(
    '/items/:id',
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

      // Validate request body
      const validation = updateContentItemSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content item update data',
          },
        });
      }

      const updates = validation.data;
      const item = await contentService.updateContentItem(orgId, id, updates);

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content item not found',
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
  // CONTENT BRIEFS ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/content/briefs
   * List content briefs with filtering
   */
  server.get<{
    Querystring: {
      status?: string;
      limit?: string;
      offset?: string;
    };
    Reply: ListContentBriefsResponse;
  }>(
    '/briefs',
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
      const validation = listContentBriefsSchema.safeParse({
        status: request.query.status,
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

      const filters = validation.data;
      const items = await contentService.listContentBriefs(orgId, filters);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );

  /**
   * GET /api/v1/content/briefs/:id
   * Get a content brief with context (related topics and suggested keywords)
   */
  server.get<{
    Params: { id: string };
    Reply: GetContentBriefWithContextResponse;
  }>(
    '/briefs/:id',
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
      const briefWithContext = await contentService.getContentBriefWithContext(orgId, id);

      if (!briefWithContext) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content brief not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: briefWithContext,
      });
    }
  );

  /**
   * POST /api/v1/content/briefs
   * Create a new content brief
   */
  server.post<{
    Body: Partial<ContentBrief>;
    Reply: CreateContentBriefResponse;
  }>(
    '/briefs',
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
      const validation = createContentBriefSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content brief data',
          },
        });
      }

      const data = validation.data;
      const item = await contentService.createContentBrief(orgId, data);

      return reply.code(201).send({
        success: true,
        data: { item },
      });
    }
  );

  /**
   * PUT /api/v1/content/briefs/:id
   * Update an existing content brief
   */
  server.put<{
    Params: { id: string };
    Body: Partial<ContentBrief>;
    Reply: UpdateContentBriefResponse;
  }>(
    '/briefs/:id',
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

      // Validate request body
      const validation = updateContentBriefSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content brief update data',
          },
        });
      }

      const updates = validation.data;
      const item = await contentService.updateContentBrief(orgId, id, updates);

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content brief not found',
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
  // CONTENT CLUSTERS ENDPOINT
  // ========================================

  /**
   * GET /api/v1/content/clusters
   * Get content topic clusters with topics and representative content
   */
  server.get<{
    Reply: ListContentClustersResponse;
  }>(
    '/clusters',
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

      const items = await contentService.listContentClusters(orgId);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );

  // ========================================
  // CONTENT GAPS ENDPOINT
  // ========================================

  /**
   * GET /api/v1/content/gaps
   * Get content gap opportunities based on SEO keywords vs existing content
   */
  server.get<{
    Querystring: {
      keyword?: string;
      minScore?: string;
      topicId?: string;
      limit?: string;
    };
    Reply: ListContentGapsResponse;
  }>(
    '/gaps',
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
      const validation = listContentGapsSchema.safeParse({
        keyword: request.query.keyword,
        minScore: request.query.minScore ? parseFloat(request.query.minScore) : undefined,
        topicId: request.query.topicId,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
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
      const items = await contentService.listContentGaps(orgId, filters);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );
}
