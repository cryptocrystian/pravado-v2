/**
 * Scenario Simulation & Autonomous Playbook Orchestration API Routes (Sprint S67)
 * RESTful endpoints for scenario playbooks, simulations, and run orchestration
 */

import { FastifyPluginAsync } from 'fastify';
import { isEnabled } from '@pravado/feature-flags';
import {
  createScenarioPlaybookSchema,
  updateScenarioPlaybookSchema,
  listPlaybooksSchema,
  updatePlaybookStepSchema,
  addPlaybookStepSchema,
  reorderPlaybookStepsSchema,
  createScenarioSchema,
  updateScenarioSchema,
  listScenariosSchema,
  simulateScenarioSchema,
  startScenarioRunSchema,
  listScenarioRunsSchema,
  approveScenarioStepSchema,
  cancelScenarioRunSchema,
  listScenarioAuditLogsSchema,
  playbookIdParamSchema,
  scenarioIdParamSchema,
  runIdParamSchema,
  stepIdParamSchema,
} from '@pravado/validators';
import {
  CreateScenarioPlaybookInput,
  UpdateScenarioPlaybookInput,
  ScenarioListPlaybooksQuery,
  CreatePlaybookStepInput,
  UpdatePlaybookStepInput,
  CreateScenarioInput,
  UpdateScenarioInput,
  ListScenariosQuery,
  SimulateScenarioInput,
  StartScenarioRunInput,
  ListScenarioRunsQuery,
  ApproveScenarioStepInput,
  CancelScenarioRunInput,
  ListScenarioAuditLogsQuery,
} from '@pravado/types';
import * as service from '../../services/scenarioPlaybookService';

const scenarioPlaybookRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature flag check middleware
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!isEnabled('ENABLE_SCENARIO_PLAYBOOK')) {
      return reply.status(403).send({
        error: 'Feature not enabled',
        code: 'FEATURE_DISABLED',
      });
    }
  });

  // Helper to get service context
  const getContext = (request: { supabase: unknown; orgId: string; userId: string }) => ({
    supabase: request.supabase as service.ServiceContext['supabase'],
    orgId: request.orgId,
    userId: request.userId,
  });

  // ==========================================================================
  // PLAYBOOK ENDPOINTS
  // ==========================================================================

  // Create playbook
  fastify.post('/playbooks', async (request, reply) => {
    try {
      const input = createScenarioPlaybookSchema.parse(request.body) as unknown as CreateScenarioPlaybookInput;
      const ctx = getContext(request as never);
      const playbook = await service.createPlaybook(ctx, input);
      return reply.status(201).send(playbook);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // List playbooks
  fastify.get('/playbooks', async (request, reply) => {
    try {
      const input = listPlaybooksSchema.parse(request.query) as unknown as ScenarioListPlaybooksQuery;
      const ctx = getContext(request as never);
      const result = await service.listPlaybooks(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get playbook by ID
  fastify.get('/playbooks/:playbookId', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const playbook = await service.getPlaybook(ctx, playbookId);
      if (!playbook) {
        return reply.status(404).send({ error: 'Playbook not found' });
      }
      return reply.send(playbook);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get playbook with steps
  fastify.get('/playbooks/:playbookId/full', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const playbook = await service.getPlaybookWithSteps(ctx, playbookId);
      if (!playbook) {
        return reply.status(404).send({ error: 'Playbook not found' });
      }
      return reply.send(playbook);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Update playbook
  fastify.patch('/playbooks/:playbookId', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const input = updateScenarioPlaybookSchema.parse(request.body) as unknown as UpdateScenarioPlaybookInput;
      const ctx = getContext(request as never);
      const playbook = await service.updatePlaybook(ctx, playbookId, input);
      return reply.send(playbook);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Delete playbook
  fastify.delete('/playbooks/:playbookId', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      await service.deletePlaybook(ctx, playbookId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Activate playbook
  fastify.post('/playbooks/:playbookId/activate', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const playbook = await service.activatePlaybook(ctx, playbookId);
      return reply.send(playbook);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Archive playbook
  fastify.post('/playbooks/:playbookId/archive', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const playbook = await service.archivePlaybook(ctx, playbookId);
      return reply.send(playbook);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // PLAYBOOK STEP ENDPOINTS
  // ==========================================================================

  // Add step to playbook
  fastify.post('/playbooks/:playbookId/steps', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const body = addPlaybookStepSchema.parse({
        playbookId,
        step: request.body,
        insertAtIndex: (request.body as Record<string, unknown>).insertAtIndex,
      });
      const ctx = getContext(request as never);
      const step = await service.addPlaybookStep(
        ctx,
        playbookId,
        body.step as unknown as CreatePlaybookStepInput,
        body.insertAtIndex
      );
      return reply.status(201).send(step);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Update step
  fastify.patch('/steps/:stepId', async (request, reply) => {
    try {
      const { stepId } = stepIdParamSchema.parse(request.params);
      const input = updatePlaybookStepSchema.parse(request.body) as unknown as UpdatePlaybookStepInput;
      const ctx = getContext(request as never);
      const step = await service.updatePlaybookStep(ctx, stepId, input);
      return reply.send(step);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Delete step
  fastify.delete('/steps/:stepId', async (request, reply) => {
    try {
      const { stepId } = stepIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      await service.deletePlaybookStep(ctx, stepId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Reorder steps
  fastify.post('/playbooks/:playbookId/steps/reorder', async (request, reply) => {
    try {
      const { playbookId } = playbookIdParamSchema.parse(request.params);
      const body = reorderPlaybookStepsSchema.parse({
        playbookId,
        stepOrder: (request.body as Record<string, unknown>).stepOrder,
      });
      const ctx = getContext(request as never);
      const steps = await service.reorderPlaybookSteps(ctx, playbookId, body.stepOrder);
      return reply.send({ steps });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // SCENARIO ENDPOINTS
  // ==========================================================================

  // Create scenario
  fastify.post('/scenarios', async (request, reply) => {
    try {
      const input = createScenarioSchema.parse(request.body) as unknown as CreateScenarioInput;
      const ctx = getContext(request as never);
      const scenario = await service.createScenario(ctx, input);
      return reply.status(201).send(scenario);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // List scenarios
  fastify.get('/scenarios', async (request, reply) => {
    try {
      const input = listScenariosSchema.parse(request.query) as unknown as ListScenariosQuery;
      const ctx = getContext(request as never);
      const result = await service.listScenarios(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get scenario by ID
  fastify.get('/scenarios/:scenarioId', async (request, reply) => {
    try {
      const { scenarioId } = scenarioIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const scenario = await service.getScenario(ctx, scenarioId);
      if (!scenario) {
        return reply.status(404).send({ error: 'Scenario not found' });
      }
      return reply.send(scenario);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get scenario with playbook
  fastify.get('/scenarios/:scenarioId/full', async (request, reply) => {
    try {
      const { scenarioId } = scenarioIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const scenario = await service.getScenarioWithPlaybook(ctx, scenarioId);
      if (!scenario) {
        return reply.status(404).send({ error: 'Scenario not found' });
      }
      return reply.send(scenario);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Update scenario
  fastify.patch('/scenarios/:scenarioId', async (request, reply) => {
    try {
      const { scenarioId } = scenarioIdParamSchema.parse(request.params);
      const input = updateScenarioSchema.parse(request.body) as unknown as UpdateScenarioInput;
      const ctx = getContext(request as never);
      const scenario = await service.updateScenario(ctx, scenarioId, input);
      return reply.send(scenario);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Delete scenario
  fastify.delete('/scenarios/:scenarioId', async (request, reply) => {
    try {
      const { scenarioId } = scenarioIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      await service.deleteScenario(ctx, scenarioId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // SIMULATION ENDPOINTS
  // ==========================================================================

  // Simulate scenario
  fastify.post('/scenarios/:scenarioId/simulate', async (request, reply) => {
    try {
      const { scenarioId } = scenarioIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const input = simulateScenarioSchema.parse({
        scenarioId,
        ...body,
      }) as unknown as SimulateScenarioInput;
      const ctx = getContext(request as never);
      const result = await service.simulateScenario(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // RUN ENDPOINTS
  // ==========================================================================

  // Start scenario run
  fastify.post('/runs', async (request, reply) => {
    try {
      const input = startScenarioRunSchema.parse(request.body) as unknown as StartScenarioRunInput;
      const ctx = getContext(request as never);
      const run = await service.startScenarioRun(ctx, input);
      return reply.status(201).send(run);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // List runs
  fastify.get('/runs', async (request, reply) => {
    try {
      const input = listScenarioRunsSchema.parse(request.query) as unknown as ListScenarioRunsQuery;
      const ctx = getContext(request as never);
      const result = await service.listScenarioRuns(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get run by ID
  fastify.get('/runs/:runId', async (request, reply) => {
    try {
      const { runId } = runIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const run = await service.getScenarioRun(ctx, runId);
      if (!run) {
        return reply.status(404).send({ error: 'Run not found' });
      }
      return reply.send(run);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Get run with details
  fastify.get('/runs/:runId/full', async (request, reply) => {
    try {
      const { runId } = runIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const run = await service.getRunWithDetails(ctx, runId);
      if (!run) {
        return reply.status(404).send({ error: 'Run not found' });
      }
      return reply.send(run);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Pause run
  fastify.post('/runs/:runId/pause', async (request, reply) => {
    try {
      const { runId } = runIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const run = await service.pauseScenarioRun(ctx, runId);
      return reply.send(run);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Resume run
  fastify.post('/runs/:runId/resume', async (request, reply) => {
    try {
      const { runId } = runIdParamSchema.parse(request.params);
      const ctx = getContext(request as never);
      const run = await service.resumeScenarioRun(ctx, runId);
      return reply.send(run);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // Cancel run
  fastify.post('/runs/:runId/cancel', async (request, reply) => {
    try {
      const { runId } = runIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const input = cancelScenarioRunSchema.parse({
        runId,
        reason: body.reason,
      }) as unknown as CancelScenarioRunInput;
      const ctx = getContext(request as never);
      const run = await service.cancelScenarioRun(ctx, input);
      return reply.send(run);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // STEP APPROVAL ENDPOINTS
  // ==========================================================================

  // Approve/reject step
  fastify.post('/run-steps/:stepId/approve', async (request, reply) => {
    try {
      const { stepId } = stepIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const input = approveScenarioStepSchema.parse({
        stepId,
        approved: body.approved,
        notes: body.notes,
      }) as unknown as ApproveScenarioStepInput;
      const ctx = getContext(request as never);
      const step = await service.approveScenarioStep(ctx, input);
      return reply.send(step);
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
      const input = listScenarioAuditLogsSchema.parse(request.query) as unknown as ListScenarioAuditLogsQuery;
      const ctx = getContext(request as never);
      const result = await service.listScenarioAuditLogs(ctx, input);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });

  // ==========================================================================
  // STATS ENDPOINT
  // ==========================================================================

  // Get stats
  fastify.get('/stats', async (request, reply) => {
    try {
      const ctx = getContext(request as never);
      const stats = await service.getScenarioPlaybookStats(ctx);
      return reply.send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: String(error) });
    }
  });
};

export default scenarioPlaybookRoutes;
