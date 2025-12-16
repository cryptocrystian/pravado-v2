/**
 * Media Monitoring Routes (Sprint S40)
 * API endpoints for media monitoring, article ingestion, and earned mention detection
 */

import { FLAGS } from '@pravado/feature-flags';
import type { CreateSourceInput, UpdateSourceInput } from '@pravado/types';
import { LlmRouter } from '@pravado/utils';
import {
  apiEnvSchema,
  createSourceSchema,
  detectMentionsInputSchema,
  ingestArticleSchema,
  listArticlesSchema,
  listMentionsSchema,
  listSourcesSchema,
  updateSourceSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { createMediaAlertService } from '../../services/mediaAlertService'; // S43
import { createMediaMonitoringService } from '../../services/mediaMonitoringService';

/**
 * Register media monitoring routes
 */
export async function mediaMonitoringRoutes(server: FastifyInstance): Promise<void> {
  // Check feature flag
  if (!FLAGS.ENABLE_MEDIA_MONITORING) {
    server.log.info('Media monitoring routes disabled by feature flag');
    return;
  }

  // Create Supabase client (S100.2 fix)
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  /**
   * Helper to get user's org ID
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('user_orgs')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1);

    return userOrgs?.[0]?.org_id || null;
  }

  // Initialize LLM Router if API key available
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const llmRouter = openaiApiKey
    ? new LlmRouter({
        provider: 'openai',
        openaiApiKey,
        openaiModel: 'gpt-4o-mini',
        supabase,
      })
    : undefined;

  // S43: Initialize Media Alert Service if feature flag enabled
  const mediaAlertService = FLAGS.ENABLE_MEDIA_ALERTS
    ? createMediaAlertService({
        supabase,
        debugMode: process.env.NODE_ENV !== 'production',
      })
    : undefined;

  const monitoringService = createMediaMonitoringService({
    supabase,
    llmRouter,
    openaiApiKey,
    debugMode: process.env.NODE_ENV !== 'production',
    mediaAlertService, // S43: Wire in alert evaluation
  });

  // ============================================================================
  // SOURCE ENDPOINTS
  // ============================================================================

  // POST /api/v1/media-monitoring/sources - Create a new monitoring source
  server.post<{
    Body: CreateSourceInput;
  }>('/api/v1/media-monitoring/sources', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      const validation = createSourceSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid input',
            details: validation.error.errors,
          },
        });
      }

      const source = await monitoringService.createSource(orgId, validation.data);

      return reply.status(201).send({
        success: true,
        data: { source },
      });
    } catch (error) {
      console.error('Failed to create source:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create source',
        },
      });
    }
  });

  // GET /api/v1/media-monitoring/sources - List monitoring sources
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>('/api/v1/media-monitoring/sources', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      const validation = listSourcesSchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid query parameters',
          },
        });
      }

      const result = await monitoringService.listSources(orgId, validation.data);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to list sources:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list sources',
        },
      });
    }
  });

  // GET /api/v1/media-monitoring/sources/:id - Get a single source
  server.get<{
    Params: { id: string };
  }>(
    '/api/v1/media-monitoring/sources/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const source = await monitoringService.getSource(orgId, request.params.id);

        if (!source) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'SOURCE_NOT_FOUND',
              message: 'Source not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { source },
        });
      } catch (error) {
        console.error('Failed to get source:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get source',
          },
        });
      }
    }
  );

  // PUT /api/v1/media-monitoring/sources/:id - Update a source
  server.put<{
    Params: { id: string };
    Body: UpdateSourceInput;
  }>(
    '/api/v1/media-monitoring/sources/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const validation = updateSourceSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid input',
            },
          });
        }

        const source = await monitoringService.updateSource(
          orgId,
          request.params.id,
          validation.data
        );

        return reply.send({
          success: true,
          data: { source },
        });
      } catch (error) {
        console.error('Failed to update source:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to update source',
          },
        });
      }
    }
  );

  // DELETE /api/v1/media-monitoring/sources/:id - Deactivate a source
  server.delete<{
    Params: { id: string };
  }>(
    '/api/v1/media-monitoring/sources/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        await monitoringService.deactivateSource(orgId, request.params.id);

        return reply.send({
          success: true,
          data: { message: 'Source deactivated' },
        });
      } catch (error) {
        console.error('Failed to deactivate source:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to deactivate source',
          },
        });
      }
    }
  );

  // ============================================================================
  // ARTICLE ENDPOINTS
  // ============================================================================

  // POST /api/v1/media-monitoring/ingest - Ingest an article
  server.post<{
    Body: { url: string; sourceId?: string; title?: string; author?: string; content?: string };
  }>('/api/v1/media-monitoring/ingest', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      const validation = ingestArticleSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid input',
          },
        });
      }

      const result = await monitoringService.ingestArticle(orgId, validation.data.url, {
        sourceId: validation.data.sourceId,
        title: validation.data.title,
        author: validation.data.author,
        content: validation.data.content,
      });

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to ingest article:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to ingest article',
        },
      });
    }
  });

  // GET /api/v1/media-monitoring/articles - List articles
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>('/api/v1/media-monitoring/articles', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      const validation = listArticlesSchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid query parameters',
          },
        });
      }

      const result = await monitoringService.listArticles(orgId, validation.data);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to list articles:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list articles',
        },
      });
    }
  });

  // GET /api/v1/media-monitoring/articles/:id - Get article with mentions
  server.get<{
    Params: { id: string };
  }>(
    '/api/v1/media-monitoring/articles/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const article = await monitoringService.getArticleWithMentions(orgId, request.params.id);

        if (!article) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ARTICLE_NOT_FOUND',
              message: 'Article not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { article },
        });
      } catch (error) {
        console.error('Failed to get article:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get article',
          },
        });
      }
    }
  );

  // ============================================================================
  // MENTION ENDPOINTS
  // ============================================================================

  // POST /api/v1/media-monitoring/detect-mentions - Detect mentions in an article
  server.post<{
    Body: { articleId: string; entities: string[]; detectCompetitors?: boolean };
  }>(
    '/api/v1/media-monitoring/detect-mentions',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const validation = detectMentionsInputSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid input',
            },
          });
        }

        const result = await monitoringService.detectMentions(
          orgId,
          validation.data.articleId,
          validation.data.entities,
          validation.data.detectCompetitors
        );

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error('Failed to detect mentions:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to detect mentions',
          },
        });
      }
    }
  );

  // GET /api/v1/media-monitoring/mentions - List mentions
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>('/api/v1/media-monitoring/mentions', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      const validation = listMentionsSchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid query parameters',
          },
        });
      }

      const result = await monitoringService.listMentions(orgId, validation.data);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to list mentions:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list mentions',
        },
      });
    }
  });

  // ============================================================================
  // STATS ENDPOINT
  // ============================================================================

  // GET /api/v1/media-monitoring/stats - Get monitoring statistics
  server.get('/api/v1/media-monitoring/stats', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      const stats = await monitoringService.getStats(orgId);

      return reply.send({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error('Failed to get stats:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get stats',
        },
      });
    }
  });
}
