/**
 * Reality Maps API Routes (Sprint S73)
 * AI-Driven Multi-Outcome "Reality Maps" Engine
 */

import { FastifyPluginAsync } from 'fastify';
import { FLAGS } from '@pravado/feature-flags';
import {
  createRealityMapSchema,
  updateRealityMapSchema,
  generateRealityMapSchema,
  listRealityMapsQuerySchema,
  getRealityMapGraphQuerySchema,
  getRealityMapAnalysisQuerySchema,
  listRealityMapAuditQuerySchema,
} from '@pravado/validators';
import * as realityMapService from '../../services/realityMapService';

const realityMapsRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check via preHandler hook for all routes
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!FLAGS.ENABLE_REALITY_MAPS) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FEATURE_DISABLED', message: 'Reality Maps feature is not enabled' },
      });
    }
  });

  // ============================================================================
  // REALITY MAPS CRUD
  // ============================================================================

  /**
   * GET /reality-maps
   * List reality maps for organization
   */
  fastify.get('/', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const query = listRealityMapsQuerySchema.parse(request.query);

    const result = await realityMapService.listRealityMaps(orgId, query);

    return reply.send(result);
  });

  /**
   * POST /reality-maps
   * Create a new reality map
   */
  fastify.post('/', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const input = createRealityMapSchema.parse(request.body);

    const result = await realityMapService.createRealityMap(orgId, userId, input);

    return reply.status(201).send(result);
  });

  /**
   * GET /reality-maps/:id
   * Get reality map by ID
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;

    const result = await realityMapService.getRealityMap(orgId, id);

    if (!result.map) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reality map not found' },
      });
    }

    return reply.send(result);
  });

  /**
   * PATCH /reality-maps/:id
   * Update reality map
   */
  fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const { id } = request.params;
    const input = updateRealityMapSchema.parse(request.body);

    const result = await realityMapService.updateRealityMap(orgId, id, userId, input);

    return reply.send(result);
  });

  /**
   * DELETE /reality-maps/:id
   * Delete reality map
   */
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;

    const result = await realityMapService.deleteRealityMap(orgId, id);

    return reply.send(result);
  });

  // ============================================================================
  // GENERATION
  // ============================================================================

  /**
   * POST /reality-maps/:id/generate
   * Generate reality map from source data
   */
  fastify.post<{ Params: { id: string } }>('/:id/generate', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const { id } = request.params;
    const input = generateRealityMapSchema.parse(request.body || {});

    const result = await realityMapService.generateRealityMap(orgId, id, userId, input);

    return reply.send(result);
  });

  // ============================================================================
  // GRAPH & VISUALIZATION
  // ============================================================================

  /**
   * GET /reality-maps/:id/graph
   * Get graph data for visualization
   */
  fastify.get<{ Params: { id: string } }>('/:id/graph', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;
    // Query params parsed but not used in current implementation
    getRealityMapGraphQuerySchema.parse(request.query);

    const result = await realityMapService.getGraph(orgId, id);

    return reply.send(result);
  });

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  /**
   * GET /reality-maps/:id/analysis
   * Get analysis for reality map
   */
  fastify.get<{ Params: { id: string } }>('/:id/analysis', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;
    // Query params parsed for future use
    getRealityMapAnalysisQuerySchema.parse(request.query);

    const result = await realityMapService.getAnalysis(orgId, id);

    return reply.send(result);
  });

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * GET /reality-maps/stats
   * Get global stats for organization
   */
  fastify.get('/stats', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;

    const result = await realityMapService.getGlobalStats(orgId);

    return reply.send(result);
  });

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  /**
   * GET /reality-maps/:id/audit-log
   * List audit events for a reality map
   */
  fastify.get<{ Params: { id: string } }>('/:id/audit-log', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;
    const query = listRealityMapAuditQuerySchema.parse(request.query);

    const result = await realityMapService.listAuditEvents(orgId, id, query);

    return reply.send(result);
  });
};

export default realityMapsRoutes;
