/**
 * PR Outreach Routes (Sprint S44)
 * API routes for automated journalist outreach
 */

import { FLAGS } from '@pravado/feature-flags';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import type { OutreachEventType } from '@pravado/types';

import type { ProviderConfig } from '@pravado/types';
import {
  advanceRunInputSchema,
  apiEnvSchema,
  createOutreachEventInputSchema,
  createOutreachSequenceInputSchema,
  createOutreachStepInputSchema,
  listOutreachEventsQuerySchema,
  listOutreachRunsQuerySchema,
  listOutreachSequencesQuerySchema,
  sendPitchInputSchema,
  startSequenceRunsInputSchema,
  stopRunInputSchema,
  updateOutreachRunInputSchema,
  updateOutreachSequenceInputSchema,
  updateOutreachStepInputSchema,
  validateEnv,
} from '@pravado/validators';
import { requireUser } from '../../middleware/requireUser';
import { createOutreachService } from '../../services/outreachService';
import { createOutreachDeliverabilityService } from '../../services/outreachDeliverabilityService';
import { createAIDraftService } from '../../services/aiDraftService';

/**
 * Get provider configuration from environment (S98)
 */
function getProviderConfig(): ProviderConfig {
  const provider = (process.env.EMAIL_PROVIDER as any) || 'stub';

  if (provider === 'sendgrid') {
    return {
      provider: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@pravado.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'Pravado',
    };
  } else if (provider === 'mailgun') {
    return {
      provider: 'mailgun',
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
      fromEmail: process.env.MAILGUN_FROM_EMAIL || 'noreply@pravado.com',
      fromName: 'Pravado',
    };
  }

  return {
    provider: 'stub',
    fromEmail: 'noreply@pravado.com',
    fromName: 'Pravado',
  };
}

