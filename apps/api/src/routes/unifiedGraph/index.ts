/**
 * Unified Intelligence Graph API Routes (Sprint S66)
 * Global Insight Fabric & Unified Intelligence Graph V1
 */

import { FastifyPluginAsync } from 'fastify';
import { isEnabled } from '@pravado/feature-flags';
import {
  createNodeSchema,
  updateNodeSchema,
  listNodesSchema,
  createEdgeSchema,
  updateEdgeSchema,
  listEdgesSchema,
  mergeNodesSchema,
  unifiedGraphQuerySchema,
  generateSnapshotSchema,
  listSnapshotsSchema,
  explainPathSchema,
  traverseGraphSchema,
  findNeighborsSchema,
  generateEmbeddingsSchema,
  semanticSearchSchema,
  computeMetricsSchema,
  listAuditLogsSchema,
} from '@pravado/validators';
import {
  CreateNodeInput,
  UpdateNodeInput,
  ListNodesInput,
  CreateEdgeInput,
  UpdateEdgeInput,
  ListEdgesInput,
  MergeNodesInput,
  GraphQueryInput,
  GenerateSnapshotInput,
  ExplainPathInput,
  GenerateEmbeddingsInput,
  ComputeMetricsInput,
} from '@pravado/types';
import * as graphService from '../../services/unifiedIntelligenceGraphService';

const unifiedGraphRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check middleware
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!isEnabled('ENABLE_UNIFIED_INTELLIGENCE_GRAPH')) {
      return reply.status(403).send({
        error: 'Feature not enabled',
        code: 'FEATURE_DISABLED',
      });
    }
  });

  // Helper to get service context
  const getContext = (request: { supabase: unknown; orgId: string; userId: string }) => ({
    supabase: request.supabase as graphService.ServiceContext['supabase'],
    orgId: request.orgId,
    userId: request.userId,
  });

  // ==========================================================================
  // NODE ENDPOINTS
  // ==========================================================================

  // Create node
  fastify.post('/nodes', async (request, reply) => {
    try {
      const input = createNodeSchema.parse(request.body) as unknown as CreateNodeInput;
      const ctx = getContext(request as never);
      const node = await graphService.createNode(ctx, input);
      return reply.status(201).send(node);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // List nodes
  fastify.get('/nodes', async (request, reply) => {
    try {
      const input = listNodesSchema.parse(request.query) as unknown as ListNodesInput;
      const ctx = getContext(request as never);
      const result = await graphService.listNodes(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get node by ID
  fastify.get('/nodes/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      const node = await graphService.getNode(ctx, id);
      if (!node) {
        return reply.status(404).send({ error: 'Node not found' });
      }
      return reply.send(node);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get node with connections
  fastify.get('/nodes/:id/connections', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      const result = await graphService.getNodeWithConnections(ctx, id);
      if (!result) {
        return reply.status(404).send({ error: 'Node not found' });
      }
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Update node
  fastify.patch('/nodes/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const input = updateNodeSchema.parse(request.body) as unknown as UpdateNodeInput;
      const ctx = getContext(request as never);
      const node = await graphService.updateNode(ctx, id, input);
      return reply.send(node);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Delete node
  fastify.delete('/nodes/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      await graphService.deleteNode(ctx, id);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get node neighbors
  fastify.get('/nodes/:id/neighbors', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      // Validate but don't use the result - using getNodeWithConnections instead
      const query = (request.query || {}) as Record<string, unknown>;
      findNeighborsSchema.parse({ ...query, nodeId: id });
      const ctx = getContext(request as never);
      const result = await graphService.getNodeWithConnections(ctx, id);
      if (!result) {
        return reply.status(404).send({ error: 'Node not found' });
      }
      return reply.send({
        node: result.node,
        neighbors: result.neighbors,
        edges: [...result.incomingEdges, ...result.outgoingEdges],
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // EDGE ENDPOINTS
  // ==========================================================================

  // Create edge
  fastify.post('/edges', async (request, reply) => {
    try {
      const input = createEdgeSchema.parse(request.body) as unknown as CreateEdgeInput;
      const ctx = getContext(request as never);
      const edge = await graphService.createEdge(ctx, input);
      return reply.status(201).send(edge);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // List edges
  fastify.get('/edges', async (request, reply) => {
    try {
      const input = listEdgesSchema.parse(request.query) as unknown as ListEdgesInput;
      const ctx = getContext(request as never);
      const result = await graphService.listEdges(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get edge by ID
  fastify.get('/edges/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      const edge = await graphService.getEdge(ctx, id);
      if (!edge) {
        return reply.status(404).send({ error: 'Edge not found' });
      }
      return reply.send(edge);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get edge with nodes
  fastify.get('/edges/:id/nodes', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      const result = await graphService.getEdgeWithNodes(ctx, id);
      if (!result) {
        return reply.status(404).send({ error: 'Edge not found' });
      }
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Update edge
  fastify.patch('/edges/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const input = updateEdgeSchema.parse(request.body) as unknown as UpdateEdgeInput;
      const ctx = getContext(request as never);
      const edge = await graphService.updateEdge(ctx, id, input);
      return reply.send(edge);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Delete edge
  fastify.delete('/edges/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      await graphService.deleteEdge(ctx, id);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // MERGE ENDPOINTS
  // ==========================================================================

  // Merge nodes
  fastify.post('/merge', async (request, reply) => {
    try {
      const input = mergeNodesSchema.parse(request.body) as unknown as MergeNodesInput;
      const ctx = getContext(request as never);
      const result = await graphService.mergeNodes(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // QUERY & TRAVERSAL ENDPOINTS
  // ==========================================================================

  // Query graph
  fastify.post('/query', async (request, reply) => {
    try {
      const input = unifiedGraphQuerySchema.parse(request.body) as unknown as GraphQueryInput;
      const ctx = getContext(request as never);
      const result = await graphService.queryGraph(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Traverse graph
  fastify.post('/traverse', async (request, reply) => {
    try {
      const input = traverseGraphSchema.parse(request.body) as never;
      const ctx = getContext(request as never);
      const result = await graphService.traverseGraph(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Find shortest path
  fastify.post('/path', async (request, reply) => {
    try {
      const { startNodeId, endNodeId, maxDepth } = request.body as {
        startNodeId: string;
        endNodeId: string;
        maxDepth?: number;
      };
      const ctx = getContext(request as never);
      const path = await graphService.findShortestPath(ctx, startNodeId, endNodeId, maxDepth);
      if (!path) {
        return reply.status(404).send({ error: 'No path found' });
      }
      return reply.send(path);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Explain path (LLM-powered)
  fastify.post('/explain-path', async (request, reply) => {
    try {
      const input = explainPathSchema.parse(request.body) as unknown as ExplainPathInput;
      const ctx = getContext(request as never);
      const result = await graphService.explainPath(ctx, input);
      if (!result) {
        return reply.status(404).send({ error: 'No path found' });
      }
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Semantic search
  fastify.post('/search', async (request, reply) => {
    try {
      const input = semanticSearchSchema.parse(request.body) as never;
      const ctx = getContext(request as never);
      const results = await graphService.semanticSearch(ctx, input);
      return reply.send({ results });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // METRICS ENDPOINTS
  // ==========================================================================

  // Get metrics
  fastify.get('/metrics', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const metrics = await graphService.getMetrics(ctx);
      return reply.send(metrics);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Compute metrics
  fastify.post('/metrics/compute', async (request, reply) => {
    try {
      const input = computeMetricsSchema.parse(request.body) as unknown as ComputeMetricsInput;
      const ctx = getContext(request as never);
      const result = await graphService.computeMetrics(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // EMBEDDINGS ENDPOINTS
  // ==========================================================================

  // Generate embeddings
  fastify.post('/embeddings', async (request, reply) => {
    try {
      const input = generateEmbeddingsSchema.parse(request.body) as unknown as GenerateEmbeddingsInput;
      const ctx = getContext(request as never);
      const result = await graphService.generateEmbeddings(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // SNAPSHOT ENDPOINTS
  // ==========================================================================

  // Create snapshot
  fastify.post('/snapshots', async (request, reply) => {
    try {
      const input = generateSnapshotSchema.parse(request.body) as unknown as GenerateSnapshotInput;
      const ctx = getContext(request as never);
      const snapshot = await graphService.createSnapshot(ctx, input);
      return reply.status(201).send(snapshot);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // List snapshots
  fastify.get('/snapshots', async (request, reply) => {
    try {
      const input = listSnapshotsSchema.parse(request.query) as never;
      const ctx = getContext(request as never);
      const result = await graphService.listSnapshots(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get snapshot by ID
  fastify.get('/snapshots/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      const snapshot = await graphService.getSnapshot(ctx, id);
      if (!snapshot) {
        return reply.status(404).send({ error: 'Snapshot not found' });
      }
      return reply.send(snapshot);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Regenerate snapshot
  fastify.post('/snapshots/:id/regenerate', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ctx = getContext(request as never);
      const snapshot = await graphService.regenerateSnapshot(ctx, id);
      return reply.send(snapshot);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // AUDIT LOG ENDPOINTS
  // ==========================================================================

  // List audit logs
  fastify.get('/audit', async (request, reply) => {
    try {
      const input = listAuditLogsSchema.parse(request.query) as never;
      const ctx = getContext(request as never);
      const result = await graphService.listAuditLogs(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // STATS ENDPOINT
  // ==========================================================================

  // Get graph stats
  fastify.get('/stats', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const stats = await graphService.getStats(ctx);
      return reply.send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });
};

export default unifiedGraphRoutes;
