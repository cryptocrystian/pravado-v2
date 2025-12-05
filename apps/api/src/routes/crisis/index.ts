/**
 * Crisis Response & Escalation Engine Routes (Sprint S55)
 *
 * REST API endpoints for crisis detection, incident management,
 * escalation rules, action recommendations, and crisis briefings.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { CrisisService } from '../../services/crisisService';
import {
  createIncidentSchema,
  updateIncidentSchema,
  listIncidentsSchema,
  createActionSchema,
  updateActionSchema,
  listActionsSchema,
  createEscalationRuleSchema,
  updateEscalationRuleSchema,
  listEscalationRulesSchema,
  listSignalsSchema,
  acknowledgeSignalSchema,
  generateCrisisBriefSchema,
  regenerateSectionSchema,
  updateSectionSchema,
  listBriefsSchema,
  triggerDetectionSchema,
} from '@pravado/validators';
import { LlmRouter } from '@pravado/utils';
import { isFeatureEnabled } from '@pravado/feature-flags';
import { z } from 'zod';
import type {
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentFilters,
  SignalFilters,
  CreateActionRequest,
  UpdateActionRequest,
  ActionFilters,
  CreateEscalationRuleRequest,
  UpdateEscalationRuleRequest,
  GenerateCrisisBriefRequest,
  BriefFilters,
} from '@pravado/types';
import type { CrisisSourceSystem } from '@pravado/types';

// Helper to extract orgId from headers
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Missing x-org-id header');
  }
  return orgId;
}

// Helper to extract userId from request (from auth middleware)
function getUserId(request: FastifyRequest): string {
  const userId = (request as any).user?.id || (request.headers['x-user-id'] as string);
  if (!userId) {
    throw new Error('Missing user ID');
  }
  return userId;
}

export default async function crisisRoutes(server: FastifyInstance) {
  // Feature flag check
  if (!isFeatureEnabled('ENABLE_CRISIS_ENGINE')) {
    server.log.warn('Crisis engine feature is disabled');
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Initialize LLM Router if configured
  let llmRouter: LlmRouter | undefined;
  try {
    if (env.LLM_OPENAI_API_KEY || env.LLM_ANTHROPIC_API_KEY) {
      llmRouter = new LlmRouter({
        openaiApiKey: env.LLM_OPENAI_API_KEY,
        anthropicApiKey: env.LLM_ANTHROPIC_API_KEY,
      });
    }
  } catch (error) {
    server.log.warn({ err: error }, 'LLM Router not initialized');
  }

  const service = new CrisisService(supabase, llmRouter);

  // =========================================================================
  // DASHBOARD ENDPOINTS
  // =========================================================================

  /**
   * GET /dashboard
   * Get crisis dashboard statistics
   */
  server.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const stats = await service.getDashboardStats(orgId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      server.log.error('Error fetching dashboard stats:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // INCIDENT ENDPOINTS
  // =========================================================================

  /**
   * POST /incidents
   * Create new incident
   */
  server.post('/incidents', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createIncidentSchema.parse(request.body);
      const incident = await service.createIncident(orgId, userId, validated as CreateIncidentRequest);

      return reply.status(201).send({
        success: true,
        data: incident,
      });
    } catch (error: any) {
      server.log.error('Error creating incident:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /incidents
   * List incidents with filters
   */
  server.get('/incidents', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const filters = listIncidentsSchema.parse({
        status: query.status ? query.status.split(',') : undefined,
        severity: query.severity ? query.severity.split(',') : undefined,
        trajectory: query.trajectory ? query.trajectory.split(',') : undefined,
        propagationLevel: query.propagationLevel ? query.propagationLevel.split(',') : undefined,
        crisisType: query.crisisType,
        searchQuery: query.searchQuery,
        ownerId: query.ownerId,
        isEscalated: query.isEscalated === 'true' ? true : query.isEscalated === 'false' ? false : undefined,
        escalationLevelGte: query.escalationLevelGte ? parseInt(query.escalationLevelGte, 10) : undefined,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        offset: query.offset ? parseInt(query.offset, 10) : undefined,
      });

      const result = await service.getIncidents(
        orgId,
        {
          ...filters,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        } as IncidentFilters,
        filters.limit || 20,
        filters.offset || 0
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error listing incidents:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /incidents/:id
   * Get single incident
   */
  server.get('/incidents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };
      const incident = await service.getIncident(orgId, id);

      return reply.send({
        success: true,
        data: incident,
      });
    } catch (error: any) {
      server.log.error('Error fetching incident:', error);
      return reply.status(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /incidents/:id
   * Update incident
   */
  server.patch('/incidents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const validated = updateIncidentSchema.parse(request.body);
      const incident = await service.updateIncident(orgId, userId, id, validated as UpdateIncidentRequest);

      return reply.send({
        success: true,
        data: incident,
      });
    } catch (error: any) {
      server.log.error('Error updating incident:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /incidents/:id/close
   * Close incident
   */
  server.post('/incidents/:id/close', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const body = request.body as { resolutionNotes?: string } | undefined;
      const incident = await service.closeIncident(orgId, userId, id, body?.resolutionNotes);

      return reply.send({
        success: true,
        data: incident,
      });
    } catch (error: any) {
      server.log.error('Error closing incident:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /incidents/:id/escalate
   * Escalate incident
   */
  server.post('/incidents/:id/escalate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const body = request.body as { level: number };
      const level = z.number().int().min(1).max(5).parse(body.level);
      const incident = await service.escalateIncident(orgId, userId, id, level);

      return reply.send({
        success: true,
        data: incident,
      });
    } catch (error: any) {
      server.log.error('Error escalating incident:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /incidents/:id/recommendations
   * Generate AI action recommendations
   */
  server.post('/incidents/:id/recommendations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const actions = await service.generateActionRecommendations(orgId, userId, id);

      return reply.status(201).send({
        success: true,
        data: actions,
      });
    } catch (error: any) {
      server.log.error('Error generating recommendations:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // SIGNAL ENDPOINTS
  // =========================================================================

  /**
   * GET /signals
   * List signals
   */
  server.get('/signals', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const filters = listSignalsSchema.parse({
        severity: query.severity ? query.severity.split(',') : undefined,
        isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
        isEscalated: query.isEscalated === 'true' ? true : query.isEscalated === 'false' ? false : undefined,
        sourceSystems: query.sourceSystems ? query.sourceSystems.split(',') : undefined,
        linkedIncidentId: query.linkedIncidentId,
        windowFrom: query.windowFrom,
        windowTo: query.windowTo,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        offset: query.offset ? parseInt(query.offset, 10) : undefined,
      });

      const result = await service.getSignals(
        orgId,
        {
          ...filters,
          windowFrom: filters.windowFrom ? new Date(filters.windowFrom) : undefined,
          windowTo: filters.windowTo ? new Date(filters.windowTo) : undefined,
        } as SignalFilters,
        filters.limit || 20,
        filters.offset || 0
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error listing signals:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /signals/:id/acknowledge
   * Acknowledge signal
   */
  server.post('/signals/:id/acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const body = request.body as { linkedIncidentId?: string; resolutionNotes?: string } | undefined;
      const validated = acknowledgeSignalSchema.parse(body || {});
      const signal = await service.acknowledgeSignal(
        orgId,
        userId,
        id,
        validated.linkedIncidentId,
        validated.resolutionNotes
      );

      return reply.send({
        success: true,
        data: signal,
      });
    } catch (error: any) {
      server.log.error('Error acknowledging signal:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // DETECTION ENDPOINTS
  // =========================================================================

  /**
   * POST /detection/run
   * Trigger detection run
   */
  server.post('/detection/run', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const body = request.body as Record<string, unknown> | undefined;
      const validated = triggerDetectionSchema.parse(body || {});
      const result = await service.runDetection(orgId, userId, {
        timeWindowMinutes: validated.timeWindowMinutes,
        sourceSystems: validated.sourceSystems as CrisisSourceSystem[] | undefined,
        keywords: validated.keywords,
        forceRefresh: validated.forceRefresh,
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error running detection:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // ACTION ENDPOINTS
  // =========================================================================

  /**
   * POST /actions
   * Create action
   */
  server.post('/actions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createActionSchema.parse(request.body);
      const action = await service.createAction(orgId, userId, {
        ...validated,
        dueAt: validated.dueAt ? new Date(validated.dueAt) : undefined,
      } as CreateActionRequest);

      return reply.status(201).send({
        success: true,
        data: action,
      });
    } catch (error: any) {
      server.log.error('Error creating action:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /actions
   * List actions
   */
  server.get('/actions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const filters = listActionsSchema.parse({
        incidentId: query.incidentId,
        status: query.status ? query.status.split(',') : undefined,
        actionType: query.actionType ? query.actionType.split(',') : undefined,
        assignedTo: query.assignedTo,
        isAiGenerated: query.isAiGenerated === 'true' ? true : query.isAiGenerated === 'false' ? false : undefined,
        dueBefore: query.dueBefore,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        offset: query.offset ? parseInt(query.offset, 10) : undefined,
      });

      const result = await service.getActions(
        orgId,
        {
          ...filters,
          dueBefore: filters.dueBefore ? new Date(filters.dueBefore) : undefined,
        } as ActionFilters,
        filters.limit || 20,
        filters.offset || 0
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error listing actions:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /actions/:id
   * Update action
   */
  server.patch('/actions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const validated = updateActionSchema.parse(request.body);
      const action = await service.updateAction(orgId, userId, id, {
        ...validated,
        dueAt: validated.dueAt ? new Date(validated.dueAt) : undefined,
      } as UpdateActionRequest);

      return reply.send({
        success: true,
        data: action,
      });
    } catch (error: any) {
      server.log.error('Error updating action:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // BRIEF ENDPOINTS
  // =========================================================================

  /**
   * POST /incidents/:id/briefs
   * Generate crisis brief for incident
   */
  server.post('/incidents/:id/briefs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown> | undefined;
      const validated = generateCrisisBriefSchema.parse(body || {});
      const result = await service.generateCrisisBrief(orgId, userId, id, validated as GenerateCrisisBriefRequest);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error generating brief:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /incidents/:id/briefs/current
   * Get current brief for incident
   */
  server.get('/incidents/:id/briefs/current', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };
      const brief = await service.getCurrentBrief(orgId, id);

      if (!brief) {
        return reply.status(404).send({
          success: false,
          error: 'No current brief found',
        });
      }

      return reply.send({
        success: true,
        data: brief,
      });
    } catch (error: any) {
      server.log.error('Error fetching current brief:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /briefs
   * List briefs
   */
  server.get('/briefs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const filters = listBriefsSchema.parse({
        incidentId: query.incidentId,
        format: query.format ? query.format.split(',') : undefined,
        status: query.status ? query.status.split(',') : undefined,
        isCurrent: query.isCurrent === 'true' ? true : query.isCurrent === 'false' ? false : undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        offset: query.offset ? parseInt(query.offset, 10) : undefined,
      });

      const result = await service.getBriefs(orgId, filters as BriefFilters, filters.limit || 20, filters.offset || 0);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error listing briefs:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /briefs/:briefId/sections/:sectionId/regenerate
   * Regenerate brief section
   */
  server.post('/briefs/:briefId/sections/:sectionId/regenerate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { briefId, sectionId } = request.params as { briefId: string; sectionId: string };
      const body = request.body as Record<string, unknown> | undefined;
      const validated = regenerateSectionSchema.parse(body || {});
      const result = await service.regenerateBriefSection(orgId, userId, briefId, sectionId, validated);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error regenerating section:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /briefs/:briefId/sections/:sectionId
   * Update brief section
   */
  server.patch('/briefs/:briefId/sections/:sectionId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { briefId, sectionId } = request.params as { briefId: string; sectionId: string };
      const validated = updateSectionSchema.parse(request.body);
      const section = await service.updateSection(orgId, userId, briefId, sectionId, validated);

      return reply.send({
        success: true,
        data: section,
      });
    } catch (error: any) {
      server.log.error('Error updating section:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // ESCALATION RULE ENDPOINTS
  // =========================================================================

  /**
   * POST /rules
   * Create escalation rule
   */
  server.post('/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createEscalationRuleSchema.parse(request.body);
      const rule = await service.createEscalationRule(orgId, userId, validated as CreateEscalationRuleRequest);

      return reply.status(201).send({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      server.log.error('Error creating rule:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /rules
   * List escalation rules
   */
  server.get('/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const query = request.query as Record<string, string>;

      const filters = listEscalationRulesSchema.parse({
        isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
        ruleType: query.ruleType,
        escalationLevelGte: query.escalationLevelGte ? parseInt(query.escalationLevelGte, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        offset: query.offset ? parseInt(query.offset, 10) : undefined,
      });

      const result = await service.getEscalationRules(
        orgId,
        filters.isActive,
        filters.limit || 50,
        filters.offset || 0
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error listing rules:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /rules/:id
   * Update escalation rule
   */
  server.patch('/rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      const validated = updateEscalationRuleSchema.parse(request.body);
      const rule = await service.updateEscalationRule(orgId, userId, id, validated as UpdateEscalationRuleRequest);

      return reply.send({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      server.log.error('Error updating rule:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /rules/:id
   * Delete escalation rule
   */
  server.delete('/rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };
      await service.deleteEscalationRule(orgId, userId, id);

      return reply.send({
        success: true,
        message: 'Rule deleted successfully',
      });
    } catch (error: any) {
      server.log.error('Error deleting rule:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
