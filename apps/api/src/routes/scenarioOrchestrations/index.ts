/**
 * Scenario Orchestration Routes (Sprint S72)
 *
 * API endpoints for multi-scenario orchestration suites.
 */

import { FastifyPluginAsync } from 'fastify';
import {
  createScenarioSuiteSchema,
  updateScenarioSuiteSchema,
  listScenarioSuitesSchema,
  listSuiteRunsSchema,
  listSuiteRunItemsSchema,
  listSuiteAuditEventsSchema,
  startScenarioSuiteRunSchema,
  advanceSuiteRunSchema,
  abortSuiteRunSchema,
  createSuiteItemSchema,
  updateSuiteItemSchema,
  suiteIdParamSchema,
  suiteRunIdParamSchema,
  suiteItemIdParamSchema,
  generateSuiteNarrativeSchema,
  generateSuiteRiskMapSchema,
} from '@pravado/validators';
import { isEnabled } from '@pravado/feature-flags';
import * as service from '../../services/scenarioOrchestrationService';

// Helper to get service context from request
const getContext = (request: { supabase: unknown; orgId: string; userId: string }) => ({
  supabase: request.supabase as service.ScenarioOrchestrationContext['supabase'],
  orgId: request.orgId,
  userId: request.userId,
});

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

const scenarioOrchestrationRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check middleware
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!isEnabled('ENABLE_SCENARIO_ORCHESTRATION')) {
      return reply.status(403).send({
        success: false,
        error: 'Scenario Orchestration feature is not enabled for this organization',
      });
    }
  });

  // ========================================================================
  // SUITE CRUD
  // ========================================================================

  // List suites
  fastify.get('/suites', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const query = listScenarioSuitesSchema.parse(request.query);
      const result = await service.listSuites(ctx, query);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list suites';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Create suite
  fastify.post('/suites', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const input = createScenarioSuiteSchema.parse(request.body);
      const result = await service.createSuite(ctx, input);
      return reply.status(201).send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create suite';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Get suite by ID
  fastify.get('/suites/:id', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = suiteIdParamSchema.parse(request.params);
      const result = await service.getSuite(ctx, id);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get suite';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Update suite
  fastify.patch('/suites/:id', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = suiteIdParamSchema.parse(request.params);
      const input = updateScenarioSuiteSchema.parse(request.body);
      const result = await service.updateSuite(ctx, id, input);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update suite';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Archive suite
  fastify.post('/suites/:id/archive', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = suiteIdParamSchema.parse(request.params);
      const body = request.body as { reason?: string } | undefined;
      const result = await service.archiveSuite(ctx, id, body?.reason);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive suite';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // SUITE ITEMS
  // ========================================================================

  // Add item to suite
  fastify.post('/suites/:id/items', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = suiteIdParamSchema.parse(request.params);
      const input = createSuiteItemSchema.parse(request.body);
      const item = await service.addSuiteItem(ctx, id, input);
      return reply.status(201).send({ success: true, item });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add suite item';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Update suite item
  fastify.patch('/suite-items/:itemId', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { itemId } = suiteItemIdParamSchema.parse(request.params);
      const input = updateSuiteItemSchema.parse(request.body);
      const item = await service.updateSuiteItem(ctx, itemId, input);
      return reply.send({ success: true, item });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update suite item';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Remove suite item
  fastify.delete('/suite-items/:itemId', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { itemId } = suiteItemIdParamSchema.parse(request.params);
      const result = await service.removeSuiteItem(ctx, itemId);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove suite item';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // SUITE RUNS
  // ========================================================================

  // Start suite run
  fastify.post('/suites/:id/runs', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = suiteIdParamSchema.parse(request.params);
      const input = startScenarioSuiteRunSchema.parse(request.body || {});
      const result = await service.startSuiteRun(ctx, id, input);
      return reply.status(201).send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start suite run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // List suite runs
  fastify.get('/suites/:id/runs', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = suiteIdParamSchema.parse(request.params);
      const query = listSuiteRunsSchema.parse(request.query);
      const result = await service.listSuiteRuns(ctx, id, query);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list suite runs';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Get suite run detail
  fastify.get('/suite-runs/:runId', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      const result = await service.getSuiteRun(ctx, runId);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get suite run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // List suite run items
  fastify.get('/suite-runs/:runId/items', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      // Validate query params (used for validation only)
      listSuiteRunItemsSchema.parse(request.query);
      const result = await service.listSuiteRunItems(ctx, runId);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list run items';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Advance suite run
  fastify.post('/suite-runs/:runId/advance', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      const input = advanceSuiteRunSchema.parse(request.body || {});
      const result = await service.advanceSuiteRun(ctx, runId, input);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to advance suite run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Abort suite run
  fastify.post('/suite-runs/:runId/abort', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      const input = abortSuiteRunSchema.parse(request.body || {});
      const result = await service.abortSuiteRun(ctx, runId, input);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to abort suite run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // METRICS & OBSERVABILITY
  // ========================================================================

  // Get suite run metrics
  fastify.get('/suite-runs/:runId/metrics', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      const result = await service.getSuiteRunMetrics(ctx, runId);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get run metrics';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Get suite statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const result = await service.getSuiteStats(ctx);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get statistics';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // NARRATIVE & RISK MAP
  // ========================================================================

  // Generate suite narrative
  fastify.post('/suite-runs/:runId/narrative', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      const body = request.body as { format?: string; includeRecommendations?: boolean } | undefined;
      const input = generateSuiteNarrativeSchema.parse({ runId, ...body });
      const result = await service.generateSuiteNarrative(ctx, input);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate narrative';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Generate suite risk map
  fastify.post('/suite-runs/:runId/risk-map', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      const body = request.body as { includeOpportunities?: boolean; includeMitigations?: boolean } | undefined;
      const input = generateSuiteRiskMapSchema.parse({ runId, ...body });
      const result = await service.generateSuiteRiskMap(ctx, input);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate risk map';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // AUDIT LOG
  // ========================================================================

  // List audit events for a suite
  fastify.get('/suites/:id/audit-log', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = suiteIdParamSchema.parse(request.params);
      const query = listSuiteAuditEventsSchema.parse({ ...(request.query as Record<string, unknown>), suiteId: id });
      const result = await service.listAuditEvents(ctx, query);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list audit events';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // List audit events for a run
  fastify.get('/suite-runs/:runId/audit-log', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = suiteRunIdParamSchema.parse(request.params);
      const query = listSuiteAuditEventsSchema.parse({ ...(request.query as Record<string, unknown>), suiteRunId: runId });
      const result = await service.listAuditEvents(ctx, query);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list audit events';
      return reply.status(400).send({ success: false, error: message });
    }
  });
};

export default scenarioOrchestrationRoutes;