export default async function prOutreachRoutes(fastify: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_PR_OUTREACH) {
    fastify.log.info('PR outreach routes disabled by feature flag');
    return;
  }

  // Create Supabase client
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

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
  // =============================================
  // Sequences
  // =============================================

  /**
   * POST /api/pr-outreach/sequences
   * Create a new outreach sequence
   */
  fastify.post(
    '/sequences',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = createOutreachSequenceInputSchema.parse(request.body);

      const service = createOutreachService({ supabase });
      const sequence = await service.createSequence(orgId, input);

      return reply.send({
        success: true,
        data: sequence,
      });
    }
  );

  /**
   * GET /api/pr-outreach/sequences
   * List outreach sequences
   */
  fastify.get(
    '/sequences',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = listOutreachSequencesQuerySchema.parse(request.query);

      const service = createOutreachService({ supabase });
      const result = await service.listSequences(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/pr-outreach/sequences/:id
   * Get a single sequence
   */
  fastify.get(
    '/sequences/:id',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const service = createOutreachService({ supabase });
      const sequence = await service.getSequence(id, orgId);

      return reply.send({
        success: true,
        data: sequence,
      });
    }
  );

  /**
   * GET /api/pr-outreach/sequences/:id/with-steps
   * Get sequence with steps
   */
  fastify.get(
    '/sequences/:id/with-steps',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const service = createOutreachService({ supabase });
      const sequence = await service.getSequenceWithSteps(id, orgId);

      return reply.send({
        success: true,
        data: sequence,
      });
    }
  );

  /**
   * PATCH /api/pr-outreach/sequences/:id
   * Update a sequence
   */
  fastify.patch(
    '/sequences/:id',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const input = updateOutreachSequenceInputSchema.parse(request.body);

      const service = createOutreachService({ supabase });
      const sequence = await service.updateSequence(id, orgId, input);

      return reply.send({
        success: true,
        data: sequence,
      });
    }
  );

  /**
   * DELETE /api/pr-outreach/sequences/:id
   * Delete a sequence
   */
  fastify.delete(
    '/sequences/:id',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const service = createOutreachService({ supabase });
      await service.deleteSequence(id, orgId);

      return reply.send({
        success: true,
        data: null,
      });
    }
  );

  // =============================================
  // Steps
  // =============================================

  /**
   * POST /api/pr-outreach/sequences/:sequenceId/steps
   * Create a new step
   */
  fastify.post(
    '/sequences/:sequenceId/steps',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sequenceId } = request.params as { sequenceId: string };

      const input = createOutreachStepInputSchema.parse(request.body);

      const service = createOutreachService({ supabase });
      const step = await service.createStep(sequenceId, input);

      return reply.send({
        success: true,
        data: step,
      });
    }
  );

  /**
   * PATCH /api/pr-outreach/steps/:id
   * Update a step
   */
  fastify.patch(
    '/steps/:id',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const input = updateOutreachStepInputSchema.parse(request.body);

      const service = createOutreachService({ supabase });
      const step = await service.updateStep(id, input);

      return reply.send({
        success: true,
        data: step,
      });
    }
  );

  /**
   * DELETE /api/pr-outreach/steps/:id
   * Delete a step
   */
  fastify.delete(
    '/steps/:id',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const service = createOutreachService({ supabase });
      await service.deleteStep(id);

      return reply.send({
        success: true,
        data: null,
      });
    }
  );

  // =============================================
  // Runs
  // =============================================

  /**
   * POST /api/pr-outreach/sequences/:sequenceId/start
   * Start sequence runs
   */
  fastify.post(
    '/sequences/:sequenceId/start',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { sequenceId } = request.params as { sequenceId: string };

      const body = request.body as Record<string, unknown>;
      const input = startSequenceRunsInputSchema.parse({
        sequenceId,
        ...body,
      });

      const service = createOutreachService({ supabase });
      const result = await service.startSequenceRuns(orgId, input);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/pr-outreach/runs
   * List runs
   */
  fastify.get(
    '/runs',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = listOutreachRunsQuerySchema.parse(request.query);

      const service = createOutreachService({ supabase });
      const result = await service.listRuns(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/pr-outreach/runs/:id
   * Get run with details
   */
  fastify.get(
    '/runs/:id',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const service = createOutreachService({ supabase });
      const run = await service.getRunWithDetails(id, orgId);

      return reply.send({
        success: true,
        data: run,
      });
    }
  );

  /**
   * PATCH /api/pr-outreach/runs/:id
   * Update a run
   */
  fastify.patch(
    '/runs/:id',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const input = updateOutreachRunInputSchema.parse(request.body);

      const service = createOutreachService({ supabase });
      const run = await service.updateRun(id, orgId, input);

      return reply.send({
        success: true,
        data: run,
      });
    }
  );

  /**
   * POST /api/pr-outreach/runs/:id/stop
   * Stop a run
   */
  fastify.post(
    '/runs/:id/stop',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const body = request.body as Record<string, unknown>;
      const input = stopRunInputSchema.parse({ runId: id, ...body });

      const service = createOutreachService({ supabase });
      const run = await service.stopRun(id, orgId, input.reason);

      return reply.send({
        success: true,
        data: run,
      });
    }
  );

  /**
   * POST /api/pr-outreach/runs/:id/advance
   * Manually advance a run
   */
  fastify.post(
    '/runs/:id/advance',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const body = request.body as Record<string, unknown>;
      const input = advanceRunInputSchema.parse({ runId: id, ...body });

      const service = createOutreachService({ supabase });
      const run = await service.advanceRun(id, orgId, input.forceAdvance);

      return reply.send({
        success: true,
        data: run,
      });
    }
  );

  // =============================================
  // Events
  // =============================================

  /**
   * POST /api/pr-outreach/events
   * Create an event (mostly for testing)
   */
  fastify.post(
    '/events',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = createOutreachEventInputSchema.parse(request.body);

      const service = createOutreachService({ supabase });
      const event = await service.createEvent(orgId, input);

      return reply.send({
        success: true,
        data: event,
      });
    }
  );

  /**
   * GET /api/pr-outreach/events
   * List events
   */
  fastify.get(
    '/events',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = listOutreachEventsQuerySchema.parse(request.query);

      const service = createOutreachService({ supabase });
      const result = await service.listEvents(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * POST /api/pr-outreach/webhooks/track
   * Track email events (opened, clicked, etc.)
   */
  fastify.post(
    '/webhooks/track',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { eventId, eventType, metadata } = request.body as {
        eventId?: string;
        eventType?: string;
        metadata?: Record<string, unknown>;
      };

      if (!eventId || !eventType) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'eventId and eventType are required',
          },
        });
      }

      const service = createOutreachService({ supabase });
      await service.trackEmailEvent(eventId, eventType as OutreachEventType, metadata);

      return reply.send({
        success: true,
        data: null,
      });
    }
  );

  // =============================================
  // Targeting & Stats
  // =============================================

  /**
   * GET /api/pr-outreach/sequences/:id/preview-targeting
   * Preview targeting for a sequence
   */
  fastify.get(
    '/sequences/:id/preview-targeting',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params as { id: string };

      const service = createOutreachService({ supabase });
      const preview = await service.previewTargeting(id, orgId);

      return reply.send({
        success: true,
        data: preview,
      });
    }
  );

  /**
   * GET /api/pr-outreach/stats
   * Get outreach stats
   */
  fastify.get(
    '/stats',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { sequenceId } = request.query as { sequenceId?: string };

      const service = createOutreachService({ supabase });
      const stats = await service.getStats(orgId, sequenceId);

      return reply.send({
        success: true,
        data: stats,
      });
    }
  );

  // =============================================
  // S98: Direct Email Sending
  // =============================================

  /**
   * POST /api/pr-outreach/send-pitch
   * Send a pitch directly to a journalist (S98)
   */
  fastify.post(
    '/send-pitch',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const input = sendPitchInputSchema.parse(request.body);

      // Look up the journalist's email
      const { data: journalist, error: journalistError } = await supabase
        .from('journalists')
        .select('id, name, email, outlet')
        .eq('id', input.journalistId)
        .single();

      if (journalistError || !journalist) {
        return reply.status(404).send({
          success: false,
          error: { code: 'JOURNALIST_NOT_FOUND', message: 'Journalist not found' },
        });
      }

      if (!journalist.email) {
        return reply.status(400).send({
          success: false,
          error: { code: 'NO_EMAIL', message: 'Journalist has no email address' },
        });
      }

      // Get email provider config and create service
      const providerConfig = getProviderConfig();
      const deliverabilityService = createOutreachDeliverabilityService({
        supabase,
        providerConfig
      });

      // Send the email
      const sendResult = await deliverabilityService.sendEmail({
        to: journalist.email,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText || '',
        metadata: {
          orgId,
          journalistId: input.journalistId,
          pitchId: input.pitchId,
          articleId: input.articleId,
          ...input.metadata,
        },
      });

      // Record the email message for tracking
      if (sendResult.success && sendResult.messageId) {
        try {
          await deliverabilityService.createEmailMessage(orgId, {
            journalistId: input.journalistId,
            subject: input.subject,
            bodyHtml: input.bodyHtml,
            bodyText: input.bodyText || '',
            providerMessageId: sendResult.messageId,
            metadata: {
              pitchId: input.pitchId,
              articleId: input.articleId,
              sentBy: user.id,
              provider: sendResult.provider,
            },
          });
        } catch (err) {
          // Log but don't fail the request
          fastify.log.error({ err }, 'Failed to record email message');
        }
      }

      return reply.send({
        success: true,
        data: {
          success: sendResult.success,
          messageId: sendResult.messageId,
          provider: sendResult.provider,
          sentAt: sendResult.success ? new Date() : null,
          error: sendResult.error,
          journalist: {
            id: journalist.id,
            name: journalist.name,
            email: journalist.email,
            outlet: journalist.outlet,
          },
        },
      });
    }
  );

  /**
   * GET /api/pr-outreach/journalist/:journalistId/history
   * Get outreach history for a specific journalist (S98)
   */
  fastify.get<{
    Params: { journalistId: string };
  }>(
    '/journalist/:journalistId/history',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { journalistId } = request.params;

      const providerConfig = getProviderConfig();
      const deliverabilityService = createOutreachDeliverabilityService({
        supabase,
        providerConfig
      });

      // Get email messages for this journalist
      const messages = await deliverabilityService.listEmailMessages(orgId, {
        journalistId,
        limit: 50,
      });

      // Get engagement metrics
      const engagement = await deliverabilityService.getJournalistEngagement(journalistId, orgId);

      return reply.send({
        success: true,
        data: {
          messages: messages.messages,
          total: messages.total,
          engagement,
        },
      });
    }
  );

  // =============================================
  // S98: AI Draft Generation
  // =============================================

  /**
   * POST /api/pr-outreach/generate-draft
   * Generate an AI-powered pitch or response draft (S98)
   */
  fastify.post<{
    Body: {
      journalistId: string;
      action: 'pitch' | 'respond' | 'follow-up';
      topic?: string;
      angle?: string;
      coverageTitle?: string;
      coverageSummary?: string;
    };
  }>(
    '/generate-draft',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { journalistId, action, topic, angle, coverageTitle, coverageSummary } = request.body;

      if (!journalistId || !action) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'journalistId and action are required' },
        });
      }

      // Look up journalist
      const { data: journalist, error: journalistError } = await supabase
        .from('journalists')
        .select('id, name, email, outlet, beat, topics')
        .eq('id', journalistId)
        .single();

      if (journalistError || !journalist) {
        return reply.status(404).send({
          success: false,
          error: { code: 'JOURNALIST_NOT_FOUND', message: 'Journalist not found' },
        });
      }

      // Look up org for brand context
      const { data: org } = await supabase
        .from('orgs')
        .select('name, description')
        .eq('id', orgId)
        .single();

      const brandName = org?.name || 'Our Company';
      const brandDescription = org?.description;

      // Create the AI draft service and generate draft
      const aiDraftService = createAIDraftService();

      try {
        const draft = action === 'respond' || action === 'follow-up'
          ? await aiDraftService.generateResponseDraft({
              journalistName: journalist.name,
              journalistEmail: journalist.email,
              journalistOutlet: journalist.outlet,
              journalistBeat: journalist.beat,
              journalistTopics: journalist.topics || [],
              brandName,
              brandDescription,
              coverageTitle,
              coverageSummary,
              action,
              topic,
              angle,
            })
          : await aiDraftService.generatePitchDraft({
              journalistName: journalist.name,
              journalistEmail: journalist.email,
              journalistOutlet: journalist.outlet,
              journalistBeat: journalist.beat,
              journalistTopics: journalist.topics || [],
              brandName,
              brandDescription,
              action,
              topic,
              angle,
            });

        return reply.send({
          success: true,
          data: {
            subject: draft.subject,
            bodyHtml: draft.bodyHtml,
            bodyText: draft.bodyText,
            reasoning: draft.reasoning,
            generatedAt: draft.generatedAt,
            journalist: {
              id: journalist.id,
              name: journalist.name,
              email: journalist.email,
              outlet: journalist.outlet,
            },
          },
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to generate AI draft');
        return reply.status(500).send({
          success: false,
          error: { code: 'GENERATION_FAILED', message: 'Failed to generate draft' },
        });
      }
    }
  );
}
