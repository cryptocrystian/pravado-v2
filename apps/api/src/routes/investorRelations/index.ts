/**
 * Investor Relations API Routes (Sprint S64)
 * Investor Relations Pack & Earnings Narrative Engine V1
 *
 * REST API endpoints for investor pack management:
 * - Pack CRUD operations
 * - Section management
 * - Q&A bank management
 * - Pack generation and publishing
 * - Approval workflow
 * - Audit logs and statistics
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { FLAGS } from '@pravado/feature-flags';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createInvestorRelationsService } from '../../services/investorRelationsService';
import {
  createInvestorPackSchema,
  updateInvestorPackSchema,
  listInvestorPacksQuerySchema,
  generateInvestorPackSchema,
  updateInvestorSectionSchema,
  regenerateInvestorSectionSchema,
  reorderInvestorSectionsSchema,
  createInvestorQnASchema,
  updateInvestorQnASchema,
  generateInvestorQnASchema,
  listInvestorQnAQuerySchema,
  approveInvestorPackSchema,
  publishInvestorPackSchema,
  archiveInvestorPackSchema,
  listInvestorAuditLogQuerySchema,
  investorPackIdParamSchema,
  investorPackSectionParamSchema,
  investorQnAIdParamSchema,
} from '@pravado/validators';
import type {
  CreateInvestorPack,
  UpdateInvestorPack,
  ListInvestorPacksQuery,
  GenerateInvestorPack,
  UpdateInvestorSection,
  RegenerateInvestorSection,
  ReorderInvestorSections,
  CreateInvestorQnA,
  UpdateInvestorQnA,
  GenerateInvestorQnA,
  ListInvestorQnAQuery,
  ApproveInvestorPack,
  PublishInvestorPack,
  ArchiveInvestorPack,
  ListInvestorAuditLogQuery,
} from '@pravado/validators';

// Helper to extract orgId from headers
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Missing x-org-id header');
  }
  return orgId;
}

// Helper to extract userId from request
function getUserId(request: FastifyRequest): string | null {
  const user = (request as unknown as { user?: { id?: string } }).user;
  return user?.id || null;
}

// Helper to extract user email from request
function getUserEmail(request: FastifyRequest): string | null {
  const user = (request as unknown as { user?: { email?: string } }).user;
  return user?.email || null;
}

export async function investorRelationsRoutes(server: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_INVESTOR_RELATIONS) {
    server.log.info('Investor Relations routes disabled via feature flag');
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = createInvestorRelationsService({
    supabase,
    openaiApiKey: env.LLM_OPENAI_API_KEY || '',
    storageBucket: 'investor-relations',
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // =========================================================================
  // PACK CRUD ENDPOINTS
  // =========================================================================

  /**
   * GET /investor-relations
   * List investor packs with filters and pagination
   */
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = listInvestorPacksQuerySchema.parse(request.query);
      const response = await service.listPacks(orgId, validated as ListInvestorPacksQuery);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing investor packs');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations
   * Create a new investor pack
   */
  server.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const validated = createInvestorPackSchema.parse(request.body);
      const pack = await service.createPack(orgId, userId, userEmail, validated as CreateInvestorPack);

      return reply.status(201).send({
        success: true,
        data: pack,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating investor pack');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /investor-relations/stats
   * Get pack statistics for the organization
   */
  server.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const stats = await service.getStats(orgId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting pack stats');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /investor-relations/:id
   * Get a single investor pack with sections
   */
  server.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const pack = await service.getPack(orgId, id);

      if (!pack) {
        return reply.status(404).send({
          success: false,
          error: 'Pack not found',
        });
      }

      return reply.send({
        success: true,
        data: pack,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting investor pack');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /investor-relations/:id
   * Update an investor pack
   */
  server.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const validated = updateInvestorPackSchema.parse(request.body);
      const pack = await service.updatePack(orgId, id, userId, userEmail, validated as UpdateInvestorPack);

      if (!pack) {
        return reply.status(404).send({
          success: false,
          error: 'Pack not found',
        });
      }

      return reply.send({
        success: true,
        data: pack,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating investor pack');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /investor-relations/:id
   * Delete an investor pack
   */
  server.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const success = await service.deletePack(orgId, id, userId, userEmail);

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Pack not found or already deleted',
        });
      }

      return reply.send({
        success: true,
        message: 'Pack deleted successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error deleting investor pack');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // PACK WORKFLOW ENDPOINTS
  // =========================================================================

  /**
   * POST /investor-relations/:id/generate
   * Generate or regenerate pack content
   */
  server.post('/:id/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const validated = generateInvestorPackSchema.parse(request.body || {});
      const response = await service.generatePack(orgId, id, userId, userEmail, validated as GenerateInvestorPack);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error generating investor pack');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations/:id/approve
   * Approve an investor pack
   */
  server.post('/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const validated = approveInvestorPackSchema.parse(request.body || {});
      const pack = await service.approvePack(orgId, id, userId, userEmail, validated as ApproveInvestorPack);

      if (!pack) {
        return reply.status(400).send({
          success: false,
          error: 'Pack not found or not in review status',
        });
      }

      return reply.send({
        success: true,
        data: pack,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error approving investor pack');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations/:id/publish
   * Publish an investor pack
   */
  server.post('/:id/publish', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const validated = publishInvestorPackSchema.parse(request.body || {});
      const response = await service.publishPack(orgId, id, userId, userEmail, validated as PublishInvestorPack);

      if (!response) {
        return reply.status(400).send({
          success: false,
          error: 'Pack not found or not in approved status',
        });
      }

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error publishing investor pack');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations/:id/archive
   * Archive an investor pack
   */
  server.post('/:id/archive', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const validated = archiveInvestorPackSchema.parse(request.body || {});
      const pack = await service.archivePack(orgId, id, userId, userEmail, validated as ArchiveInvestorPack);

      if (!pack) {
        return reply.status(404).send({
          success: false,
          error: 'Pack not found',
        });
      }

      return reply.send({
        success: true,
        data: pack,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error archiving investor pack');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // SECTION MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * PATCH /investor-relations/:id/sections/:sectionId
   * Update a pack section
   */
  server.patch('/:id/sections/:sectionId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id, sectionId } = investorPackSectionParamSchema.parse(request.params);
      const validated = updateInvestorSectionSchema.parse(request.body);
      const section = await service.updateSection(orgId, id, sectionId, userId, userEmail, validated as UpdateInvestorSection);

      if (!section) {
        return reply.status(404).send({
          success: false,
          error: 'Section not found',
        });
      }

      return reply.send({
        success: true,
        data: section,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating pack section');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations/:id/sections/:sectionId/regenerate
   * Regenerate a specific section
   */
  server.post('/:id/sections/:sectionId/regenerate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id, sectionId } = investorPackSectionParamSchema.parse(request.params);
      const validated = regenerateInvestorSectionSchema.parse(request.body || {});
      const section = await service.regenerateSection(orgId, id, sectionId, userId, userEmail, validated as RegenerateInvestorSection);

      if (!section) {
        return reply.status(404).send({
          success: false,
          error: 'Section not found',
        });
      }

      return reply.send({
        success: true,
        data: section,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error regenerating pack section');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations/:id/sections/reorder
   * Reorder pack sections
   */
  server.post('/:id/sections/reorder', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { id } = investorPackIdParamSchema.parse(request.params);
      const validated = reorderInvestorSectionsSchema.parse(request.body);
      const sections = await service.reorderSections(orgId, id, userId, userEmail, validated as ReorderInvestorSections);

      return reply.send({
        success: true,
        data: sections,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error reordering pack sections');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // Q&A MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * GET /investor-relations/qna
   * List Q&A entries with filters
   */
  server.get('/qna', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = listInvestorQnAQuerySchema.parse(request.query);
      const response = await service.listQnAs(orgId, validated as ListInvestorQnAQuery);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing Q&As');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations/qna
   * Create a Q&A entry manually
   */
  server.post('/qna', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const validated = createInvestorQnASchema.parse(request.body);
      const qna = await service.createQnA(orgId, userId, userEmail, validated as CreateInvestorQnA);

      return reply.status(201).send({
        success: true,
        data: qna,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating Q&A');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /investor-relations/qna/generate
   * Generate Q&A entries using AI
   */
  server.post('/qna/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const validated = generateInvestorQnASchema.parse(request.body);
      const response = await service.generateQnAs(orgId, userId, userEmail, validated as GenerateInvestorQnA);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error generating Q&As');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /investor-relations/qna/:qnaId
   * Update a Q&A entry
   */
  server.patch('/qna/:qnaId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const userEmail = getUserEmail(request);
      const { qnaId } = investorQnAIdParamSchema.parse(request.params);
      const validated = updateInvestorQnASchema.parse(request.body);
      const qna = await service.updateQnA(orgId, qnaId, userId, userEmail, validated as UpdateInvestorQnA);

      if (!qna) {
        return reply.status(404).send({
          success: false,
          error: 'Q&A not found',
        });
      }

      return reply.send({
        success: true,
        data: qna,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating Q&A');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /investor-relations/qna/:qnaId
   * Delete a Q&A entry
   */
  server.delete('/qna/:qnaId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { qnaId } = investorQnAIdParamSchema.parse(request.params);
      const success = await service.deleteQnA(orgId, qnaId);

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Q&A not found or already deleted',
        });
      }

      return reply.send({
        success: true,
        message: 'Q&A deleted successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error deleting Q&A');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // AUDIT LOG ENDPOINTS
  // =========================================================================

  /**
   * GET /investor-relations/audit
   * List audit log entries
   */
  server.get('/audit', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = listInvestorAuditLogQuerySchema.parse(request.query);
      const response = await service.listAuditLogs(orgId, validated as ListInvestorAuditLogQuery);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing audit logs');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });
}
