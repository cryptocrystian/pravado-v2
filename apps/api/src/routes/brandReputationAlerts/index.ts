/**
 * Brand Reputation Alerts & Executive Reporting API Routes (Sprint S57)
 *
 * REST API endpoints for brand reputation alerts and executive reports:
 * - Alert rule management (CRUD)
 * - Alert event tracking and lifecycle
 * - Executive report generation and management
 * - Reputation insights for dashboards
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { BrandReputationAlertsService } from '../../services/brandReputationAlertsService';
import {
  createReputationAlertRuleSchema,
  updateReputationAlertRuleSchema,
  listReputationAlertRulesQuerySchema,
  listReputationAlertEventsQuerySchema,
  acknowledgeReputationAlertEventSchema,
  resolveReputationAlertEventSchema,
  createReputationReportSchema,
  generateReputationReportSchema,
  regenerateReputationReportSectionSchema,
  listReputationReportsQuerySchema,
  getReputationInsightsQuerySchema,
  alertRuleIdParamSchema,
  alertEventIdParamSchema,
  reputationReportIdParamSchema,
  reputationSectionIdParamSchema,
} from '@pravado/validators';
import type {
  CreateReputationAlertRuleInput,
  UpdateReputationAlertRuleInput,
  ListReputationAlertRulesQuery,
  ListReputationAlertEventsQuery,
  CreateReputationReportInput,
  GenerateReputationReportInput,
  RegenerateReputationReportSectionInput,
  ListReputationReportsQuery,
  GetReputationInsightsQuery,
} from '@pravado/types';

// Helper to extract orgId from headers
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Missing x-org-id header');
  }
  return orgId;
}

// Helper to extract userId from request (assume JWT middleware sets this)
function getUserId(request: FastifyRequest): string | undefined {
  const user = (request as FastifyRequest & { user?: { id: string } }).user;
  return user?.id;
}

export default async function brandReputationAlertsRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = new BrandReputationAlertsService(supabase);

  // =========================================================================
  // ALERT RULE ENDPOINTS
  // =========================================================================

  /**
   * POST /alert-rules
   * Create a new alert rule
   */
  server.post('/alert-rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createReputationAlertRuleSchema.parse(request.body);
      const rule = await service.createAlertRule(
        orgId,
        validated as CreateReputationAlertRuleInput,
        userId
      );

      return reply.status(201).send({
        success: true,
        data: rule,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating alert rule');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /alert-rules
   * List alert rules with filters and pagination
   */
  server.get('/alert-rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, unknown>;
      const validated = listReputationAlertRulesQuerySchema.parse(query);
      const response = await service.listAlertRules(
        orgId,
        validated as ListReputationAlertRulesQuery
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing alert rules');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /alert-rules/:id
   * Get a single alert rule by ID
   */
  server.get('/alert-rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = alertRuleIdParamSchema.parse(request.params);
      const rule = await service.getAlertRule(orgId, id);

      if (!rule) {
        return reply.status(404).send({
          success: false,
          error: 'Alert rule not found',
        });
      }

      return reply.send({
        success: true,
        data: rule,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching alert rule');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /alert-rules/:id
   * Update an alert rule
   */
  server.patch('/alert-rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = alertRuleIdParamSchema.parse(request.params);
      const validated = updateReputationAlertRuleSchema.parse(request.body);
      const rule = await service.updateAlertRule(
        orgId,
        id,
        validated as UpdateReputationAlertRuleInput
      );

      return reply.send({
        success: true,
        data: rule,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating alert rule');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /alert-rules/:id
   * Delete an alert rule
   */
  server.delete('/alert-rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = alertRuleIdParamSchema.parse(request.params);
      await service.deleteAlertRule(orgId, id);

      return reply.send({
        success: true,
        message: 'Alert rule deleted successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error deleting alert rule');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // ALERT EVENT ENDPOINTS
  // =========================================================================

  /**
   * GET /alert-events
   * List alert events with filters and pagination
   */
  server.get('/alert-events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, unknown>;
      const validated = listReputationAlertEventsQuerySchema.parse(query);
      const response = await service.listAlertEvents(
        orgId,
        validated as ListReputationAlertEventsQuery
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing alert events');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /alert-events/:id
   * Get a single alert event by ID
   */
  server.get('/alert-events/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = alertEventIdParamSchema.parse(request.params);
      const event = await service.getAlertEvent(orgId, id);

      if (!event) {
        return reply.status(404).send({
          success: false,
          error: 'Alert event not found',
        });
      }

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching alert event');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /alert-events/:id/acknowledge
   * Acknowledge an alert event
   */
  server.post('/alert-events/:id/acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = alertEventIdParamSchema.parse(request.params);
      const validated = acknowledgeReputationAlertEventSchema.parse(request.body || {});

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'User authentication required',
        });
      }

      const event = await service.acknowledgeAlertEvent(orgId, id, userId, validated.notes);

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error acknowledging alert event');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /alert-events/:id/resolve
   * Resolve an alert event
   */
  server.post('/alert-events/:id/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = alertEventIdParamSchema.parse(request.params);
      const validated = resolveReputationAlertEventSchema.parse(request.body);

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'User authentication required',
        });
      }

      const event = await service.resolveAlertEvent(
        orgId,
        id,
        userId,
        validated.resolutionNotes
      );

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error resolving alert event');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /alert-events/:id/mute
   * Mute an alert event
   */
  server.post('/alert-events/:id/mute', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = alertEventIdParamSchema.parse(request.params);

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'User authentication required',
        });
      }

      const event = await service.muteAlertEvent(orgId, id, userId);

      return reply.send({
        success: true,
        data: event,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error muting alert event');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // REPORT ENDPOINTS
  // =========================================================================

  /**
   * POST /reports
   * Create a new report (draft)
   */
  server.post('/reports', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createReputationReportSchema.parse(request.body);
      const response = await service.createReputationReport(
        orgId,
        validated as CreateReputationReportInput,
        userId
      );

      return reply.status(201).send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating report');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /reports
   * List reports with filters and pagination
   */
  server.get('/reports', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, unknown>;
      const validated = listReputationReportsQuerySchema.parse(query);
      const response = await service.listReputationReports(
        orgId,
        validated as ListReputationReportsQuery
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing reports');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /reports/:id
   * Get a single report with sections and recipients
   */
  server.get('/reports/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = reputationReportIdParamSchema.parse(request.params);
      const response = await service.getReputationReport(orgId, id);

      if (!response) {
        return reply.status(404).send({
          success: false,
          error: 'Report not found',
        });
      }

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching report');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /reports/generate
   * Generate a full report with sections (ad hoc or scheduled)
   */
  server.post('/reports/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = generateReputationReportSchema.parse(request.body);
      const response = await service.generateReputationReport(
        orgId,
        validated as GenerateReputationReportInput,
        userId
      );

      return reply.status(201).send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error generating report');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /reports/:id/sections/:sectionId/regenerate
   * Regenerate a specific report section
   */
  server.post('/reports/:id/sections/:sectionId/regenerate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id, sectionId } = reputationSectionIdParamSchema.parse(request.params);
      const validated = regenerateReputationReportSectionSchema.parse(request.body || {});
      const response = await service.regenerateReputationReportSection(
        orgId,
        id,
        sectionId,
        validated as RegenerateReputationReportSectionInput
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error regenerating report section');
      return reply.status(errorMessage.includes('not found') ? 404 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // INSIGHTS ENDPOINT
  // =========================================================================

  /**
   * GET /insights
   * Get reputation insights for dashboards
   */
  server.get('/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, unknown>;
      const validated = getReputationInsightsQuerySchema.parse(query);
      const response = await service.getReputationInsights(
        orgId,
        validated as GetReputationInsightsQuery
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching reputation insights');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });
}
