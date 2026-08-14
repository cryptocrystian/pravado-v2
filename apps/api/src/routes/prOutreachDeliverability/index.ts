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

import { captureRawBody } from '../../lib/captureRawBody';
import { requireUser } from '../../middleware/requireUser';
import { createSupabaseGovernanceGateways } from '../../services/governanceGateways';
import {
  createOutreachDeliverabilityService,
  resolveWebhookOrgId,
  verifySvixSignature,
} from '../../services/outreachDeliverabilityService';
import {
  parseTokenFromRecipients,
  processInboundReply,
  resolveReplyToken,
} from '../../services/pr/replyCapture';
import {
  deliverabilityRawSend,
  sendGuardedEmail,
} from '../../services/sendGuardedEmail';

/**
 * Get provider configuration from environment (S98)
 * Supports SendGrid, Mailgun, or Stub providers
 */
function getProviderConfig(): ProviderConfig {
  const provider = (process.env.EMAIL_PROVIDER as any) || 'stub';

  // SendGrid configuration (primary for S98)
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail =
    process.env.SENDGRID_FROM_EMAIL || 'noreply@pravado.com';
  const sendgridFromName = process.env.SENDGRID_FROM_NAME || 'Pravado';
  const sendgridWebhookKey = process.env.SENDGRID_WEBHOOK_KEY;

  // Mailgun configuration (fallback)
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunFromEmail =
    process.env.MAILGUN_FROM_EMAIL || 'noreply@pravado.com';

  // Select config based on provider
  if (provider === 'sendgrid') {
    return {
      provider: 'sendgrid',
      apiKey: sendgridApiKey,
      fromEmail: sendgridFromEmail,
      fromName: sendgridFromName,
      webhookKey: sendgridWebhookKey,
    };
  }
  if (provider === 'resend') {
    return {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
      fromEmail:
        process.env.RESEND_OUTREACH_FROM_EMAIL || 'outreach@pravado.io',
      fromName: process.env.RESEND_FROM_NAME || 'Pravado',
      webhookKey: process.env.RESEND_WEBHOOK_SECRET,
    };
  }
  if (provider === 'mailgun') {
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

export default async function prOutreachDeliverabilityRoutes(
  fastify: FastifyInstance
) {
  // Check feature flag
  if (!FLAGS.ENABLE_PR_OUTREACH_DELIVERABILITY) {
    fastify.log.info(
      'PR outreach deliverability routes disabled by feature flag'
    );
    return;
  }

  // Create Supabase client
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
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

  /**
   * Dependencies for the provider-agnostic inbound-reply core. The forward uses
   * the transactional mailer (`request.server.mailer.sendMail`) — the
   * governance-clean channel, NOT the outreach provider — and engagement
   * recompute rides the deliverability service.
   */
  function buildInboundDeps(request: FastifyRequest) {
    return {
      supabase,
      sendMail: (msg: {
        to: string;
        subject: string;
        html: string;
        text: string;
      }) => request.server.mailer.sendMail(msg),
      updateEngagement: async (journalistId: string, orgId: string) => {
        const svc = createOutreachDeliverabilityService({
          supabase,
          providerConfig,
        });
        await svc.updateEngagementMetrics(journalistId, orgId);
      },
      logWarn: (obj: unknown, msg: string) => fastify.log.warn(obj, msg),
    };
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const engagement = await service.getJournalistEngagement(
        journalistId,
        orgId
      );

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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const topEngaged = await service.getTopEngagedJournalists(
        orgId,
        limitNum
      );

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
  fastify.post<{ Params: { provider: string } }>(
    '/webhooks/:provider',
    {
      // Raw body is required for HMAC signature verification (SendGrid /
      // Mailgun). Plan 06d replaced the `fastify-raw-body` plugin (Fastify
      // ^5.x peer dep, repo on 4.29.1) with this per-route preParsing hook —
      // see apps/api/src/lib/captureRawBody.ts. The hook decorates
      // `request.rawBody` with the byte-exact Buffer that arrived on the
      // wire, then re-streams it so Fastify body parsing continues normally.
      preParsing: captureRawBody,
    },
    async (request, reply: FastifyReply) => {
      const { provider } = request.params;

      // Validate provider
      const parseResult = emailProviderSchema.safeParse(provider);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_PROVIDER',
            message: 'Invalid email provider',
          },
        });
      }

      // Get signature and timestamp from headers (provider-specific)
      // SendGrid uses X-Twilio-Email-Event-Webhook-Signature and X-Twilio-Email-Event-Webhook-Timestamp
      const signature =
        (request.headers['x-twilio-email-event-webhook-signature'] as string) ||
        (request.headers['svix-signature'] as string) || // Resend (Svix)
        (request.headers['x-mailgun-signature'] as string) ||
        (request.headers['x-amz-sns-message-id'] as string);

      const timestamp = (request.headers[
        'x-twilio-email-event-webhook-timestamp'
      ] || request.headers['svix-timestamp']) as string;

      // Svix message id (Resend) — part of the signed content.
      const svixId = request.headers['svix-id'] as string | undefined;

      // Raw body required for HMAC signature verification. The route's
      // `preParsing: captureRawBody` hook (above) decorates `request.rawBody`
      // with the byte-exact Buffer that arrived on the wire. If `rawBody` is
      // missing here, the hook didn't run — REJECT the webhook with 500.
      // NEVER fall back to JSON.stringify(request.body): re-serialized bytes
      // do not match the bytes SendGrid signed, so HMAC verification would
      // silently fail and the event would be ack'd while being dropped here.
      // (Track 0D Group 1 B1 hardening principle; DECISIONS_LOG 2026-05-15,
      // 2026-06-05.)
      const rawBody = request.rawBody?.toString();
      if (!rawBody) {
        fastify.log.error(
          { provider, hasRawBody: false, requestId: request.id },
          'Webhook rejected: raw body unavailable. captureRawBody preParsing hook did not decorate request.rawBody.'
        );
        return reply.status(500).send({
          success: false,
          error: {
            code: 'RAW_BODY_UNAVAILABLE',
            message:
              'Webhook signature validation requires raw body; preParsing hook misconfigured.',
          },
        });
      }

      // Resolve the owning org from the event (#7): custom_args `orgId` (set at
      // send), else a provider_message_id lookup. The former hardcoded
      // 'placeholder-org-id' scoped the message lookup to a non-existent org, so
      // every deliverability event was silently dropped.
      const payload = request.body as Record<string, unknown>;

      const orgId = await resolveWebhookOrgId(supabase, payload);
      if (!orgId) {
        // Ack (200) so the provider does not retry a permanently-unresolvable
        // event, but record that we could not attribute it.
        fastify.log.warn(
          { provider, requestId: request.id },
          'Webhook org unresolved (no custom_args orgId + provider_message_id lookup miss) — skipping event.'
        );
        return reply.send({
          success: false,
          data: { processed: false, reason: 'org_unresolved' },
        });
      }

      try {
        const service = createOutreachDeliverabilityService({
          supabase,
          providerConfig,
        });

        // Process the webhook with raw body for signature validation
        const result = await service.processWebhookEvent(
          orgId,
          parseResult.data,
          payload,
          signature,
          timestamp,
          rawBody,
          svixId
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

  // SendGrid Inbound Parse route removed: reply.pravado.io MX now points to
  // Resend inbound (below), confirmed round-tripping in prod. SendGrid is
  // retired from the mail path entirely.

  // ===========================================================================
  // Inbound reply capture — Resend inbound (PRIMARY)
  // POST /api/v1/pr-outreach-deliverability/inbound/resend
  //
  // Resend delivers inbound mail in two steps (unlike SendGrid's single multipart
  // POST): an `email.received` Svix-signed webhook carries only metadata
  // (email_id, from, to[], subject, message_id) — NOT the body — so we fetch the
  // body from the Received-emails API by email_id, then hand the normalized
  // message to the same provider-agnostic core the legacy route uses.
  //
  // Signature: Svix (svix-id / svix-timestamp / svix-signature, `whsec_` secret).
  // Ack 2xx on resolvable AND unresolvable input so Resend does not retry a
  // permanently-unprocessable event; 5xx only on an unexpected fault.
  // ===========================================================================
  fastify.post(
    '/inbound/resend',
    { preParsing: captureRawBody },
    async (request, reply) => {
      if (!FLAGS.PR_OUTREACH_INBOUND_WIRED) {
        return reply
          .status(404)
          .send({ success: false, error: { code: 'NOT_WIRED' } });
      }

      // Verify the Svix signature over the byte-exact raw body. The inbound
      // webhook has its own signing secret; fall back to the engagement webhook
      // secret only if a dedicated one is not set (single-endpoint setups).
      const secret =
        process.env.RESEND_INBOUND_WEBHOOK_SECRET ||
        process.env.RESEND_WEBHOOK_SECRET;
      const rawBody = request.rawBody?.toString();
      if (secret) {
        if (!rawBody) {
          fastify.log.error(
            { requestId: request.id },
            'Resend inbound rejected: raw body unavailable (captureRawBody hook did not run).'
          );
          return reply.status(500).send({
            success: false,
            error: { code: 'RAW_BODY_UNAVAILABLE' },
          });
        }
        const ok = await verifySvixSignature(secret, {
          id: request.headers['svix-id'] as string | undefined,
          timestamp: request.headers['svix-timestamp'] as string | undefined,
          signature: request.headers['svix-signature'] as string | undefined,
          payload: rawBody,
        });
        if (!ok) {
          return reply
            .status(401)
            .send({ success: false, error: { code: 'BAD_SIGNATURE' } });
        }
      }

      try {
        const payload = request.body as {
          type?: string;
          data?: {
            email_id?: string;
            from?: string;
            to?: string[];
            received_for?: string[];
            subject?: string;
            message_id?: string;
          };
        };

        // Only inbound-received events are reply captures; ack-ignore the rest.
        if (payload?.type !== 'email.received' || !payload.data?.email_id) {
          return reply.send({
            success: true,
            data: { processed: false, reason: 'ignored_event' },
          });
        }
        const data = payload.data;

        // The tokenized reply-to is the envelope recipient; it may land in `to`
        // or `received_for` (forwarded). Search both.
        const recipients = [
          ...(data.to ?? []),
          ...(data.received_for ?? []),
        ].join(', ');
        const token = parseTokenFromRecipients(recipients);
        if (!token) {
          return reply.send({
            success: false,
            data: { processed: false, reason: 'no_token' },
          });
        }
        const tokenRow = await resolveReplyToken(supabase, token);
        if (!tokenRow) {
          return reply.send({
            success: false,
            data: { processed: false, reason: 'token_unresolved' },
          });
        }

        // Fetch the body (text/html/headers) from the Received-emails API. The
        // webhook omits it by design (serverless-friendly payload size).
        let bodyText: string | null = null;
        let bodyHtml: string | null = null;
        let headersRaw: string | null = null;
        let fromEmail: string | null = data.from ?? null;
        let subject: string | null = data.subject ?? null;
        let inboundMessageId: string | null = data.message_id ?? null;
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
          try {
            const res = await fetch(
              `https://api.resend.com/emails/receiving/${data.email_id}`,
              { headers: { Authorization: `Bearer ${apiKey}` } }
            );
            if (res.ok) {
              const body = (await res.json()) as {
                text?: string | null;
                html?: string | null;
                headers?: Record<string, string> | null;
                from?: string;
                subject?: string;
                message_id?: string;
              };
              bodyText = body.text ?? null;
              bodyHtml = body.html ?? null;
              headersRaw = body.headers
                ? Object.entries(body.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n')
                : null;
              fromEmail = body.from ?? fromEmail;
              subject = body.subject ?? subject;
              inboundMessageId = body.message_id ?? inboundMessageId;
            } else {
              fastify.log.warn(
                { status: res.status, emailId: data.email_id },
                'Resend received-email fetch failed; recording reply from webhook metadata only'
              );
            }
          } catch (err) {
            fastify.log.warn(
              { err, emailId: data.email_id },
              'Resend received-email fetch threw; recording reply from webhook metadata only'
            );
          }
        }

        const result = await processInboundReply(buildInboundDeps(request), {
          tokenRow,
          fromEmail,
          subject,
          bodyText,
          bodyHtml,
          headersRaw,
          inboundMessageId,
        });

        return reply.send({ success: true, data: result });
      } catch (error) {
        fastify.log.error({ error }, 'Resend inbound processing error');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INBOUND_ERROR',
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

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });

      // Even the test-send path routes through the governed chokepoint so it
      // can NEVER egress to a suppressed/bounced recipient. purpose:'test'
      // bypasses eligibility/caps/personalization but NOT suppression.
      const gateways = createSupabaseGovernanceGateways(supabase);
      const guarded = await sendGuardedEmail({
        request: emailRequest,
        context: {
          orgId,
          recipientEmail: emailRequest.to,
          actorId: user.id,
          isFollowUp: false,
          purpose: 'test',
          personalization: { name: null, outlet: null, beats: [] },
        },
        gateways,
        rawSend: deliverabilityRawSend(service),
        logger: fastify.log,
      });

      if (guarded.refusal) {
        return reply.status(422).send({
          success: false,
          error: {
            code: `SEND_BLOCKED_${guarded.refusal.governor.toUpperCase()}`,
            message: guarded.refusal.reason,
            details: guarded.refusal.details,
          },
        });
      }

      return reply.send({
        success: true,
        data: guarded.providerResponse,
      });
    }
  );
}
