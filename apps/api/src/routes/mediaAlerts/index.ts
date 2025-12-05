/**
 * Media Alerts Routes (Sprint S43)
 * API endpoints for media monitoring alerts, smart signals, and rule management
 */

import { FLAGS } from '@pravado/feature-flags';
import type {
  CreateMediaAlertRuleInput,
  UpdateMediaAlertRuleInput,
  MarkAlertEventsReadInput,
} from '@pravado/types';
import {
  createMediaAlertRuleSchema,
  updateMediaAlertRuleSchema,
  listMediaAlertRulesQuerySchema,
  listMediaAlertEventsQuerySchema,
  markAlertEventsReadSchema,
} from '@pravado/validators';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { createMediaAlertService } from '../../services/mediaAlertService';

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
 * Register media alerts routes
 */
export async function mediaAlertsRoutes(server: FastifyInstance): Promise<void> {
  // Check feature flag
  if (!FLAGS.ENABLE_MEDIA_ALERTS) {
    server.log.info('Media alerts routes disabled by feature flag');
    return;
  }

  const supabase = (server as unknown as { supabase: SupabaseClient }).supabase;

  const alertService = createMediaAlertService({
    supabase,
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // ============================================================================
  // ALERT RULE ENDPOINTS
  // ============================================================================

  // POST /api/v1/media-alerts/rules - Create a new alert rule
  server.post<{
    Body: CreateMediaAlertRuleInput;
  }>('/api/v1/media-alerts/rules', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = createMediaAlertRuleSchema.safeParse(request.body);
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

      const rule = await alertService.createRule(orgId, validation.data);

      return reply.status(201).send({
        success: true,
        data: { rule },
      });
    } catch (error) {
      console.error('Failed to create alert rule:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create alert rule',
        },
      });
    }
  });

  // GET /api/v1/media-alerts/rules - List alert rules
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>('/api/v1/media-alerts/rules', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = listMediaAlertRulesQuerySchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid query parameters',
          },
        });
      }

      const result = await alertService.listRules(orgId, validation.data);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to list alert rules:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list alert rules',
        },
      });
    }
  });

  // GET /api/v1/media-alerts/rules/:id - Get a single alert rule
  server.get<{
    Params: { id: string };
  }>('/api/v1/media-alerts/rules/:id', { preHandler: requireUser }, async (request, reply) => {
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

      const rule = await alertService.getRule(request.params.id, orgId);

      return reply.send({
        success: true,
        data: { rule },
      });
    } catch (error) {
      console.error('Failed to get alert rule:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get alert rule',
        },
      });
    }
  });

  // PATCH /api/v1/media-alerts/rules/:id - Update an alert rule
  server.patch<{
    Params: { id: string };
    Body: UpdateMediaAlertRuleInput;
  }>('/api/v1/media-alerts/rules/:id', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = updateMediaAlertRuleSchema.safeParse(request.body);
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

      const rule = await alertService.updateRule(request.params.id, orgId, validation.data);

      return reply.send({
        success: true,
        data: { rule },
      });
    } catch (error) {
      console.error('Failed to update alert rule:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update alert rule',
        },
      });
    }
  });

  // DELETE /api/v1/media-alerts/rules/:id - Delete an alert rule
  server.delete<{
    Params: { id: string };
  }>('/api/v1/media-alerts/rules/:id', { preHandler: requireUser }, async (request, reply) => {
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

      await alertService.deleteRule(request.params.id, orgId);

      return reply.send({
        success: true,
        data: { message: 'Alert rule deleted successfully' },
      });
    } catch (error) {
      console.error('Failed to delete alert rule:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete alert rule',
        },
      });
    }
  });

  // ============================================================================
  // ALERT EVENT ENDPOINTS
  // ============================================================================

  // GET /api/v1/media-alerts/events - List alert events
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>('/api/v1/media-alerts/events', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = listMediaAlertEventsQuerySchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid query parameters',
          },
        });
      }

      const result = await alertService.listEvents(orgId, validation.data);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to list alert events:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list alert events',
        },
      });
    }
  });

  // GET /api/v1/media-alerts/events/:id - Get a single alert event
  server.get<{
    Params: { id: string };
  }>('/api/v1/media-alerts/events/:id', { preHandler: requireUser }, async (request, reply) => {
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

      const event = await alertService.getEvent(request.params.id, orgId);

      return reply.send({
        success: true,
        data: { event },
      });
    } catch (error) {
      console.error('Failed to get alert event:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get alert event',
        },
      });
    }
  });

  // POST /api/v1/media-alerts/events/mark-read - Mark events as read/unread
  server.post<{
    Body: MarkAlertEventsReadInput;
  }>('/api/v1/media-alerts/events/mark-read', { preHandler: requireUser }, async (request, reply) => {
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

      const validation = markAlertEventsReadSchema.safeParse(request.body);
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

      const updatedCount = await alertService.markEventsAsRead(orgId, validation.data);

      return reply.send({
        success: true,
        data: { updatedCount },
      });
    } catch (error) {
      console.error('Failed to mark events as read:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to mark events as read',
        },
      });
    }
  });

  // ============================================================================
  // SIGNALS & EVALUATION ENDPOINTS
  // ============================================================================

  // GET /api/v1/media-alerts/signals - Get signals overview
  server.get('/api/v1/media-alerts/signals', { preHandler: requireUser }, async (request, reply) => {
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

      const overview = await alertService.getSignalsOverview(orgId);

      return reply.send({
        success: true,
        data: overview,
      });
    } catch (error) {
      console.error('Failed to get signals overview:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get signals overview',
        },
      });
    }
  });

  // POST /api/v1/media-alerts/evaluate - Manually trigger rule evaluation (admin/testing)
  server.post('/api/v1/media-alerts/evaluate', { preHandler: requireUser }, async (request, reply) => {
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

      const events = await alertService.evaluateRulesForWindow(orgId);

      return reply.send({
        success: true,
        data: {
          eventsCreated: events.length,
          events,
        },
      });
    } catch (error) {
      console.error('Failed to evaluate rules:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to evaluate rules',
        },
      });
    }
  });
}
