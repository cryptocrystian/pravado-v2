/**
 * Unified Narrative Generator V2 Routes (Sprint S70)
 * Cross-domain synthesis engine API endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import {
  createNarrativeSchema,
  updateNarrativeSchema,
  generateNarrativeSchema,
  listNarrativesQuerySchema,
  updateNarrativeSectionSchema,
  regenerateNarrativeSectionSchema,
  computeDeltaSchema,
  getNarrativeInsightsQuerySchema,
  approveNarrativeSchema,
  publishNarrativeSchema,
  exportNarrativeSchema,
  listAuditLogsQuerySchema,
  narrativeIdParamSchema,
  narrativeSectionIdParamSchema,
} from '@pravado/validators';
import * as unifiedNarrativeService from '../../services/unifiedNarrativeService';
import { isEnabled } from '@pravado/feature-flags';

const unifiedNarrativeRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check middleware
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!isEnabled('ENABLE_UNIFIED_NARRATIVE_V2')) {
      return reply.status(403).send({
        success: false,
        error: 'Unified Narrative Generator V2 feature is not enabled for this organization',
      });
    }
  });

  // Helper to get service context from request
  const getContext = (request: { supabase: unknown; orgId: string; userId: string; userEmail?: string }) => ({
    supabase: request.supabase as unifiedNarrativeService.ServiceContext['supabase'],
    orgId: request.orgId,
    userId: request.userId,
    userEmail: request.userEmail || '',
  });

  // ============================================================================
  // NARRATIVE CRUD ENDPOINTS
  // ============================================================================

  /**
   * List unified narratives
   * GET /api/v1/unified-narratives
   */
  fastify.get('/', async (request, reply) => {
    const query = listNarrativesQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.listNarratives(ctx, query);

    return reply.send({ success: true, ...result });
  });

  /**
   * Get a single narrative with sections and sources
   * GET /api/v1/unified-narratives/:narrativeId
   */
  fastify.get('/:narrativeId', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.getNarrative(ctx, narrativeId);

    return reply.send({ success: true, ...result });
  });

  /**
   * Create a new unified narrative
   * POST /api/v1/unified-narratives
   */
  fastify.post('/', async (request, reply) => {
    const input = createNarrativeSchema.parse(request.body);
    const ctx = getContext(request as never);

    const narrative = await unifiedNarrativeService.createNarrative(ctx, input);

    return reply.status(201).send({ success: true, narrative });
  });

  /**
   * Update a narrative
   * PATCH /api/v1/unified-narratives/:narrativeId
   */
  fastify.patch('/:narrativeId', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const input = updateNarrativeSchema.parse(request.body);
    const ctx = getContext(request as never);

    const narrative = await unifiedNarrativeService.updateNarrative(ctx, narrativeId, input);

    return reply.send({ success: true, narrative });
  });

  /**
   * Delete a narrative
   * DELETE /api/v1/unified-narratives/:narrativeId
   */
  fastify.delete('/:narrativeId', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const ctx = getContext(request as never);

    await unifiedNarrativeService.deleteNarrative(ctx, narrativeId);

    return reply.status(204).send();
  });

  // ============================================================================
  // NARRATIVE GENERATION ENDPOINTS
  // ============================================================================

  /**
   * Generate or regenerate narrative content
   * POST /api/v1/unified-narratives/:narrativeId/generate
   */
  fastify.post('/:narrativeId/generate', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const input = generateNarrativeSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.generateNarrative(ctx, narrativeId, input);

    return reply.send({ success: true, ...result });
  });

  // ============================================================================
  // SECTION MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Update a section
   * PATCH /api/v1/unified-narratives/:narrativeId/sections/:sectionId
   */
  fastify.patch('/:narrativeId/sections/:sectionId', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const { sectionId } = narrativeSectionIdParamSchema.parse(request.params);
    const input = updateNarrativeSectionSchema.parse(request.body);
    const ctx = getContext(request as never);

    const section = await unifiedNarrativeService.updateSection(ctx, narrativeId, sectionId, input);

    return reply.send({ success: true, section });
  });

  /**
   * Regenerate a section
   * POST /api/v1/unified-narratives/:narrativeId/sections/:sectionId/regenerate
   */
  fastify.post('/:narrativeId/sections/:sectionId/regenerate', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const { sectionId } = narrativeSectionIdParamSchema.parse(request.params);
    const input = regenerateNarrativeSectionSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const section = await unifiedNarrativeService.regenerateSection(ctx, narrativeId, sectionId, input);

    return reply.send({ success: true, section });
  });

  // ============================================================================
  // DELTA COMPUTATION ENDPOINTS
  // ============================================================================

  /**
   * Compute delta between current and previous narrative
   * POST /api/v1/unified-narratives/:narrativeId/compute-delta
   */
  fastify.post('/:narrativeId/compute-delta', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const input = computeDeltaSchema.parse(request.body);
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.computeDelta(ctx, narrativeId, input);

    return reply.send({ success: true, ...result });
  });

  // ============================================================================
  // INSIGHTS ENDPOINTS
  // ============================================================================

  /**
   * Get insights for a narrative
   * GET /api/v1/unified-narratives/:narrativeId/insights
   */
  fastify.get('/:narrativeId/insights', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const query = getNarrativeInsightsQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.getInsights(ctx, narrativeId, query);

    return reply.send({ success: true, ...result });
  });

  // ============================================================================
  // WORKFLOW ENDPOINTS
  // ============================================================================

  /**
   * Approve a narrative
   * POST /api/v1/unified-narratives/:narrativeId/approve
   */
  fastify.post('/:narrativeId/approve', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const input = approveNarrativeSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const narrative = await unifiedNarrativeService.approveNarrative(ctx, narrativeId, input);

    return reply.send({ success: true, narrative });
  });

  /**
   * Publish a narrative
   * POST /api/v1/unified-narratives/:narrativeId/publish
   */
  fastify.post('/:narrativeId/publish', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const input = publishNarrativeSchema.parse(request.body || {});
    const ctx = getContext(request as never);

    const narrative = await unifiedNarrativeService.publishNarrative(ctx, narrativeId, input);

    return reply.send({ success: true, narrative });
  });

  /**
   * Archive a narrative
   * POST /api/v1/unified-narratives/:narrativeId/archive
   */
  fastify.post('/:narrativeId/archive', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const body = request.body as { archiveReason?: string } || {};
    const ctx = getContext(request as never);

    const narrative = await unifiedNarrativeService.archiveNarrative(ctx, narrativeId, body.archiveReason);

    return reply.send({ success: true, narrative });
  });

  // ============================================================================
  // EXPORT ENDPOINTS
  // ============================================================================

  /**
   * Export a narrative
   * POST /api/v1/unified-narratives/:narrativeId/export
   */
  fastify.post('/:narrativeId/export', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const input = exportNarrativeSchema.parse(request.body);
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.exportNarrative(ctx, narrativeId, input);

    return reply.send({ success: true, ...result });
  });

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  /**
   * Get narrative statistics
   * GET /api/v1/unified-narratives/stats
   */
  fastify.get('/stats', async (request, reply) => {
    const ctx = getContext(request as never);

    const stats = await unifiedNarrativeService.getStats(ctx);

    return reply.send({ success: true, stats });
  });

  // ============================================================================
  // AUDIT LOG ENDPOINTS
  // ============================================================================

  /**
   * List audit logs for narratives
   * GET /api/v1/unified-narratives/audit-logs
   */
  fastify.get('/audit-logs', async (request, reply) => {
    const query = listAuditLogsQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.listAuditLogs(ctx, query);

    return reply.send({ success: true, ...result });
  });

  /**
   * Get audit logs for a specific narrative
   * GET /api/v1/unified-narratives/:narrativeId/audit-logs
   */
  fastify.get('/:narrativeId/audit-logs', async (request, reply) => {
    const { narrativeId } = narrativeIdParamSchema.parse(request.params);
    const query = listAuditLogsQuerySchema.parse(request.query);
    const ctx = getContext(request as never);

    const result = await unifiedNarrativeService.listAuditLogs(ctx, {
      ...query,
      narrativeId,
    });

    return reply.send({ success: true, ...result });
  });
};

export default unifiedNarrativeRoutes;
