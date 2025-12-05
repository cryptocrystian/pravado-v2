/**
 * Audience Persona API Routes (Sprint S51)
 * RESTful endpoints for Persona Builder Engine
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import {
  CreatePersonaInputSchema,
  UpdatePersonaInputSchema,
  GeneratePersonaRequestSchema,
  AddTraitRequestSchema,
  AddInsightRequestSchema,
  ComparePersonasRequestSchema,
  MergePersonasRequestSchema,
  PersonasQuerySchema,
  PersonaInsightsQuerySchema,
  PersonaHistoryQuerySchema,
  PersonaTrendsQuerySchema,
} from '@pravado/validators';
import { AudiencePersonaService } from '../../services/audiencePersonaService';

// Helper to get org ID from request
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Organization ID is required');
  }
  return orgId;
}

// Helper to get user ID from request
function getUserId(request: FastifyRequest): string | undefined {
  return request.headers['x-user-id'] as string | undefined;
}

export default async function audiencePersonasRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = new AudiencePersonaService(supabase);

  // ========================================
  // POST /api/v1/personas/generate
  // Generate persona using LLM from source text
  // ========================================

  server.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);

      const input = GeneratePersonaRequestSchema.parse(request.body);

      const result = await service.generatePersona(orgId, input.generationContext, userId);

      return reply.status(201).send({
        persona: result.persona,
        traits: result.traits,
        insights: result.insights,
        extraction: result.extraction,
        message: 'Persona generated successfully',
      });
    } catch (error) {
      server.log.error({ err: error }, 'Failed to generate persona');
      const message = error instanceof Error ? error.message : 'Failed to generate persona';
      return reply.status(message.includes('required') ? 400 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // POST /api/v1/personas
  // Create a new persona manually
  // ========================================

  server.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);

      const input = CreatePersonaInputSchema.parse(request.body);

      const persona = await service.createPersona(orgId, input, userId);

      return reply.status(201).send(persona);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to create persona');
      const message = error instanceof Error ? error.message : 'Failed to create persona';
      return reply.status(message.includes('required') ? 400 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // GET /api/v1/personas
  // List personas with filtering and pagination
  // ========================================

  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      // Parse query parameters
      const query = PersonasQuerySchema.parse({
        personaType: queryParams.personaType ? String(queryParams.personaType).split(',') : undefined,
        role: queryParams.role,
        industry: queryParams.industry,
        seniorityLevel: queryParams.seniorityLevel ? String(queryParams.seniorityLevel).split(',') : undefined,
        minRelevanceScore: queryParams.minRelevanceScore ? Number(queryParams.minRelevanceScore) : undefined,
        minEngagementScore: queryParams.minEngagementScore ? Number(queryParams.minEngagementScore) : undefined,
        minAlignmentScore: queryParams.minAlignmentScore ? Number(queryParams.minAlignmentScore) : undefined,
        minOverallScore: queryParams.minOverallScore ? Number(queryParams.minOverallScore) : undefined,
        status: queryParams.status ? String(queryParams.status).split(',') : undefined,
        tags: queryParams.tags ? String(queryParams.tags).split(',') : undefined,
        searchQuery: queryParams.searchQuery,
        sortBy: queryParams.sortBy as string | undefined,
        sortOrder: queryParams.sortOrder as string | undefined,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      });

      const result = await service.listPersonas(orgId, query);

      return reply.status(200).send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to list personas');
      const message = error instanceof Error ? error.message : 'Failed to list personas';
      return reply.status(500).send({
        error: message,
      });
    }
  });

  // ========================================
  // GET /api/v1/personas/:id
  // Get persona detail with traits, insights, and history
  // ========================================

  server.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };

      const detail = await service.getPersonaDetail(orgId, id);

      return reply.status(200).send(detail);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to get persona detail');
      const message = error instanceof Error ? error.message : 'Failed to get persona detail';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // PATCH /api/v1/personas/:id
  // Update an existing persona
  // ========================================

  server.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };

      const input = UpdatePersonaInputSchema.parse(request.body);

      const persona = await service.updatePersona(orgId, id, input, userId);

      return reply.status(200).send(persona);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to update persona');
      const message = error instanceof Error ? error.message : 'Failed to update persona';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // DELETE /api/v1/personas/:id
  // Delete a persona
  // ========================================

  server.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };

      await service.deletePersona(orgId, id);

      return reply.status(204).send();
    } catch (error) {
      server.log.error({ err: error }, 'Failed to delete persona');
      const message = error instanceof Error ? error.message : 'Failed to delete persona';
      return reply.status(500).send({
        error: message,
      });
    }
  });

  // ========================================
  // GET /api/v1/personas/:id/insights
  // Get insights for a persona
  // ========================================

  server.get('/:id/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };
      const queryParams = request.query as Record<string, unknown>;

      const query = PersonaInsightsQuerySchema.parse({
        insightType: queryParams.insightType ? String(queryParams.insightType).split(',') : undefined,
        insightCategory: queryParams.insightCategory ? String(queryParams.insightCategory).split(',') : undefined,
        sourceSystem: queryParams.sourceSystem ? String(queryParams.sourceSystem).split(',') : undefined,
        minConfidence: queryParams.minConfidence ? Number(queryParams.minConfidence) : undefined,
        minImpact: queryParams.minImpact ? Number(queryParams.minImpact) : undefined,
        isActionable: queryParams.isActionable === 'true' ? true : queryParams.isActionable === 'false' ? false : undefined,
        sortBy: queryParams.sortBy as string | undefined,
        sortOrder: queryParams.sortOrder as string | undefined,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      });

      const result = await service.getPersonaInsights(orgId, id, query);

      return reply.status(200).send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to get persona insights');
      const message = error instanceof Error ? error.message : 'Failed to get persona insights';
      return reply.status(500).send({
        error: message,
      });
    }
  });

  // ========================================
  // GET /api/v1/personas/:id/history
  // Get persona history snapshots
  // ========================================

  server.get('/:id/history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };
      const queryParams = request.query as Record<string, unknown>;

      const query = PersonaHistoryQuerySchema.parse({
        snapshotType: queryParams.snapshotType ? String(queryParams.snapshotType).split(',') : undefined,
        minChangeMagnitude: queryParams.minChangeMagnitude ? Number(queryParams.minChangeMagnitude) : undefined,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        sortBy: queryParams.sortBy as string | undefined,
        sortOrder: queryParams.sortOrder as string | undefined,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      });

      const result = await service.getPersonaHistory(orgId, id, query);

      return reply.status(200).send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to get persona history');
      const message = error instanceof Error ? error.message : 'Failed to get persona history';
      return reply.status(500).send({
        error: message,
      });
    }
  });

  // ========================================
  // GET /api/v1/personas/:id/trends
  // Get persona trends over time
  // ========================================

  server.get('/:id/trends', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };
      const queryParams = request.query as Record<string, unknown>;

      const query = PersonaTrendsQuerySchema.parse({
        daysBack: queryParams.daysBack ? Number(queryParams.daysBack) : undefined,
        includeTraits: queryParams.includeTraits === 'true',
        includeInsights: queryParams.includeInsights === 'true',
      });

      const result = await service.getPersonaTrends(orgId, id, query.daysBack || 90);

      return reply.status(200).send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to get persona trends');
      const message = error instanceof Error ? error.message : 'Failed to get persona trends';
      return reply.status(500).send({
        error: message,
      });
    }
  });

  // ========================================
  // POST /api/v1/personas/:id/compare
  // Compare two personas
  // ========================================

  server.post('/:id/compare', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id: personaId1 } = request.params as { id: string };

      const input = ComparePersonasRequestSchema.parse(request.body);
      const personaId2 = input.personaId2;

      const comparison = await service.comparePersonas(orgId, personaId1, personaId2);

      return reply.status(200).send({ comparison });
    } catch (error) {
      server.log.error({ err: error }, 'Failed to compare personas');
      const message = error instanceof Error ? error.message : 'Failed to compare personas';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // POST /api/v1/personas/merge
  // Merge two personas
  // ========================================

  server.post('/merge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);

      const input = MergePersonasRequestSchema.parse(request.body);

      const result = await service.mergePersonas(
        orgId,
        input.sourcePersonaId,
        input.targetPersonaId,
        input.mergeTraits,
        input.mergeInsights,
        input.archiveSource,
        userId
      );

      return reply.status(200).send({
        mergedPersona: result.mergedPersona,
        traitsAdded: result.traitsAdded,
        insightsAdded: result.insightsAdded,
        message: `Merged ${result.traitsAdded} traits and ${result.insightsAdded} insights`,
      });
    } catch (error) {
      server.log.error({ err: error }, 'Failed to merge personas');
      const message = error instanceof Error ? error.message : 'Failed to merge personas';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // POST /api/v1/personas/:id/traits
  // Add a trait to a persona
  // ========================================

  server.post('/:id/traits', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };

      const input = AddTraitRequestSchema.parse(request.body);

      const trait = await service.addTrait(orgId, id, input, userId);

      return reply.status(201).send(trait);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to add trait');
      const message = error instanceof Error ? error.message : 'Failed to add trait';
      return reply.status(message.includes('required') ? 400 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // POST /api/v1/personas/:id/insights
  // Add an insight to a persona
  // ========================================

  server.post('/:id/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = request.params as { id: string };

      const input = AddInsightRequestSchema.parse(request.body);

      const insight = await service.addInsight(orgId, id, input, userId);

      return reply.status(201).send(insight);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to add insight');
      const message = error instanceof Error ? error.message : 'Failed to add insight';
      return reply.status(message.includes('required') ? 400 : 500).send({
        error: message,
      });
    }
  });
}
