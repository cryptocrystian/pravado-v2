/**
 * AI Scenario Simulation Routes (Sprint S71)
 *
 * API endpoints for autonomous multi-agent scenario simulations.
 */

import { FastifyPluginAsync } from 'fastify';
import {
  createAISimulationSchema,
  updateAISimulationSchema,
  listAISimulationsSchema,
  startSimulationRunSchema,
  listSimulationRunsSchema,
  stepRunSchema,
  postAgentFeedbackSchema,
  listRunTurnsSchema,
  listRunMetricsSchema,
  listRunOutcomesSchema,
  archiveSimulationSchema,
  runUntilConvergedSchema,
  summarizeOutcomesSchema,
  simulationIdParamSchema,
  aiSimRunIdParamSchema,
} from '@pravado/validators';
import { isEnabled } from '@pravado/feature-flags';
import * as service from '../../services/aiScenarioSimulationService';

// Helper to get service context from request
const getContext = (request: { supabase: unknown; orgId: string; userId: string }) => ({
  supabase: request.supabase as service.AIScenarioSimulationContext['supabase'],
  orgId: request.orgId,
  userId: request.userId,
});

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

const aiScenarioSimulationRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check middleware
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!isEnabled('ENABLE_AI_SCENARIO_SIMULATIONS')) {
      return reply.status(403).send({
        success: false,
        error: 'AI Scenario Simulations feature is not enabled for this organization',
      });
    }
  });

  // ========================================================================
  // SIMULATION CRUD
  // ========================================================================

  // List simulations
  fastify.get('/simulations', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const query = listAISimulationsSchema.parse(request.query);
      const result = await service.listSimulations(ctx, query);
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list simulations';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Create simulation
  fastify.post('/simulations', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const input = createAISimulationSchema.parse(request.body);
      const simulation = await service.createSimulation(ctx, input);
      return reply.status(201).send({ success: true, simulation });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create simulation';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Get simulation by ID
  fastify.get('/simulations/:id', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = simulationIdParamSchema.parse(request.params);
      const simulation = await service.getSimulationById(ctx, id);

      if (!simulation) {
        return reply.status(404).send({ success: false, error: 'Simulation not found' });
      }

      return reply.send({ success: true, simulation });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get simulation';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Update simulation
  fastify.patch('/simulations/:id', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = simulationIdParamSchema.parse(request.params);
      const input = updateAISimulationSchema.parse(request.body);
      const simulation = await service.updateSimulation(ctx, id, input);
      return reply.send({ success: true, simulation });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update simulation';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Archive simulation
  fastify.post('/simulations/:id/archive', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = simulationIdParamSchema.parse(request.params);
      const input = archiveSimulationSchema.parse(request.body || {});
      const result = await service.archiveSimulation(ctx, id, input.reason);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive simulation';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Delete simulation (permanent)
  fastify.delete('/simulations/:id', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = simulationIdParamSchema.parse(request.params);
      await service.deleteSimulation(ctx, id);
      return reply.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete simulation';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // RUN LIFECYCLE
  // ========================================================================

  // Start a new run for simulation
  fastify.post('/simulations/:id/runs', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = simulationIdParamSchema.parse(request.params);
      const input = startSimulationRunSchema.parse(request.body || {});
      const run = await service.startRun(ctx, id, input);
      return reply.status(201).send({ success: true, run });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // List runs for simulation
  fastify.get('/simulations/:id/runs', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { id } = simulationIdParamSchema.parse(request.params);
      const query = listSimulationRunsSchema.parse(request.query);
      const result = await service.listRunsForSimulation(ctx, id, query);
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list runs';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Get run detail
  fastify.get('/runs/:runId', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const result = await service.getRunDetail(ctx, runId);

      if (!result) {
        return reply.status(404).send({ success: false, error: 'Run not found' });
      }

      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Advance run by one step
  fastify.post('/runs/:runId/step', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const input = stepRunSchema.parse(request.body || {});
      const run = await service.runOneStep(ctx, runId, input);
      return reply.send({ success: true, run });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to step run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Run until converged
  fastify.post('/runs/:runId/run-to-completion', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const input = runUntilConvergedSchema.parse(request.body || {});
      const result = await service.runUntilConverged(ctx, runId, input);
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run to completion';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Post agent feedback
  fastify.post('/runs/:runId/feedback', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const input = postAgentFeedbackSchema.parse(request.body);
      const result = await service.postAgentFeedback(ctx, runId, input);
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post feedback';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Abort run
  fastify.post('/runs/:runId/abort', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const run = await service.abortRun(ctx, runId);
      return reply.send({ success: true, run });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to abort run';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // OBSERVABILITY
  // ========================================================================

  // List turns for run
  fastify.get('/runs/:runId/turns', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const query = listRunTurnsSchema.parse(request.query);
      const result = await service.listRunTurns(ctx, runId, query);
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list turns';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // List metrics for run
  fastify.get('/runs/:runId/metrics', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const query = listRunMetricsSchema.parse(request.query);
      const result = await service.listRunMetrics(ctx, runId, query);
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list metrics';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // List outcomes for run
  fastify.get('/runs/:runId/outcomes', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const query = listRunOutcomesSchema.parse(request.query);
      const result = await service.listRunOutcomes(ctx, runId, query);
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list outcomes';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // Summarize outcomes for run
  fastify.post('/runs/:runId/summarize', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const { runId } = aiSimRunIdParamSchema.parse(request.params);
      const input = summarizeOutcomesSchema.parse(request.body || {});
      const result = await service.summarizeOutcomes(ctx, runId, input);
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to summarize outcomes';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // STATISTICS
  // ========================================================================

  // Get simulation statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const stats = await service.getSimulationStats(ctx);
      return reply.send({ success: true, stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      return reply.status(400).send({ success: false, error: message });
    }
  });

  // ========================================================================
  // AUDIT LOGS
  // ========================================================================

  // List audit logs
  fastify.get('/audit', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const query = request.query as {
        simulationId?: string;
        runId?: string;
        eventType?: string;
        limit?: string;
        offset?: string;
      };
      const result = await service.listAuditLogs(ctx, {
        simulationId: query.simulationId,
        runId: query.runId,
        eventType: query.eventType,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        offset: query.offset ? parseInt(query.offset, 10) : undefined,
      });
      return reply.send({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list audit logs';
      return reply.status(400).send({ success: false, error: message });
    }
  });
};

export default aiScenarioSimulationRoutes;
