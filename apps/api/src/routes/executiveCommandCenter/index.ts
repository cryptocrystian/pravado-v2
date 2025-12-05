/**
 * Executive Command Center Routes (Sprint S61)
 * API endpoints for Executive Command Center & Cross-System Insights
 */

import { FLAGS } from '@pravado/feature-flags';
import {
  createExecDashboardSchema,
  updateExecDashboardSchema,
  refreshExecDashboardSchema,
  listExecDashboardsSchema,
  listExecInsightsSchema,
  listExecKpisSchema,
  listExecNarrativesSchema,
  execDashboardIdParamSchema,
} from '@pravado/validators';
import type { FastifyInstance } from 'fastify';

import { createExecutiveCommandCenterService } from '../../services/executiveCommandCenterService';
import { requireUser } from '../../middleware/requireUser';

// ============================================================================
// Route Registration
// ============================================================================

export async function executiveCommandCenterRoutes(server: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_EXECUTIVE_COMMAND_CENTER) {
    server.log.info('Executive Command Center routes disabled by feature flag');
    return;
  }

  // Initialize service
  const service = createExecutiveCommandCenterService({
    supabase: (server as any).supabase,
    openaiApiKey: process.env.OPENAI_API_KEY,
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // ==========================================================================
  // Dashboard CRUD
  // ==========================================================================

  /**
   * List all executive dashboards for the organization
   * GET /api/v1/exec-dashboards
   */
  server.get<{
    Querystring: {
      includeArchived?: string;
      primaryFocus?: string;
      limit?: string;
      offset?: string;
    };
  }>('/', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId } = (request as any).user;

      const query = listExecDashboardsSchema.parse({
        includeArchived: request.query.includeArchived === 'true',
        primaryFocus: request.query.primaryFocus,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
      });

      const result = await service.listDashboards(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to list dashboards');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'LIST_DASHBOARDS_FAILED',
          message: error.message || 'Failed to list dashboards',
        },
      });
    }
  });

  /**
   * Create a new executive dashboard
   * POST /api/v1/exec-dashboards
   */
  server.post<{
    Body: {
      title?: string;
      description?: string;
      timeWindow?: string;
      primaryFocus?: string;
      filters?: Record<string, unknown>;
      isDefault?: boolean;
    };
  }>('/', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId, userId } = (request as any).user;

      const input = createExecDashboardSchema.parse(request.body);

      const dashboard = await service.createDashboard(orgId, userId, input as any);

      return reply.status(201).send({
        success: true,
        data: { dashboard },
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to create dashboard');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'CREATE_DASHBOARD_FAILED',
          message: error.message || 'Failed to create dashboard',
        },
      });
    }
  });

  /**
   * Get a specific executive dashboard with details
   * GET /api/v1/exec-dashboards/:id
   */
  server.get<{
    Params: { id: string };
  }>('/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId, userId } = (request as any).user;

      const params = execDashboardIdParamSchema.parse(request.params);

      const result = await service.getDashboard(orgId, params.id);

      if (!result) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'DASHBOARD_NOT_FOUND',
            message: 'Dashboard not found',
          },
        });
      }

      // Log view action
      await service.logDashboardAction(orgId, params.id, userId, 'viewed');

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to get dashboard');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'GET_DASHBOARD_FAILED',
          message: error.message || 'Failed to get dashboard',
        },
      });
    }
  });

  /**
   * Update an executive dashboard
   * PATCH /api/v1/exec-dashboards/:id
   */
  server.patch<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      timeWindow?: string;
      primaryFocus?: string;
      filters?: Record<string, unknown>;
      isDefault?: boolean;
      isArchived?: boolean;
    };
  }>('/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId, userId } = (request as any).user;

      const params = execDashboardIdParamSchema.parse(request.params);
      const input = updateExecDashboardSchema.parse(request.body);

      const dashboard = await service.updateDashboard(orgId, params.id, userId, input as any);

      if (!dashboard) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'DASHBOARD_NOT_FOUND',
            message: 'Dashboard not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { dashboard },
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to update dashboard');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'UPDATE_DASHBOARD_FAILED',
          message: error.message || 'Failed to update dashboard',
        },
      });
    }
  });

  /**
   * Delete/archive an executive dashboard
   * DELETE /api/v1/exec-dashboards/:id
   */
  server.delete<{
    Params: { id: string };
    Querystring: { hardDelete?: string };
  }>('/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId, userId } = (request as any).user;

      const params = execDashboardIdParamSchema.parse(request.params);
      const hardDelete = request.query.hardDelete === 'true';

      const success = await service.deleteDashboard(orgId, params.id, userId, hardDelete);

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'DASHBOARD_NOT_FOUND',
            message: 'Dashboard not found or could not be deleted',
          },
        });
      }

      return reply.send({
        success: true,
        data: { deleted: true, archived: !hardDelete },
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to delete dashboard');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'DELETE_DASHBOARD_FAILED',
          message: error.message || 'Failed to delete dashboard',
        },
      });
    }
  });

  // ==========================================================================
  // Dashboard Refresh
  // ==========================================================================

  /**
   * Refresh dashboard data (rebuild KPIs, insights, narrative)
   * POST /api/v1/exec-dashboards/:id/refresh
   */
  server.post<{
    Params: { id: string };
    Body: {
      timeWindowOverride?: string;
      primaryFocusOverride?: string;
      regenerateNarrative?: boolean;
      forceRefresh?: boolean;
    };
  }>('/:id/refresh', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId, userId } = (request as any).user;

      const params = execDashboardIdParamSchema.parse(request.params);
      const input = refreshExecDashboardSchema.parse(request.body || {});

      const result = await service.refreshDashboard(orgId, params.id, userId, input);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to refresh dashboard');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'REFRESH_DASHBOARD_FAILED',
          message: error.message || 'Failed to refresh dashboard',
        },
      });
    }
  });

  // ==========================================================================
  // Insights
  // ==========================================================================

  /**
   * List insights for a dashboard
   * GET /api/v1/exec-dashboards/:id/insights
   */
  server.get<{
    Params: { id: string };
    Querystring: {
      sourceSystem?: string;
      category?: string;
      isTopInsight?: string;
      isRisk?: string;
      isOpportunity?: string;
      limit?: string;
      offset?: string;
    };
  }>('/:id/insights', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId } = (request as any).user;

      const params = execDashboardIdParamSchema.parse(request.params);
      const query = listExecInsightsSchema.parse({
        dashboardId: params.id,
        sourceSystem: request.query.sourceSystem,
        category: request.query.category,
        isTopInsight: request.query.isTopInsight === 'true' ? true : request.query.isTopInsight === 'false' ? false : undefined,
        isRisk: request.query.isRisk === 'true' ? true : request.query.isRisk === 'false' ? false : undefined,
        isOpportunity: request.query.isOpportunity === 'true' ? true : request.query.isOpportunity === 'false' ? false : undefined,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
      });

      const result = await service.listInsights(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to list insights');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'LIST_INSIGHTS_FAILED',
          message: error.message || 'Failed to list insights',
        },
      });
    }
  });

  // ==========================================================================
  // KPIs
  // ==========================================================================

  /**
   * List KPIs for a dashboard
   * GET /api/v1/exec-dashboards/:id/kpis
   */
  server.get<{
    Params: { id: string };
    Querystring: {
      category?: string;
      sourceSystem?: string;
      limit?: string;
      offset?: string;
    };
  }>('/:id/kpis', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId } = (request as any).user;

      const params = execDashboardIdParamSchema.parse(request.params);
      const query = listExecKpisSchema.parse({
        dashboardId: params.id,
        category: request.query.category,
        sourceSystem: request.query.sourceSystem,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
      });

      const result = await service.listKpis(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to list KPIs');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'LIST_KPIS_FAILED',
          message: error.message || 'Failed to list KPIs',
        },
      });
    }
  });

  // ==========================================================================
  // Narratives
  // ==========================================================================

  /**
   * List narratives for a dashboard
   * GET /api/v1/exec-dashboards/:id/narratives
   */
  server.get<{
    Params: { id: string };
    Querystring: {
      limit?: string;
      offset?: string;
    };
  }>('/:id/narratives', { preHandler: requireUser }, async (request, reply) => {
    try {
      const { orgId } = (request as any).user;

      const params = execDashboardIdParamSchema.parse(request.params);
      const query = listExecNarrativesSchema.parse({
        dashboardId: params.id,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
      });

      const result = await service.listNarratives(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error({ err: error }, 'Failed to list narratives');
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: 'LIST_NARRATIVES_FAILED',
          message: error.message || 'Failed to list narratives',
        },
      });
    }
  });

  server.log.info('Executive Command Center routes registered');
}
