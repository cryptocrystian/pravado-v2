/**
 * Strategic Intelligence Narrative Engine Routes (Sprint S65)
 * CEO-level unified strategic intelligence reports API endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import {
  createStrategicReportSchema,
  updateStrategicReportSchema,
  updateStrategicSectionSchema,
  listStrategicReportsQuerySchema,
  listStrategicSourcesQuerySchema,
  listStrategicAuditLogsQuerySchema,
  generateStrategicReportSchema,
  regenerateStrategicSectionSchema,
  refreshInsightsSchema,
  reorderStrategicSectionsSchema,
  addStrategicSourceSchema,
  updateStrategicSourceSchema,
  approveStrategicReportSchema,
  publishStrategicReportSchema,
  archiveStrategicReportSchema,
  exportStrategicReportSchema,
  comparePeriodsSchema,
  strategicReportIdParamSchema,
  strategicSectionIdParamSchema,
  strategicSourceIdParamSchema,
} from '@pravado/validators';
import * as strategicIntelligenceService from '../../services/strategicIntelligenceService';
import { isEnabled } from '@pravado/feature-flags';

const strategicIntelligenceRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check middleware
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!isEnabled('ENABLE_STRATEGIC_INTELLIGENCE')) {
      return reply.status(403).send({
        success: false,
        error: 'Strategic Intelligence feature is not enabled for this organization',
      });
    }
  });

  // Helper to get service context from request
  const getContext = (request: { supabase: unknown; orgId: string; userId: string; userEmail?: string }) => ({
    supabase: request.supabase as strategicIntelligenceService.ServiceContext['supabase'],
    orgId: request.orgId,
    userId: request.userId,
    userEmail: request.userEmail || '',
  });

  // ============================================================================
  // REPORT CRUD ENDPOINTS
  // ============================================================================

  /**
   * List strategic intelligence reports
   * GET /api/v1/strategic-intelligence/reports
   */
  fastify.get('/reports', async (request, reply) => {
    const query = listStrategicReportsQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.listReports(ctx, query);

    return reply.send({ success: true, ...result });
  });

  /**
   * Get a single strategic intelligence report with sections
   * GET /api/v1/strategic-intelligence/reports/:reportId
   */
  fastify.get('/reports/:reportId', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.getReport(ctx, reportId);

    return reply.send({ success: true, ...result });
  });

  /**
   * Create a new strategic intelligence report
   * POST /api/v1/strategic-intelligence/reports
   */
  fastify.post('/reports', async (request, reply) => {
    const input = createStrategicReportSchema.parse(request.body);
    const ctx = getContext(request as never);

    const report = await strategicIntelligenceService.createReport(ctx, input);

    return reply.status(201).send({ success: true, report });
  });

  /**
   * Update a strategic intelligence report
   * PATCH /api/v1/strategic-intelligence/reports/:reportId
   */
  fastify.patch('/reports/:reportId', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = updateStrategicReportSchema.parse(request.body);
    const ctx = getContext(request as never);

    const report = await strategicIntelligenceService.updateReport(ctx, reportId, input);

    return reply.send({ success: true, report });
  });

  /**
   * Delete a strategic intelligence report
   * DELETE /api/v1/strategic-intelligence/reports/:reportId
   */
  fastify.delete('/reports/:reportId', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const ctx = getContext(request as never);

    await strategicIntelligenceService.deleteReport(ctx, reportId);

    return reply.status(204).send();
  });

  // ============================================================================
  // REPORT GENERATION ENDPOINTS
  // ============================================================================

  /**
   * Generate or regenerate report content
   * POST /api/v1/strategic-intelligence/reports/:reportId/generate
   */
  fastify.post('/reports/:reportId/generate', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = generateStrategicReportSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.generateReport(ctx, reportId, input);

    return reply.send({ success: true, ...result });
  });

  /**
   * Refresh insights from upstream sources
   * POST /api/v1/strategic-intelligence/reports/:reportId/refresh-insights
   */
  fastify.post('/reports/:reportId/refresh-insights', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = refreshInsightsSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.refreshInsights(ctx, reportId, input);

    return reply.send({ success: true, ...result });
  });

  // ============================================================================
  // WORKFLOW ENDPOINTS
  // ============================================================================

  /**
   * Approve a strategic intelligence report
   * POST /api/v1/strategic-intelligence/reports/:reportId/approve
   */
  fastify.post('/reports/:reportId/approve', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = approveStrategicReportSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const report = await strategicIntelligenceService.approveReport(ctx, reportId, input);

    return reply.send({ success: true, report });
  });

  /**
   * Publish a strategic intelligence report
   * POST /api/v1/strategic-intelligence/reports/:reportId/publish
   */
  fastify.post('/reports/:reportId/publish', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = publishStrategicReportSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.publishReport(ctx, reportId, input);

    return reply.send({ success: true, ...result });
  });

  /**
   * Archive a strategic intelligence report
   * POST /api/v1/strategic-intelligence/reports/:reportId/archive
   */
  fastify.post('/reports/:reportId/archive', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = archiveStrategicReportSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const report = await strategicIntelligenceService.archiveReport(ctx, reportId, input);

    return reply.send({ success: true, report });
  });

  // ============================================================================
  // SECTION ENDPOINTS
  // ============================================================================

  /**
   * Update a report section
   * PATCH /api/v1/strategic-intelligence/reports/:reportId/sections/:sectionId
   */
  fastify.patch('/reports/:reportId/sections/:sectionId', async (request, reply) => {
    const { reportId, sectionId } = strategicSectionIdParamSchema.parse(request.params);
    const input = updateStrategicSectionSchema.parse(request.body);
    const ctx = getContext(request as never);

    const section = await strategicIntelligenceService.updateSection(ctx, reportId, sectionId, input);

    return reply.send({ success: true, section });
  });

  /**
   * Regenerate a specific section
   * POST /api/v1/strategic-intelligence/reports/:reportId/sections/:sectionId/regenerate
   */
  fastify.post('/reports/:reportId/sections/:sectionId/regenerate', async (request, reply) => {
    const { reportId, sectionId } = strategicSectionIdParamSchema.parse(request.params);
    const input = regenerateStrategicSectionSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const section = await strategicIntelligenceService.regenerateSection(ctx, reportId, sectionId, input);

    return reply.send({ success: true, section });
  });

  /**
   * Reorder report sections
   * POST /api/v1/strategic-intelligence/reports/:reportId/sections/reorder
   */
  fastify.post('/reports/:reportId/sections/reorder', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = reorderStrategicSectionsSchema.parse(request.body);
    const ctx = getContext(request as never);

    const sections = await strategicIntelligenceService.reorderSections(ctx, reportId, input);

    return reply.send({ success: true, sections });
  });

  // ============================================================================
  // SOURCE ENDPOINTS
  // ============================================================================

  /**
   * List data sources
   * GET /api/v1/strategic-intelligence/sources
   */
  fastify.get('/sources', async (request, reply) => {
    const query = listStrategicSourcesQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.listSources(ctx, query);

    return reply.send({ success: true, ...result });
  });

  /**
   * Add a data source to a report
   * POST /api/v1/strategic-intelligence/reports/:reportId/sources
   */
  fastify.post('/reports/:reportId/sources', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = addStrategicSourceSchema.parse(request.body);
    const ctx = getContext(request as never);

    const source = await strategicIntelligenceService.addSource(ctx, reportId, input);

    return reply.status(201).send({ success: true, source });
  });

  /**
   * Update a data source
   * PATCH /api/v1/strategic-intelligence/reports/:reportId/sources/:sourceId
   */
  fastify.patch('/reports/:reportId/sources/:sourceId', async (request, reply) => {
    const { reportId, sourceId } = strategicSourceIdParamSchema.parse(request.params);
    const input = updateStrategicSourceSchema.parse(request.body);
    const ctx = getContext(request as never);

    const source = await strategicIntelligenceService.updateSource(ctx, reportId, sourceId, input);

    return reply.send({ success: true, source });
  });

  /**
   * Delete a data source
   * DELETE /api/v1/strategic-intelligence/reports/:reportId/sources/:sourceId
   */
  fastify.delete('/reports/:reportId/sources/:sourceId', async (request, reply) => {
    const { reportId, sourceId } = strategicSourceIdParamSchema.parse(request.params);
    const ctx = getContext(request as never);

    await strategicIntelligenceService.deleteSource(ctx, reportId, sourceId);

    return reply.status(204).send();
  });

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  /**
   * Get strategic intelligence statistics
   * GET /api/v1/strategic-intelligence/stats
   */
  fastify.get('/stats', async (request, reply) => {
    const ctx = getContext(request as never);
    const stats = await strategicIntelligenceService.getStats(ctx);

    return reply.send({ success: true, stats });
  });

  // ============================================================================
  // COMPARISON ENDPOINTS
  // ============================================================================

  /**
   * Compare periods between reports
   * POST /api/v1/strategic-intelligence/compare
   */
  fastify.post('/compare', async (request, reply) => {
    const input = comparePeriodsSchema.parse(request.body);
    const ctx = getContext(request as never);

    const comparison = await strategicIntelligenceService.comparePeriods(ctx, input);

    return reply.send({ success: true, comparison });
  });

  // ============================================================================
  // EXPORT ENDPOINTS
  // ============================================================================

  /**
   * Export report to various formats
   * POST /api/v1/strategic-intelligence/reports/:reportId/export
   */
  fastify.post('/reports/:reportId/export', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const input = exportStrategicReportSchema.parse(request.body);
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.exportReport(ctx, reportId, input);

    return reply.send({ success: true, ...result });
  });

  // ============================================================================
  // AUDIT LOG ENDPOINTS
  // ============================================================================

  /**
   * List audit logs
   * GET /api/v1/strategic-intelligence/audit-logs
   */
  fastify.get('/audit-logs', async (request, reply) => {
    const query = listStrategicAuditLogsQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.listAuditLogs(ctx, query);

    return reply.send({ success: true, ...result });
  });

  /**
   * List audit logs for a specific report
   * GET /api/v1/strategic-intelligence/reports/:reportId/audit-logs
   */
  fastify.get('/reports/:reportId/audit-logs', async (request, reply) => {
    const { reportId } = strategicReportIdParamSchema.parse(request.params);
    const query = listStrategicAuditLogsQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await strategicIntelligenceService.listAuditLogs(ctx, { ...query, reportId });

    return reply.send({ success: true, ...result });
  });
};

export default strategicIntelligenceRoutes;
