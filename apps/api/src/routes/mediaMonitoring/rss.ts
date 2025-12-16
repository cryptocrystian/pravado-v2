/**
 * RSS & Media Crawling Routes (Sprint S41)
 * API endpoints for RSS feeds, crawl jobs, and automated ingestion
 */

import { FLAGS } from '@pravado/feature-flags';
import type {
  CreateCrawlJobInput,
  CreateRSSFeedInput,
  UpdateRSSFeedInput,
} from '@pravado/types';
import {
  apiEnvSchema,
  createCrawlJobSchema,
  createRSSFeedSchema,
  listCrawlJobsSchema,
  listRSSFeedsSchema,
  triggerRSSFetchSchema,
  updateRSSFeedSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { createMediaMonitoringService } from '../../services/mediaMonitoringService';
import { createMediaCrawlerService } from '../../services/mediaCrawlerService';

/**
 * Register RSS and crawler routes
 */
export async function rssRoutes(server: FastifyInstance): Promise<void> {
  // Check feature flag
  if (!FLAGS.ENABLE_MEDIA_CRAWLING) {
    server.log.info('Media crawling routes disabled by feature flag');
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

  // Initialize monitoring service (required for crawler)
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const monitoringService = createMediaMonitoringService({
    supabase,
    openaiApiKey,
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // Initialize crawler service
  const crawlerService = createMediaCrawlerService({
    supabase,
    monitoringService,
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // ============================================================================
  // RSS FEED ENDPOINTS
  // ============================================================================

  // POST /api/v1/media-monitoring/rss-feeds - Add RSS feed
  server.post<{
    Body: CreateRSSFeedInput;
  }>('/api/v1/media-monitoring/rss-feeds', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = createRSSFeedSchema.safeParse(request.body);
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

      const feed = await crawlerService.addRSSFeed(orgId, validation.data);

      return reply.status(201).send({
        success: true,
        data: { feed },
      });
    } catch (error) {
      console.error('Failed to add RSS feed:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to add RSS feed',
        },
      });
    }
  });

  // GET /api/v1/media-monitoring/rss-feeds - List RSS feeds
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>('/api/v1/media-monitoring/rss-feeds', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = listRSSFeedsSchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid query parameters',
          },
        });
      }

      const result = await crawlerService.listRSSFeeds(orgId, validation.data);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to list RSS feeds:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list RSS feeds',
        },
      });
    }
  });

  // GET /api/v1/media-monitoring/rss-feeds/:id - Get RSS feed
  server.get<{
    Params: { id: string };
  }>(
    '/api/v1/media-monitoring/rss-feeds/:id',
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

        const feed = await crawlerService.getRSSFeed(orgId, request.params.id);

        if (!feed) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'FEED_NOT_FOUND',
              message: 'RSS feed not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { feed },
        });
      } catch (error) {
        console.error('Failed to get RSS feed:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get RSS feed',
          },
        });
      }
    }
  );

  // PUT /api/v1/media-monitoring/rss-feeds/:id - Update RSS feed
  server.put<{
    Params: { id: string };
    Body: UpdateRSSFeedInput;
  }>(
    '/api/v1/media-monitoring/rss-feeds/:id',
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

        const validation = updateRSSFeedSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid input',
            },
          });
        }

        const feed = await crawlerService.updateRSSFeed(orgId, request.params.id, validation.data);

        return reply.send({
          success: true,
          data: { feed },
        });
      } catch (error) {
        console.error('Failed to update RSS feed:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to update RSS feed',
          },
        });
      }
    }
  );

  // DELETE /api/v1/media-monitoring/rss-feeds/:id - Deactivate RSS feed
  server.delete<{
    Params: { id: string };
  }>(
    '/api/v1/media-monitoring/rss-feeds/:id',
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

        await crawlerService.deactivateRSSFeed(orgId, request.params.id);

        return reply.send({
          success: true,
          data: { message: 'RSS feed deactivated' },
        });
      } catch (error) {
        console.error('Failed to deactivate RSS feed:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to deactivate RSS feed',
          },
        });
      }
    }
  );

  // ============================================================================
  // RSS FETCH ENDPOINTS
  // ============================================================================

  // POST /api/v1/media-monitoring/rss/fetch - Manually trigger RSS fetch
  server.post<{
    Body: { feedIds?: string[] };
  }>('/api/v1/media-monitoring/rss/fetch', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = triggerRSSFetchSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid input',
          },
        });
      }

      const results = await crawlerService.fetchAllActiveFeeds(orgId, validation.data.feedIds);

      return reply.send({
        success: true,
        data: {
          results,
          totalFeeds: results.length,
          totalJobsCreated: results.reduce((sum, r) => sum + r.jobsCreated, 0),
        },
      });
    } catch (error) {
      console.error('Failed to fetch RSS feeds:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch RSS feeds',
        },
      });
    }
  });

  // ============================================================================
  // CRAWL JOB ENDPOINTS
  // ============================================================================

  // POST /api/v1/media-monitoring/crawl-jobs - Create crawl job
  server.post<{
    Body: CreateCrawlJobInput;
  }>(
    '/api/v1/media-monitoring/crawl-jobs',
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

        const validation = createCrawlJobSchema.safeParse(request.body);
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

        const job = await crawlerService.createCrawlJob(orgId, validation.data);

        return reply.status(201).send({
          success: true,
          data: { job },
        });
      } catch (error) {
        console.error('Failed to create crawl job:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to create crawl job',
          },
        });
      }
    }
  );

  // GET /api/v1/media-monitoring/crawl-jobs - List crawl jobs
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>(
    '/api/v1/media-monitoring/crawl-jobs',
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

        const validation = listCrawlJobsSchema.safeParse(request.query);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid query parameters',
            },
          });
        }

        const result = await crawlerService.listCrawlJobs(orgId, validation.data);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error('Failed to list crawl jobs:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to list crawl jobs',
          },
        });
      }
    }
  );

  // POST /api/v1/media-monitoring/crawl-jobs/run - Manually run pending jobs
  server.post(
    '/api/v1/media-monitoring/crawl-jobs/run',
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

        const results = await crawlerService.processPendingJobs(orgId, 10);

        return reply.send({
          success: true,
          data: {
            results,
            totalProcessed: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
        });
      } catch (error) {
        console.error('Failed to run crawl jobs:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to run crawl jobs',
          },
        });
      }
    }
  );

  // ============================================================================
  // STATS ENDPOINT
  // ============================================================================

  // GET /api/v1/media-monitoring/rss/stats - Get RSS and crawler statistics
  server.get('/api/v1/media-monitoring/rss/stats', { preHandler: requireUser }, async (request, reply) => {
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

      const stats = await crawlerService.getStats(orgId);

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
