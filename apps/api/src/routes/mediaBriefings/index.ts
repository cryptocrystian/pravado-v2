/**
 * Media Briefing API Routes (Sprint S54)
 *
 * REST API endpoints for AI-powered media briefing generation:
 * - Briefing CRUD operations
 * - Section management
 * - Talking point CRUD and generation
 * - LLM-driven content generation
 * - Source reference management
 * - Workflow (review, approve, archive)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { MediaBriefingService } from '../../services/mediaBriefingService';
import {
  createBriefingRequestSchema,
  updateBriefingRequestSchema,
  generateBriefingRequestSchema,
  regenerateSectionRequestSchema,
  createTalkingPointRequestSchema,
  updateTalkingPointRequestSchema,
  generateTalkingPointsRequestSchema,
  updateSectionRequestSchema,
  briefingFiltersSchema,
  talkingPointFiltersSchema,
  briefingIdParamSchema,
  sectionIdParamSchema,
  talkingPointIdParamSchema,
} from '@pravado/validators';
import type {
  CreateBriefingRequest,
  UpdateBriefingRequest,
  GenerateBriefingRequest,
  RegenerateSectionRequest,
  CreateTalkingPointRequest,
  UpdateTalkingPointRequest,
  GenerateTalkingPointsRequest,
  UpdateSectionRequest,
  BriefingFilters,
  TalkingPointFilters,
} from '@pravado/types';
import { LlmRouter } from '@pravado/utils';

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
  const userId = (request as any).user?.id || request.headers['x-user-id'] as string;
  if (!userId) {
    throw new Error('Missing user ID');
  }
  return userId;
}

export default async function mediaBriefingRoutes(server: FastifyInstance) {
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

  const service = new MediaBriefingService(supabase, llmRouter);

  // =========================================================================
  // BRIEFING CRUD ENDPOINTS
  // =========================================================================

  /**
   * POST /briefings
   * Create a new media briefing
   */
  server.post('/briefings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createBriefingRequestSchema.parse(request.body);
      const briefing = await service.createBriefing(orgId, userId, validated as CreateBriefingRequest);

      return reply.status(201).send({
        success: true,
        data: briefing,
      });
    } catch (error: any) {
      server.log.error('Error creating briefing:', error);
      return reply.status(error.message.includes('validation') ? 400 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /briefings
   * List briefings with filters and pagination
   */
  server.get('/briefings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { limit = 20, offset = 0, ...filters } = request.query as any;

      const validatedFilters = briefingFiltersSchema.parse(filters);
      const response = await service.getBriefings(
        orgId,
        validatedFilters as BriefingFilters,
        Number(limit),
        Number(offset)
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      server.log.error('Error fetching briefings:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /briefings/:id
   * Get single briefing by ID with sections and talking points
   */
  server.get('/briefings/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const briefing = await service.getBriefing(orgId, id);

      return reply.send({
        success: true,
        data: briefing,
      });
    } catch (error: any) {
      server.log.error('Error fetching briefing:', error);
      return reply.status(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /briefings/:id
   * Update briefing metadata
   */
  server.patch('/briefings/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const validated = updateBriefingRequestSchema.parse(request.body);
      const briefing = await service.updateBriefing(
        orgId,
        userId,
        id,
        validated as UpdateBriefingRequest
      );

      return reply.send({
        success: true,
        data: briefing,
      });
    } catch (error: any) {
      server.log.error('Error updating briefing:', error);
      return reply.status(error.message.includes('validation') ? 400 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /briefings/:id
   * Delete briefing and all related content
   */
  server.delete('/briefings/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      await service.deleteBriefing(orgId, userId, id);

      return reply.send({
        success: true,
        message: 'Briefing deleted successfully',
      });
    } catch (error: any) {
      server.log.error('Error deleting briefing:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // BRIEFING WORKFLOW ENDPOINTS
  // =========================================================================

  /**
   * POST /briefings/:id/review
   * Mark briefing as reviewed
   */
  server.post('/briefings/:id/review', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const briefing = await service.reviewBriefing(orgId, userId, id);

      return reply.send({
        success: true,
        data: briefing,
      });
    } catch (error: any) {
      server.log.error('Error reviewing briefing:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /briefings/:id/approve
   * Approve briefing for use
   */
  server.post('/briefings/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const briefing = await service.approveBriefing(orgId, userId, id);

      return reply.send({
        success: true,
        data: briefing,
      });
    } catch (error: any) {
      server.log.error('Error approving briefing:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /briefings/:id/archive
   * Archive briefing
   */
  server.post('/briefings/:id/archive', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const briefing = await service.archiveBriefing(orgId, userId, id);

      return reply.send({
        success: true,
        data: briefing,
      });
    } catch (error: any) {
      server.log.error('Error archiving briefing:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // GENERATION ENDPOINTS
  // =========================================================================

  /**
   * POST /briefings/:id/generate
   * Generate briefing content using LLM
   */
  server.post('/briefings/:id/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const validated = generateBriefingRequestSchema.parse({
        ...body,
        briefingId: id,
      });

      const result = await service.generateBriefing(
        orgId,
        userId,
        validated as GenerateBriefingRequest
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error generating briefing:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /briefings/:id/generate-talking-points
   * Generate talking points for briefing
   */
  server.post('/briefings/:id/generate-talking-points', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const validated = generateTalkingPointsRequestSchema.parse({
        ...body,
        briefingId: id,
      });

      const result = await service.generateTalkingPoints(
        orgId,
        userId,
        validated as GenerateTalkingPointsRequest
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      server.log.error('Error generating talking points:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // SECTION ENDPOINTS
  // =========================================================================

  /**
   * GET /briefings/:briefingId/sections/:sectionId
   * Get single section
   */
  server.get('/briefings/:briefingId/sections/:sectionId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { briefingId, sectionId } = sectionIdParamSchema.parse(request.params);
      const section = await service.getSection(orgId, briefingId, sectionId);

      return reply.send({
        success: true,
        data: section,
      });
    } catch (error: any) {
      server.log.error('Error fetching section:', error);
      return reply.status(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /briefings/:briefingId/sections/:sectionId
   * Update section content
   */
  server.patch('/briefings/:briefingId/sections/:sectionId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { briefingId, sectionId } = sectionIdParamSchema.parse(request.params);
      const validated = updateSectionRequestSchema.parse(request.body);
      const section = await service.updateSection(
        orgId,
        userId,
        briefingId,
        sectionId,
        validated as UpdateSectionRequest
      );

      return reply.send({
        success: true,
        data: section,
      });
    } catch (error: any) {
      server.log.error('Error updating section:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /briefings/:briefingId/sections/:sectionId/regenerate
   * Regenerate single section
   */
  server.post('/briefings/:briefingId/sections/:sectionId/regenerate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { briefingId, sectionId } = sectionIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const validated = regenerateSectionRequestSchema.parse({
        ...body,
        briefingId,
        sectionId,
      });

      const result = await service.regenerateSection(
        orgId,
        userId,
        validated as RegenerateSectionRequest
      );

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
   * PUT /briefings/:briefingId/sections/reorder
   * Reorder sections
   */
  server.put('/briefings/:briefingId/sections/reorder', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { briefingId } = request.params as any;
      const { sectionIds } = request.body as { sectionIds: string[] };

      if (!Array.isArray(sectionIds)) {
        return reply.status(400).send({
          success: false,
          error: 'sectionIds must be an array',
        });
      }

      const sections = await service.reorderSections(orgId, briefingId, sectionIds);

      return reply.send({
        success: true,
        data: sections,
      });
    } catch (error: any) {
      server.log.error('Error reordering sections:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // TALKING POINT ENDPOINTS
  // =========================================================================

  /**
   * POST /talking-points
   * Create a talking point
   */
  server.post('/talking-points', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createTalkingPointRequestSchema.parse(request.body);
      const talkingPoint = await service.createTalkingPoint(
        orgId,
        userId,
        validated as CreateTalkingPointRequest
      );

      return reply.status(201).send({
        success: true,
        data: talkingPoint,
      });
    } catch (error: any) {
      server.log.error('Error creating talking point:', error);
      return reply.status(error.message.includes('validation') ? 400 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /talking-points
   * List talking points with filters and pagination
   */
  server.get('/talking-points', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { limit = 20, offset = 0, ...filters } = request.query as any;

      const validatedFilters = talkingPointFiltersSchema.parse(filters);
      const response = await service.getTalkingPoints(
        orgId,
        validatedFilters as TalkingPointFilters,
        Number(limit),
        Number(offset)
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      server.log.error('Error fetching talking points:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /talking-points/:id
   * Get single talking point
   */
  server.get('/talking-points/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = talkingPointIdParamSchema.parse(request.params);
      const talkingPoint = await service.getTalkingPoint(orgId, id);

      return reply.send({
        success: true,
        data: talkingPoint,
      });
    } catch (error: any) {
      server.log.error('Error fetching talking point:', error);
      return reply.status(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /talking-points/:id
   * Update talking point
   */
  server.patch('/talking-points/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = talkingPointIdParamSchema.parse(request.params);
      const validated = updateTalkingPointRequestSchema.parse(request.body);
      const talkingPoint = await service.updateTalkingPoint(
        orgId,
        userId,
        id,
        validated as UpdateTalkingPointRequest
      );

      return reply.send({
        success: true,
        data: talkingPoint,
      });
    } catch (error: any) {
      server.log.error('Error updating talking point:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /talking-points/:id
   * Delete talking point
   */
  server.delete('/talking-points/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = talkingPointIdParamSchema.parse(request.params);
      await service.deleteTalkingPoint(orgId, id);

      return reply.send({
        success: true,
        message: 'Talking point deleted successfully',
      });
    } catch (error: any) {
      server.log.error('Error deleting talking point:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /talking-points/:id/approve
   * Approve talking point
   */
  server.post('/talking-points/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = talkingPointIdParamSchema.parse(request.params);
      const talkingPoint = await service.updateTalkingPoint(
        orgId,
        userId,
        id,
        { isApproved: true }
      );

      return reply.send({
        success: true,
        data: talkingPoint,
      });
    } catch (error: any) {
      server.log.error('Error approving talking point:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // SOURCE REFERENCE ENDPOINTS
  // =========================================================================

  /**
   * GET /briefings/:id/sources
   * Get sources used in briefing
   */
  server.get('/briefings/:id/sources', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = briefingIdParamSchema.parse(request.params);
      const { sourceType } = request.query as any;
      const sources = await service.getBriefingSources(orgId, id, sourceType);

      return reply.send({
        success: true,
        data: sources,
      });
    } catch (error: any) {
      server.log.error('Error fetching sources:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
