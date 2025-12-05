/**
 * Audit Replay Routes (Sprint S37)
 * API endpoints for audit log replay functionality
 */

import { FLAGS } from '@pravado/feature-flags';
import type { AuditReplayFilters } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { AuditReplayService, replayEventEmitter } from '../../services/auditReplayService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: SupabaseClient): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('user_orgs')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1);

  return userOrgs?.[0]?.org_id || null;
}

/**
 * Check if user has admin role
 */
function isUserAdmin(role: string): boolean {
  return role === 'admin' || role === 'owner';
}

/**
 * Register audit replay routes
 */
export async function auditReplayRoutes(server: FastifyInstance): Promise<void> {
  // Check feature flag
  if (!FLAGS.ENABLE_AUDIT_REPLAY) {
    server.log.info('Audit replay routes disabled by feature flag');
    return;
  }

  const supabase = (server as unknown as { supabase: SupabaseClient }).supabase;
  const replayService = new AuditReplayService(supabase);

  // ============================================================================
  // POST /api/v1/audit/replay - Create a new replay job
  // ============================================================================
  server.post<{
    Body: { filters?: AuditReplayFilters };
  }>('/api/v1/audit/replay', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId, supabase);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      // Check RBAC - admin only
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single();

      if (!membership || !isUserAdmin(membership.role)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin role required for replay operations',
          },
        });
      }

      const filters = request.body?.filters || {};

      // Create replay job
      const job = await replayService.createReplayJob(orgId, userId, filters);

      if (!job) {
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create replay job',
          },
        });
      }

      // Start processing the job asynchronously
      setImmediate(() => {
        replayService.processReplayJob(job.id, orgId).catch((err) => {
          console.error('Replay job processing failed:', err);
        });
      });

      return reply.status(201).send({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
        },
      });
    } catch (error) {
      console.error('Failed to create replay job:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create replay job',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/audit/replay/:id - Get replay job status
  // ============================================================================
  server.get<{
    Params: { id: string };
  }>('/api/v1/audit/replay/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId, supabase);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
      }

      const job = await replayService.getReplayJob(orgId, id);

      if (!job) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Replay job not found',
          },
        });
      }

      // Get timeline if job is complete
      let timeline;
      if (job.status === 'success') {
        timeline = await replayService.getTimeline(id);
      }

      return reply.send({
        success: true,
        data: {
          run: job,
          timeline,
        },
      });
    } catch (error) {
      console.error('Failed to get replay job:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get replay job',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/audit/replay/:id/stream - SSE stream for replay progress
  // ============================================================================
  server.get<{
    Params: { id: string };
  }>('/api/v1/audit/replay/:id/stream', { preHandler: requireUser }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.user!.id;
    const orgId = await getUserOrgId(userId, supabase);

    if (!orgId) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
      });
    }

    // Verify job exists and belongs to org
    const job = await replayService.getReplayJob(orgId, id);
    if (!job) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Replay job not found',
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
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', runId: id })}\n\n`);

    // Listen for replay events
    const eventHandler = (event: unknown) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        console.error('Failed to send SSE event:', err);
      }
    };

    const eventKey = `replay:${id}`;
    replayEventEmitter.on(eventKey, eventHandler);

    // Clean up on disconnect
    request.raw.on('close', () => {
      replayEventEmitter.off(eventKey, eventHandler);
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

    // If job is already complete, send result and close
    if (job.status === 'success' || job.status === 'failed') {
      reply.raw.write(
        `data: ${JSON.stringify({
          type: job.status === 'success' ? 'replay.completed' : 'replay.failed',
          data: {
            runId: id,
            result: job.result,
            error: job.errorMessage,
          },
        })}\n\n`
      );
    }
  });

  // ============================================================================
  // GET /api/v1/audit/replay/:id/snapshots/:index - Get a specific snapshot
  // ============================================================================
  server.get<{
    Params: { id: string; index: string };
  }>('/api/v1/audit/replay/:id/snapshots/:index', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { id, index } = request.params;
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId, supabase);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
      }
      const snapshotIndex = parseInt(index, 10);

      if (isNaN(snapshotIndex) || snapshotIndex < 0) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid snapshot index',
          },
        });
      }

      // Verify job exists and belongs to org
      const job = await replayService.getReplayJob(orgId, id);
      if (!job) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Replay job not found',
          },
        });
      }

      const snapshot = await replayService.getSnapshot(id, snapshotIndex);

      if (!snapshot) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Snapshot not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      console.error('Failed to get snapshot:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get snapshot',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/audit/replays - List replay jobs
  // ============================================================================
  server.get<{
    Querystring: { limit?: string; offset?: string };
  }>('/api/v1/audit/replays', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId, supabase);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
      }
      const limit = parseInt(request.query.limit || '20', 10);
      const offset = parseInt(request.query.offset || '0', 10);

      const { runs, total } = await replayService.listReplayJobs(orgId, limit, offset);

      return reply.send({
        success: true,
        data: {
          runs,
          total,
          hasMore: offset + runs.length < total,
        },
      });
    } catch (error) {
      console.error('Failed to list replay jobs:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list replay jobs',
        },
      });
    }
  });

  server.log.info('Audit replay routes registered');
}
