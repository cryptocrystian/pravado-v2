/**
 * PR Outreach Deliverability Routes (Sprint S45)
 * API routes for email deliverability tracking and engagement analytics
 */

import { FLAGS } from '@pravado/feature-flags';
import type { ProviderConfig } from '@pravado/types';
import {
  apiEnvSchema,
  emailProviderSchema,
  listEmailMessagesQuerySchema,
  listEngagementMetricsQuerySchema,
  sendEmailRequestSchema,
  updateEmailMessageInputSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';


import { requireUser } from '../../middleware/requireUser';
import { createOutreachDeliverabilityService } from '../../services/outreachDeliverabilityService';


/**
 * Get provider configuration from environment (S98)
 * Supports SendGrid, Mailgun, or Stub providers
 */
function getProviderConfig(): ProviderConfig {
  const provider = (process.env.EMAIL_PROVIDER as any) || 'stub';

  // SendGrid configuration (primary for S98)
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@pravado.com';
  const sendgridFromName = process.env.SENDGRID_FROM_NAME || 'Pravado';
  const sendgridWebhookKey = process.env.SENDGRID_WEBHOOK_KEY;

  // Mailgun configuration (fallback)
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@pravado.com';

  // Select config based on provider
  if (provider === 'sendgrid') {
    return {
      provider: 'sendgrid',
      apiKey: sendgridApiKey,
      fromEmail: sendgridFromEmail,
      fromName: sendgridFromName,
      webhookKey: sendgridWebhookKey,
    };
  } else if (provider === 'mailgun') {
    return {
      provider: 'mailgun',
      apiKey: mailgunApiKey,
      domain: mailgunDomain,
      fromEmail: mailgunFromEmail,
      fromName: 'Pravado',
    };
  }

  // Default to stub
  return {
    provider: 'stub',
    fromEmail: 'noreply@pravado.com',
    fromName: 'Pravado',
  };
}

export default async function prOutreachDeliverabilityRoutes(fastify: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_PR_OUTREACH_DELIVERABILITY) {
    fastify.log.info('PR outreach deliverability routes disabled by feature flag');
    return;
  }

  // Create Supabase client
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const providerConfig = getProviderConfig();

  /**
   * Helper to get user's org ID
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1);

    return userOrgs?.[0]?.org_id || null;
  }

  // =============================================
  // Email Messages
  // =============================================

  /**
   * GET /api/pr-outreach-deliverability/messages
   * List email messages
   */
  fastify.get(
    '/messages',
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

      const query = listEmailMessagesQuerySchema.parse(request.query);

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const result = await service.listEmailMessages(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/pr-outreach-deliverability/messages/:id
   * Get a single email message
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/messages/:id',
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

      const { id } = request.params;

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const message = await service.getEmailMessage(id, orgId);

      if (!message) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Email message not found' },
        });
      }

      return reply.send({
        success: true,
        data: message,
      });
    }
  );

  /**
   * PATCH /api/pr-outreach-deliverability/messages/:id
   * Update an email message
   */
  fastify.patch<{
    Params: { id: string };
  }>(
    '/messages/:id',
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

      const { id } = request.params;
      const input = updateEmailMessageInputSchema.parse(request.body);

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const message = await service.updateEmailMessage(id, orgId, input);

      return reply.send({
        success: true,
        data: message,
      });
    }
  );

  /**
   * DELETE /api/pr-outreach-deliverability/messages/:id
   * Delete an email message
   */
  fastify.delete<{
    Params: { id: string };
  }>(
    '/messages/:id',
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

      const { id } = request.params;

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      await service.deleteEmailMessage(id, orgId);

      return reply.send({
        success: true,
        data: null,
      });
    }
  );

  // =============================================
  // Engagement Metrics
  // =============================================

  /**
   * GET /api/pr-outreach-deliverability/engagement
   * List engagement metrics
   */
  fastify.get(
    '/engagement',
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

      const query = listEngagementMetricsQuerySchema.parse(request.query);

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const result = await service.listEngagementMetrics(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/pr-outreach-deliverability/engagement/:journalistId
   * Get engagement metrics for a journalist
   */
  fastify.get<{
    Params: { journalistId: string };
  }>(
    '/engagement/:journalistId',
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

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const engagement = await service.getJournalistEngagement(journalistId, orgId);

      if (!engagement) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Engagement metrics not found' },
        });
      }

      return reply.send({
        success: true,
        data: engagement,
      });
    }
  );

  /**
   * POST /api/pr-outreach-deliverability/engagement/:journalistId/recalculate
   * Recalculate engagement metrics for a journalist
   */
  fastify.post<{
    Params: { journalistId: string };
  }>(
    '/engagement/:journalistId/recalculate',
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

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const result = await service.updateEngagementMetrics(journalistId, orgId);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // =============================================
  // Statistics
  // =============================================

  /**
   * GET /api/pr-outreach-deliverability/stats/deliverability
   * Get deliverability summary statistics
   */
  fastify.get(
    '/stats/deliverability',
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

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const summary = await service.getDeliverabilitySummary(orgId);

      return reply.send({
        success: true,
        data: summary,
      });
    }
  );

  /**
   * GET /api/pr-outreach-deliverability/stats/top-engaged
   * Get top engaged journalists
   */
  fastify.get(
    '/stats/top-engaged',
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

      const { limit } = request.query as any;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const topEngaged = await service.getTopEngagedJournalists(orgId, limitNum);

      return reply.send({
        success: true,
        data: topEngaged,
      });
    }
  );

  // =============================================
  // Webhooks
  // =============================================

  /**
   * POST /api/pr-outreach-deliverability/webhooks/:provider
   * Process webhook events from email providers (S98 - with signature validation)
   */
  fastify.post(
    '/webhooks/:provider',
    {
      // For SendGrid signature validation, we need the raw body
      config: {
        rawBody: true,
      },
    },
    async (request: FastifyRequest<{ Params: { provider: string } }>, reply: FastifyReply) => {
      const { provider } = request.params;

      // Validate provider
      const parseResult = emailProviderSchema.safeParse(provider);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_PROVIDER', message: 'Invalid email provider' },
        });
      }

      // Get signature and timestamp from headers (provider-specific)
      // SendGrid uses X-Twilio-Email-Event-Webhook-Signature and X-Twilio-Email-Event-Webhook-Timestamp
      const signature =
        (request.headers['x-twilio-email-event-webhook-signature'] as string) ||
        (request.headers['x-mailgun-signature'] as string) ||
        (request.headers['x-amz-sns-message-id'] as string);

      const timestamp = request.headers['x-twilio-email-event-webhook-timestamp'] as string;

      // Get raw body for signature validation (or stringify if not available)
      const rawBody = (request as any).rawBody?.toString() ||
        (typeof request.body === 'string' ? request.body : JSON.stringify(request.body));

      // For webhook processing, we need to determine the org ID from the payload
      // This is typically embedded in metadata or we can look it up by message ID
      const payload = request.body as any;

      try {
        // Create service without specific org (we'll determine it from the message)
        const service = createOutreachDeliverabilityService({ supabase, providerConfig });

        // Process the webhook with raw body for signature validation
        // Note: The service will look up the org from the message
        const result = await service.processWebhookEvent(
          'placeholder-org-id', // TODO: Extract from payload or lookup
          parseResult.data,
          payload,
          signature,
          timestamp,
          rawBody
        );

        return reply.send({
          success: result.success,
          data: result,
        });
      } catch (error) {
        fastify.log.error({ error }, 'Webhook processing error');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'WEBHOOK_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  // =============================================
  // Testing & Development
  // =============================================

  /**
   * POST /api/pr-outreach-deliverability/test-send
   * Test email sending (development only)
   */
  fastify.post(
    '/test-send',
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

      const emailRequest = sendEmailRequestSchema.parse(request.body);

      const service = createOutreachDeliverabilityService({ supabase, providerConfig });
      const result = await service.sendEmail(emailRequest);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );
}
