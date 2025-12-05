/**
 * Executive Digest API Routes (Sprint S62)
 * Automated Strategic Briefs & Exec Weekly Digest Generator V1
 *
 * REST API endpoints for executive digest management:
 * - Digest CRUD operations
 * - Section management and ordering
 * - Recipient management
 * - Digest generation and delivery
 * - Delivery logs and statistics
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { FLAGS } from '@pravado/feature-flags';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createExecutiveDigestService } from '../../services/executiveDigestService';
import {
  createExecDigestSchema,
  updateExecDigestSchema,
  generateExecDigestSchema,
  deliverExecDigestSchema,
  addExecDigestRecipientSchema,
  updateExecDigestRecipientSchema,
  updateSectionOrderSchema,
  listExecDigestsSchema,
  listExecDigestRecipientsSchema,
  listExecDigestDeliveryLogsSchema,
  execDigestIdParamSchema,
  execDigestRecipientIdParamSchema,
} from '@pravado/validators';
import type {
  CreateExecDigestInput,
  UpdateExecDigestInput,
  GenerateExecDigestInput,
  DeliverExecDigestInput,
  AddExecDigestRecipientInput,
  UpdateExecDigestRecipientInput,
  ListExecDigestsQuery,
  UpdateSectionOrderInput,
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

export async function executiveDigestRoutes(server: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_EXEC_DIGESTS) {
    server.log.info('Executive Digest routes disabled via feature flag');
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = createExecutiveDigestService({
    supabase,
    openaiApiKey: env.LLM_OPENAI_API_KEY || '',
    storageBucket: 'exec-digests',
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // =========================================================================
  // DIGEST CRUD ENDPOINTS
  // =========================================================================

  /**
   * GET /exec-digests
   * List digests with filters and pagination
   */
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = listExecDigestsSchema.parse(request.query);
      const response = await service.listDigests(orgId, validated as ListExecDigestsQuery);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing digests');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /exec-digests
   * Create a new digest
   */
  server.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const validated = createExecDigestSchema.parse(request.body);
      const digest = await service.createDigest(orgId, userId, validated as CreateExecDigestInput);

      return reply.status(201).send({
        success: true,
        data: digest,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating digest');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /exec-digests/stats
   * Get digest statistics for the organization
   */
  server.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const stats = await service.getDigestStats(orgId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching digest stats');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /exec-digests/:id
   * Get a single digest by ID with all related data
   */
  server.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const response = await service.getDigest(orgId, id);

      if (!response) {
        return reply.status(404).send({
          success: false,
          error: 'Digest not found',
        });
      }

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error fetching digest');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /exec-digests/:id
   * Update a digest
   */
  server.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const validated = updateExecDigestSchema.parse(request.body);
      const digest = await service.updateDigest(orgId, id, userId, validated as UpdateExecDigestInput);

      if (!digest) {
        return reply.status(404).send({
          success: false,
          error: 'Digest not found',
        });
      }

      return reply.send({
        success: true,
        data: digest,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating digest');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /exec-digests/:id
   * Delete (archive) a digest
   */
  server.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const hardDelete = (request.query as { hard?: string }).hard === 'true';
      const result = await service.deleteDigest(orgId, id, userId, hardDelete);

      return reply.send({
        success: true,
        data: result,
        message: result.deleted ? 'Digest permanently deleted' : 'Digest archived successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error deleting digest');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  // =========================================================================
  // GENERATION & DELIVERY ENDPOINTS
  // =========================================================================

  /**
   * POST /exec-digests/:id/generate
   * Generate digest content (sections) from aggregated data
   */
  server.post('/:id/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const validated = generateExecDigestSchema.parse(request.body || {});
      const response = await service.generateDigest(
        orgId,
        id,
        userId,
        validated as GenerateExecDigestInput
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error generating digest');
      return reply.status(errorMessage.includes('not found') ? 404 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /exec-digests/:id/deliver
   * Deliver digest to recipients via email
   */
  server.post('/:id/deliver', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const validated = deliverExecDigestSchema.parse(request.body || {});
      const response = await service.deliverDigest(
        orgId,
        id,
        userId,
        validated as DeliverExecDigestInput
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error delivering digest');
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
   * GET /exec-digests/:id/sections
   * List sections for a digest
   */
  server.get('/:id/sections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const response = await service.listSections(orgId, id);

      return reply.send({
        success: true,
        data: response,
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
   * POST /exec-digests/:id/sections/order
   * Update section ordering
   */
  server.post('/:id/sections/order', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const validated = updateSectionOrderSchema.parse(request.body);
      const sections = await service.updateSectionOrder(
        orgId,
        id,
        userId,
        (validated as UpdateSectionOrderInput).sections
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
  // RECIPIENT MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * GET /exec-digests/:id/recipients
   * List recipients for a digest
   */
  server.get('/:id/recipients', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const validated = listExecDigestRecipientsSchema.parse(request.query);
      const response = await service.listRecipients(
        orgId,
        id,
        { ...validated, digestId: id }
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing recipients');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /exec-digests/:id/recipients
   * Add a recipient to a digest
   */
  server.post('/:id/recipients', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const validated = addExecDigestRecipientSchema.parse(request.body);
      const recipient = await service.addRecipient(
        orgId,
        id,
        userId,
        validated as AddExecDigestRecipientInput
      );

      return reply.status(201).send({
        success: true,
        data: recipient,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error adding recipient');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /exec-digests/:id/recipients/:recipientId
   * Update a recipient
   */
  server.patch(
    '/:id/recipients/:recipientId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const orgId = getOrgId(request);
        const userId = getUserId(request);
        const { id, recipientId } = execDigestRecipientIdParamSchema.parse(request.params);
        const validated = updateExecDigestRecipientSchema.parse(request.body);
        const recipient = await service.updateRecipient(
          orgId,
          id,
          recipientId,
          userId,
          validated as UpdateExecDigestRecipientInput
        );

        if (!recipient) {
          return reply.status(404).send({
            success: false,
            error: 'Recipient not found',
          });
        }

        return reply.send({
          success: true,
          data: recipient,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        server.log.error({ err: error }, 'Error updating recipient');
        return reply.status(500).send({
          success: false,
          error: errorMessage,
        });
      }
    }
  );

  /**
   * DELETE /exec-digests/:id/recipients/:recipientId
   * Remove a recipient from a digest
   */
  server.delete(
    '/:id/recipients/:recipientId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const orgId = getOrgId(request);
        const userId = getUserId(request);
        const { id, recipientId } = execDigestRecipientIdParamSchema.parse(request.params);
        await service.removeRecipient(orgId, id, recipientId, userId);

        return reply.send({
          success: true,
          message: 'Recipient removed successfully',
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        server.log.error({ err: error }, 'Error removing recipient');
        return reply.status(500).send({
          success: false,
          error: errorMessage,
        });
      }
    }
  );

  // =========================================================================
  // DELIVERY LOG ENDPOINTS
  // =========================================================================

  /**
   * GET /exec-digests/:id/deliveries
   * List delivery logs for a digest
   */
  server.get('/:id/deliveries', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = execDigestIdParamSchema.parse(request.params);
      const validated = listExecDigestDeliveryLogsSchema.parse(request.query);
      const response = await service.listDeliveryLogs(
        orgId,
        id,
        { ...validated, digestId: id }
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error listing delivery logs');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });
}

export default executiveDigestRoutes;
