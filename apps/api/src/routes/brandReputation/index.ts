/**
 * Brand Reputation Intelligence Routes (Sprint S56)
 *
 * REST API endpoints for brand reputation dashboard, trend analysis,
 * score recalculation, config management, events, and alerts.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { BrandReputationService } from '../../services/brandReputationService';
import {
  getReputationDashboardQuerySchema,
  getReputationTrendQuerySchema,
  getReputationEventsQuerySchema,
  getReputationAlertsQuerySchema,
  recalculateReputationBodySchema,
  updateReputationConfigBodySchema,
  createReputationEventBodySchema,
  acknowledgeAlertBodySchema,
  resolveAlertBodySchema,
  snapshotIdParamSchema,
  eventIdParamSchema,
  alertIdParamSchema,
} from '@pravado/validators';
import { isFeatureEnabled } from '@pravado/feature-flags';
import { z } from 'zod';

// Helper to extract orgId from headers
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Missing x-org-id header');
  }
  return orgId;
}

// Helper to extract userId from request (from auth middleware)
function getUserId(request: FastifyRequest): string {
  const userId = (request as any).user?.id || (request.headers['x-user-id'] as string);
  if (!userId) {
    throw new Error('Missing user ID');
  }
  return userId;
}

export default async function brandReputationRoutes(server: FastifyInstance) {
  // Feature flag check
  if (!isFeatureEnabled('ENABLE_BRAND_REPUTATION')) {
    server.log.warn('Brand reputation feature is disabled');
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = new BrandReputationService(supabase);

  // =========================================================================
  // DASHBOARD ENDPOINTS
  // =========================================================================

  /**
   * GET /dashboard
   * Get comprehensive reputation dashboard with executive radar summary
   */
  server.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const validated = getReputationDashboardQuerySchema.parse({
        window: query.window,
        includeCompetitors: query.includeCompetitors,
        includeTrend: query.includeTrend,
        includeEvents: query.includeEvents,
        maxDrivers: query.maxDrivers,
      });

      const result = await service.getDashboardSnapshot(orgId, validated.window);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error fetching reputation dashboard:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // TREND ENDPOINTS
  // =========================================================================

  /**
   * GET /trend
   * Get reputation trend data over time
   */
  server.get('/trend', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const validated = getReputationTrendQuerySchema.parse({
        window: query.window || '30d',
        granularity: query.granularity,
        includeComponents: query.includeComponents,
      });

      const result = await service.getTrend(orgId, validated.window, validated.granularity);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error fetching reputation trend:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // RECALCULATION ENDPOINTS
  // =========================================================================

  /**
   * POST /recalculate
   * Trigger recalculation of reputation score
   */
  server.post('/recalculate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const body = request.body as Record<string, unknown> | undefined;

      const validated = recalculateReputationBodySchema.parse(body || {});

      const result = await service.recalculate(orgId, validated.window);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error recalculating reputation:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // CONFIGURATION ENDPOINTS
  // =========================================================================

  /**
   * GET /config
   * Get reputation configuration for the organization
   */
  server.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const config = await service.getOrCreateConfig(orgId);

      return reply.send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      server.log.error('Error fetching reputation config:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /config
   * Update reputation configuration
   */
  server.patch('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = updateReputationConfigBodySchema.parse(request.body);

      const config = await service.updateConfig(orgId, validated, userId);

      return reply.send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      server.log.error('Error updating reputation config:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // SNAPSHOT ENDPOINTS
  // =========================================================================

  /**
   * GET /snapshots/:snapshotId
   * Get a specific reputation snapshot by ID
   */
  server.get('/snapshots/:snapshotId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const params = snapshotIdParamSchema.parse(request.params);

      const snapshot = await service.getSnapshotById(orgId, params.snapshotId);

      if (!snapshot) {
        return reply.status(404).send({
          success: false,
          error: 'Snapshot not found',
        });
      }

      return reply.send({
        success: true,
        data: snapshot,
      });
    } catch (error: any) {
      server.log.error('Error fetching snapshot:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // EVENT ENDPOINTS
  // =========================================================================

  /**
   * GET /events
   * List reputation events with filters
   */
  server.get('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const validated = getReputationEventsQuerySchema.parse({
        window: query.window,
        sourceSystem: query.sourceSystem,
        component: query.component,
        severity: query.severity,
        limit: query.limit,
        offset: query.offset,
      });

      const result = await service.getEvents(
        orgId,
        {
          window: validated.window,
          sourceSystem: validated.sourceSystem,
          component: validated.component,
          severity: validated.severity,
        },
        validated.limit,
        validated.offset
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error fetching reputation events:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /events
   * Create a manual reputation event
   */
  server.post('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createReputationEventBodySchema.parse(request.body);

      const event = await service.recordEvent(orgId, {
        sourceSystem: 'manual_adjustment',
        signalType: validated.signalType,
        delta: validated.delta,
        affectedComponent: validated.affectedComponent,
        severity: validated.severity,
        title: validated.title,
        description: validated.description,
        sourceEntityType: validated.sourceEntityType,
        sourceEntityId: validated.sourceEntityId,
        context: {
          ...validated.context,
          createdBy: userId,
          isManual: true,
        },
      });

      return reply.status(201).send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      server.log.error('Error creating reputation event:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /events/:eventId
   * Get a specific reputation event by ID
   */
  server.get('/events/:eventId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const params = eventIdParamSchema.parse(request.params);

      const event = await service.getEventById(orgId, params.eventId);

      if (!event) {
        return reply.status(404).send({
          success: false,
          error: 'Event not found',
        });
      }

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      server.log.error('Error fetching event:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // ALERT ENDPOINTS
  // =========================================================================

  /**
   * GET /alerts
   * List reputation alerts with filters
   */
  server.get('/alerts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const validated = getReputationAlertsQuerySchema.parse({
        severity: query.severity,
        isAcknowledged: query.isAcknowledged,
        isResolved: query.isResolved,
        limit: query.limit,
        offset: query.offset,
      });

      const result = await service.getAlerts(
        orgId,
        {
          severity: validated.severity,
          isAcknowledged: validated.isAcknowledged,
          isResolved: validated.isResolved,
        },
        validated.limit,
        validated.offset
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error fetching reputation alerts:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /alerts/:alertId
   * Get a specific alert by ID
   */
  server.get('/alerts/:alertId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const params = alertIdParamSchema.parse(request.params);

      const alert = await service.getAlertById(orgId, params.alertId);

      if (!alert) {
        return reply.status(404).send({
          success: false,
          error: 'Alert not found',
        });
      }

      return reply.send({
        success: true,
        data: alert,
      });
    } catch (error: any) {
      server.log.error('Error fetching alert:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /alerts/:alertId/acknowledge
   * Acknowledge an alert
   */
  server.post('/alerts/:alertId/acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const params = alertIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown> | undefined;
      const validated = acknowledgeAlertBodySchema.parse(body || {});

      const alert = await service.acknowledgeAlert(orgId, params.alertId, userId, validated.notes);

      return reply.send({
        success: true,
        data: alert,
      });
    } catch (error: any) {
      server.log.error('Error acknowledging alert:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /alerts/:alertId/resolve
   * Resolve an alert
   */
  server.post('/alerts/:alertId/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const params = alertIdParamSchema.parse(request.params);
      const validated = resolveAlertBodySchema.parse(request.body);

      const alert = await service.resolveAlert(orgId, params.alertId, userId, validated.resolutionNotes);

      return reply.send({
        success: true,
        data: alert,
      });
    } catch (error: any) {
      server.log.error('Error resolving alert:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // HEALTH CHECK ENDPOINT
  // =========================================================================

  /**
   * GET /health
   * Get reputation system health status
   */
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const health = await service.getSystemHealth(orgId);

      return reply.send({
        success: true,
        data: health,
      });
    } catch (error: any) {
      server.log.error('Error fetching reputation health:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // COMPETITOR COMPARISON ENDPOINT
  // =========================================================================

  /**
   * GET /competitors
   * Get competitive reputation comparison
   */
  server.get('/competitors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const validated = getReputationDashboardQuerySchema.parse({
        window: query.window,
        includeCompetitors: 'true',
        includeTrend: 'false',
        includeEvents: 'false',
        maxDrivers: '0',
      });

      const dashboard = await service.getDashboardSnapshot(orgId, validated.window);

      return reply.send({
        success: true,
        data: {
          brandScore: dashboard.executiveSummary.currentScore,
          competitorComparison: dashboard.executiveSummary.competitorComparison,
          competitiveRank: dashboard.executiveSummary.competitiveRank,
          competitorCount: dashboard.executiveSummary.competitorCount,
        },
      });
    } catch (error: any) {
      server.log.error('Error fetching competitor comparison:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
