/**
 * Insight Conflicts API Routes (Sprint S74)
 * Autonomous Insight Conflict Resolution Engine V1
 */

import { FastifyPluginAsync } from 'fastify';
import { FLAGS } from '@pravado/feature-flags';
import {
  createConflictSchema,
  updateConflictSchema,
  analyzeConflictSchema,
  resolveConflictSchema,
  reviewResolutionSchema,
  listConflictsSchema,
  listConflictItemsSchema,
  listResolutionsSchema,
  listAuditLogSchema,
  createClusterSchema,
  listClustersSchema,
  createGraphEdgeSchema,
  runDetectionSchema,
  batchAnalyzeSchema,
  batchResolveSchema,
  batchDismissSchema,
} from '@pravado/validators';
import * as insightConflictService from '../../services/insightConflictService';

const insightConflictRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check via preHandler hook for all routes
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!FLAGS.ENABLE_INSIGHT_CONFLICTS) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FEATURE_DISABLED', message: 'Insight Conflicts feature is not enabled' },
      });
    }
  });

  // ============================================================================
  // INSIGHT CONFLICTS CRUD
  // ============================================================================

  /**
   * GET /insight-conflicts
   * List insight conflicts for organization
   */
  fastify.get('/', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const query = listConflictsSchema.parse(request.query);

    const result = await insightConflictService.listConflicts(orgId, query);

    return reply.send(result);
  });

  /**
   * POST /insight-conflicts
   * Create a new insight conflict
   */
  fastify.post('/', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const input = createConflictSchema.parse(request.body);

    const result = await insightConflictService.createConflict(orgId, userId, input);

    return reply.status(201).send(result);
  });

  /**
   * GET /insight-conflicts/stats
   * Get conflict statistics for organization
   */
  fastify.get('/stats', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;

    const result = await insightConflictService.getConflictStats(orgId);

    return reply.send(result);
  });

  /**
   * GET /insight-conflicts/:id
   * Get insight conflict by ID
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;

    const result = await insightConflictService.getConflict(orgId, id);

    if (!result.conflict) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Insight conflict not found' },
      });
    }

    return reply.send(result);
  });

  /**
   * PATCH /insight-conflicts/:id
   * Update insight conflict
   */
  fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const { id } = request.params;
    const input = updateConflictSchema.parse(request.body);

    const result = await insightConflictService.updateConflict(orgId, id, userId, input);

    return reply.send(result);
  });

  /**
   * DELETE /insight-conflicts/:id
   * Delete insight conflict
   */
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const { id } = request.params;

    const result = await insightConflictService.deleteConflict(orgId, userId, id);

    return reply.send(result);
  });

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  /**
   * POST /insight-conflicts/:id/analyze
   * Analyze an insight conflict
   */
  fastify.post<{ Params: { id: string } }>('/:id/analyze', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const { id } = request.params;
    const input = analyzeConflictSchema.parse(request.body || {});

    const result = await insightConflictService.analyzeConflict(orgId, id, userId, input);

    return reply.send(result);
  });

  // ============================================================================
  // RESOLUTION
  // ============================================================================

  /**
   * POST /insight-conflicts/:id/resolve
   * Resolve an insight conflict
   */
  fastify.post<{ Params: { id: string } }>('/:id/resolve', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const { id } = request.params;
    const input = resolveConflictSchema.parse(request.body);

    const result = await insightConflictService.resolveConflict(orgId, id, userId, input);

    return reply.send(result);
  });

  /**
   * POST /insight-conflicts/:id/dismiss
   * Dismiss an insight conflict
   */
  fastify.post<{ Params: { id: string } }>('/:id/dismiss', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const { id } = request.params;
    const { reason } = (request.body as { reason?: string }) || {};

    const result = await insightConflictService.dismissConflict(orgId, id, userId, reason);

    return reply.send(result);
  });

  // ============================================================================
  // ITEMS
  // ============================================================================

  /**
   * GET /insight-conflicts/:id/items
   * List conflict items
   */
  fastify.get<{ Params: { id: string } }>('/:id/items', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;
    const queryBase = listConflictItemsSchema.omit({ conflictId: true }).parse(request.query);
    const query = { ...queryBase, conflictId: id };

    const result = await insightConflictService.listConflictItems(orgId, query);

    return reply.send(result);
  });

  // ============================================================================
  // RESOLUTIONS
  // ============================================================================

  /**
   * GET /insight-conflicts/:id/resolutions
   * List resolutions for a conflict
   */
  fastify.get<{ Params: { id: string } }>('/:id/resolutions', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;
    const queryBase = listResolutionsSchema.omit({ conflictId: true }).parse(request.query);
    const query = { ...queryBase, conflictId: id };

    const result = await insightConflictService.listResolutions(orgId, query);

    return reply.send(result);
  });

  /**
   * POST /insight-conflicts/:id/resolutions/:resolutionId/review
   * Review a resolution
   */
  fastify.post<{ Params: { id: string; resolutionId: string } }>(
    '/:id/resolutions/:resolutionId/review',
    async (request, reply) => {
      const orgId = (request as unknown as { orgId: string }).orgId;
      const userId = (request as unknown as { userId: string }).userId;
      const { id, resolutionId } = request.params;
      const input = reviewResolutionSchema.parse(request.body);

      const result = await insightConflictService.reviewResolution(
        orgId,
        id,
        resolutionId,
        userId,
        input
      );

      return reply.send(result);
    }
  );

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  /**
   * GET /insight-conflicts/:id/audit-log
   * List audit log entries for a conflict
   */
  fastify.get<{ Params: { id: string } }>('/:id/audit-log', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;
    const queryBase = listAuditLogSchema.omit({ conflictId: true }).parse(request.query);
    const query = { ...queryBase, conflictId: id };

    const result = await insightConflictService.listAuditLog(orgId, query);

    return reply.send(result);
  });

  // ============================================================================
  // GRAPH
  // ============================================================================

  /**
   * GET /insight-conflicts/:id/graph
   * Get conflict graph for visualization
   */
  fastify.get<{ Params: { id: string } }>('/:id/graph', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const { id } = request.params;

    const result = await insightConflictService.getConflictGraph(orgId, id);

    return reply.send(result);
  });

  /**
   * POST /insight-conflicts/graph-edges
   * Create a graph edge between conflicts
   */
  fastify.post('/graph-edges', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const input = createGraphEdgeSchema.parse(request.body);

    const result = await insightConflictService.createGraphEdge(orgId, input);

    return reply.status(201).send(result);
  });

  // ============================================================================
  // CLUSTERS
  // ============================================================================

  /**
   * GET /insight-conflicts/clusters
   * List conflict clusters
   */
  fastify.get('/clusters', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const query = listClustersSchema.parse(request.query);

    const result = await insightConflictService.listClusters(orgId, query);

    return reply.send(result);
  });

  /**
   * POST /insight-conflicts/clusters
   * Create a conflict cluster
   */
  fastify.post('/clusters', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const input = createClusterSchema.parse(request.body);

    const result = await insightConflictService.createCluster(orgId, input);

    return reply.status(201).send(result);
  });

  // ============================================================================
  // DETECTION
  // ============================================================================

  /**
   * POST /insight-conflicts/detect
   * Run conflict detection
   */
  fastify.post('/detect', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const input = runDetectionSchema.parse(request.body || {});

    const result = await insightConflictService.runDetection(orgId, userId, input);

    return reply.send(result);
  });

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * POST /insight-conflicts/batch/analyze
   * Batch analyze multiple conflicts
   */
  fastify.post('/batch/analyze', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const input = batchAnalyzeSchema.parse(request.body);

    const result = await insightConflictService.batchAnalyze(orgId, userId, input);

    return reply.send(result);
  });

  /**
   * POST /insight-conflicts/batch/resolve
   * Batch resolve multiple conflicts
   */
  fastify.post('/batch/resolve', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const input = batchResolveSchema.parse(request.body);

    const result = await insightConflictService.batchResolve(orgId, userId, input);

    return reply.send(result);
  });

  /**
   * POST /insight-conflicts/batch/dismiss
   * Batch dismiss multiple conflicts
   */
  fastify.post('/batch/dismiss', async (request, reply) => {
    const orgId = (request as unknown as { orgId: string }).orgId;
    const userId = (request as unknown as { userId: string }).userId;
    const input = batchDismissSchema.parse(request.body);

    const result = await insightConflictService.batchDismiss(orgId, userId, input);

    return reply.send(result);
  });
};

export default insightConflictRoutes;
