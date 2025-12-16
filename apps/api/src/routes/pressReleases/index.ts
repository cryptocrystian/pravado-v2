/**
 * Press Release Routes (Sprint S38)
 * API endpoints for AI-generated press release functionality
 */

import { FLAGS } from '@pravado/feature-flags';
import type { PRGenerationInput, PRListFilters, PRReleaseStatus } from '@pravado/types';
import { apiEnvSchema, validateEnv } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { PressReleaseService, prGenerationEmitter } from '../../services/pressReleaseService';

/**
 * Register press release routes
 */
export async function pressReleaseRoutes(server: FastifyInstance): Promise<void> {
  // Check feature flag
  if (!FLAGS.ENABLE_PR_GENERATOR) {
    server.log.info('Press release routes disabled by feature flag');
    return;
  }

  // Create Supabase client (S100.3 fix)
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const prService = new PressReleaseService(supabase);

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

  // ============================================================================
  // POST /api/v1/pr/releases/generate - Generate a new press release
  // ============================================================================
  server.post<{
    Body: PRGenerationInput;
  }>('/api/v1/pr/releases/generate', { preHandler: requireUser }, async (request, reply) => {
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

      const input = request.body;

      // Validate required fields
      if (!input.newsType || !input.announcement || !input.companyName) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: newsType, announcement, companyName',
          },
        });
      }

      // Generate the press release
      const release = await prService.generateRelease(orgId, userId, input);

      return reply.status(201).send({
        success: true,
        data: {
          id: release.id,
          status: release.status,
          generationRunId: release.generationRunId,
        },
      });
    } catch (error) {
      console.error('Failed to generate press release:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate press release',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/pr/releases - List press releases
  // ============================================================================
  server.get<{
    Querystring: {
      status?: PRReleaseStatus;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };
  }>('/api/v1/pr/releases', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
      }

      const filters: PRListFilters = {
        status: request.query.status,
        startDate: request.query.startDate,
        endDate: request.query.endDate,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : 20,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : 0,
      };

      const { releases, total } = await prService.listReleases(orgId, filters);

      return reply.send({
        success: true,
        data: {
          releases,
          total,
          hasMore: (filters.offset || 0) + releases.length < total,
        },
      });
    } catch (error) {
      console.error('Failed to list press releases:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list press releases',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/pr/releases/:id - Get a press release by ID
  // ============================================================================
  server.get<{
    Params: { id: string };
  }>('/api/v1/pr/releases/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
      }

      const release = await prService.getRelease(id, orgId);

      if (!release) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Press release not found',
          },
        });
      }

      // Fetch related data
      const [headlineVariants, angleOptions] = await Promise.all([
        prService.getHeadlineVariants(id),
        prService.getAngleOptions(id),
      ]);

      return reply.send({
        success: true,
        data: {
          release,
          headlineVariants,
          angleOptions,
        },
      });
    } catch (error) {
      console.error('Failed to get press release:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get press release',
        },
      });
    }
  });

  // ============================================================================
  // POST /api/v1/pr/releases/:id/optimize - Re-run optimization layer
  // ============================================================================
  server.post<{
    Params: { id: string };
  }>('/api/v1/pr/releases/:id/optimize', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
      }

      const result = await prService.optimizeRelease(id, orgId);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to optimize press release:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to optimize press release',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/pr/releases/:id/embeddings/similar - Find similar press releases
  // ============================================================================
  server.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>('/api/v1/pr/releases/:id/embeddings/similar', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
      }

      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 5;
      const similar = await prService.findSimilarReleases(id, orgId, limit);

      return reply.send({
        success: true,
        data: {
          similar,
          total: similar.length,
        },
      });
    } catch (error) {
      console.error('Failed to find similar press releases:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to find similar releases',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/pr/releases/:id/stream - SSE stream for generation progress
  // ============================================================================
  server.get<{
    Params: { id: string };
  }>('/api/v1/pr/releases/:id/stream', { preHandler: requireUser }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.user!.id;
    const orgId = await getUserOrgId(userId);

    if (!orgId) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
    }

    // Verify release exists and belongs to org
    const release = await prService.getRelease(id, orgId);
    if (!release) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Press release not found',
        },
      });
    }

    // Set up SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection event
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', releaseId: id })}\n\n`);

    // Listen for generation events
    const eventHandler = (event: unknown) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        console.error('Failed to send SSE event:', err);
      }
    };

    const eventKey = `pr:${id}`;
    prGenerationEmitter.on(eventKey, eventHandler);

    // Clean up on disconnect
    request.raw.on('close', () => {
      prGenerationEmitter.off(eventKey, eventHandler);
    });

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
    });

    // If release is already complete, send result and close
    if (release.status === 'complete' || release.status === 'failed') {
      reply.raw.write(
        `data: ${JSON.stringify({
          type: release.status === 'complete' ? 'completed' : 'failed',
          releaseId: id,
          status: release.status,
          error: release.errorMessage,
        })}\n\n`
      );
    }
  });

  server.log.info('Press release routes registered');
}
