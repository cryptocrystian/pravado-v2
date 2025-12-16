/**
 * PR Pitch Routes (Sprint S39)
 * API endpoints for PR pitch and outreach sequence functionality
 */

import { FLAGS } from '@pravado/feature-flags';
import type {
  CreatePRPitchSequenceInput,
  GeneratePitchPreviewInput,
  UpdatePRPitchSequenceInput,
} from '@pravado/types';
import {
  apiEnvSchema,
  attachContactsSchema,
  createPRPitchSequenceSchema,
  generatePitchPreviewSchema,
  listPRPitchContactsSchema,
  listPRPitchSequencesSchema,
  updatePRPitchSequenceSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { createPRPitchService } from '../../services/prPitchService';

/**
 * Register PR pitch routes
 */
export async function prPitchRoutes(server: FastifyInstance): Promise<void> {
  // Check feature flag
  if (!FLAGS.ENABLE_PR_PITCH_ENGINE) {
    server.log.info('PR pitch routes disabled by feature flag');
    return;
  }

  // Create Supabase client (S100.3 fix)
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const pitchService = createPRPitchService(supabase);

  /**
   * Helper to get user's org ID
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('user_orgs')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1);

    return userOrgs?.[0]?.org_id || null;
  }

  // ============================================================================
  // POST /api/v1/pr/pitches/sequences - Create a new pitch sequence
  // ============================================================================
  server.post<{
    Body: CreatePRPitchSequenceInput;
  }>('/api/v1/pr/pitches/sequences', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      // Validate input
      const validation = createPRPitchSequenceSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid input',
            details: validation.error.errors,
          },
        });
      }

      const sequence = await pitchService.createSequence(orgId, userId, validation.data);

      return reply.status(201).send({
        success: true,
        data: { sequence },
      });
    } catch (error) {
      console.error('Failed to create pitch sequence:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create sequence',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/pr/pitches/sequences - List pitch sequences
  // ============================================================================
  server.get<{
    Querystring: Record<string, string | undefined>;
  }>('/api/v1/pr/pitches/sequences', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      // Parse and validate query params
      const validation = listPRPitchSequencesSchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid query parameters',
          },
        });
      }

      const result = await pitchService.listSequences(orgId, validation.data);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to list sequences:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list sequences',
        },
      });
    }
  });

  // ============================================================================
  // GET /api/v1/pr/pitches/sequences/:id - Get sequence with steps
  // ============================================================================
  server.get<{
    Params: { id: string };
  }>('/api/v1/pr/pitches/sequences/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);
      const sequenceId = request.params.id;

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      const sequence = await pitchService.getSequenceWithSteps(sequenceId, orgId);

      if (!sequence) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Sequence not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { sequence },
      });
    } catch (error) {
      console.error('Failed to get sequence:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get sequence',
        },
      });
    }
  });

  // ============================================================================
  // PUT /api/v1/pr/pitches/sequences/:id - Update sequence
  // ============================================================================
  server.put<{
    Params: { id: string };
    Body: UpdatePRPitchSequenceInput;
  }>('/api/v1/pr/pitches/sequences/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);
      const sequenceId = request.params.id;

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      // Validate input
      const validation = updatePRPitchSequenceSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid input',
            details: validation.error.errors,
          },
        });
      }

      const sequence = await pitchService.updateSequence(sequenceId, orgId, validation.data);

      return reply.send({
        success: true,
        data: { sequence },
      });
    } catch (error) {
      console.error('Failed to update sequence:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update sequence',
        },
      });
    }
  });

  // ============================================================================
  // DELETE /api/v1/pr/pitches/sequences/:id - Archive sequence
  // ============================================================================
  server.delete<{
    Params: { id: string };
  }>('/api/v1/pr/pitches/sequences/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);
      const sequenceId = request.params.id;

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      await pitchService.deleteSequence(sequenceId, orgId);

      return reply.send({
        success: true,
        data: { message: 'Sequence archived successfully' },
      });
    } catch (error) {
      console.error('Failed to delete sequence:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete sequence',
        },
      });
    }
  });

  // ============================================================================
  // POST /api/v1/pr/pitches/sequences/:id/contacts - Attach contacts
  // ============================================================================
  server.post<{
    Params: { id: string };
    Body: { journalistIds: string[] };
  }>(
    '/api/v1/pr/pitches/sequences/:id/contacts',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);
        const sequenceId = request.params.id;

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        // Validate input
        const validation = attachContactsSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid input',
              details: validation.error.errors,
            },
          });
        }

        const contacts = await pitchService.attachContactsToSequence(
          sequenceId,
          orgId,
          validation.data.journalistIds
        );

        return reply.status(201).send({
          success: true,
          data: { contacts, added: contacts.length },
        });
      } catch (error) {
        console.error('Failed to attach contacts:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to attach contacts',
          },
        });
      }
    }
  );

  // ============================================================================
  // GET /api/v1/pr/pitches/sequences/:id/contacts - List contacts
  // ============================================================================
  server.get<{
    Params: { id: string };
    Querystring: Record<string, string | undefined>;
  }>(
    '/api/v1/pr/pitches/sequences/:id/contacts',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);
        const sequenceId = request.params.id;

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        // Parse and validate query params
        const validation = listPRPitchContactsSchema.safeParse(request.query);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid query parameters',
            },
          });
        }

        const result = await pitchService.listContacts(sequenceId, orgId, validation.data);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error('Failed to list contacts:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to list contacts',
          },
        });
      }
    }
  );

  // ============================================================================
  // POST /api/v1/pr/pitches/preview - Generate pitch preview
  // ============================================================================
  server.post<{
    Body: GeneratePitchPreviewInput;
  }>('/api/v1/pr/pitches/preview', { preHandler: requireUser }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found for user',
          },
        });
      }

      // Validate input
      const validation = generatePitchPreviewSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid input',
            details: validation.error.errors,
          },
        });
      }

      const preview = await pitchService.generatePitchPreview(orgId, userId, validation.data);

      return reply.send({
        success: true,
        data: { preview },
      });
    } catch (error) {
      console.error('Failed to generate pitch preview:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate preview',
        },
      });
    }
  });

  // ============================================================================
  // POST /api/v1/pr/pitches/contacts/:id/queue - Queue pitch for contact
  // ============================================================================
  server.post<{
    Params: { id: string };
  }>(
    '/api/v1/pr/pitches/contacts/:id/queue',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);
        const contactId = request.params.id;

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const contact = await pitchService.queuePitchForContact(contactId, orgId);

        return reply.send({
          success: true,
          data: { contact },
        });
      } catch (error) {
        console.error('Failed to queue pitch:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to queue pitch',
          },
        });
      }
    }
  );

  // ============================================================================
  // GET /api/v1/pr/pitches/contacts/:id - Get contact with events
  // ============================================================================
  server.get<{
    Params: { id: string };
  }>(
    '/api/v1/pr/pitches/contacts/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId);
        const contactId = request.params.id;

        if (!orgId) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const contact = await pitchService.getContactWithEvents(contactId, orgId);

        if (!contact) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Contact not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: { contact },
        });
      } catch (error) {
        console.error('Failed to get contact:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get contact',
          },
        });
      }
    }
  );
}
