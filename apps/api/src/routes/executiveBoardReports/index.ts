/**
 * Executive Board Report API Routes (Sprint S63)
 * Board Reporting & Quarterly Executive Pack Generator V1
 *
 * REST API endpoints for executive board report management:
 * - Report CRUD operations
 * - Section management
 * - Audience management
 * - Report generation and publishing
 * - Approval workflow
 * - Audit logs and statistics
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { FLAGS } from '@pravado/feature-flags';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createExecutiveBoardReportService } from '../../services/executiveBoardReportService';
import {
  createExecBoardReportSchema,
  updateExecBoardReportSchema,
  generateExecBoardReportSchema,
  publishExecBoardReportSchema,
  approveExecBoardReportSchema,
  addExecBoardReportAudienceSchema,
  updateExecBoardReportAudienceSchema,
  updateExecBoardReportSectionSchema,
  updateExecBoardReportSectionOrderSchema,
  listExecBoardReportsSchema,
  listExecBoardReportSectionsSchema,
  listExecBoardReportAudienceSchema,
  listExecBoardReportAuditLogsSchema,
  execBoardReportIdParamSchema,
  execBoardReportSectionIdParamSchema,
  execBoardReportAudienceIdParamSchema,
} from '@pravado/validators';
import type {
  CreateExecBoardReportInput,
  UpdateExecBoardReportInput,
  GenerateExecBoardReportInput,
  PublishExecBoardReportInput,
  ApproveExecBoardReportInput,
  AddExecBoardReportAudienceInput,
  UpdateExecBoardReportAudienceInput,
  UpdateExecBoardReportSectionInput,
  UpdateExecBoardReportSectionOrderInput,
  ListExecBoardReportsQuery,
  ListExecBoardReportAudienceQuery,
  ListExecBoardReportAuditLogsQuery,
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

export async function executiveBoardReportRoutes(server: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_EXEC_BOARD_REPORTS) {
    server.log.info('Executive Board Report routes disabled via feature flag');
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = createExecutiveBoardReportService({
    supabase,
    openaiApiKey: env.LLM_OPENAI_API_KEY || '',
    storageBucket: 'exec-board-reports',
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // =========================================================================
  // REPORT CRUD ENDPOINTS
  // =========================================================================

  /**
   * GET /executive-board-reports
   * List reports with filters and pagination
   */
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = listExecBoardReportsSchema.parse(request.query);
      const response = await service.listReports(orgId, validated as ListExecBoardReportsQuery);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing reports');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /executive-board-reports
   * Create a new report
   */
  server.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createExecBoardReportSchema.parse(request.body);
      const report = await service.createReport(orgId, userId, validated as CreateExecBoardReportInput);

      return reply.status(201).send({
        success: true,
        data: report,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating report');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /executive-board-reports/stats
   * Get report statistics for the organization
   */
  server.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const stats = await service.getReportStats(orgId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching report stats');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /executive-board-reports/:id
   * Get a single report by ID with all related data
   */
  server.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const response = await service.getReport(orgId, id);

      if (!response) {
        return reply.status(404).send({
          success: false,
          error: 'Report not found',
        });
      }

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching report');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /executive-board-reports/:id
   * Update a report
   */
  server.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = updateExecBoardReportSchema.parse(request.body);
      const report = await service.updateReport(orgId, id, userId, validated as UpdateExecBoardReportInput);

      if (!report) {
        return reply.status(404).send({
          success: false,
          error: 'Report not found',
        });
      }

      return reply.send({
        success: true,
        data: report,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating report');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /executive-board-reports/:id
   * Delete (archive) a report
   */
  server.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const hardDelete = (request.query as { hard?: string }).hard === 'true';
      const result = await service.deleteReport(orgId, id, userId, hardDelete);

      return reply.send({
        success: true,
        data: result,
        message: result.deleted ? 'Report permanently deleted' : 'Report archived successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error deleting report');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // GENERATION & WORKFLOW ENDPOINTS
  // =========================================================================

  /**
   * POST /executive-board-reports/:id/generate
   * Generate report content (sections) from aggregated data
   */
  server.post('/:id/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = generateExecBoardReportSchema.parse(request.body || {});
      const response = await service.generateReport(
        orgId,
        id,
        userId,
        validated as GenerateExecBoardReportInput
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error generating report');
      return reply.status(errorMessage.includes('not found') ? 404 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /executive-board-reports/:id/approve
   * Approve a report for publishing
   */
  server.post('/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = approveExecBoardReportSchema.parse(request.body || {});
      const report = await service.approveReport(
        orgId,
        id,
        userId,
        validated as ApproveExecBoardReportInput
      );

      if (!report) {
        return reply.status(404).send({
          success: false,
          error: 'Report not found',
        });
      }

      return reply.send({
        success: true,
        data: report,
        message: 'Report approved successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error approving report');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /executive-board-reports/:id/publish
   * Publish report to audience
   */
  server.post('/:id/publish', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = publishExecBoardReportSchema.parse(request.body || {});
      const response = await service.publishReport(
        orgId,
        id,
        userId,
        validated as PublishExecBoardReportInput
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error publishing report');
      return reply.status(errorMessage.includes('not found') ? 404 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // SECTION MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * GET /executive-board-reports/:id/sections
   * List sections for a report
   */
  server.get('/:id/sections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      // Note: query params validated but sections are listed unfiltered
      listExecBoardReportSectionsSchema.parse(request.query);
      const sections = await service.listSections(orgId, id);

      return reply.send({
        success: true,
        data: { sections },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing sections');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /executive-board-reports/:id/sections/:sectionId
   * Update a section
   */
  server.patch('/:id/sections/:sectionId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id, sectionId } = execBoardReportSectionIdParamSchema.parse(request.params);
      const validated = updateExecBoardReportSectionSchema.parse(request.body);
      const section = await service.updateSection(
        orgId,
        id,
        sectionId,
        userId,
        validated as UpdateExecBoardReportSectionInput
      );

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
      server.log.error({ err: error }, 'Error updating section');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /executive-board-reports/:id/sections/order
   * Update section ordering
   */
  server.post('/:id/sections/order', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = updateExecBoardReportSectionOrderSchema.parse(request.body);
      const sections = await service.updateSectionOrder(
        orgId,
        id,
        userId,
        (validated as UpdateExecBoardReportSectionOrderInput).sections
      );

      return reply.send({
        success: true,
        data: { sections },
        message: 'Section order updated successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating section order');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // AUDIENCE MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * GET /executive-board-reports/:id/audience
   * List audience members for a report
   */
  server.get('/:id/audience', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = listExecBoardReportAudienceSchema.parse(request.query);
      const response = await service.listAudienceMembers(
        orgId,
        id,
        { ...validated, reportId: id } as ListExecBoardReportAudienceQuery
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing audience');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /executive-board-reports/:id/audience
   * Add an audience member to a report
   */
  server.post('/:id/audience', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = addExecBoardReportAudienceSchema.parse(request.body);
      const member = await service.addAudienceMember(
        orgId,
        id,
        userId,
        validated as AddExecBoardReportAudienceInput
      );

      return reply.status(201).send({
        success: true,
        data: member,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error adding audience member');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /executive-board-reports/:id/audience/:audienceId
   * Update an audience member
   */
  server.patch(
    '/:id/audience/:audienceId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const orgId = getOrgId(request);
        const userId = getUserId(request);
        const { id, audienceId } = execBoardReportAudienceIdParamSchema.parse(request.params);
        const validated = updateExecBoardReportAudienceSchema.parse(request.body);
        const member = await service.updateAudienceMember(
          orgId,
          id,
          audienceId,
          userId,
          validated as UpdateExecBoardReportAudienceInput
        );

        if (!member) {
          return reply.status(404).send({
            success: false,
            error: 'Audience member not found',
          });
        }

        return reply.send({
          success: true,
          data: member,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        server.log.error({ err: error }, 'Error updating audience member');
        return reply.status(500).send({
          success: false,
          error: errorMessage,
        });
      }
    }
  );

  /**
   * DELETE /executive-board-reports/:id/audience/:audienceId
   * Remove an audience member from a report
   */
  server.delete(
    '/:id/audience/:audienceId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const orgId = getOrgId(request);
        const userId = getUserId(request);
        const { id, audienceId } = execBoardReportAudienceIdParamSchema.parse(request.params);
        await service.removeAudienceMember(orgId, id, audienceId, userId);

        return reply.send({
          success: true,
          message: 'Audience member removed successfully',
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        server.log.error({ err: error }, 'Error removing audience member');
        return reply.status(500).send({
          success: false,
          error: errorMessage,
        });
      }
    }
  );

  // =========================================================================
  // AUDIT LOG ENDPOINTS
  // =========================================================================

  /**
   * GET /executive-board-reports/:id/audit-logs
   * List audit logs for a report
   */
  server.get('/:id/audit-logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execBoardReportIdParamSchema.parse(request.params);
      const validated = listExecBoardReportAuditLogsSchema.parse(request.query);
      const response = await service.listAuditLogs(
        orgId,
        id,
        { ...validated, reportId: id } as ListExecBoardReportAuditLogsQuery
      );

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

export default executiveBoardReportRoutes;
